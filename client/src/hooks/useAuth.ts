import { useAuth as useClerkAuth, useUser } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import { useOrganizationContext } from "@/contexts/OrganizationContext";

export function useAuth() {
  const { isLoaded, isSignedIn, userId, getToken } = useClerkAuth();
  const { user: clerkUser } = useUser();
  const { currentOrganization } = useOrganizationContext();

  // Fetch user details from our database
  const { data: dbUser, isLoading: isLoadingUser } = useQuery({
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
    organization: currentOrganization,
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