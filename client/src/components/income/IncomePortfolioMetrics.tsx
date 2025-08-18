import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, DollarSign, Target, Calendar, PieChart, BarChart3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface IncomeMetrics {
  totalIncome: number;
  monthlyGrowth: number;
  topCategories: Array<{
    category: string;
    amount: number;
    percentage: number;
    count: number;
  }>;
  recentTrends: Array<{
    month: string;
    amount: number;
    previousMonth: number;
  }>;
  sourceSummary: {
    loanInterest: number;
    processingFees: number;
    otherSources: number;
  };
}

export default function IncomePortfolioMetrics() {
  const { data: metrics, isLoading } = useQuery<IncomeMetrics>({
    queryKey: ['/api/income/metrics'],
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
            Unable to load income metrics
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

  const formatPercentage = (value: number) => 
    `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;

  return (
    <div className="space-y-6 mb-6">
      {/* Primary Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Income */}
        <Card className="gradient-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Income
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(metrics.totalIncome)}
            </div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-1">
              <TrendingUp className="h-3 w-3" />
              <span>All time revenue</span>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Growth */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Monthly Growth
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPercentage(metrics.monthlyGrowth)}
            </div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-1">
              <Calendar className="h-3 w-3" />
              <span>vs last month</span>
            </div>
          </CardContent>
        </Card>

        {/* Loan Interest Revenue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Interest Revenue
            </CardTitle>
            <Target className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(metrics.sourceSummary.loanInterest)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {((metrics.sourceSummary.loanInterest / metrics.totalIncome) * 100).toFixed(1)}% of total
            </div>
          </CardContent>
        </Card>

        {/* Processing Fees */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Processing Fees
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(metrics.sourceSummary.processingFees)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {((metrics.sourceSummary.processingFees / metrics.totalIncome) * 100).toFixed(1)}% of total
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Categories */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <PieChart className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">Top Income Categories</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.topCategories.map((category, index) => (
                <div key={category.category} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      index === 0 ? 'bg-blue-500' : 
                      index === 1 ? 'bg-green-500' : 
                      index === 2 ? 'bg-purple-500' : 'bg-gray-400'
                    }`} />
                    <div>
                      <p className="text-sm font-medium">{category.category}</p>
                      <p className="text-xs text-muted-foreground">{category.count} transactions</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{formatCurrency(category.amount)}</p>
                    <p className="text-xs text-muted-foreground">{category.percentage.toFixed(1)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Trends */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <CardTitle className="text-lg">Recent Trends</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.recentTrends.map((trend, index) => {
                const growth = ((trend.amount - trend.previousMonth) / trend.previousMonth) * 100;
                const isPositive = growth >= 0;
                
                return (
                  <div key={trend.month} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium">{index + 1}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{trend.month}</p>
                        <p className="text-xs text-muted-foreground">
                          vs prev: {formatCurrency(trend.previousMonth)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{formatCurrency(trend.amount)}</p>
                      <Badge variant={isPositive ? "default" : "destructive"} className="text-xs">
                        {formatPercentage(growth)}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Income Source Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(metrics.sourceSummary.loanInterest)}
              </div>
              <div className="text-sm text-muted-foreground">Loan Interest</div>
              <div className="text-xs text-muted-foreground mt-1">
                Primary revenue stream
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(metrics.sourceSummary.processingFees)}
              </div>
              <div className="text-sm text-muted-foreground">Processing Fees</div>
              <div className="text-xs text-muted-foreground mt-1">
                Upfront loan fees
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {formatCurrency(metrics.sourceSummary.otherSources)}
              </div>
              <div className="text-sm text-muted-foreground">Other Sources</div>
              <div className="text-xs text-muted-foreground mt-1">
                Miscellaneous income
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}