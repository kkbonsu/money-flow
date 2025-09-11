// Legacy compatibility hook - now uses the comprehensive TenantContext
import { useTenantContext as useNewTenantContext, useCurrentTenant } from '@/contexts/TenantContext';
import type { TenantInfo } from '@/types/tenant';

/**
 * @deprecated Use useTenantContext from @/contexts/TenantContext instead
 * This hook is maintained for backwards compatibility
 */
export function useTenant() {
  const { currentTenant, isLoading, tenantId, tenantSlug, tenantName } = useNewTenantContext();

  return {
    tenant: currentTenant,
    isLoading,
    tenantId,
    tenantSlug,
    tenantName,
  };
}

/**
 * @deprecated Use useTenantContext from @/contexts/TenantContext instead
 * This hook is maintained for backwards compatibility
 */
export function useTenantContext() {
  const { 
    currentTenant, 
    tenantId, 
    tenantSlug, 
    tenantName, 
    isLoading, 
    isMultiTenant 
  } = useNewTenantContext();

  return {
    tenant: currentTenant,
    tenantId,
    tenantSlug, 
    tenantName,
    isLoading,
    isMultiTenant,
  };
}

// Re-export the new comprehensive hooks for convenience
export { 
  useTenantContext as useComprehensiveTenantContext,
  useSwitchTenant,
  useCurrentTenant,
  useAccessibleTenants 
} from '@/contexts/TenantContext';