import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Users, Plus, Settings, Activity } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CreateTenantDialog } from '@/components/tenant/CreateTenantDialog';
import { TenantManagementTable } from '@/components/tenant/TenantManagementTable';
import { TenantOnboardingWizard } from '@/components/tenant/TenantOnboardingWizard';
import { SuperAdminStats } from '@/components/tenant/SuperAdminStats';

export default function SuperAdminDashboard() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showOnboardingWizard, setShowOnboardingWizard] = useState(false);
  const { toast } = useToast();

  const { data: tenants, isLoading } = useQuery({
    queryKey: ['/api/admin/tenants'],
  });

  const { data: systemStats } = useQuery({
    queryKey: ['/api/admin/stats'],
  });

  const deleteTenantMutation = useMutation({
    mutationFn: (tenantId: string) => apiRequest(`/api/admin/tenants/${tenantId}`, {
      method: 'DELETE',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tenants'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      toast({
        title: "Success",
        description: "Tenant deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete tenant",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse">Loading super admin dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Super Admin Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Manage tenants, users, and system-wide settings
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => setShowOnboardingWizard(true)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Activity className="h-4 w-4" />
              Onboard Tenant
            </Button>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Tenant
            </Button>
          </div>
        </div>

        {/* System Stats */}
        <SuperAdminStats stats={systemStats} />

        {/* Main Content */}
        <Tabs defaultValue="tenants" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="tenants" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Tenants
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              All Users
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              System Settings
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tenants">
            <Card className="backdrop-blur-sm bg-white/90 dark:bg-gray-800/90 border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Tenant Management
                </CardTitle>
                <CardDescription>
                  Create, manage, and monitor all tenants in the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TenantManagementTable 
                  tenants={tenants || []}
                  onDeleteTenant={(tenantId) => deleteTenantMutation.mutate(tenantId)}
                  isDeleting={deleteTenantMutation.isPending}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card className="backdrop-blur-sm bg-white/90 dark:bg-gray-800/90 border-0 shadow-xl">
              <CardHeader>
                <CardTitle>System-Wide User Management</CardTitle>
                <CardDescription>
                  View and manage users across all tenants
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  User management interface will be loaded here
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card className="backdrop-blur-sm bg-white/90 dark:bg-gray-800/90 border-0 shadow-xl">
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>
                  Configure system-wide settings and preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  System settings interface will be loaded here
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <Card className="backdrop-blur-sm bg-white/90 dark:bg-gray-800/90 border-0 shadow-xl">
              <CardHeader>
                <CardTitle>System Analytics</CardTitle>
                <CardDescription>
                  Monitor system performance and usage across all tenants
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  Analytics dashboard will be loaded here
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <CreateTenantDialog 
        open={showCreateDialog} 
        onOpenChange={setShowCreateDialog}
      />
      
      <TenantOnboardingWizard
        open={showOnboardingWizard}
        onOpenChange={setShowOnboardingWizard}
      />
    </div>
  );
}