import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, AlertTriangle, DollarSign, Users, Calendar, Target } from 'lucide-react';
import { LoanBook, PaymentSchedule } from '@shared/schema';

export default function LoanPortfolioMetrics() {
  const { data: loans = [] } = useQuery({
    queryKey: ['/api/loans'],
  });

  const { data: paymentSchedules = [] } = useQuery({
    queryKey: ['/api/payment-schedules'],
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['/api/customers'],
  });

  // Calculate portfolio metrics
  const totalLoans = loans.length;
  const activeLoans = loans.filter((loan: LoanBook) => loan.status === 'disbursed').length;
  const pendingLoans = loans.filter((loan: LoanBook) => loan.status === 'pending').length;
  const approvedLoans = loans.filter((loan: LoanBook) => loan.status === 'approved' || loan.status === 'disbursed').length;
  const rejectedLoans = loans.filter((loan: LoanBook) => loan.status === 'rejected').length;

  // Financial metrics
  const totalPortfolioValue = loans.reduce((sum, loan: LoanBook) => 
    sum + parseFloat(loan.loanAmount), 0);
  const disbursedValue = loans
    .filter((loan: LoanBook) => loan.status === 'disbursed')
    .reduce((sum, loan: LoanBook) => sum + parseFloat(loan.loanAmount), 0);
  const outstandingBalance = loans
    .filter((loan: LoanBook) => loan.status === 'disbursed')
    .reduce((sum, loan: LoanBook) => sum + parseFloat(loan.outstandingBalance || loan.loanAmount), 0);

  // Payment performance
  const paidPayments = paymentSchedules.filter((payment: PaymentSchedule) => payment.status === 'paid').length;
  const pendingPayments = paymentSchedules.filter((payment: PaymentSchedule) => payment.status === 'pending').length;
  const overduePayments = paymentSchedules.filter((payment: PaymentSchedule) => {
    if (payment.status !== 'pending') return false;
    const dueDate = new Date(payment.dueDate);
    return dueDate < new Date();
  }).length;

  const paymentPerformanceRate = paidPayments + pendingPayments > 0 ? 
    (paidPayments / (paidPayments + pendingPayments)) * 100 : 0;

  // Risk metrics
  const avgLoanSize = totalLoans > 0 ? totalPortfolioValue / totalLoans : 0;
  const disbursementRate = totalLoans > 0 ? (activeLoans / totalLoans) * 100 : 0;
  const approvalRate = totalLoans > 0 ? ((approvedLoans + activeLoans) / totalLoans) * 100 : 0;

  // Portfolio health score (0-100)
  const portfolioHealthScore = Math.round(
    (paymentPerformanceRate * 0.4) + 
    (disbursementRate * 0.3) + 
    (approvalRate * 0.2) + 
    (Math.min(100, (activeLoans / Math.max(1, overduePayments)) * 10) * 0.1)
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthBadgeColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {/* Portfolio Overview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Portfolio Health</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold mb-2">
            <span className={getHealthColor(portfolioHealthScore)}>
              {portfolioHealthScore}%
            </span>
          </div>
          <Badge className={getHealthBadgeColor(portfolioHealthScore)}>
            {portfolioHealthScore >= 80 ? 'Excellent' : 
             portfolioHealthScore >= 60 ? 'Good' : 'Needs Attention'}
          </Badge>
          <Progress value={portfolioHealthScore} className="mt-2" />
        </CardContent>
      </Card>

      {/* Total Portfolio Value */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalPortfolioValue)}</div>
          <p className="text-xs text-muted-foreground">
            Disbursed: {formatCurrency(disbursedValue)}
          </p>
          <p className="text-xs text-muted-foreground">
            Outstanding: {formatCurrency(outstandingBalance)}
          </p>
        </CardContent>
      </Card>

      {/* Active Loans */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Loans</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeLoans}</div>
          <p className="text-xs text-muted-foreground">
            {totalLoans} total loans
          </p>
          <div className="flex items-center space-x-2 text-sm mt-2">
            <div className="flex items-center text-green-600">
              <div className="w-2 h-2 bg-green-600 rounded-full mr-1"></div>
              Active: {activeLoans}
            </div>
            <div className="flex items-center text-yellow-600">
              <div className="w-2 h-2 bg-yellow-600 rounded-full mr-1"></div>
              Pending: {pendingLoans}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Performance */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Payment Performance</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{paymentPerformanceRate.toFixed(1)}%</div>
          <p className="text-xs text-muted-foreground">
            On-time payment rate
          </p>
          <div className="mt-2 space-y-1">
            <div className="flex justify-between text-xs">
              <span>Paid: {paidPayments}</span>
              <span className="text-green-600">✓</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>Overdue: {overduePayments}</span>
              <span className="text-red-600">⚠</span>
            </div>
          </div>
          <Progress value={paymentPerformanceRate} className="mt-2" />
        </CardContent>
      </Card>

      {/* Loan Status Breakdown */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Loan Status Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">{activeLoans}</div>
              <div className="text-xs text-muted-foreground">Disbursed</div>
              <div className="text-xs">({totalLoans > 0 ? ((activeLoans / totalLoans) * 100).toFixed(1) : 0}%)</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">{approvedLoans}</div>
              <div className="text-xs text-muted-foreground">Approved</div>
              <div className="text-xs">({totalLoans > 0 ? ((approvedLoans / totalLoans) * 100).toFixed(1) : 0}%)</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-yellow-600">{pendingLoans}</div>
              <div className="text-xs text-muted-foreground">Pending</div>
              <div className="text-xs">({totalLoans > 0 ? ((pendingLoans / totalLoans) * 100).toFixed(1) : 0}%)</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-red-600">{rejectedLoans}</div>
              <div className="text-xs text-muted-foreground">Rejected</div>
              <div className="text-xs">({totalLoans > 0 ? ((rejectedLoans / totalLoans) * 100).toFixed(1) : 0}%)</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Performance Indicators */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Key Performance Indicators</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <div className="text-sm font-medium">Approval Rate</div>
                <div className="text-lg font-bold">{approvalRate.toFixed(1)}%</div>
              </div>
              {approvalRate >= 70 ? 
                <TrendingUp className="h-5 w-5 text-green-600" /> : 
                <TrendingDown className="h-5 w-5 text-red-600" />
              }
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <div className="text-sm font-medium">Avg Loan Size</div>
                <div className="text-lg font-bold">{formatCurrency(avgLoanSize)}</div>
              </div>
              <DollarSign className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <div className="text-sm font-medium">Risk Level</div>
                <div className="text-lg font-bold">
                  {overduePayments > activeLoans * 0.1 ? 'High' : 
                   overduePayments > activeLoans * 0.05 ? 'Medium' : 'Low'}
                </div>
              </div>
              {overduePayments > activeLoans * 0.1 ? 
                <AlertTriangle className="h-5 w-5 text-red-600" /> : 
                <Target className="h-5 w-5 text-green-600" />
              }
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}