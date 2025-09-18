import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, Activity, DollarSign } from 'lucide-react';

interface SystemStats {
  totalTenants: number;
  totalUsers: number;
  activeTenants: number;
  systemRevenue?: string;
}

interface SuperAdminStatsProps {
  stats: SystemStats | undefined;
}

export function SuperAdminStats({ stats }: SuperAdminStatsProps) {
  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="backdrop-blur-sm bg-white/90 dark:bg-gray-800/90 border-0 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Loading...</CardTitle>
              <div className="h-4 w-4 bg-gray-300 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold bg-gray-300 h-8 w-16 rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Tenants",
      value: stats.totalTenants.toString(),
      icon: Building2,
      description: "Organizations in system"
    },
    {
      title: "Active Tenants", 
      value: stats.activeTenants.toString(),
      icon: Activity,
      description: "Currently active"
    },
    {
      title: "Total Users",
      value: stats.totalUsers.toString(), 
      icon: Users,
      description: "Across all tenants"
    },
    {
      title: "System Revenue",
      value: stats.systemRevenue || "$0",
      icon: DollarSign,
      description: "Total platform revenue"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title} className="backdrop-blur-sm bg-white/90 dark:bg-gray-800/90 border-0 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {stat.title}
              </CardTitle>
              <Icon className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {stat.value}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}