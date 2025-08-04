import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export function useAuth() {
  // Temporarily use a simple auth check while Clerk is being configured
  const isAuthenticated = !!localStorage.getItem("auth_token");

  // Fetch user details from our database
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    enabled: isAuthenticated,
    retry: false,
  });

  return {
    isLoading,
    isAuthenticated,
    user,
    clerkUser: null,
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