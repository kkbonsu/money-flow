import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

function getCustomerAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('customer_auth_token');
  
  // Extract tenant slug from subdomain  
  const hostname = window.location.hostname;
  const subdomain = hostname.split('.')[0];
  const tenantSlug = (subdomain === 'localhost' || subdomain.includes('replit')) ? 'default' : subdomain;
  
  return {
    'Content-Type': 'application/json',
    'X-Tenant-Slug': tenantSlug,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function customerApiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: getCustomerAuthHeaders(),
    body: data ? JSON.stringify(data) : undefined,
  });

  await throwIfResNotOk(res);
  return res;
}

// Alias for compatibility with existing code
export const apiRequest = async (url: string, method: string, data?: unknown) => {
  const res = await customerApiRequest(method, url, data);
  return res.json();
};

type UnauthorizedBehavior = "returnNull" | "throw";
export const getCustomerQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      const res = await fetch(queryKey.join("/") as string, {
        headers: getCustomerAuthHeaders(),
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (error) {
      console.error('Customer query fetch error:', error);
      throw error;
    }
  };

export const customerQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getCustomerQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: true,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 1,
    },
    mutations: {
      retry: false,
    },
  },
});