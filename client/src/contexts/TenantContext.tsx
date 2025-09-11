import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  apiRequest, 
  tenantAwareApiRequest, 
  setGlobalTenantContext,
  invalidateTenantQueries,
  removeTenantQueries,
  createTenantAwareQueryKey 
} from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  TenantInfo, 
  AccessibleTenant, 
  TenantSwitchResponse, 
  TenantContextType 
} from '@/types/tenant';

const TenantContext = createContext<TenantContextType | undefined>(undefined);

interface TenantProviderProps {
  children: ReactNode;
}

export function TenantProvider({ children }: TenantProviderProps) {
  const [currentTenant, setCurrentTenant] = useState<TenantInfo | null>(null);
  const [isSwitching, setIsSwitching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current tenant info from the backend
  // NOTE: These queries use regular apiRequest to avoid circular dependency during initialization
  const { 
    data: tenantData, 
    isLoading: tenantLoading,
    error: tenantError 
  } = useQuery<TenantInfo>({
    queryKey: ['/api/tenant/info'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/tenant/info');
      return await res.json();
    },
    retry: 2,
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });

  // Get accessible tenants for the current user
  const { 
    data: accessibleTenants = [], 
    isLoading: tenantsLoading,
    refetch: refetchTenants 
  } = useQuery<AccessibleTenant[]>({
    queryKey: ['/api/user/accessible-tenants'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/user/accessible-tenants');
      return await res.json();
    },
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Update current tenant when data is loaded and sync with query client
  useEffect(() => {
    if (tenantData && !tenantError) {
      setCurrentTenant(tenantData);
      setError(null);
      
      // Update global tenant context in query client
      setGlobalTenantContext({
        tenantId: tenantData.id,
        tenantSlug: tenantData.slug
      });
    } else if (tenantError) {
      setError('Failed to load tenant information');
      // Clear global tenant context on error
      setGlobalTenantContext(null);
    }
  }, [tenantData, tenantError]);
  
  // Initialize global tenant context on mount with fallback
  useEffect(() => {
    if (!tenantData && !tenantLoading) {
      // Set fallback tenant context based on subdomain
      const hostname = window.location.hostname;
      const subdomain = hostname.split('.')[0];
      const tenantSlug = (subdomain === 'localhost' || subdomain.includes('replit')) ? 'default' : subdomain;
      
      setGlobalTenantContext({
        tenantId: 'default-tenant-001',
        tenantSlug
      });
    }
  }, [tenantData, tenantLoading]);

  // Enhanced switch tenant mutation with targeted cache management
  const switchTenantMutation = useMutation({
    mutationFn: async (tenantSlug: string): Promise<TenantSwitchResponse> => {
      const response = await tenantAwareApiRequest('POST', '/api/user/switch-tenant', { tenantSlug });
      return await response.json();
    },
    onMutate: (newTenantSlug) => {
      setIsSwitching(true);
      setError(null);
      
      // Store previous tenant for cleanup
      const previousTenant = currentTenant;
      return { previousTenant, newTenantSlug };
    },
    onSuccess: (data: TenantSwitchResponse, _variables, context) => {
      // Update the local token with the new tenant context
      localStorage.setItem('auth_token', data.token);
      
      // Update current tenant state first
      setCurrentTenant(data.tenant);
      
      // Update global tenant context in query client
      setGlobalTenantContext({
        tenantId: data.tenant.id,
        tenantSlug: data.tenant.slug
      });
      
      // Remove old tenant's cached data (targeted cleanup)
      if (context?.previousTenant) {
        removeTenantQueries(queryClient, context.previousTenant.slug);
      }
      
      // Invalidate and refetch tenant-related queries for new tenant
      queryClient.invalidateQueries({
        queryKey: createTenantAwareQueryKey(['/api/tenant/info'])
      });
      queryClient.invalidateQueries({
        queryKey: createTenantAwareQueryKey(['/api/user/accessible-tenants'])
      });
      
      // Refetch accessible tenants to update the list
      refetchTenants();
      
      toast({
        title: "Tenant switched",
        description: `Successfully switched to ${data.tenant.name}`,
      });
      
      setError(null);
    },
    onError: (error: any, _variables, context) => {
      const errorMessage = error?.message || 'Failed to switch tenant';
      setError(errorMessage);
      
      // Restore global tenant context if switch failed
      if (context?.previousTenant) {
        setGlobalTenantContext({
          tenantId: context.previousTenant.id,
          tenantSlug: context.previousTenant.slug
        });
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsSwitching(false);
    },
  });

  // Switch tenant function
  const switchTenant = useCallback(async (tenantSlug: string) => {
    if (!tenantSlug) {
      setError('Invalid tenant slug');
      return;
    }

    if (currentTenant?.slug === tenantSlug) {
      toast({
        title: "Already active",
        description: "You are already in this tenant",
        variant: "default",
      });
      return;
    }

    try {
      await switchTenantMutation.mutateAsync(tenantSlug);
    } catch (error) {
      // Error handling is done in the mutation
      console.error('Tenant switch error:', error);
    }
  }, [currentTenant?.slug, switchTenantMutation, toast]);

  // Enhanced refresh tenants function with tenant-aware queries
  const refreshTenants = useCallback(async () => {
    try {
      await Promise.all([
        queryClient.invalidateQueries({ 
          queryKey: createTenantAwareQueryKey(['/api/tenant/info']) 
        }),
        queryClient.invalidateQueries({ 
          queryKey: createTenantAwareQueryKey(['/api/user/accessible-tenants']) 
        })
      ]);
    } catch (error) {
      console.error('Failed to refresh tenants:', error);
      setError('Failed to refresh tenant information');
    }
  }, [queryClient]);

  // Clear error function
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  // Enhanced cache invalidation for current tenant
  const invalidateCurrentTenantCache = useCallback(() => {
    if (currentTenant) {
      invalidateTenantQueries(queryClient, currentTenant.slug);
    }
  }, [queryClient, currentTenant]);
  
  // Clear current tenant cache function
  const clearCurrentTenantCache = useCallback(() => {
    if (currentTenant) {
      removeTenantQueries(queryClient, currentTenant.slug);
    }
  }, [queryClient, currentTenant]);

  // Extract tenant slug from subdomain for fallback
  const getSubdomainTenantSlug = useCallback(() => {
    const hostname = window.location.hostname;
    const subdomain = hostname.split('.')[0];
    return (subdomain === 'localhost' || subdomain.includes('replit')) ? 'default' : subdomain;
  }, []);

  // Computed properties
  const tenantId = currentTenant?.id || 'default-tenant-001';
  const tenantSlug = currentTenant?.slug || getSubdomainTenantSlug();
  const tenantName = currentTenant?.name || 'Default Organization';
  const isMultiTenant = accessibleTenants.length > 1;
  const canSwitchTenants = accessibleTenants.length > 0;
  const isLoading = tenantLoading || tenantsLoading;

  // Context value
  const contextValue: TenantContextType = {
    // Current tenant state
    currentTenant,
    accessibleTenants,
    
    // Loading states
    isLoading,
    isSwitching,
    
    // Actions
    switchTenant,
    refreshTenants,
    
    // Computed properties
    tenantId,
    tenantSlug,
    tenantName,
    isMultiTenant,
    canSwitchTenants,
    
    // Error state
    error,
    clearError,
    
    // Enhanced cache management
    invalidateCurrentTenantCache,
    clearCurrentTenantCache,
  };

  return (
    <TenantContext.Provider value={contextValue}>
      {children}
    </TenantContext.Provider>
  );
}

// Hook to use tenant context
export function useTenantContext(): TenantContextType {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenantContext must be used within a TenantProvider');
  }
  return context;
}

// Hook for switching tenants
export function useSwitchTenant() {
  const { switchTenant, isSwitching, error, clearError } = useTenantContext();
  return {
    switchTenant,
    isSwitching,
    error,
    clearError,
  };
}

// Hook for current tenant info
export function useCurrentTenant() {
  const { 
    currentTenant, 
    tenantId, 
    tenantSlug, 
    tenantName, 
    isLoading 
  } = useTenantContext();
  
  return {
    tenant: currentTenant,
    tenantId,
    tenantSlug,
    tenantName,
    isLoading,
    isMultiTenant: tenantSlug !== 'default',
  };
}

// Hook for accessible tenants
export function useAccessibleTenants() {
  const { 
    accessibleTenants, 
    refreshTenants, 
    isLoading, 
    canSwitchTenants 
  } = useTenantContext();
  
  return {
    tenants: accessibleTenants,
    refreshTenants,
    isLoading,
    canSwitchTenants,
  };
}

// Export the context for advanced usage
export { TenantContext };