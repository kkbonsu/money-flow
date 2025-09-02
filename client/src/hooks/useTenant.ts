import { useQuery } from '@tanstack/react-query';
import type { TenantInfo } from '@/types/tenant';

export function useTenant() {
  const { data: tenant, isLoading } = useQuery<TenantInfo>({
    queryKey: ['/api/tenant/info'],
    retry: false,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  return {
    tenant,
    isLoading,
    tenantId: tenant?.id || 'default-tenant-001',
    tenantSlug: tenant?.slug || 'default',
    tenantName: tenant?.name || 'Default Organization',
  };
}

export function useTenantContext() {
  const { tenant, tenantId, tenantSlug, tenantName, isLoading } = useTenant();

  return {
    tenant,
    tenantId,
    tenantSlug, 
    tenantName,
    isLoading,
    // Helper to check if we're in a multi-tenant context
    isMultiTenant: tenantSlug !== 'default',
  };
}