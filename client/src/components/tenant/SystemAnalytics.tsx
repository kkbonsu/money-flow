import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, Building2, CreditCard, Activity, Download, RefreshCw, Calendar } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

interface AnalyticsData {
  timeframe: string;
  tenantGrowth: Array<{ date: string; count: number }>;
  userGrowth: Array<{ date: string; count: number }>;
  loanGrowth: Array<{ date: string; count: number; amount: string }>;
  topTenantsByUsers: Array<{ tenantName: string; userCount: number }>;
  topTenantsByLoans: Array<{ tenantName: string; loanCount: number; totalAmount: string }>;
  systemActivity: Array<{ date: string; activityCount: number }>;
}

export function SystemAnalytics() {
  const [timeframe, setTimeframe] = useState('30d');
  const [activeTab, setActiveTab] = useState('overview');

  const { data: analyticsData, isLoading, refetch } = useQuery<AnalyticsData>({
    queryKey: ['/api/admin/analytics/overview', { timeframe }],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: insightsData, isLoading: insightsLoading } = useQuery({
    queryKey: ['/api/admin/insights/cross-tenant'],
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex justify-between items-center">
          <div className="h-8 w-48 bg-gray-300 rounded"></div>
          <div className="h-10 w-32 bg-gray-300 rounded"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-300 rounded"></div>
          ))}
        </div>
        <div className="h-96 bg-gray-300 rounded"></div>
      </div>
    );
  }

  const formatChartData = (data: any[], valueKey: string, labelKey: string = 'date') => {
    return data?.map(item => ({
      ...item,
      [labelKey]: new Date(item[labelKey]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    })) || [];
  };

  return (
    <div className="space-y-6" data-testid="system-analytics">
      {/* Header with Controls */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">System Analytics</h2>
          <p className="text-gray-600 dark:text-gray-400">Cross-tenant performance and usage analytics</p>
        </div>
        <div className="flex items-center space-x-3">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-32" data-testid="select-timeframe">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => refetch()} data-testid="button-refresh-analytics">
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" data-testid="button-export-data">
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="tenants" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Tenants
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="financial" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Financial
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Growth Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="backdrop-blur-sm bg-white/90 dark:bg-gray-800/90">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Tenant Growth Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={formatChartData(analyticsData?.tenantGrowth || [], 'count')}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="backdrop-blur-sm bg-white/90 dark:bg-gray-800/90">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  User Growth Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={formatChartData(analyticsData?.userGrowth || [], 'count')}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="#82ca9d" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Top Performing Tenants */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="backdrop-blur-sm bg-white/90 dark:bg-gray-800/90">
              <CardHeader>
                <CardTitle>Top Tenants by Users</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData?.topTenantsByUsers?.slice(0, 5) || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="tenantName" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="userCount" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="backdrop-blur-sm bg-white/90 dark:bg-gray-800/90">
              <CardHeader>
                <CardTitle>System Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={formatChartData(analyticsData?.systemActivity || [], 'activityCount')}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="activityCount" stroke="#ffc658" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tenants" className="space-y-6">
          <Card className="backdrop-blur-sm bg-white/90 dark:bg-gray-800/90">
            <CardHeader>
              <CardTitle>Tenant Performance Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              {insightsLoading ? (
                <div className="animate-pulse space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 bg-gray-300 rounded"></div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {insightsData?.tenantPerformance?.slice(0, 10).map((tenant: any, index: number) => (
                    <div key={tenant.tenantId} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium">{index + 1}</span>
                        </div>
                        <div>
                          <h3 className="font-medium">{tenant.tenantName}</h3>
                          <p className="text-sm text-muted-foreground">
                            {tenant.userCount} users • {tenant.customerCount} customers
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Badge variant={tenant.status === 'active' ? 'default' : 'secondary'}>
                          {tenant.status}
                        </Badge>
                        <div className="text-right">
                          <p className="text-sm font-medium">{tenant.loanCount} loans</p>
                          <p className="text-xs text-muted-foreground">
                            ${parseFloat(tenant.totalLoanAmount).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="backdrop-blur-sm bg-white/90 dark:bg-gray-800/90">
              <CardHeader>
                <CardTitle>User Engagement Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                {insightsLoading ? (
                  <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                    <div className="h-8 bg-gray-300 rounded w-1/2"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Daily Active Users</span>
                      <span className="font-medium">{insightsData?.userEngagement?.dailyActiveUsers || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Weekly Active Users</span>
                      <span className="font-medium">{insightsData?.userEngagement?.weeklyActiveUsers || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Monthly Active Users</span>
                      <span className="font-medium">{insightsData?.userEngagement?.monthlyActiveUsers || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total Active Users</span>
                      <span className="font-medium">{insightsData?.userEngagement?.totalActiveUsers || 0}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="backdrop-blur-sm bg-white/90 dark:bg-gray-800/90">
              <CardHeader>
                <CardTitle>Resource Utilization</CardTitle>
              </CardHeader>
              <CardContent>
                {insightsLoading ? (
                  <div className="animate-pulse">
                    <div className="h-64 bg-gray-300 rounded"></div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={insightsData?.resourceUtilization?.slice(0, 5).map((tenant: any, index: number) => ({
                          name: tenant.tenantName,
                          value: tenant.apiCallsToday,
                          fill: COLORS[index % COLORS.length]
                        })) || []}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {insightsData?.resourceUtilization?.slice(0, 5).map((_: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="financial" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="backdrop-blur-sm bg-white/90 dark:bg-gray-800/90">
              <CardHeader>
                <CardTitle className="text-sm">Total Loans Issued</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {insightsData?.financialMetrics?.totalLoansIssued || 0}
                </div>
                <p className="text-xs text-muted-foreground">Across all tenants</p>
              </CardContent>
            </Card>

            <Card className="backdrop-blur-sm bg-white/90 dark:bg-gray-800/90">
              <CardHeader>
                <CardTitle className="text-sm">Total Loan Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${parseFloat(insightsData?.financialMetrics?.totalLoanValue || '0').toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Portfolio value</p>
              </CardContent>
            </Card>

            <Card className="backdrop-blur-sm bg-white/90 dark:bg-gray-800/90">
              <CardHeader>
                <CardTitle className="text-sm">Average Loan Size</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${parseFloat(insightsData?.financialMetrics?.avgLoanAmount || '0').toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Per loan</p>
              </CardContent>
            </Card>
          </div>

          <Card className="backdrop-blur-sm bg-white/90 dark:bg-gray-800/90">
            <CardHeader>
              <CardTitle>Loan Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Approved', value: insightsData?.financialMetrics?.approvedLoans || 0, fill: '#00C49F' },
                      { name: 'Pending', value: insightsData?.financialMetrics?.pendingLoans || 0, fill: '#FFBB28' },
                      { name: 'Rejected', value: insightsData?.financialMetrics?.rejectedLoans || 0, fill: '#FF8042' }
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(1)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    <Cell fill="#00C49F" />
                    <Cell fill="#FFBB28" />
                    <Cell fill="#FF8042" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}