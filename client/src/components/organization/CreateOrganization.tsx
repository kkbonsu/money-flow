import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Building2, Sparkles } from "lucide-react";

interface CreateOrganizationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (organization: any) => void;
}

export function CreateOrganization({ open, onOpenChange, onSuccess }: CreateOrganizationProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    tin: "",
    licenseNumber: "",
    subscriptionPlan: "free" as "free" | "starter" | "professional" | "enterprise",
  });

  const createOrganization = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiRequest("/api/organizations", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Organization created successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/organizations"] });
      onSuccess?.(data);
      onOpenChange(false);
      setFormData({
        name: "",
        description: "",
        tin: "",
        licenseNumber: "",
        subscriptionPlan: "free",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create organization",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Organization name is required",
        variant: "destructive",
      });
      return;
    }
    createOrganization.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl glassmorphism-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Create New Organization
          </DialogTitle>
          <DialogDescription>
            Set up a new organization to manage your microfinance operations
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Organization Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="ABC Microfinance Ltd"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tin">TIN Number</Label>
              <Input
                id="tin"
                value={formData.tin}
                onChange={(e) => setFormData({ ...formData, tin: e.target.value })}
                placeholder="Tax Identification Number"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of your organization"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="licenseNumber">BoG License Number</Label>
            <Input
              id="licenseNumber"
              value={formData.licenseNumber}
              onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
              placeholder="Bank of Ghana License Number"
            />
          </div>

          <div className="space-y-3">
            <Label>Subscription Plan</Label>
            <RadioGroup
              value={formData.subscriptionPlan}
              onValueChange={(value: any) => setFormData({ ...formData, subscriptionPlan: value })}
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start space-x-2 p-4 rounded-lg border hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="free" id="free" />
                  <div className="flex-1">
                    <Label htmlFor="free" className="cursor-pointer">
                      <div className="font-medium">Free</div>
                      <div className="text-sm text-muted-foreground">
                        Basic features for small operations
                      </div>
                    </Label>
                  </div>
                </div>

                <div className="flex items-start space-x-2 p-4 rounded-lg border hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="starter" id="starter" />
                  <div className="flex-1">
                    <Label htmlFor="starter" className="cursor-pointer">
                      <div className="font-medium">Starter</div>
                      <div className="text-sm text-muted-foreground">
                        Essential features for growing teams
                      </div>
                    </Label>
                  </div>
                </div>

                <div className="flex items-start space-x-2 p-4 rounded-lg border hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="professional" id="professional" />
                  <div className="flex-1">
                    <Label htmlFor="professional" className="cursor-pointer">
                      <div className="font-medium flex items-center gap-1">
                        Professional
                        <Sparkles className="h-3 w-3 text-primary" />
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Advanced features and priority support
                      </div>
                    </Label>
                  </div>
                </div>

                <div className="flex items-start space-x-2 p-4 rounded-lg border hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="enterprise" id="enterprise" />
                  <div className="flex-1">
                    <Label htmlFor="enterprise" className="cursor-pointer">
                      <div className="font-medium">Enterprise</div>
                      <div className="text-sm text-muted-foreground">
                        Unlimited features and dedicated support
                      </div>
                    </Label>
                  </div>
                </div>
              </div>
            </RadioGroup>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createOrganization.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createOrganization.isPending}>
              {createOrganization.isPending ? "Creating..." : "Create Organization"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}