import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Building2, ChevronDown, MapPin, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface Branch {
  branchId: string;
  branchCode: string;
  branchName: string;
  role: string;
  permissions: string[];
}

interface UserContext {
  organizationName: string;
  organizationCode: string;
  currentBranchId: string;
  currentBranchName: string;
  currentBranchCode: string;
  branches: Branch[];
}

export function BranchSwitcher() {
  const { toast } = useToast();
  const [userContext, setUserContext] = useState<UserContext | null>(null);

  // Get current user context from JWT
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        // Decode JWT to get user context (base64 decode)
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserContext({
          organizationName: payload.organizationName,
          organizationCode: payload.organizationCode,
          currentBranchId: payload.currentBranchId,
          currentBranchName: payload.currentBranchName,
          currentBranchCode: payload.currentBranchCode,
          branches: payload.branches || []
        });
      } catch (error) {
        console.error("Failed to decode token:", error);
      }
    }
  }, []);

  // Switch branch mutation
  const switchBranchMutation = useMutation({
    mutationFn: async (branchId: string) => {
      return apiRequest(`/api/auth/switch-branch`, {
        method: "POST",
        body: JSON.stringify({ branchId }),
      });
    },
    onSuccess: (data) => {
      // Update token and refresh page
      if (data.token) {
        localStorage.setItem("token", data.token);
        
        // Decode new token to update context
        const payload = JSON.parse(atob(data.token.split('.')[1]));
        setUserContext({
          organizationName: payload.organizationName,
          organizationCode: payload.organizationCode,
          currentBranchId: payload.currentBranchId,
          currentBranchName: payload.currentBranchName,
          currentBranchCode: payload.currentBranchCode,
          branches: payload.branches || []
        });
        
        // Invalidate all queries to refresh data
        queryClient.invalidateQueries();
        
        toast({
          title: "Branch Switched",
          description: `Now working in ${payload.currentBranchName}`,
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Switch Failed",
        description: error.message || "Failed to switch branch",
        variant: "destructive",
      });
    },
  });

  if (!userContext || userContext.branches.length <= 1) {
    // Don't show switcher if user has access to only one branch
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
        <Building2 className="h-4 w-4" />
        <span>{userContext?.currentBranchName || "Loading..."}</span>
      </div>
    );
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
      case "manager":
        return "default";
      case "user":
        return "secondary";
      case "viewer":
        return "outline";
      default:
        return "outline";
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          <div className="flex flex-col items-start">
            <span className="text-xs text-muted-foreground">
              {userContext.organizationName}
            </span>
            <span className="font-medium">
              {userContext.currentBranchName}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex flex-col">
          <span className="font-normal text-xs text-muted-foreground">
            Organization
          </span>
          <span>{userContext.organizationName}</span>
          <span className="text-xs text-muted-foreground">
            {userContext.organizationCode}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Switch Branch
        </DropdownMenuLabel>
        {userContext.branches.map((branch) => (
          <DropdownMenuItem
            key={branch.branchId}
            onClick={() => {
              if (branch.branchId !== userContext.currentBranchId) {
                switchBranchMutation.mutate(branch.branchId);
              }
            }}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <MapPin className="h-3 w-3" />
              <div className="flex flex-col">
                <span className="font-medium">
                  {branch.branchName}
                </span>
                <span className="text-xs text-muted-foreground">
                  {branch.branchCode}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={getRoleBadgeVariant(branch.role)} className="text-xs">
                {branch.role}
              </Badge>
              {branch.branchId === userContext.currentBranchId && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}