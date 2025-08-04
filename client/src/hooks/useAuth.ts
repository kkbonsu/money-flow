import { useAuth as useClerkAuth, useUser } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export function useAuth() {
  const { isLoaded, isSignedIn, userId, getToken } = useClerkAuth();
  const { user: clerkUser } = useUser();

  // Fetch user details from our database
  const { data: dbUser, isLoading: isLoadingUser } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    enabled: isSignedIn && !!userId,
    retry: false,
  });

  // Helper to get auth token for API requests
  const getAuthToken = async () => {
    if (!isSignedIn) return null;
    return await getToken();
  };

  return {
    isLoading: !isLoaded || isLoadingUser,
    isAuthenticated: isSignedIn,
    user: dbUser,
    clerkUser,
    userId,
    getAuthToken,
    hasRole: (role: string) => dbUser?.role === role,
    hasPermission: (permission: string) => {
      const permissions = dbUser?.permissions || [];
      return permissions.includes(permission);
    },
    isSuperAdmin: () => dbUser?.role === "super_admin",
    isOrgAdmin: () => dbUser?.role === "org_admin" || dbUser?.role === "super_admin",
    isManager: () => ["manager", "org_admin", "super_admin"].includes(dbUser?.role || ""),
  };
}