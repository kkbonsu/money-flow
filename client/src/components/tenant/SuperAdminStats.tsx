import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Building2, Users, Activity, DollarSign, UserCheck, CreditCard, TrendingUp, Shield, Clock, AlertTriangle } from 'lucide-react';

interface SystemStats {
  totalTenants: number;
  activeTenants: number;
  suspendedTenants: number;
  totalUsers: number;
  activeUsers: number;
  totalCustomers: number;
  totalLoans: number;
  totalLoanAmount: string;
  recentTenants: number;
  recentUsers: number;
  tenantGrowth: number;
  userGrowth: number;
  customerGrowth: number;
  systemRevenue?: string;
  systemHealth?: {
    status: string;
    uptime: number;
    memoryUsage: any;
    timestamp: string;
  };
}

interface SuperAdminStatsProps {
  stats: SystemStats | undefined;
}

export function SuperAdminStats({ stats }: SuperAdminStatsProps) {
  if (!stats) {
    return (
      <div className="space-y-6">
        {/* Loading skeleton for main stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="backdrop-blur-sm bg-white/90 dark:bg-gray-800/90 border-0 shadow-xl animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-20 bg-gray-300 rounded" />
                <div className="h-4 w-4 bg-gray-300 rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-gray-300 rounded mb-2" />
                <div className="h-3 w-24 bg-gray-200 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Loading skeleton for secondary stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="backdrop-blur-sm bg-white/90 dark:bg-gray-800/90 border-0 shadow-xl animate-pulse">
              <CardHeader>
                <div className="h-4 w-32 bg-gray-300 rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-6 w-20 bg-gray-300 rounded mb-2" />
                <div className="h-2 w-full bg-gray-200 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const formatUptime = (uptime: number) => {
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatBytes = (bytes: number) => {
    const mb = bytes / 1024 / 1024;
    return `${mb.toFixed(1)} MB`;
  };

  const getTrendIcon = (growth: number) => {
    return growth >= 0 ? TrendingUp : TrendingUp;
  };

  const getTrendColor = (growth: number) => {
    return growth >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const mainStats = [
    {
      title: "Total Tenants",
      value: stats.totalTenants.toString(),
      icon: Building2,
      description: "Organizations in system",
      growth: stats.tenantGrowth,
      subValue: `${stats.activeTenants} active`
    },
    {
      title: "System Users", 
      value: stats.totalUsers.toString(),
      icon: Users,
      description: "Across all tenants",
      growth: stats.userGrowth,
      subValue: `${stats.activeUsers} active`
    },
    {
      title: "Total Customers",
      value: stats.totalCustomers.toString(), 
      icon: UserCheck,
      description: "Platform customers",
      growth: stats.customerGrowth,
      subValue: `${stats.recentUsers} new this month`
    },
    {
      title: "Loan Portfolio",
      value: `$${parseFloat(stats.totalLoanAmount).toLocaleString()}`,
      icon: CreditCard,
      description: "Total loan value",
      growth: 0,
      subValue: `${stats.totalLoans} loans`
    }
  ];

  const healthStatus = stats.systemHealth?.status || 'unknown';
  const healthColor = healthStatus === 'healthy' ? 'bg-green-500' : 
                     healthStatus === 'warning' ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="space-y-6">
      {/* Main Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {mainStats.map((stat) => {
          const Icon = stat.icon;
          const TrendIcon = getTrendIcon(stat.growth);
          return (
            <Card key={stat.title} className="backdrop-blur-sm bg-white/90 dark:bg-gray-800/90 border-0 shadow-xl hover:shadow-2xl transition-shadow duration-300" data-testid={`card-${stat.title.toLowerCase().replace(' ', '-')}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {stat.title}
                </CardTitle>
                <div className="flex items-center space-x-1">
                  {stat.growth !== 0 && (
                    <TrendIcon className={`h-3 w-3 ${getTrendColor(stat.growth)}`} />
                  )}
                  <Icon className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stat.value}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
                {stat.subValue && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    {stat.subValue}
                  </p>
                )}
                {stat.growth !== 0 && (
                  <div className="flex items-center mt-1">
                    <Badge variant={stat.growth >= 0 ? "default" : "destructive"} className="text-xs px-1 py-0">
                      {stat.growth > 0 ? '+' : ''}{stat.growth}%
                    </Badge>
                    <span className="text-xs text-muted-foreground ml-1">vs last month</span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* System Health & Performance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="backdrop-blur-sm bg-white/90 dark:bg-gray-800/90 border-0 shadow-xl" data-testid="card-system-health">
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${healthColor}`} />
              <CardTitle className="text-sm font-medium">System Health</CardTitle>
            </div>
            <Shield className="h-4 w-4 text-primary ml-auto" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold capitalize text-gray-900 dark:text-white">
              {healthStatus}
            </div>
            <p className="text-xs text-muted-foreground">
              All systems operational
            </p>
            {stats.systemHealth && (
              <div className="mt-2 space-y-1">
                <div className="flex items-center text-xs text-muted-foreground">
                  <Clock className="h-3 w-3 mr-1" />
                  Uptime: {formatUptime(stats.systemHealth.uptime)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Memory: {formatBytes(stats.systemHealth.memoryUsage.heapUsed)}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="backdrop-blur-sm bg-white/90 dark:bg-gray-800/90 border-0 shadow-xl" data-testid="card-tenant-distribution">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center">
              <Activity className="h-4 w-4 mr-2 text-primary" />
              Tenant Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Active</span>
                <span className="text-sm font-medium">{stats.activeTenants}</span>
              </div>
              <Progress 
                value={(stats.activeTenants / stats.totalTenants) * 100} 
                className="h-2"
              />
              {stats.suspendedTenants > 0 && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Suspended</span>
                    <span className="text-sm font-medium text-orange-600">{stats.suspendedTenants}</span>
                  </div>
                  <Progress 
                    value={(stats.suspendedTenants / stats.totalTenants) * 100} 
                    className="h-2"
                  />
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-sm bg-white/90 dark:bg-gray-800/90 border-0 shadow-xl" data-testid="card-recent-activity">
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center">
              <TrendingUp className="h-4 w-4 mr-2 text-primary" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">New Tenants (30d)</span>
                <Badge variant="secondary" className="text-xs">
                  {stats.recentTenants}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">New Users (30d)</span>
                <Badge variant="secondary" className="text-xs">
                  {stats.recentUsers}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">System Revenue</span>
                <span className="text-sm font-medium text-green-600">
                  {stats.systemRevenue}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}