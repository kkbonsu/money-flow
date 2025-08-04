import { useState } from "react";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export function OrganizationSwitcher() {
  const { toast } = useToast();
  const { currentOrganization, setCurrentOrganization } = useOrganization();
  const [isCreating, setIsCreating] = useState(false);

  const { data: organizations, isLoading } = useQuery({
    queryKey: ["/api/organizations"],
  });

  const switchOrganization = useMutation({
    mutationFn: async (orgId: string) => {
      return await apiRequest(`/api/organizations/${orgId}/switch`, {
        method: "POST",
      });
    },
    onSuccess: (_, orgId) => {
      const newOrg = organizations?.find((org: any) => org.id === orgId);
      if (newOrg) {
        setCurrentOrganization(newOrg);
        toast({
          title: "Organization switched",
          description: `Now working in ${newOrg.name}`,
        });
        // Refresh all data for the new organization
        queryClient.invalidateQueries();
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to switch organization",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Select
        value={currentOrganization?.id}
        onValueChange={(value) => switchOrganization.mutate(value)}
        disabled={switchOrganization.isPending}
      >
        <SelectTrigger className="w-[200px] glassmorphism-input">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <SelectValue placeholder="Select organization" />
          </div>
        </SelectTrigger>
        <SelectContent>
          {organizations?.map((org: any) => (
            <SelectItem key={org.id} value={org.id}>
              <div className="flex items-center justify-between w-full">
                <span>{org.name}</span>
                {org.userRole && (
                  <Badge variant="outline" className="ml-2 text-xs">
                    {org.userRole}
                  </Badge>
                )}
              </div>
            </SelectItem>
          ))}
          <div className="border-t mt-1 pt-1">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={() => setIsCreating(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create new organization
            </Button>
          </div>
        </SelectContent>
      </Select>
    </div>
  );
}