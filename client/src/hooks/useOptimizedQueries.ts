import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useTenantContext } from "@/contexts/TenantContext";

/**
 * Optimized query hooks for Money Flow application
 * Implements intelligent caching and batching strategies
 */

// Dashboard metrics with smart caching (tenant-aware)
export function useDashboardMetrics() {
  const { currentTenant } = useTenantContext();
  
  return useQuery({
    queryKey: ['tenant', currentTenant?.slug || 'default', "/api/dashboard/metrics"],
    staleTime: 2 * 60 * 1000, // 2 minutes for real-time financial data
    gcTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
    enabled: !!currentTenant, // Only fetch when tenant is loaded
  });
}

// Recent payments with pagination support (tenant-aware)
export function useRecentPayments(limit: number = 10) {
  const { currentTenant } = useTenantContext();
  
  return useQuery({
    queryKey: ['tenant', currentTenant?.slug || 'default', "/api/payments/recent", { limit }],
    staleTime: 1 * 60 * 1000, // 1 minute for payment data
    gcTime: 3 * 60 * 1000,
    enabled: !!currentTenant, // Only fetch when tenant is loaded
  });
}

// Customer list with search and pagination (tenant-aware)
export function useCustomers(search?: string, page: number = 1, limit: number = 20) {
  const { currentTenant } = useTenantContext();
  
  return useQuery({
    queryKey: ['tenant', currentTenant?.slug || 'default', "/api/customers", { search, page, limit }],
    staleTime: 3 * 60 * 1000, // 3 minutes for customer data
    enabled: !!currentTenant, // Only fetch when tenant is loaded
  });
}

// Loan portfolio data with caching (tenant-aware)
export function useLoanPortfolio() {
  const { currentTenant } = useTenantContext();
  
  return useQuery({
    queryKey: ['tenant', currentTenant?.slug || 'default', "/api/loans/portfolio"],
    staleTime: 5 * 60 * 1000, // 5 minutes for portfolio analysis
    gcTime: 10 * 60 * 1000,
    enabled: !!currentTenant, // Only fetch when tenant is loaded
  });
}

// Optimized mutation hooks with cache invalidation
export function useCreateCustomer() {
  const queryClient = useQueryClient();
  const { currentTenant } = useTenantContext();
  
  return useMutation({
    mutationFn: async (customerData: any) => {
      const response = await apiRequest("POST", "/api/customers", customerData);
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch customer-related queries (tenant-scoped)
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey;
          return Array.isArray(key) && key[0] === 'tenant' && key[1] === currentTenant?.slug;
        }
      });
    },
    onError: (error) => {
      console.error("Failed to create customer:", error);
    },
  });
}

export function useCreateLoan() {
  const queryClient = useQueryClient();
  const { currentTenant } = useTenantContext();
  
  return useMutation({
    mutationFn: async (loanData: any) => {
      const response = await apiRequest("POST", "/api/loans", loanData);
      return response.json();
    },
    onSuccess: () => {
      // Invalidate loan and dashboard queries (tenant-scoped)
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey;
          return Array.isArray(key) && key[0] === 'tenant' && key[1] === currentTenant?.slug;
        }
      });
    },
  });
}

export function useUpdatePaymentStatus() {
  const queryClient = useQueryClient();
  const { currentTenant } = useTenantContext();
  
  return useMutation({
    mutationFn: async ({ paymentId, status }: { paymentId: number; status: string }) => {
      const response = await apiRequest("PATCH", `/api/payments/${paymentId}`, { status });
      return response.json();
    },
    onSuccess: () => {
      // Invalidate payment and dashboard queries (tenant-scoped)
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey;
          return Array.isArray(key) && key[0] === 'tenant' && key[1] === currentTenant?.slug;
        }
      });
    },
  });
}

// Batch query hook for multiple related data
export function useBatchDashboardData() {
  const metrics = useDashboardMetrics();
  const recentPayments = useRecentPayments(5);
  const portfolio = useLoanPortfolio();
  
  return {
    metrics,
    recentPayments,
    portfolio,
    isLoading: metrics.isLoading || recentPayments.isLoading || portfolio.isLoading,
    isError: metrics.isError || recentPayments.isError || portfolio.isError,
    error: metrics.error || recentPayments.error || portfolio.error,
  };
}

// Prefetch utility for predictive loading
export function usePrefetch() {
  const queryClient = useQueryClient();
  
  const { currentTenant } = useTenantContext();
  
  const prefetchCustomers = () => {
    if (currentTenant) {
      queryClient.prefetchQuery({
        queryKey: ['tenant', currentTenant.slug, "/api/customers"],
        staleTime: 3 * 60 * 1000,
      });
    }
  };
  
  const prefetchLoans = () => {
    if (currentTenant) {
      queryClient.prefetchQuery({
        queryKey: ['tenant', currentTenant.slug, "/api/loans"],
        staleTime: 3 * 60 * 1000,
      });
    }
  };
  
  return { prefetchCustomers, prefetchLoans };
}