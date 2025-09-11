import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useFilteredNavigation, useNavigationContext } from '@/hooks/useNavigationPermissions';
import { useTenantContext } from '@/contexts/TenantContext';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  BarChart, 
  Shield,
  AlertTriangle,
  User,
  Crown,
  Settings2
} from 'lucide-react';

// Navigation items are now loaded dynamically based on permissions
// See navigationConfig.ts for the static configuration

function NavigationSkeleton() {
  return (
    <div className="px-4 py-6 space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}

function RoleIndicator({ role, hierarchyLevel, isSuperAdmin }: { 
  role: string | null; 
  hierarchyLevel: number | null; 
  isSuperAdmin: boolean;
}) {
  if (isSuperAdmin) {
    return (
      <Badge variant="destructive" className="text-xs flex items-center gap-1">
        <Crown className="w-3 h-3" />
        Super Admin
      </Badge>
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

  const IconComponent = getRoleIcon(hierarchyLevel);

  return (
    <Badge variant={getRoleColor(hierarchyLevel)} className="text-xs flex items-center gap-1">
      <IconComponent className="w-3 h-3" />
      {role || 'No Role'}
    </Badge>
  );
}

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const { tenantName, tenantSlug, isLoading: tenantLoading } = useTenantContext();
  const { 
    navigationSections, 
    specialItems, 
    isLoading: navLoading,
    userRole,
    hierarchyLevel 
  } = useFilteredNavigation();
  const navigationContext = useNavigationContext();

  const isLoading = tenantLoading || navLoading;

  return (
    <div className="hidden md:flex md:w-80 glass-sidebar flex-col slide-in-left">
      {/* Logo and Tenant Section */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center space-x-3 scale-in">
          <div className="w-10 h-10 bg-sidebar-primary rounded-xl flex items-center justify-center shadow-lg">
            <BarChart className="w-6 h-6 text-sidebar-primary-foreground" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-sidebar-foreground">Money Flow</h1>
            <p className="text-sm text-sidebar-foreground/70">Loan Management</p>
          </div>
        </div>
        
        {/* Tenant and Role Info */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-sidebar-foreground/60">Organization:</span>
            <span className="text-xs font-medium text-sidebar-foreground truncate max-w-32" title={tenantName}>
              {tenantName}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-sidebar-foreground/60">Role:</span>
            <RoleIndicator 
              role={userRole} 
              hierarchyLevel={hierarchyLevel}
              isSuperAdmin={navigationContext.isSuperAdmin}
            />
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto" data-testid="nav-sidebar">
        {isLoading ? (
          <NavigationSkeleton />
        ) : (
          <>
            {/* Special Navigation Items (Super Admin, etc.) */}
            {specialItems.map((item) => (
              <Link key={item.name} href={item.href}>
                <div
                  className={cn(
                    'sidebar-nav-item bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-300/30',
                    location === item.href && 'active'
                  )}
                  data-testid={item.testId}
                >
                  <item.icon className="w-5 h-5 mr-3 text-red-600" />
                  {item.name}
                  <Crown className="w-4 h-4 ml-auto text-red-600" />
                </div>
              </Link>
            ))}
            
            {/* Regular Navigation Sections */}
            {navigationSections.map((section) => (
              <div key={section.name} className="space-y-1">
                {section.href ? (
                  <Link href={section.href}>
                    <div
                      className={cn(
                        'sidebar-nav-item',
                        location === section.href && 'active'
                      )}
                      data-testid={section.testId}
                    >
                      <section.icon className="w-5 h-5 mr-3" />
                      {section.name}
                    </div>
                  </Link>
                ) : (
                  <>
                    <div className="text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider mt-6 mb-3 flex items-center justify-between">
                      <span>{section.name}</span>
                      {section.items && (
                        <span className="text-sidebar-foreground/40">({section.items.length})</span>
                      )}
                    </div>
                    {section.items?.map((item) => (
                      <Link key={item.name} href={item.href}>
                        <div
                          className={cn(
                            'sidebar-nav-item',
                            location === item.href && 'active'
                          )}
                          data-testid={item.testId}
                        >
                          <item.icon className="w-5 h-5 mr-3" />
                          <span className="flex-1">{item.name}</span>
                          {/* Visual indicator for restricted items */}
                          {item.permission && hierarchyLevel && hierarchyLevel > 2 && (
                            <div className="w-2 h-2 rounded-full bg-orange-400 opacity-60" 
                                 title="Requires elevated permissions" />
                          )}
                        </div>
                      </Link>
                    ))}
                  </>
                )}
              </div>
            ))}
            
            {/* Debug Info in Development */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-8 p-3 bg-sidebar-accent/20 rounded-lg border border-sidebar-border/50">
                <div className="text-xs text-sidebar-foreground/60 font-medium mb-2">Debug Info:</div>
                <div className="text-xs text-sidebar-foreground/50 space-y-1">
                  <div>Tenant: {navigationContext.tenantSlug}</div>
                  <div>Role: {navigationContext.userRole} (L{navigationContext.hierarchyLevel})</div>
                  <div>Permissions: {navigationContext.permissions.length}</div>
                  <div>Sections: {navigationSections.length}</div>
                </div>
              </div>
            )}
            
            {/* No Access Warning */}
            {navigationSections.length === 0 && !isLoading && (
              <div className="mt-8 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
                      Limited Access
                    </h3>
                    <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-1">
                      Contact your administrator to request additional permissions for this tenant.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </nav>
    </div>
  );
}
