import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export interface Role {
  id: number;
  name: string;
  description: string;
  hierarchyLevel: number;
  isSystemRole: boolean;
  userCount?: number;
  permissions?: Permission[];
}

export interface Permission {
  id: number;
  name: string;
  category: string;
  description: string;
  resource: string;
  action: string;
  createdAt: string;
}

export interface UserRole {
  id: number;
  userId: number;
  roleId: number;
  tenantId: string;
  assignedBy: number;
  assignedAt: string;
  isActive: boolean;
}

export interface UserWithRole {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  roleId?: number;
  roleName?: string;
  hierarchyLevel?: number;
  assignedAt?: string;
}

export interface UserPermissions {
  userId: number;
  tenantId: string;
  roleId: number;
  roleName: string;
  hierarchyLevel: number;
  permissions: string[];
  isSuperAdmin: boolean;
}

// Hooks for roles
export function useRoles() {
  return useQuery({
    queryKey: ['/api/roles/roles'],
  });
}

export function useRole(roleId: number) {
  return useQuery({
    queryKey: ['/api/roles/roles', roleId],
    enabled: !!roleId,
  });
}

// Hooks for permissions
export function usePermissions() {
  return useQuery({
    queryKey: ['/api/roles/permissions'],
  });
}

// Hooks for user-role management
export function useUsersWithRoles() {
  return useQuery({
    queryKey: ['/api/roles/users-roles'],
  });
}

export function useMyPermissions() {
  return useQuery({
    queryKey: ['/api/roles/my-permissions'],
  });
}

// Mutations for role assignment
export function useAssignRole() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, roleId }: { userId: number; roleId: number }) => {
      const response = await fetch(`/api/roles/users/${userId}/assign-role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ userId, roleId }),
      });
      if (!response.ok) throw new Error('Failed to assign role');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/roles/users-roles'] });
      queryClient.invalidateQueries({ queryKey: ['/api/roles/roles'] });
    },
  });
}

export function useRemoveRole() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userId: number) => {
      const response = await fetch(`/api/roles/users/${userId}/role`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
      });
      if (!response.ok) throw new Error('Failed to remove role');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/roles/users-roles'] });
      queryClient.invalidateQueries({ queryKey: ['/api/roles/roles'] });
    },
  });
}

export function useUpdateRolePermissions() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ roleId, permissionIds }: { roleId: number; permissionIds: number[] }) => {
      const response = await fetch(`/api/roles/roles/${roleId}/permissions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ permissionIds }),
      });
      if (!response.ok) throw new Error('Failed to update role permissions');
      return response.json();
    },
    onSuccess: (_, { roleId }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/roles/roles', roleId] });
      queryClient.invalidateQueries({ queryKey: ['/api/roles/my-permissions'] });
    },
  });
}

// Permission checking utilities
export function useHasPermission(permission: string) {
  const { data: userPermissions } = useMyPermissions();
  
  const permissions = userPermissions as UserPermissions | undefined;
  return permissions?.permissions.includes(permission) || 
         permissions?.isSuperAdmin || 
         false;
}

export function useHasMinimumRole(hierarchyLevel: number) {
  const { data: userPermissions } = useMyPermissions();
  
  const permissions = userPermissions as UserPermissions | undefined;
  return (permissions?.hierarchyLevel || 99) <= hierarchyLevel || 
         permissions?.isSuperAdmin || 
         false;
}

export function useCanManageUser(targetUserId: number) {
  const { data: userPermissions } = useMyPermissions();
  const { data: usersWithRoles } = useUsersWithRoles();
  
  const permissions = userPermissions as UserPermissions | undefined;
  const users = usersWithRoles as UserWithRole[] | undefined;
  
  if (!permissions || !users) return false;
  
  // Super admin can manage anyone
  if (permissions.isSuperAdmin) return true;
  
  // Must have user management permissions
  if (!permissions.permissions.includes('users:assign_roles')) return false;
  
  // Find target user
  const targetUser = users.find(u => u.id === targetUserId);
  if (!targetUser) return false;
  
  // Can't manage users with higher or equal hierarchy level
  if (targetUser.hierarchyLevel && targetUser.hierarchyLevel <= permissions.hierarchyLevel) {
    return false;
  }
  
  return true;
}