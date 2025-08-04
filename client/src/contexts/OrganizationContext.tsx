import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

interface Organization {
  id: string;
  name: string;
  slug: string;
  subscriptionPlan: string;
  subscriptionStatus: string;
  settings?: any;
  features?: any;
  branding?: any;
  userRole?: string;
}

interface OrganizationContextType {
  currentOrganization: Organization | null;
  setCurrentOrganization: (org: Organization) => void;
  isLoading: boolean;
  organizations: Organization[];
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);

  // Fetch organizations the user has access to
  const { data: organizations = [], isLoading } = useQuery<Organization[]>({
    queryKey: ["/api/organizations"],
  });

  // Set the first organization as current if none is selected
  useEffect(() => {
    if (organizations.length > 0 && !currentOrganization) {
      const savedOrgId = localStorage.getItem("currentOrganizationId");
      const savedOrg = organizations.find((org: Organization) => org.id === savedOrgId);
      
      if (savedOrg) {
        setCurrentOrganization(savedOrg);
      } else {
        setCurrentOrganization(organizations[0]);
      }
    }
  }, [organizations, currentOrganization]);

  // Save current organization to localStorage
  useEffect(() => {
    if (currentOrganization) {
      localStorage.setItem("currentOrganizationId", currentOrganization.id);
      // Update query client defaults to include organizationId
      queryClient.setDefaultOptions({
        queries: {
          queryFn: async ({ queryKey }) => {
            const url = queryKey[0] as string;
            const response = await fetch(url, {
              headers: {
                "X-Organization-Id": currentOrganization.id,
              },
              credentials: "include",
            });
            
            if (!response.ok) {
              throw new Error(`${response.status}: ${response.statusText}`);
            }
            
            return response.json();
          },
        },
      });
    }
  }, [currentOrganization]);

  return (
    <OrganizationContext.Provider
      value={{
        currentOrganization,
        setCurrentOrganization,
        isLoading,
        organizations,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error("useOrganization must be used within an OrganizationProvider");
  }
  return context;
}