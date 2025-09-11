import { Sun, Moon, Menu, User, Settings, LogOut, ChevronDown, Building2, ArrowRightLeft, CheckCircle2, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { useTenantContext, useSwitchTenant, useAccessibleTenants } from '@/contexts/TenantContext';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';

export default function Header() {
  const { theme, toggleTheme } = useTheme();
  const { user: authUser, logout } = useAuth();
  const [, setLocation] = useLocation();
  
  // Get tenant context
  const {
    currentTenant,
    tenantName,
    tenantSlug,
    isMultiTenant,
    canSwitchTenants,
    isLoading: tenantLoading
  } = useTenantContext();
  
  const { tenants } = useAccessibleTenants();
  const { switchTenant, isSwitching } = useSwitchTenant();
  
  // Get fresh user data including profile picture
  const { data: user } = useQuery<any>({
    queryKey: ['/api/users/profile'],
    enabled: !!authUser, // Only run if user is authenticated
  });

  return (
    <header className="backdrop-blur-lg bg-card/50 border-b border-border/50 shadow-lg slide-in-right">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="w-5 h-5" />
          </Button>
          
          {/* Tenant Context Display */}
          {!tenantLoading && currentTenant && (
            <div className="hidden md:flex items-center space-x-3 px-3 py-2 bg-muted/50 rounded-lg">
              <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg flex items-center justify-center">
                <Building2 className="w-4 h-4 text-primary" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground">
                  {tenantName}
                </span>
                <span className="text-xs text-muted-foreground">
                  {tenantSlug}
                </span>
              </div>
              {currentTenant?.status && (
                <Badge 
                  variant={currentTenant.status === 'active' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {currentTenant.status}
                </Badge>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-4">
          {/* Tenant Switcher - Quick Access */}
          {canSwitchTenants && tenants.length > 1 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="flex items-center gap-2"
                  disabled={isSwitching}
                  data-testid="dropdown-tenant-switcher"
                >
                  <Globe className="w-4 h-4" />
                  <span className="hidden sm:inline">Switch</span>
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>Switch Organization</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {tenants.map((tenant) => (
                  <DropdownMenuItem
                    key={tenant.slug}
                    onClick={() => {
                      if (tenant.slug !== tenantSlug) {
                        switchTenant(tenant.slug);
                      }
                    }}
                    disabled={tenant.slug === tenantSlug || isSwitching}
                    className="flex items-center justify-between"
                    data-testid={`option-quick-tenant-${tenant.slug}`}
                  >
                    <div className="flex items-center space-x-2">
                      {tenant.slug === tenantSlug && (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      )}
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{tenant.name}</span>
                        <span className="text-xs text-muted-foreground">{tenant.slug}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" className="text-xs">
                        {tenant.role}
                      </Badge>
                      {tenant.slug === tenantSlug && (
                        <Badge variant="default" className="text-xs">
                          Current
                        </Badge>
                      )}
                    </div>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setLocation('/tenant-selection')}>
                  <ArrowRightLeft className="mr-2 h-4 w-4" />
                  <span>Manage Organizations</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="hover:scale-110 transition-transform duration-300"
            data-testid="button-theme-toggle"
          >
            {theme === 'light' ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </Button>

          {/* User Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 p-2 h-auto">
                <Avatar className="h-8 w-8">
                  <AvatarImage 
                    src={user?.profilePicture || undefined} 
                    alt={user?.username || authUser?.username || 'User'} 
                  />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {user?.firstName?.[0] || user?.username?.charAt(0).toUpperCase() || authUser?.username?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.firstName && user?.lastName 
                      ? `${user.firstName} ${user.lastName}` 
                      : user?.username || authUser?.username}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email || authUser?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setLocation('/profile')}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLocation('/tenant-selection')}>
                <Building2 className="mr-2 h-4 w-4" />
                <span>Switch Organization</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
