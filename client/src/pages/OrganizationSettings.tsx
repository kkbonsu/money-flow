import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, CreditCard, Settings, Shield, Bell } from "lucide-react";
import { useOrganization } from "@/contexts/OrganizationContext";
import type { Organization } from "@shared/schema";

export default function OrganizationSettings() {
  const { toast } = useToast();
  const { currentOrganization } = useOrganization();
  const [isLoading, setIsLoading] = useState(false);

  const { data: organization, isLoading: orgLoading } = useQuery({
    queryKey: ["/api/organizations", currentOrganization?.id],
    enabled: !!currentOrganization?.id,
  });

  const { data: members } = useQuery({
    queryKey: ["/api/organizations", currentOrganization?.id, "members"],
    enabled: !!currentOrganization?.id,
  });

  const updateOrganization = useMutation({
    mutationFn: async (data: Partial<Organization>) => {
      return await apiRequest(`/api/organizations/${currentOrganization?.id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Organization settings updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/organizations"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update organization settings.",
        variant: "destructive",
      });
    },
  });

  const inviteMember = useMutation({
    mutationFn: async (data: { email: string; role: string }) => {
      return await apiRequest(`/api/organizations/${currentOrganization?.id}/invite`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Invitation sent successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/organizations", currentOrganization?.id, "members"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send invitation.",
        variant: "destructive",
      });
    },
  });

  if (orgLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Organization Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your organization settings, members, and billing
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid grid-cols-5 w-full max-w-2xl">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="members" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Members
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Billing
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card className="glassmorphism-card">
            <CardHeader>
              <CardTitle>Organization Details</CardTitle>
              <CardDescription>
                Update your organization's basic information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Organization Name</Label>
                  <Input
                    id="name"
                    defaultValue={organization?.name}
                    placeholder="Enter organization name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="domain">Domain</Label>
                  <Input
                    id="domain"
                    defaultValue={organization?.domain}
                    placeholder="company.moneyflow.app"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  defaultValue={organization?.description}
                  placeholder="Brief description of your organization"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tin">TIN Number</Label>
                  <Input
                    id="tin"
                    defaultValue={organization?.tin}
                    placeholder="Tax Identification Number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="licenseNumber">License Number</Label>
                  <Input
                    id="licenseNumber"
                    defaultValue={organization?.licenseNumber}
                    placeholder="BoG License Number"
                  />
                </div>
              </div>

              <Button
                onClick={() => {
                  // Collect form data and update
                  const formData = {
                    name: (document.getElementById('name') as HTMLInputElement).value,
                    description: (document.getElementById('description') as HTMLInputElement).value,
                    tin: (document.getElementById('tin') as HTMLInputElement).value,
                    licenseNumber: (document.getElementById('licenseNumber') as HTMLInputElement).value,
                  };
                  updateOrganization.mutate(formData);
                }}
                disabled={updateOrganization.isPending}
              >
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="space-y-6">
          <Card className="glassmorphism-card">
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                Manage your organization's team members and their roles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4 mb-6">
                  <Input
                    id="inviteEmail"
                    placeholder="Enter email address"
                    className="flex-1"
                  />
                  <Select defaultValue="member">
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={() => {
                      const email = (document.getElementById('inviteEmail') as HTMLInputElement).value;
                      const role = (document.querySelector('[data-state="open"]') as any)?.value || 'member';
                      if (email) {
                        inviteMember.mutate({ email, role });
                      }
                    }}
                    disabled={inviteMember.isPending}
                  >
                    Send Invite
                  </Button>
                </div>

                <div className="space-y-2">
                  {members?.map((member: any) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-background/50 backdrop-blur"
                    >
                      <div>
                        <p className="font-medium">{member.name || member.email}</p>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant={member.status === 'active' ? 'default' : 'secondary'}>
                          {member.status}
                        </Badge>
                        <Badge variant="outline">{member.role}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <Card className="glassmorphism-card">
            <CardHeader>
              <CardTitle>Subscription & Billing</CardTitle>
              <CardDescription>
                Manage your subscription plan and billing details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-6 rounded-lg bg-gradient-to-r from-primary/10 to-purple-600/10 border">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-semibold">{organization?.subscriptionPlan || 'Free'} Plan</h3>
                    <p className="text-muted-foreground mt-1">
                      {organization?.subscriptionPlan === 'enterprise' && 'Unlimited features and support'}
                      {organization?.subscriptionPlan === 'professional' && 'Advanced features for growing teams'}
                      {organization?.subscriptionPlan === 'starter' && 'Essential features to get started'}
                      {organization?.subscriptionPlan === 'free' && 'Basic features with limitations'}
                    </p>
                  </div>
                  <Badge variant="default">Active</Badge>
                </div>
                <div className="mt-4 flex gap-4">
                  <Button variant="outline">Change Plan</Button>
                  <Button variant="outline">View Invoice History</Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Next Billing Date</Label>
                  <p className="text-sm text-muted-foreground">
                    {organization?.subscriptionEndsAt ? 
                      new Date(organization.subscriptionEndsAt).toLocaleDateString() : 
                      'No active subscription'}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <p className="text-sm text-muted-foreground">
                    {organization?.settings?.paymentMethod || 'No payment method on file'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card className="glassmorphism-card">
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Configure security settings for your organization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div>
                    <p className="font-medium">Two-Factor Authentication</p>
                    <p className="text-sm text-muted-foreground">
                      Require 2FA for all organization members
                    </p>
                  </div>
                  <Button variant="outline">Configure</Button>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div>
                    <p className="font-medium">Session Timeout</p>
                    <p className="text-sm text-muted-foreground">
                      Automatically log out users after inactivity
                    </p>
                  </div>
                  <Select defaultValue="30">
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div>
                    <p className="font-medium">IP Allowlist</p>
                    <p className="text-sm text-muted-foreground">
                      Restrict access to specific IP addresses
                    </p>
                  </div>
                  <Button variant="outline">Configure</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card className="glassmorphism-card">
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Configure how your organization receives notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                {[
                  { title: "Payment Notifications", description: "Receive alerts for payment activities" },
                  { title: "Security Alerts", description: "Get notified about security events" },
                  { title: "System Updates", description: "Updates about system maintenance and features" },
                  { title: "Compliance Reminders", description: "Reminders for regulatory compliance" },
                ].map((item) => (
                  <div key={item.title} className="flex items-center justify-between p-4 rounded-lg border">
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Configure
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}