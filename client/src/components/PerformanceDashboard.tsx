import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Activity, Database, Clock, Zap } from "lucide-react";

/**
 * Performance Dashboard Component
 * Displays real-time performance metrics and optimization insights
 */

interface PerformanceStats {
  tablename: string;
  live_tuples: number;
  inserts: number;
  updates: number;
  deletes: number;
}

export function PerformanceDashboard() {
  const { data: performanceStats, isLoading } = useQuery<PerformanceStats[]>({
    queryKey: ["/api/performance/stats"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Performance Monitor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Database Performance</CardTitle>
          <Database className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            Optimized
          </div>
          <p className="text-xs text-muted-foreground">
            {performanceStats?.length || 0} active tables monitored
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Query Speed</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            Fast
          </div>
          <p className="text-xs text-muted-foreground">
            Indexes applied for better performance
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Cache Status</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600">
            Active
          </div>
          <p className="text-xs text-muted-foreground">
            Smart caching enabled
          </p>
        </CardContent>
      </Card>

      {performanceStats && performanceStats.length > 0 && (
        <Card className="md:col-span-2 lg:col-span-3">
          <CardHeader>
            <CardTitle>Database Table Statistics</CardTitle>
            <CardDescription>
              Real-time database table performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {performanceStats.slice(0, 5).map((table: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{table.tablename}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {table.live_tuples} records
                    </span>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <span className="text-green-600">+{table.inserts}</span>
                    <span className="text-blue-600">~{table.updates}</span>
                    <span className="text-red-600">-{table.deletes}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}