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
    queryFn: () => apiRequest<Role[]>('/api/roles/roles'),
  });
}

export function useRole(roleId: number) {
  return useQuery({
    queryKey: ['/api/roles/roles', roleId],
    queryFn: () => apiRequest<Role>(`/api/roles/roles/${roleId}`),
    enabled: !!roleId,
  });
}

// Hooks for permissions
export function usePermissions() {
  return useQuery({
    queryKey: ['/api/roles/permissions'],
    queryFn: () => apiRequest<Record<string, Permission[]>>('/api/roles/permissions'),
  });
}

// Hooks for user-role management
export function useUsersWithRoles() {
  return useQuery({
    queryKey: ['/api/roles/users-roles'],
    queryFn: () => apiRequest<UserWithRole[]>('/api/roles/users-roles'),
  });
}

export function useMyPermissions() {
  return useQuery({
    queryKey: ['/api/roles/my-permissions'],
    queryFn: () => apiRequest<UserPermissions>('/api/roles/my-permissions'),
  });
}

// Mutations for role assignment
export function useAssignRole() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, roleId }: { userId: number; roleId: number }) =>
      apiRequest(`/api/roles/users/${userId}/assign-role`, {
        method: 'POST',
        body: JSON.stringify({ userId, roleId }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/roles/users-roles'] });
      queryClient.invalidateQueries({ queryKey: ['/api/roles/roles'] });
    },
  });
}

export function useRemoveRole() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (userId: number) =>
      apiRequest(`/api/roles/users/${userId}/role`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/roles/users-roles'] });
      queryClient.invalidateQueries({ queryKey: ['/api/roles/roles'] });
    },
  });
}

export function useUpdateRolePermissions() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ roleId, permissionIds }: { roleId: number; permissionIds: number[] }) =>
      apiRequest(`/api/roles/roles/${roleId}/permissions`, {
        method: 'PUT',
        body: JSON.stringify({ permissionIds }),
      }),
    onSuccess: (_, { roleId }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/roles/roles', roleId] });
      queryClient.invalidateQueries({ queryKey: ['/api/roles/my-permissions'] });
    },
  });
}

// Permission checking utilities
export function useHasPermission(permission: string) {
  const { data: userPermissions } = useMyPermissions();
  
  return userPermissions?.permissions.includes(permission) || 
         userPermissions?.isSuperAdmin || 
         false;
}

export function useHasMinimumRole(hierarchyLevel: number) {
  const { data: userPermissions } = useMyPermissions();
  
  return userPermissions?.hierarchyLevel <= hierarchyLevel || 
         userPermissions?.isSuperAdmin || 
         false;
}

export function useCanManageUser(targetUserId: number) {
  const { data: userPermissions } = useMyPermissions();
  const { data: usersWithRoles } = useUsersWithRoles();
  
  if (!userPermissions || !usersWithRoles) return false;
  
  // Super admin can manage anyone
  if (userPermissions.isSuperAdmin) return true;
  
  // Must have user management permissions
  if (!userPermissions.permissions.includes('users:assign_roles')) return false;
  
  // Find target user
  const targetUser = usersWithRoles.find(u => u.id === targetUserId);
  if (!targetUser) return false;
  
  // Can't manage users with higher or equal hierarchy level
  if (targetUser.hierarchyLevel && targetUser.hierarchyLevel <= userPermissions.hierarchyLevel) {
    return false;
  }
  
  return true;
}