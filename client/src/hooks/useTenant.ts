import { useQuery } from '@tanstack/react-query';

export function useTenant() {
  const { data: tenant, isLoading } = useQuery({
    queryKey: ['/api/tenant/info'],
    retry: false,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  return {
    tenant,
    isLoading,
    tenantId: tenant?.id,
    tenantSlug: tenant?.slug,
    tenantName: tenant?.name,
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