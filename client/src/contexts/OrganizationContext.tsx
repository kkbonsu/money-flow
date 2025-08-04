import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth, useOrganization } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import type { Organization } from "@shared/schema";

interface OrganizationContextType {
  currentOrganization: Organization | null;
  isLoading: boolean;
  switchOrganization: (orgId: string) => Promise<void>;
  refreshOrganization: () => void;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded: authLoaded, userId } = useAuth();
  const { organization: clerkOrg, setActive } = useOrganization();
  const [isLoading, setIsLoading] = useState(true);

  // Fetch organization details from our database
  const { data: currentOrganization, refetch: refreshOrganization } = useQuery({
    queryKey: ["/api/organization", clerkOrg?.id],
    enabled: !!clerkOrg?.id && authLoaded && !!userId,
    retry: false,
  });

  useEffect(() => {
    if (authLoaded) {
      setIsLoading(false);
    }
  }, [authLoaded]);

  const switchOrganization = async (orgId: string) => {
    try {
      setIsLoading(true);
      await setActive({ organization: orgId });
      await refreshOrganization();
    } catch (error) {
      console.error("Failed to switch organization:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value: OrganizationContextType = {
    currentOrganization: currentOrganization || null,
    isLoading,
    switchOrganization,
    refreshOrganization,
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganizationContext() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error("useOrganizationContext must be used within an OrganizationProvider");
  }
  return context;
}