import { useMemo } from 'react';
import { useHasPermission, useHasMinimumRole, useMyPermissions, UserPermissions } from '@/hooks/usePermissions';
import { 
  navigationConfig, 
  specialNavigationItems, 
  customerNavigationConfig,
  NavigationSection, 
  NavigationItem 
} from '@/lib/navigationConfig';
import { useTenantContext } from '@/contexts/TenantContext';

export interface FilteredNavigationItem extends NavigationItem {
  isVisible: boolean;
  isAccessible: boolean;
  reason?: string; // Reason why item is not accessible (for debugging)
}

export interface FilteredNavigationSection extends Omit<NavigationSection, 'items'> {
  isVisible: boolean;
  isAccessible: boolean;
  items?: FilteredNavigationItem[];
  reason?: string;
}

/**
 * Hook to check if a user can access a specific navigation item
 */
export function useCanAccessNavigationItem(item: NavigationItem | NavigationSection): boolean {
  const { data: userPermissions } = useMyPermissions();
  const permissions = userPermissions as UserPermissions | undefined;
  
  // Super admins can access everything except customer-only items
  if (permissions?.isSuperAdmin && !item.href?.startsWith('/customer/')) {
    return true;
  }

  // Admin-only items
  if (item.adminOnly) {
    return permissions?.isSuperAdmin || false;
  }

  // Check specific roles
  if (item.roles && item.roles.length > 0) {
    if (!permissions?.roleName || !item.roles.includes(permissions.roleName)) {
      return false;
    }
  }

  // Check minimum role level (lower numbers = higher authority)
  if (item.minRoleLevel !== undefined) {
    if (!permissions?.hierarchyLevel || permissions.hierarchyLevel > item.minRoleLevel) {
      return false;
    }
  }

  // Check specific permission
  if (item.permission) {
    if (!permissions?.permissions.includes(item.permission)) {
      return false;
    }
  }

  return true;
}

/**
 * Hook to filter navigation items based on user permissions
 */
export function useFilteredNavigation(): {
  navigationSections: FilteredNavigationSection[];
  specialItems: FilteredNavigationItem[];
  isLoading: boolean;
  userRole: string | null;
  hierarchyLevel: number | null;
} {
  const { data: userPermissions, isLoading } = useMyPermissions();
  const { tenantSlug } = useTenantContext();
  
  const permissions = userPermissions as UserPermissions | undefined;

  const filteredNavigation = useMemo(() => {
    if (!permissions) {
      return {
        navigationSections: [],
        specialItems: [],
        isLoading: true,
        userRole: null,
        hierarchyLevel: null
      };
    }

    // Filter navigation sections
    const filteredSections: FilteredNavigationSection[] = navigationConfig
      .map((section): FilteredNavigationSection => {
        // Check if user can access the section itself
        const sectionAccessible = checkItemAccess(section, permissions);
        
        // Filter items within the section
        const filteredItems = section.items?.map((item): FilteredNavigationItem => {
          const itemAccessible = checkItemAccess(item, permissions);
          return {
            ...item,
            isVisible: itemAccessible,
            isAccessible: itemAccessible,
            reason: itemAccessible ? undefined : getAccessDeniedReason(item, permissions)
          };
        }).filter(item => item.isVisible) || [];

        // Section is visible if it's accessible and has visible items (or is a direct link)
        const sectionVisible = Boolean(sectionAccessible && (section.href || filteredItems.length > 0));

        return {
          ...section,
          isVisible: sectionVisible,
          isAccessible: sectionAccessible,
          items: filteredItems,
          reason: sectionAccessible ? undefined : getAccessDeniedReason(section, permissions)
        };
      })
      .filter(section => section.isVisible);

    // Filter special navigation items
    const filteredSpecialItems: FilteredNavigationItem[] = specialNavigationItems
      .map((item): FilteredNavigationItem => {
        const accessible = checkItemAccess(item, permissions);
        return {
          ...item,
          isVisible: accessible,
          isAccessible: accessible,
          reason: accessible ? undefined : getAccessDeniedReason(item, permissions)
        };
      })
      .filter(item => item.isVisible);

    return {
      navigationSections: filteredSections,
      specialItems: filteredSpecialItems,
      isLoading: false,
      userRole: permissions.roleName,
      hierarchyLevel: permissions.hierarchyLevel
    };
  }, [permissions, tenantSlug]);

  return {
    ...filteredNavigation,
    isLoading: isLoading || filteredNavigation.isLoading
  };
}

/**
 * Hook specifically for customer navigation (separate from staff navigation)
 */
export function useCustomerNavigation(): {
  navigationItems: FilteredNavigationItem[];
  isLoading: boolean;
} {
  return useMemo(() => {
    // Customer navigation doesn't need permission checks as customers only see their own data
    const filteredItems: FilteredNavigationItem[] = customerNavigationConfig.map(item => ({
      ...item,
      isVisible: true,
      isAccessible: true
    }));

    return {
      navigationItems: filteredItems,
      isLoading: false
    };
  }, []);
}

/**
 * Utility function to check if a user can access an item
 */
function checkItemAccess(
  item: NavigationItem | NavigationSection, 
  permissions: UserPermissions
): boolean {
  // Super admins can access everything except customer-only items
  if (permissions.isSuperAdmin && !item.href?.startsWith('/customer/')) {
    return true;
  }

  // Admin-only items
  if (item.adminOnly) {
    return permissions.isSuperAdmin;
  }

  // Check specific roles
  if (item.roles && item.roles.length > 0) {
    if (!item.roles.includes(permissions.roleName)) {
      return false;
    }
  }

  // Check minimum role level (lower numbers = higher authority)
  if (item.minRoleLevel !== undefined) {
    if (permissions.hierarchyLevel > item.minRoleLevel) {
      return false;
    }
  }

  // Check specific permission
  if (item.permission) {
    if (!permissions.permissions.includes(item.permission)) {
      return false;
    }
  }

  return true;
}

/**
 * Get reason why access was denied (for debugging)
 */
function getAccessDeniedReason(
  item: NavigationItem | NavigationSection, 
  permissions: UserPermissions
): string {
  if (item.adminOnly && !permissions.isSuperAdmin) {
    return 'Admin access required';
  }

  if (item.roles && item.roles.length > 0 && !item.roles.includes(permissions.roleName)) {
    return `Role required: ${item.roles.join(' or ')}`;
  }

  if (item.minRoleLevel !== undefined && permissions.hierarchyLevel > item.minRoleLevel) {
    return `Minimum role level required: ${item.minRoleLevel} (current: ${permissions.hierarchyLevel})`;
  }

  if (item.permission && !permissions.permissions.includes(item.permission)) {
    return `Permission required: ${item.permission}`;
  }

  return 'Access denied';
}

/**
 * Hook to get navigation context info for debugging
 */
export function useNavigationContext() {
  const { data: userPermissions } = useMyPermissions();
  const { tenantSlug, tenantName, canSwitchTenants } = useTenantContext();
  
  const permissions = userPermissions as UserPermissions | undefined;

  return {
    userRole: permissions?.roleName || 'No role',
    hierarchyLevel: permissions?.hierarchyLevel || 99,
    permissions: permissions?.permissions || [],
    isSuperAdmin: permissions?.isSuperAdmin || false,
    tenantSlug: tenantSlug || 'No tenant',
    tenantName: tenantName || 'No tenant name',
    canSwitchTenants,
    userId: permissions?.userId,
    tenantId: permissions?.tenantId
  };
}