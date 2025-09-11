import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { 
  useTenantContext, 
  useSwitchTenant, 
  useAccessibleTenants,
  useCurrentTenant 
} from '@/contexts/TenantContext';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Search, 
  Building2, 
  Users, 
  Shield, 
  ChevronRight, 
  CheckCircle2, 
  Clock,
  Globe,
  Filter,
  RefreshCcw,
  ArrowLeft,
  Settings,
  Star
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { AccessibleTenant } from '@/types/tenant';

interface TenantCardProps {
  tenant: AccessibleTenant;
  currentTenantSlug: string;
  isSelected: boolean;
  onSelect: (tenantSlug: string) => void;
  onSetDefault: (tenantSlug: string) => void;
}

function TenantCard({ tenant, currentTenantSlug, isSelected, onSelect, onSetDefault }: TenantCardProps) {
  const isActive = tenant.slug === currentTenantSlug;
  
  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] group",
        isActive && "ring-2 ring-primary shadow-lg",
        isSelected && !isActive && "ring-2 ring-primary/50"
      )}
      onClick={() => onSelect(tenant.slug)}
      data-testid={`tenant-card-${tenant.slug}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={undefined} alt={tenant.name} />
              <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                {tenant.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg group-hover:text-primary transition-colors">
                {tenant.name}
              </CardTitle>
              <CardDescription className="text-sm">
                {tenant.slug}
              </CardDescription>
            </div>
          </div>
          
          <div className="flex flex-col items-end space-y-1">
            {isActive && (
              <Badge variant="default" className="text-xs">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Active
              </Badge>
            )}
            {tenant.isDefault && (
              <Badge variant="secondary" className="text-xs">
                <Star className="w-3 h-3 mr-1" />
                Default
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Role and Status */}
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-xs">
              <Shield className="w-3 h-3 mr-1" />
              {tenant.role}
            </Badge>
            <Badge 
              variant={tenant.status === 'active' ? 'default' : 'secondary'} 
              className="text-xs"
            >
              {tenant.status}
            </Badge>
          </div>
          
          {/* Permissions */}
          {tenant.permissions && tenant.permissions.length > 0 && (
            <div className="space-y-1">
              <div className="text-xs font-medium text-muted-foreground">Permissions</div>
              <div className="flex flex-wrap gap-1">
                {tenant.permissions.slice(0, 3).map((permission, index) => (
                  <Badge key={index} variant="outline" className="text-xs px-1.5 py-0.5">
                    {permission}
                  </Badge>
                ))}
                {tenant.permissions.length > 3 && (
                  <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                    +{tenant.permissions.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          )}
          
          {/* Last Accessed */}
          {tenant.lastAccessed && (
            <div className="flex items-center text-xs text-muted-foreground">
              <Clock className="w-3 h-3 mr-1" />
              Last accessed: {new Date(tenant.lastAccessed).toLocaleDateString()}
            </div>
          )}
          
          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="ghost" 
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onSetDefault(tenant.slug);
              }}
              className="text-xs"
              disabled={tenant.isDefault}
              data-testid={`button-set-default-${tenant.slug}`}
            >
              {tenant.isDefault ? 'Default Tenant' : 'Set as Default'}
            </Button>
            
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(tenant.slug);
              }}
              disabled={isActive}
              data-testid={`button-enter-${tenant.slug}`}
            >
              {isActive ? 'Current' : 'Enter'}
              {!isActive && <ChevronRight className="w-4 h-4 ml-1" />}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function TenantSelection() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTenant, setSelectedTenant] = useState<string>('');
  const { user } = useAuth();
  const { toast } = useToast();
  
  const { 
    currentTenant, 
    isLoading, 
    canSwitchTenants,
    error,
    clearError
  } = useTenantContext();
  
  const { tenant: currentTenantInfo, tenantSlug } = useCurrentTenant();
  
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

  // Filter tenants based on search query
  const filteredTenants = tenants.filter(tenant =>
    tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tenant.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tenant.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectTenant = async (tenantSlugToSelect: string) => {
    if (tenantSlugToSelect === tenantSlug) {
      // Navigate to dashboard if selecting current tenant
      setLocation('/');
      return;
    }

    try {
      await switchTenant(tenantSlugToSelect);
      toast({
        title: "Tenant switched",
        description: "Successfully switched to the selected tenant",
      });
      // Navigate to dashboard after successful switch
      setTimeout(() => setLocation('/'), 500);
    } catch (error) {
      // Error handling is done in the context
      console.error('Failed to switch tenant:', error);
    }
  };

  const handleSetDefault = async (tenantSlugToSet: string) => {
    // TODO: Implement set default tenant functionality when backend supports it
    toast({
      title: "Feature coming soon",
      description: "Setting default tenant will be available soon",
      variant: "default",
    });
  };

  const handleRefreshTenants = async () => {
    try {
      await refreshTenants();
      toast({
        title: "Success",
        description: "Tenant list refreshed successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh tenant list",
        variant: "destructive",
      });
    }
  };

  const handleGoToDashboard = () => {
    setLocation('/');
  };

  // Handle loading states
  if (isLoading || tenantsLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Loading your organizations</h3>
            <p className="text-muted-foreground">Please wait while we fetch your accessible tenants...</p>
          </div>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error && !tenants.length) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Tenants</CardTitle>
            <CardDescription>
              We couldn't load your accessible organizations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{error}</p>
            <div className="flex gap-2">
              <Button onClick={handleRefreshTenants} disabled={tenantsLoading}>
                <RefreshCcw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              <Button variant="outline" onClick={clearError}>
                Clear Error
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleGoToDashboard}
                data-testid="button-back-to-dashboard"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <div className="hidden sm:block">
                <h1 className="text-2xl font-bold">Select Organization</h1>
                <p className="text-muted-foreground">
                  Choose which organization you'd like to work with
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleRefreshTenants}
                disabled={tenantsLoading}
                data-testid="button-refresh-tenants"
              >
                <RefreshCcw className={cn("w-4 h-4 mr-2", tenantsLoading && "animate-spin")} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Current User Info */}
        <Card className="mb-6 bg-muted/50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-medium">Welcome, {user?.username}</h3>
                <p className="text-sm text-muted-foreground">
                  You have access to {tenants.length} organization{tenants.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search organizations by name, slug, or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-tenants"
              />
            </div>
          </div>
        </div>

        {/* Current Tenant Banner */}
        {currentTenantInfo && (
          <Card className="mb-6 border-primary/50 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <div>
                    <h4 className="font-medium">Currently active: {currentTenantInfo.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      You're working in this organization
                    </p>
                  </div>
                </div>
                <Button onClick={handleGoToDashboard} data-testid="button-continue-dashboard">
                  Continue to Dashboard
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tenant Grid */}
        {filteredTenants.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTenants.map((tenant) => (
              <TenantCard
                key={tenant.slug}
                tenant={tenant}
                currentTenantSlug={tenantSlug}
                isSelected={selectedTenant === tenant.slug}
                onSelect={handleSelectTenant}
                onSetDefault={handleSetDefault}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No organizations found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery 
                    ? "No organizations match your search criteria" 
                    : "You don't have access to any organizations yet"
                  }
                </p>
                {searchQuery && (
                  <Button 
                    variant="outline" 
                    onClick={() => setSearchQuery('')}
                    data-testid="button-clear-search"
                  >
                    Clear Search
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading/Error States */}
        {isSwitching && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-sm">Switching organization...</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {(error || switchError) && (
          <Card className="mt-6 border-destructive/50 bg-destructive/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-destructive">Error</h4>
                  <p className="text-sm text-muted-foreground">
                    {error || switchError}
                  </p>
                </div>
                <Button variant="outline" onClick={clearError} data-testid="button-clear-error">
                  Dismiss
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}