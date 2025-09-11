import { QueryClient, QueryFunction, QueryKey } from "@tanstack/react-query";
import { authApi } from "./auth";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    // Enhanced error handling for tenant-related issues
    if (res.status === 403) {
      throw new Error(`Tenant Access Denied: ${text}`);
    }
    if (res.status === 404 && text.includes('tenant')) {
      throw new Error(`Tenant Not Found: ${text}`);
    }
    throw new Error(`${res.status}: ${text}`);
  }
}

// Global tenant context - will be set by TenantContext provider
let globalTenantContext: { tenantId: string; tenantSlug: string } | null = null;

// Set global tenant context (called by TenantContext)
export function setGlobalTenantContext(context: { tenantId: string; tenantSlug: string } | null) {
  globalTenantContext = context;
}

// Get current tenant information with fallback to subdomain
function getCurrentTenant(): { tenantId: string; tenantSlug: string } {
  // Use global tenant context if available
  if (globalTenantContext) {
    return globalTenantContext;
  }
  
  // Fallback to subdomain extraction
  const hostname = window.location.hostname;
  const subdomain = hostname.split('.')[0];
  const tenantSlug = (subdomain === 'localhost' || subdomain.includes('replit')) ? 'default' : subdomain;
  
  return {
    tenantId: 'default-tenant-001',
    tenantSlug
  };
}

// Enhanced headers with tenant context
function getAuthHeaders(): HeadersInit {
  const authData = authApi.getStoredAuth();
  const tenant = getCurrentTenant();
  
  return {
    'Content-Type': 'application/json',
    'X-Tenant-Slug': tenant.tenantSlug,
    'X-Tenant-Id': tenant.tenantId,
    ...(authData ? { Authorization: `Bearer ${authData.token}` } : {}),
  };
}

// Create tenant-aware query keys
export function createTenantAwareQueryKey(baseKey: QueryKey): QueryKey {
  const tenant = getCurrentTenant();
  return ['tenant', tenant.tenantSlug, ...baseKey];
}

// Extract base query key from tenant-aware key
export function extractBaseQueryKey(tenantAwareKey: QueryKey): QueryKey {
  if (Array.isArray(tenantAwareKey) && tenantAwareKey[0] === 'tenant' && tenantAwareKey.length >= 3) {
    return tenantAwareKey.slice(2);
  }
  return tenantAwareKey;
}

// Check if query key is tenant-aware
export function isTenantAwareQueryKey(queryKey: QueryKey): boolean {
  return Array.isArray(queryKey) && queryKey[0] === 'tenant';
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: getAuthHeaders(),
    body: data ? JSON.stringify(data) : undefined,
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      // Extract base URL from tenant-aware query key
      const baseKey = isTenantAwareQueryKey(queryKey) ? extractBaseQueryKey(queryKey) : queryKey;
      const url = baseKey.join("/") as string;
      
      const res = await fetch(url, {
        headers: getAuthHeaders(),
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (error) {
      console.error('Query fetch error for key:', queryKey, error);
      throw error;
    }
  };

// Tenant-aware query function that automatically adds tenant context to query keys
export const getTenantAwareQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      // Make query key tenant-aware if it isn't already
      const tenantAwareKey = isTenantAwareQueryKey(queryKey) ? queryKey : createTenantAwareQueryKey(queryKey);
      const baseKey = extractBaseQueryKey(tenantAwareKey);
      const url = baseKey.join("/") as string;
      
      const res = await fetch(url, {
        headers: getAuthHeaders(),
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (error) {
      console.error('Tenant-aware query fetch error for key:', queryKey, error);
      throw error;
    }
  };

// Tenant-aware cache management functions
export function invalidateTenantQueries(client: QueryClient, tenantSlug?: string) {
  const targetTenant = tenantSlug || getCurrentTenant().tenantSlug;
  
  // Invalidate all queries for the specific tenant
  client.invalidateQueries({
    predicate: (query) => {
      const queryKey = query.queryKey;
      return isTenantAwareQueryKey(queryKey) && queryKey[1] === targetTenant;
    }
  });
}

export function removeTenantQueries(client: QueryClient, tenantSlug: string) {
  // Remove all cached queries for a specific tenant
  client.removeQueries({
    predicate: (query) => {
      const queryKey = query.queryKey;
      return isTenantAwareQueryKey(queryKey) && queryKey[1] === tenantSlug;
    }
  });
}

export function clearCurrentTenantCache(client: QueryClient) {
  const currentTenant = getCurrentTenant().tenantSlug;
  removeTenantQueries(client, currentTenant);
}

// Enhanced query client with tenant awareness
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getTenantAwareQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes - optimized for financial data
      gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
      retry: (failureCount, error) => {
        // Don't retry on tenant access errors
        if (error.message.includes('Tenant Access Denied') || 
            error.message.includes('Tenant Not Found')) {
          return false;
        }
        // Don't retry on 4xx errors
        if (error.message.includes('4')) return false;
        return failureCount < 2;
      },
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Automatically make query keys tenant-aware
      queryKeyHashFn: (queryKey) => {
        const tenantAwareKey = isTenantAwareQueryKey(queryKey) ? queryKey : createTenantAwareQueryKey(queryKey);
        return JSON.stringify(tenantAwareKey);
      },
    },
    mutations: {
      retry: (failureCount, error) => {
        // Don't retry tenant-related mutation errors
        if (error.message.includes('Tenant Access Denied') || 
            error.message.includes('Tenant Not Found')) {
          return false;
        }
        return false;
      },
      gcTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Enhanced API request function with better tenant context
export async function tenantAwareApiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const tenant = getCurrentTenant();
  
  try {
    const res = await fetch(url, {
      method,
      headers: getAuthHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });

    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    console.error(`API request failed for tenant ${tenant.tenantSlug}:`, error);
    throw error;
  }
}

// Utility to get current tenant info
export function getCurrentTenantInfo() {
  return getCurrentTenant();
}
