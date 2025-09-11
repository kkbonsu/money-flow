import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  Shield, 
  Server, 
  Database, 
  Clock, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Zap,
  HardDrive,
  Cpu,
  MemoryStick
} from 'lucide-react';

interface SystemHealthData {
  timestamp: string;
  overallStatus: 'healthy' | 'warning' | 'critical';
  healthScore: number;
  database: {
    status: string;
    latency: number;
  };
  tenantStatus: Array<{
    status: string;
    count: number;
  }>;
  systemResources: {
    memory: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
      external: number;
      arrayBuffers: number;
    };
    uptime: number;
    platform: string;
    nodeVersion: string;
    pid: number;
  };
  errorRates: {
    last24h: number;
    last7d: number;
    errorRate: string;
  };
  alerts: Array<{
    id: string;
    type: 'warning' | 'error' | 'info';
    message: string;
    timestamp: string;
  }>;
}

export function SystemHealthMonitor() {
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds

  const { data: healthData, isLoading, refetch } = useQuery<SystemHealthData>({
    queryKey: ['/api/admin/system/health'],
    refetchInterval: refreshInterval,
    staleTime: 10 * 1000, // 10 seconds
  });

  const formatUptime = (uptime: number) => {
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const formatBytes = (bytes: number) => {
    const mb = bytes / 1024 / 1024;
    return `${mb.toFixed(1)} MB`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'critical':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Activity className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (isLoading && !healthData) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-gray-300 rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-300 rounded"></div>
          ))}
        </div>
        <div className="h-64 bg-gray-300 rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="system-health-monitor">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Shield className="h-6 w-6" />
            System Health Monitor
          </h2>
          <p className="text-gray-600 dark:text-gray-400">Real-time system status and performance monitoring</p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge 
            variant={healthData?.overallStatus === 'healthy' ? 'default' : 'destructive'}
            className="px-3 py-1"
          >
            {healthData?.overallStatus || 'Unknown'}
          </Badge>
          <Button variant="outline" size="sm" onClick={() => refetch()} data-testid="button-refresh-health">
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overall System Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className={`backdrop-blur-sm bg-white/90 dark:bg-gray-800/90 border-2 ${getStatusColor(healthData?.overallStatus || 'unknown')}`} data-testid="card-overall-status">
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <div className="flex items-center space-x-2">
              {getStatusIcon(healthData?.overallStatus || 'unknown')}
              <CardTitle className="text-sm font-medium">System Status</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {healthData?.overallStatus || 'Unknown'}
            </div>
            <div className="flex items-center mt-2">
              <span className="text-sm text-muted-foreground mr-2">Health Score:</span>
              <Progress value={healthData?.healthScore || 0} className="flex-1 mr-2" />
              <span className="text-sm font-medium">{healthData?.healthScore || 0}%</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Last updated: {healthData?.timestamp ? new Date(healthData.timestamp).toLocaleString() : 'Never'}
            </p>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-sm bg-white/90 dark:bg-gray-800/90" data-testid="card-database-status">
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <div className="flex items-center space-x-2">
              <Database className="h-4 w-4 text-blue-500" />
              <CardTitle className="text-sm font-medium">Database</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold capitalize">
              {healthData?.database?.status || 'Unknown'}
            </div>
            <p className="text-xs text-muted-foreground">
              Response Time: {healthData?.database?.latency ? `${healthData.database.latency}ms` : 'N/A'}
            </p>
            <div className="mt-2">
              <Badge variant={healthData?.database?.status === 'healthy' ? 'default' : 'destructive'} className="text-xs">
                {healthData?.database?.status === 'healthy' ? 'Operational' : 'Issues Detected'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-sm bg-white/90 dark:bg-gray-800/90" data-testid="card-system-resources">
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <div className="flex items-center space-x-2">
              <Server className="h-4 w-4 text-green-500" />
              <CardTitle className="text-sm font-medium">System Resources</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  Uptime
                </span>
                <span className="text-xs font-medium">
                  {healthData?.systemResources ? formatUptime(healthData.systemResources.uptime) : 'N/A'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground flex items-center">
                  <MemoryStick className="h-3 w-3 mr-1" />
                  Memory
                </span>
                <span className="text-xs font-medium">
                  {healthData?.systemResources?.memory ? formatBytes(healthData.systemResources.memory.heapUsed) : 'N/A'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground flex items-center">
                  <Cpu className="h-3 w-3 mr-1" />
                  Platform
                </span>
                <span className="text-xs font-medium">
                  {healthData?.systemResources?.platform || 'N/A'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="tenants" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tenants">Tenant Status</TabsTrigger>
          <TabsTrigger value="errors">Error Monitoring</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="alerts">Active Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="tenants" className="space-y-4">
          <Card className="backdrop-blur-sm bg-white/90 dark:bg-gray-800/90">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Tenant Status Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {healthData?.tenantStatus?.map((status) => (
                  <div key={status.status} className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-primary">{status.count}</div>
                    <div className="text-sm text-muted-foreground capitalize">{status.status} Tenants</div>
                  </div>
                )) || (
                  <div className="col-span-3 text-center text-muted-foreground">
                    No tenant status data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="backdrop-blur-sm bg-white/90 dark:bg-gray-800/90">
              <CardHeader>
                <CardTitle className="text-sm">Last 24 Hours</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {healthData?.errorRates?.last24h || 0}
                </div>
                <p className="text-xs text-muted-foreground">Total errors</p>
              </CardContent>
            </Card>

            <Card className="backdrop-blur-sm bg-white/90 dark:bg-gray-800/90">
              <CardHeader>
                <CardTitle className="text-sm">Last 7 Days</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {healthData?.errorRates?.last7d || 0}
                </div>
                <p className="text-xs text-muted-foreground">Total errors</p>
              </CardContent>
            </Card>

            <Card className="backdrop-blur-sm bg-white/90 dark:bg-gray-800/90">
              <CardHeader>
                <CardTitle className="text-sm">Error Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {healthData?.errorRates?.errorRate || '0%'}
                </div>
                <p className="text-xs text-muted-foreground">Current rate</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card className="backdrop-blur-sm bg-white/90 dark:bg-gray-800/90">
            <CardHeader>
              <CardTitle>Memory Usage Details</CardTitle>
            </CardHeader>
            <CardContent>
              {healthData?.systemResources?.memory ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 border rounded">
                    <div className="text-lg font-semibold">
                      {formatBytes(healthData.systemResources.memory.rss)}
                    </div>
                    <div className="text-xs text-muted-foreground">RSS</div>
                  </div>
                  <div className="text-center p-3 border rounded">
                    <div className="text-lg font-semibold">
                      {formatBytes(healthData.systemResources.memory.heapTotal)}
                    </div>
                    <div className="text-xs text-muted-foreground">Heap Total</div>
                  </div>
                  <div className="text-center p-3 border rounded">
                    <div className="text-lg font-semibold">
                      {formatBytes(healthData.systemResources.memory.heapUsed)}
                    </div>
                    <div className="text-xs text-muted-foreground">Heap Used</div>
                  </div>
                  <div className="text-center p-3 border rounded">
                    <div className="text-lg font-semibold">
                      {formatBytes(healthData.systemResources.memory.external)}
                    </div>
                    <div className="text-xs text-muted-foreground">External</div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  Memory usage data not available
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="backdrop-blur-sm bg-white/90 dark:bg-gray-800/90">
            <CardHeader>
              <CardTitle>Runtime Information</CardTitle>
            </CardHeader>
            <CardContent>
              {healthData?.systemResources ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Node.js Version</span>
                      <span className="text-sm font-medium">{healthData.systemResources.nodeVersion}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Platform</span>
                      <span className="text-sm font-medium">{healthData.systemResources.platform}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Process ID</span>
                      <span className="text-sm font-medium">{healthData.systemResources.pid}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Uptime</span>
                      <span className="text-sm font-medium">{formatUptime(healthData.systemResources.uptime)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  Runtime information not available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card className="backdrop-blur-sm bg-white/90 dark:bg-gray-800/90">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Active System Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {healthData?.alerts && healthData.alerts.length > 0 ? (
                <div className="space-y-3">
                  {healthData.alerts.map((alert) => (
                    <Alert key={alert.id} variant={alert.type === 'error' ? 'destructive' : 'default'}>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="flex justify-between">
                        <span>{alert.message}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(alert.timestamp).toLocaleString()}
                        </span>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                  <h3 className="font-medium text-gray-900 dark:text-white">All Clear!</h3>
                  <p className="text-sm text-muted-foreground">No active system alerts</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}