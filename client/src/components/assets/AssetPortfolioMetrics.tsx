import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, DollarSign, Target, Calendar, PieChart, BarChart3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface AssetMetrics {
  totalValue: number;
  depreciationTotal: number;
  assetCount: number;
  categoryBreakdown: Array<{
    category: string;
    value: number;
    count: number;
    percentage: number;
  }>;
  statusSummary: {
    active: number;
    maintenance: number;
    disposed: number;
  };
  averageAge: number;
}

export default function AssetPortfolioMetrics() {
  const { data: metrics, isLoading } = useQuery<AssetMetrics>({
    queryKey: ['/api/assets/metrics'],
    enabled: true,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-muted rounded w-3/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!metrics) {
    return (
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Unable to load asset metrics
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD' 
    }).format(amount);

  return (
    <div className="space-y-6 mb-6">
      {/* Primary Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Asset Value */}
        <Card className="gradient-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Asset Value
            </CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(metrics.totalValue)}
            </div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-1">
              <Target className="h-3 w-3" />
              <span>Current market value</span>
            </div>
          </CardContent>
        </Card>

        {/* Asset Count */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Assets
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.assetCount}
            </div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-1">
              <Calendar className="h-3 w-3" />
              <span>Total items tracked</span>
            </div>
          </CardContent>
        </Card>

        {/* Active Assets */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Assets
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.statusSummary.active}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {((metrics.statusSummary.active / metrics.assetCount) * 100).toFixed(1)}% of total
            </div>
          </CardContent>
        </Card>

        {/* Total Depreciation */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Depreciation
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(metrics.depreciationTotal)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Total depreciated value
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown and Status Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <PieChart className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">Asset Categories</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.categoryBreakdown.map((category, index) => (
                <div key={category.category} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      index === 0 ? 'bg-blue-500' : 
                      index === 1 ? 'bg-green-500' : 
                      index === 2 ? 'bg-purple-500' : 
                      index === 3 ? 'bg-orange-500' : 'bg-gray-400'
                    }`} />
                    <div>
                      <p className="text-sm font-medium capitalize">{category.category}</p>
                      <p className="text-xs text-muted-foreground">{category.count} assets</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{formatCurrency(category.value)}</p>
                    <p className="text-xs text-muted-foreground">{category.percentage.toFixed(1)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Status Summary */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-green-600" />
              <CardTitle className="text-lg">Asset Status Overview</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <div>
                    <p className="text-sm font-medium">Active</p>
                    <p className="text-xs text-muted-foreground">In operation</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{metrics.statusSummary.active}</p>
                  <p className="text-xs text-muted-foreground">
                    {((metrics.statusSummary.active / metrics.assetCount) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div>
                    <p className="text-sm font-medium">Maintenance</p>
                    <p className="text-xs text-muted-foreground">Under repair</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{metrics.statusSummary.maintenance}</p>
                  <p className="text-xs text-muted-foreground">
                    {((metrics.statusSummary.maintenance / metrics.assetCount) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div>
                    <p className="text-sm font-medium">Disposed</p>
                    <p className="text-xs text-muted-foreground">No longer in use</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{metrics.statusSummary.disposed}</p>
                  <p className="text-xs text-muted-foreground">
                    {((metrics.statusSummary.disposed / metrics.assetCount) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Asset Portfolio Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(metrics.totalValue)}
              </div>
              <div className="text-sm text-muted-foreground">Total Value</div>
              <div className="text-xs text-muted-foreground mt-1">
                Current market valuation
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(metrics.depreciationTotal)}
              </div>
              <div className="text-sm text-muted-foreground">Depreciation</div>
              <div className="text-xs text-muted-foreground mt-1">
                Total depreciated amount
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {metrics.averageAge.toFixed(1)}
              </div>
              <div className="text-sm text-muted-foreground">Avg Age (Years)</div>
              <div className="text-xs text-muted-foreground mt-1">
                Average asset age
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}