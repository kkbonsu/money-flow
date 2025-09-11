import { Sun, Moon, Menu, User, Settings, LogOut, ChevronDown, Building2, ArrowRightLeft, CheckCircle2, Globe, Shield, Crown, Settings2, AlertTriangle, Bell, UserCog, BarChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { useTenantContext, useSwitchTenant, useAccessibleTenants } from '@/contexts/TenantContext';
import { useNavigationContext } from '@/hooks/useNavigationPermissions';
import { useHasPermission, useHasMinimumRole } from '@/hooks/usePermissions';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';

// Role indicator component for header
function HeaderRoleIndicator({ 
  isSuperAdmin, 
  roleName, 
  hierarchyLevel 
}: { 
  isSuperAdmin: boolean; 
  roleName: string | null; 
  hierarchyLevel: number | null; 
}) {
  if (isSuperAdmin) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="destructive" className="text-xs flex items-center gap-1">
              <Crown className="w-3 h-3" />
              Super Admin
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Full system access across all tenants</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  const getRoleColor = (level: number | null) => {
    if (!level) return "secondary";
    if (level <= 2) return "default"; // Admin
    if (level === 3) return "outline"; // Manager  
    return "secondary"; // Staff
  };

  const getRoleIcon = (level: number | null) => {
    if (!level || level > 3) return User;
    if (level <= 2) return Shield;
    return Settings2;
  };

  const getRoleDescription = (level: number | null, role: string | null) => {
    if (!level || !role) return "No role assigned";
    if (level <= 2) return "Administrative access with elevated permissions";
    if (level === 3) return "Management access with operational permissions";
    return "Staff access with basic operational permissions";
  };

  const IconComponent = getRoleIcon(hierarchyLevel);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={getRoleColor(hierarchyLevel)} className="text-xs flex items-center gap-1">
            <IconComponent className="w-3 h-3" />
            {roleName || 'No Role'}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{getRoleDescription(hierarchyLevel, roleName)}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

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
  
  // Get navigation context for permission-based UI
  const navigationContext = useNavigationContext();
  
  // Permission checks
  const canManageRoles = useHasPermission('users:assign_roles');
  const canViewReports = useHasPermission('reports:financial_view');
  const canManageStaff = useHasPermission('staff:view');
  const isAdminLevel = useHasMinimumRole(2); // Admin level or higher
  const isManagerLevel = useHasMinimumRole(3); // Manager level or higher
  
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
          
          {/* Tenant Context Display with Enhanced Role Information */}
          {!tenantLoading && currentTenant && (
            <div className="hidden lg:flex items-center space-x-3 px-3 py-2 bg-muted/50 rounded-lg">
              <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg flex items-center justify-center">
                <Building2 className="w-4 h-4 text-primary" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {tenantName}
                  </span>
                  {navigationContext.isSuperAdmin && (
                    <Crown className="w-3 h-3 text-yellow-500" title="Super Admin Access" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {tenantSlug}
                  </span>
                  <HeaderRoleIndicator
                    isSuperAdmin={navigationContext.isSuperAdmin}
                    roleName={navigationContext.userRole}
                    hierarchyLevel={navigationContext.hierarchyLevel}
                  />
                </div>
              </div>
              {currentTenant?.status && (
                <Badge 
                  variant={currentTenant.status === 'active' ? 'default' : 'secondary'}
                  className="text-xs"
                  data-testid="badge-tenant-status"
                >
                  {currentTenant.status}
                </Badge>
              )}
            </div>
          )}
          
          {/* Permission Warning for Limited Access */}
          {!tenantLoading && !navigationContext.isSuperAdmin && navigationContext.hierarchyLevel > 3 && (
            <div className="hidden xl:flex items-center">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Limited access - contact administrator for additional permissions</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-4">
          {/* Quick Actions for Admins/Managers */}
          {isManagerLevel && (
            <div className="hidden md:flex items-center space-x-2">
              {/* Role Management - Admin only */}
              {canManageRoles && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setLocation('/role-management')}
                        className="h-8 w-8"
                        data-testid="button-quick-role-management"
                      >
                        <UserCog className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Role Management</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              
              {/* Reports - Admin/Manager */}
              {canViewReports && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setLocation('/reports')}
                        className="h-8 w-8"
                        data-testid="button-quick-reports"
                      >
                        <BarChart className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Financial Reports</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              
              {/* Notifications - placeholder for future */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 relative"
                      data-testid="button-notifications"
                    >
                      <Bell className="w-4 h-4" />
                      {/* Notification badge placeholder */}
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full opacity-0" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Notifications (Coming Soon)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
          
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
                <DropdownMenuLabel className="flex items-center justify-between">
                  <span>Switch Organization</span>
                  {navigationContext.isSuperAdmin && (
                    <Crown className="w-4 h-4 text-yellow-500" />
                  )}
                </DropdownMenuLabel>
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
            <DropdownMenuContent className="w-64" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center justify-between">
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
                    <HeaderRoleIndicator
                      isSuperAdmin={navigationContext.isSuperAdmin}
                      roleName={navigationContext.userRole}
                      hierarchyLevel={navigationContext.hierarchyLevel}
                    />
                  </div>
                  
                  {/* Tenant info in dropdown */}
                  <div className="pt-2 border-t border-border/50">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Organization:</span>
                      <span className="font-medium truncate max-w-32" title={tenantName}>
                        {tenantName}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs mt-1">
                      <span className="text-muted-foreground">Permissions:</span>
                      <span className="font-medium">
                        {navigationContext.permissions.length}
                      </span>
                    </div>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={() => setLocation('/profile')} data-testid="dropdown-profile">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              
              {/* Admin-only menu items */}
              {isAdminLevel && (
                <>
                  <DropdownMenuItem onClick={() => setLocation('/role-management')} data-testid="dropdown-role-management">
                    <Shield className="mr-2 h-4 w-4" />
                    <span>Role Management</span>
                  </DropdownMenuItem>
                  {canManageStaff && (
                    <DropdownMenuItem onClick={() => setLocation('/staff')} data-testid="dropdown-staff">
                      <UserCog className="mr-2 h-4 w-4" />
                      <span>Staff Management</span>
                    </DropdownMenuItem>
                  )}
                </>
              )}
              
              {/* Super Admin only */}
              {navigationContext.isSuperAdmin && (
                <DropdownMenuItem onClick={() => setLocation('/super-admin')} data-testid="dropdown-super-admin">
                  <Crown className="mr-2 h-4 w-4 text-yellow-500" />
                  <span>Super Admin Dashboard</span>
                </DropdownMenuItem>
              )}
              
              <DropdownMenuItem onClick={() => setLocation('/tenant-selection')} data-testid="dropdown-tenant-selection">
                <Building2 className="mr-2 h-4 w-4" />
                <span>Switch Organization</span>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              {/* Settings - Manager and above */}
              {isManagerLevel && (
                <DropdownMenuItem onClick={() => setLocation('/settings')} data-testid="dropdown-settings">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
              )}
              
              <DropdownMenuItem onClick={logout} data-testid="dropdown-logout">
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
