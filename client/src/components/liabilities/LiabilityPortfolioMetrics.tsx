import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, DollarSign, Target, Calendar, PieChart, BarChart3, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface LiabilityMetrics {
  totalAmount: number;
  totalInterest: number;
  liabilityCount: number;
  statusSummary: {
    pending: number;
    paid: number;
    overdue: number;
  };
  averageInterestRate: number;
  upcomingPayments: number;
  monthlyPaymentTotal: number;
}

export default function LiabilityPortfolioMetrics() {
  const { data: metrics, isLoading } = useQuery<LiabilityMetrics>({
    queryKey: ['/api/liabilities/metrics'],
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
            Unable to load liability metrics
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
        {/* Total Liability Amount */}
        <Card className="gradient-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Liabilities
            </CardTitle>
            <DollarSign className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(metrics.totalAmount)}
            </div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-1">
              <Target className="h-3 w-3" />
              <span>Outstanding amount</span>
            </div>
          </CardContent>
        </Card>

        {/* Overdue Count */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Overdue Items
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.statusSummary.overdue}
            </div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-1">
              <Calendar className="h-3 w-3" />
              <span>Require attention</span>
            </div>
          </CardContent>
        </Card>

        {/* Average Interest Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Interest Rate
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.averageInterestRate.toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Weighted average
            </div>
          </CardContent>
        </Card>

        {/* Monthly Payment Total */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Monthly Payments
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(metrics.monthlyPaymentTotal)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Estimated monthly
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Overview and Risk Assessment */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Summary */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <PieChart className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">Payment Status Overview</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <div>
                    <p className="text-sm font-medium">Paid</p>
                    <p className="text-xs text-muted-foreground">Completed payments</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{metrics.statusSummary.paid}</p>
                  <p className="text-xs text-muted-foreground">
                    {((metrics.statusSummary.paid / metrics.liabilityCount) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div>
                    <p className="text-sm font-medium">Pending</p>
                    <p className="text-xs text-muted-foreground">Awaiting payment</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{metrics.statusSummary.pending}</p>
                  <p className="text-xs text-muted-foreground">
                    {((metrics.statusSummary.pending / metrics.liabilityCount) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div>
                    <p className="text-sm font-medium">Overdue</p>
                    <p className="text-xs text-muted-foreground">Past due date</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{metrics.statusSummary.overdue}</p>
                  <p className="text-xs text-muted-foreground">
                    {((metrics.statusSummary.overdue / metrics.liabilityCount) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financial Impact */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-red-600" />
              <CardTitle className="text-lg">Financial Impact</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <DollarSign className="h-4 w-4 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Principal Amount</p>
                    <p className="text-xs text-muted-foreground">Total borrowed</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{formatCurrency(metrics.totalAmount)}</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Interest Accrued</p>
                    <p className="text-xs text-muted-foreground">Total interest cost</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{formatCurrency(metrics.totalInterest)}</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Monthly Obligation</p>
                    <p className="text-xs text-muted-foreground">Average monthly payment</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{formatCurrency(metrics.monthlyPaymentTotal)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Liability Portfolio Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(metrics.totalAmount)}
              </div>
              <div className="text-sm text-muted-foreground">Total Outstanding</div>
              <div className="text-xs text-muted-foreground mt-1">
                Principal amount owed
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {metrics.averageInterestRate.toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">Average Rate</div>
              <div className="text-xs text-muted-foreground mt-1">
                Weighted by amount
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {metrics.liabilityCount}
              </div>
              <div className="text-sm text-muted-foreground">Total Items</div>
              <div className="text-xs text-muted-foreground mt-1">
                Active liabilities
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Assessment Alert */}
      {metrics.statusSummary.overdue > 0 && (
        <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <CardTitle className="text-lg text-orange-800 dark:text-orange-200">
                Attention Required
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-orange-700 dark:text-orange-300">
              You have {metrics.statusSummary.overdue} overdue liability items that require immediate attention. 
              Consider contacting creditors to discuss payment arrangements and avoid potential penalties.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}