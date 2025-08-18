import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Users, UserCheck, UserX, Star, DollarSign, Calendar } from 'lucide-react';
import { Customer, LoanBook } from '@shared/schema';

export default function CustomerPortfolioMetrics() {
  const { data: customers = [] } = useQuery({
    queryKey: ['/api/customers'],
  });

  const { data: loans = [] } = useQuery({
    queryKey: ['/api/loans'],
  });

  // Calculate customer metrics
  const totalCustomers = customers.length;
  const activeCustomers = customers.filter((customer: Customer) => customer.status === 'active').length;
  const inactiveCustomers = customers.filter((customer: Customer) => customer.status === 'inactive').length;
  
  // Customer engagement metrics
  const customersWithLoans = customers.filter((customer: Customer) => 
    loans.some((loan: LoanBook) => loan.customerId === customer.id)
  ).length;
  
  const customersWithActiveLoans = customers.filter((customer: Customer) => 
    loans.some((loan: LoanBook) => loan.customerId === customer.id && loan.status === 'disbursed')
  ).length;

  // Credit score distribution
  const creditScores = customers
    .filter((customer: Customer) => customer.creditScore)
    .map((customer: Customer) => customer.creditScore as number);
  
  const avgCreditScore = creditScores.length > 0 ? 
    creditScores.reduce((sum, score) => sum + score, 0) / creditScores.length : 0;

  const excellentCredit = creditScores.filter(score => score >= 750).length;
  const goodCredit = creditScores.filter(score => score >= 650 && score < 750).length;
  const fairCredit = creditScores.filter(score => score >= 550 && score < 650).length;
  const poorCredit = creditScores.filter(score => score < 550).length;

  // Portal activity
  const portalActiveCustomers = customers.filter((customer: Customer) => customer.isPortalActive).length;
  const recentPortalLogins = customers.filter((customer: Customer) => {
    if (!customer.lastPortalLogin) return false;
    const loginDate = new Date(customer.lastPortalLogin);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return loginDate >= thirtyDaysAgo;
  }).length;

  // Engagement metrics
  const engagementRate = totalCustomers > 0 ? (customersWithLoans / totalCustomers) * 100 : 0;
  const portalAdoptionRate = totalCustomers > 0 ? (portalActiveCustomers / totalCustomers) * 100 : 0;
  const recentActivityRate = totalCustomers > 0 ? (recentPortalLogins / totalCustomers) * 100 : 0;

  // Customer health score (0-100)
  const customerHealthScore = Math.round(
    (engagementRate * 0.4) + 
    (portalAdoptionRate * 0.3) + 
    (recentActivityRate * 0.2) + 
    ((activeCustomers / Math.max(1, totalCustomers)) * 100 * 0.1)
  );

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

  const getCreditScoreColor = (score: number) => {
    if (score >= 750) return 'text-green-600';
    if (score >= 650) return 'text-blue-600';
    if (score >= 550) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {/* Customer Health Score */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Customer Health</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold mb-2">
            <span className={getHealthColor(customerHealthScore)}>
              {customerHealthScore}%
            </span>
          </div>
          <Badge className={getHealthBadgeColor(customerHealthScore)}>
            {customerHealthScore >= 80 ? 'Excellent' : 
             customerHealthScore >= 60 ? 'Good' : 'Needs Attention'}
          </Badge>
          <Progress value={customerHealthScore} className="mt-2" />
        </CardContent>
      </Card>

      {/* Total Customers */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
          <UserCheck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalCustomers}</div>
          <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-1">
            <span className="text-green-600">Active: {activeCustomers}</span>
            <span className="text-gray-500">Inactive: {inactiveCustomers}</span>
          </div>
          <div className="text-xs text-muted-foreground">
            {activeCustomers > 0 && totalCustomers > 0 ? 
              `${Math.round((activeCustomers / totalCustomers) * 100)}% active` : 
              'No active customers'}
          </div>
        </CardContent>
      </Card>

      {/* Credit Score Distribution */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Credit Score</CardTitle>
          <Star className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold mb-2">
            <span className={getCreditScoreColor(avgCreditScore)}>
              {Math.round(avgCreditScore)}
            </span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-green-600">Excellent (750+)</span>
              <span>{excellentCredit}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-blue-600">Good (650-749)</span>
              <span>{goodCredit}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-yellow-600">Fair (550-649)</span>
              <span>{fairCredit}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-red-600">Poor (&lt;550)</span>
              <span>{poorCredit}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Engagement Metrics */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Engagement</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{customersWithLoans}</div>
          <p className="text-xs text-muted-foreground">
            Customers with loans
          </p>
          <div className="space-y-1 mt-2">
            <div className="flex justify-between text-xs">
              <span>Loan engagement</span>
              <span>{Math.round(engagementRate)}%</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>Portal adoption</span>
              <span>{Math.round(portalAdoptionRate)}%</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>Recent activity</span>
              <span>{Math.round(recentActivityRate)}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Borrowers */}
      <Card className="md:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Borrowers</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">{customersWithActiveLoans}</div>
              <p className="text-xs text-muted-foreground">
                Customers with active loans
              </p>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold">
                {totalCustomers > 0 ? Math.round((customersWithActiveLoans / totalCustomers) * 100) : 0}%
              </div>
              <p className="text-xs text-muted-foreground">of total customers</p>
            </div>
          </div>
          <Progress 
            value={totalCustomers > 0 ? (customersWithActiveLoans / totalCustomers) * 100 : 0} 
            className="mt-3" 
          />
        </CardContent>
      </Card>

      {/* Portal Activity */}
      <Card className="md:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Portal Activity</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">{portalActiveCustomers}</div>
              <p className="text-xs text-muted-foreground">
                Portal-enabled customers
              </p>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold">{recentPortalLogins}</div>
              <p className="text-xs text-muted-foreground">active last 30 days</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-3">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Portal Adoption</div>
              <Progress value={portalAdoptionRate} />
              <div className="text-xs text-muted-foreground text-right mt-1">
                {Math.round(portalAdoptionRate)}%
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Recent Activity</div>
              <Progress value={recentActivityRate} />
              <div className="text-xs text-muted-foreground text-right mt-1">
                {Math.round(recentActivityRate)}%
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}