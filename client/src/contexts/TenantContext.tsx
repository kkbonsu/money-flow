import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
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
  const { 
    data: tenantData, 
    isLoading: tenantLoading,
    error: tenantError 
  } = useQuery<TenantInfo>({
    queryKey: ['/api/tenant/info'],
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
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Update current tenant when data is loaded
  useEffect(() => {
    if (tenantData && !tenantError) {
      setCurrentTenant(tenantData);
      setError(null);
    } else if (tenantError) {
      setError('Failed to load tenant information');
    }
  }, [tenantData, tenantError]);

  // Switch tenant mutation
  const switchTenantMutation = useMutation({
    mutationFn: async (tenantSlug: string): Promise<TenantSwitchResponse> => {
      const response = await apiRequest('POST', '/api/user/switch-tenant', { tenantSlug });
      return await response.json();
    },
    onMutate: () => {
      setIsSwitching(true);
      setError(null);
    },
    onSuccess: (data: TenantSwitchResponse) => {
      // Update the local token with the new tenant context
      localStorage.setItem('auth_token', data.token);
      
      // Update current tenant state
      setCurrentTenant(data.tenant);
      
      // Clear all queries to force refresh with new tenant context
      queryClient.clear();
      
      // Refetch accessible tenants to update the list
      refetchTenants();
      
      toast({
        title: "Tenant switched",
        description: `Successfully switched to ${data.tenant.name}`,
      });
      
      setError(null);
    },
    onError: (error: any) => {
      const errorMessage = error?.message || 'Failed to switch tenant';
      setError(errorMessage);
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

  // Refresh tenants function
  const refreshTenants = useCallback(async () => {
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['/api/tenant/info'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/user/accessible-tenants'] })
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