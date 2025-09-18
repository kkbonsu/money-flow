import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

/**
 * Optimized query hooks for Money Flow application
 * Implements intelligent caching and batching strategies
 */

// Dashboard metrics with smart caching
export function useDashboardMetrics() {
  return useQuery({
    queryKey: ["/api/dashboard/metrics"],
    staleTime: 2 * 60 * 1000, // 2 minutes for real-time financial data
    gcTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
  });
}

// Recent payments with pagination support
export function useRecentPayments(limit: number = 10) {
  return useQuery({
    queryKey: ["/api/payments/recent", { limit }],
    staleTime: 1 * 60 * 1000, // 1 minute for payment data
    gcTime: 3 * 60 * 1000,
  });
}

// Customer list with search and pagination
export function useCustomers(search?: string, page: number = 1, limit: number = 20) {
  return useQuery({
    queryKey: ["/api/customers", { search, page, limit }],
    staleTime: 3 * 60 * 1000, // 3 minutes for customer data
    enabled: true,
  });
}

// Loan portfolio data with caching
export function useLoanPortfolio() {
  return useQuery({
    queryKey: ["/api/loans/portfolio"],
    staleTime: 5 * 60 * 1000, // 5 minutes for portfolio analysis
    gcTime: 10 * 60 * 1000,
  });
}

// Optimized mutation hooks with cache invalidation
export function useCreateCustomer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (customerData: any) => {
      const response = await apiRequest("POST", "/api/customers", customerData);
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch customer-related queries
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
    },
    onError: (error) => {
      console.error("Failed to create customer:", error);
    },
  });
}

export function useCreateLoan() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (loanData: any) => {
      const response = await apiRequest("POST", "/api/loans", loanData);
      return response.json();
    },
    onSuccess: () => {
      // Invalidate loan and dashboard queries
      queryClient.invalidateQueries({ queryKey: ["/api/loans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/loans/portfolio"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
    },
  });
}

export function useUpdatePaymentStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ paymentId, status }: { paymentId: number; status: string }) => {
      const response = await apiRequest("PATCH", `/api/payments/${paymentId}`, { status });
      return response.json();
    },
    onSuccess: () => {
      // Invalidate payment and dashboard queries
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
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
  
  const prefetchCustomers = () => {
    queryClient.prefetchQuery({
      queryKey: ["/api/customers"],
      staleTime: 3 * 60 * 1000,
    });
  };
  
  const prefetchLoans = () => {
    queryClient.prefetchQuery({
      queryKey: ["/api/loans"],
      staleTime: 3 * 60 * 1000,
    });
  };
  
  return { prefetchCustomers, prefetchLoans };
}