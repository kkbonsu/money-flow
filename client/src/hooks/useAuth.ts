import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import type { User } from "@shared/schema";

export function useAuth() {
  const [, setLocation] = useLocation();
  
  // Get auth token from localStorage
  const token = localStorage.getItem("auth_token");
  const isAuthenticated = !!token;

  // Fetch user details from our database
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    enabled: isAuthenticated,
    retry: false,
  });

  const logout = useMutation({
    mutationFn: async () => {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
      queryClient.clear();
    },
    onSuccess: () => {
      setLocation("/login");
    },
  });

  return {
    isLoading,
    isAuthenticated,
    user,
    logout: logout.mutate,
    hasRole: (role: string) => user?.role === role,
    hasPermission: (permission: string) => {
      const permissions = user?.permissions || [];
      return permissions.includes(permission);
    },
    isSuperAdmin: () => user?.role === "super_admin",
    isOrgAdmin: () => user?.role === "org_admin" || user?.role === "super_admin",
    isManager: () => ["manager", "org_admin", "super_admin"].includes(user?.role || ""),
  };
}