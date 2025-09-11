import { useState } from 'react';
import { 
  useTenantContext, 
  useSwitchTenant, 
  useAccessibleTenants 
} from '@/contexts/TenantContext';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Globe, ArrowRightLeft, CheckCircle2, Loader2, RefreshCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function TenantSwitcher() {
  const [selectedTenant, setSelectedTenant] = useState<string>('');
  const { toast } = useToast();
  
  const { 
    currentTenant, 
    tenantSlug, 
    tenantName, 
    isMultiTenant,
    canSwitchTenants,
    isLoading,
    error,
    clearError
  } = useTenantContext();
  
  const { 
    tenants, 
    refreshTenants, 
    isLoading: tenantsLoading 
  } = useAccessibleTenants();
  
  const { 
    switchTenant, 
    isSwitching,
    error: switchError 
  } = useSwitchTenant();

  const handleSwitchTenant = async () => {
    if (!selectedTenant) {
      toast({
        title: "No tenant selected",
        description: "Please select a tenant to switch to",
        variant: "destructive",
      });
      return;
    }

    if (selectedTenant === tenantSlug) {
      toast({
        title: "Already active",
        description: "You are already in this tenant",
        variant: "default",
      });
      return;
    }

    try {
      await switchTenant(selectedTenant);
      setSelectedTenant(''); // Clear selection after successful switch
    } catch (err) {
      // Error handling is done in the context
      console.error('Tenant switch failed:', err);
    }
  };

  const handleRefreshTenants = async () => {
    try {
      await refreshTenants();
      toast({
        title: "Tenants refreshed",
        description: "Tenant list has been updated",
      });
    } catch (err) {
      toast({
        title: "Refresh failed",
        description: "Failed to refresh tenant list",
        variant: "destructive",
      });
    }
  };

  if (isLoading || tenantsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Tenant Context
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading tenant information...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Tenant Context
        </CardTitle>
        <CardDescription>
          {isMultiTenant ? 
            "Switch between different tenant organizations" : 
            "Single tenant environment"
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Tenant Information */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Current Tenant</label>
          <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <div className="flex-1">
              <div className="font-medium">{tenantName}</div>
              <div className="text-xs text-muted-foreground">
                Slug: {tenantSlug}
                {currentTenant?.id && (
                  <> • ID: {currentTenant.id}</>
                )}
              </div>
            </div>
            {currentTenant?.status && (
              <Badge variant={currentTenant.status === 'active' ? 'default' : 'secondary'}>
                {currentTenant.status}
              </Badge>
            )}
          </div>
        </div>

        {/* Tenant Switching */}
        {canSwitchTenants && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Switch Tenant</label>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshTenants}
                disabled={tenantsLoading}
                data-testid="button-refresh-tenants"
              >
                <RefreshCcw className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Select 
                value={selectedTenant} 
                onValueChange={setSelectedTenant}
                disabled={isSwitching}
              >
                <SelectTrigger 
                  className="flex-1"
                  data-testid="select-tenant"
                >
                  <SelectValue placeholder="Select a tenant..." />
                </SelectTrigger>
                <SelectContent>
                  {tenants.map((tenant) => (
                    <SelectItem 
                      key={tenant.slug} 
                      value={tenant.slug}
                      data-testid={`option-tenant-${tenant.slug}`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span>{tenant.name}</span>
                        <div className="flex items-center gap-1 ml-2">
                          <Badge variant="outline" className="text-xs">
                            {tenant.role}
                          </Badge>
                          {tenant.isDefault && (
                            <Badge variant="secondary" className="text-xs">
                              Default
                            </Badge>
                          )}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button 
                onClick={handleSwitchTenant}
                disabled={isSwitching || !selectedTenant}
                data-testid="button-switch-tenant"
              >
                {isSwitching ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Switching...
                  </>
                ) : (
                  <>
                    <ArrowRightLeft className="h-4 w-4 mr-2" />
                    Switch
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Accessible Tenants List */}
        {tenants.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Accessible Tenants ({tenants.length})
            </label>
            <div className="grid gap-2 max-h-40 overflow-y-auto">
              {tenants.map((tenant) => (
                <div 
                  key={tenant.slug}
                  className={`flex items-center justify-between p-2 rounded-md border text-sm ${
                    tenant.slug === tenantSlug ? 
                    'bg-primary/10 border-primary' : 
                    'bg-muted/50 border-muted'
                  }`}
                  data-testid={`tenant-card-${tenant.slug}`}
                >
                  <div className="flex-1">
                    <div className="font-medium">{tenant.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {tenant.slug}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className="text-xs">
                      {tenant.role}
                    </Badge>
                    {tenant.slug === tenantSlug && (
                      <Badge variant="default" className="text-xs">
                        Active
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error Display */}
        {(error || switchError) && (
          <div className="p-2 bg-destructive/10 border border-destructive/20 rounded-md">
            <div className="text-sm text-destructive font-medium">
              Error: {error || switchError}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={clearError}
              className="mt-2"
              data-testid="button-clear-error"
            >
              Clear Error
            </Button>
          </div>
        )}

        {/* No Multi-Tenant Message */}
        {!isMultiTenant && tenants.length <= 1 && (
          <div className="text-center py-4 text-muted-foreground text-sm">
            <Globe className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <div>Single tenant environment</div>
            <div className="text-xs">No additional tenants available</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}