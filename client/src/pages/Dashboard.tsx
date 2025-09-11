import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useTenantContext } from '@/contexts/TenantContext';
import { useLocation } from 'wouter';
import { BookOpen, Users, Clock, DollarSign, Building2, Settings, ArrowRightLeft, AlertCircle, RefreshCcw, BarChart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import MetricCard from '@/components/dashboard/MetricCard';
import ChartCard from '@/components/dashboard/ChartCard';
import LoanPortfolioChart from '@/components/dashboard/LoanPortfolioChart';
import PaymentStatusCard from '@/components/dashboard/PaymentStatusCard';
import AdvancedAnalytics from '@/components/dashboard/AdvancedAnalytics';
import { DashboardMetrics } from '@/types';

export default function Dashboard() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  
  // Get tenant context
  const {
    currentTenant,
    tenantName,
    tenantSlug,
    isLoading: tenantLoading,
    error: tenantError,
    isMultiTenant,
    canSwitchTenants,
    refreshTenants
  } = useTenantContext();

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    setLocation('/login');
    return null;
  }

  // Fetch dashboard metrics with proper tenant isolation
  const { data: metrics, isLoading: metricsLoading, error: metricsError } = useQuery<DashboardMetrics>({
    queryKey: ['tenant', currentTenant?.slug || 'default', '/api/dashboard/metrics'],
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!currentTenant, // Only fetch when tenant is loaded
  });

  const isLoading = tenantLoading || metricsLoading;

  // Handle tenant errors
  if (tenantError) {
    return (
      <div className="space-y-6 fade-in">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Tenant Error: {tenantError}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6 fade-in">
        {/* Tenant Context Loading Skeleton */}
        <div className="glass-card rounded-2xl p-6 pulse-animation">
          <div className="h-6 bg-muted rounded-lg w-1/3 mb-2"></div>
          <div className="h-4 bg-muted rounded-lg w-1/2"></div>
        </div>
        
        {/* Metrics Loading Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-card rounded-2xl p-6 pulse-animation" style={{ animationDelay: `${i * 0.2}s` }}>
              <div className="h-4 bg-muted rounded-lg w-3/4 mb-2"></div>
              <div className="h-8 bg-muted rounded-lg w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Tenant Context Header */}
      <div className="glass-card rounded-2xl p-6 slide-in-down">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {tenantName} Dashboard
              </h1>
              <div className="flex items-center space-x-2 mt-1">
                <p className="text-sm text-muted-foreground">
                  Organization: {tenantSlug}
                </p>
                {currentTenant?.status && (
                  <Badge 
                    variant={currentTenant.status === 'active' ? 'default' : 'secondary'}
                    className="text-xs"
                    data-testid="badge-tenant-status"
                  >
                    {currentTenant.status}
                  </Badge>
                )}
                {isMultiTenant && (
                  <Badge variant="outline" className="text-xs">
                    Multi-Tenant
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {canSwitchTenants && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation('/tenant-selection')}
                data-testid="button-switch-tenant"
              >
                <ArrowRightLeft className="w-4 h-4 mr-2" />
                Switch Organization
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshTenants}
              data-testid="button-refresh-dashboard"
            >
              <RefreshCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Metrics Error Display */}
        {metricsError && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load dashboard metrics: {metricsError.message}
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Loans"
          value={metrics?.totalLoans || '$0'}
          icon={BookOpen}
          trend={{
            value: metrics?.loanGrowth || 0,
            label: 'from last month',
          }}
        />
        <MetricCard
          title="Active Customers"
          value={metrics?.activeCustomers?.toString() || '0'}
          icon={Users}
          trend={{
            value: metrics?.customerGrowth || 0,
            label: 'from last month',
          }}
        />
        <MetricCard
          title="Pending Payments"
          value={metrics?.pendingPayments || '$0'}
          icon={Clock}
          trend={{
            value: metrics?.paymentGrowth || 0,
            label: 'from last month',
          }}
        />
        <MetricCard
          title="Monthly Income"
          value={metrics?.monthlyIncome || '$0'}
          icon={DollarSign}
          trend={{
            value: metrics?.revenueGrowth || 0,
            label: 'from last month',
          }}
        />
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="slide-in-left">
          <LoanPortfolioChart />
        </div>
        <div className="slide-in-right">
          <PaymentStatusCard />
        </div>
      </div>

      {/* Advanced Analytics & Compliance */}
      <div className="w-full slide-in-up">
        <AdvancedAnalytics />
      </div>

      {/* Tenant-Specific Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 slide-in-up">
        {/* Quick Actions Card */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-center gap-2"
                onClick={() => setLocation('/customers')}
                data-testid="button-quick-customers"
              >
                <Users className="w-6 h-6" />
                <span className="text-sm">Manage Customers</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-center gap-2"
                onClick={() => setLocation('/loan-book')}
                data-testid="button-quick-loans"
              >
                <BookOpen className="w-6 h-6" />
                <span className="text-sm">Loan Portfolio</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-center gap-2"
                onClick={() => setLocation('/receive-payments')}
                data-testid="button-quick-payments"
              >
                <DollarSign className="w-6 h-6" />
                <span className="text-sm">Receive Payments</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto p-4 flex flex-col items-center gap-2"
                onClick={() => setLocation('/reports')}
                data-testid="button-quick-reports"
              >
                <BarChart className="w-6 h-6" />
                <span className="text-sm">Reports</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tenant Information & Settings */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Tenant Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium text-foreground">{tenantName}</p>
                  <p className="text-sm text-muted-foreground">Organization ID: {currentTenant?.id}</p>
                </div>
                <div className="flex items-center space-x-2">
                  {currentTenant?.status && (
                    <Badge variant={currentTenant.status === 'active' ? 'default' : 'secondary'}>
                      {currentTenant.status}
                    </Badge>
                  )}
                  {isMultiTenant && (
                    <Badge variant="outline" className="text-xs">
                      Multi-Tenant
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {canSwitchTenants && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLocation('/tenant-selection')}
                    className="flex items-center gap-2"
                    data-testid="button-manage-tenants"
                  >
                    <ArrowRightLeft className="w-4 h-4" />
                    Switch Org
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshTenants}
                  className="flex items-center gap-2"
                  data-testid="button-refresh-tenant-data"
                >
                  <RefreshCcw className="w-4 h-4" />
                  Refresh
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
