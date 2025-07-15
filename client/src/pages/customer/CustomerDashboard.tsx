import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  CreditCard, 
  Clock, 
  DollarSign, 
  TrendingUp,
  Calendar,
  AlertCircle,
  CheckCircle,
  User,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';
import { format } from 'date-fns';

export default function CustomerDashboard() {
  const { data: customer, isLoading: isLoadingCustomer } = useQuery({
    queryKey: ['/api/customer/profile'],
  });

  const { data: loans, isLoading: isLoadingLoans } = useQuery({
    queryKey: ['/api/customer/loans'],
  });

  const { data: payments, isLoading: isLoadingPayments } = useQuery({
    queryKey: ['/api/customer/payments'],
  });

  const { data: upcomingPayments, isLoading: isLoadingUpcoming } = useQuery({
    queryKey: ['/api/customer/payments/upcoming'],
  });

  if (isLoadingCustomer || isLoadingLoans || isLoadingPayments || isLoadingUpcoming) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="glass-card">
                <CardContent className="p-6">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const activeLoan = loans?.find((loan: any) => loan.status === 'active' || loan.status === 'disbursed');
  const totalOutstanding = loans?.reduce((sum: number, loan: any) => sum + parseFloat(loan.outstandingBalance || '0'), 0) || 0;
  const nextPayment = upcomingPayments?.[0];
  const recentPayments = payments?.filter((payment: any) => payment.status === 'paid').slice(0, 5) || [];
  const totalPayments = payments?.length || 0;
  const paidPayments = payments?.filter((payment: any) => payment.status === 'paid').length || 0;

  const calculateProgress = (loanId: number) => {
    if (!payments) return 0;
    
    const loanPayments = payments.filter((payment: any) => payment.loanId === loanId);
    const totalPayments = loanPayments.length;
    const paidPayments = loanPayments.filter((payment: any) => payment.status === 'paid').length;
    
    return totalPayments > 0 ? (paidPayments / totalPayments) * 100 : 0;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back, {customer?.firstName}!
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Here's an overview of your loan account
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="glass-card slide-in-up">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Outstanding Balance</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    ${totalOutstanding.toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card slide-in-up" style={{ animationDelay: '0.1s' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Next Payment</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    ${nextPayment?.amount ? parseFloat(nextPayment.amount).toLocaleString() : '0'}
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card slide-in-up" style={{ animationDelay: '0.2s' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Credit Score</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {customer?.creditScore || 'N/A'}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card slide-in-up" style={{ animationDelay: '0.3s' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Loans</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {loans?.filter((loan: any) => loan.status === 'active' || loan.status === 'disbursed').length || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Loan Overview */}
          <div className="lg:col-span-2">
            <Card className="glass-card slide-in-up" style={{ animationDelay: '0.4s' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  Your Loans
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {loans?.map((loan: any) => (
                    <div key={loan.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            Loan #{loan.id}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {loan.purpose}
                          </p>
                        </div>
                        <Badge variant={loan.status === 'active' || loan.status === 'disbursed' ? 'default' : 'secondary'}>
                          {loan.status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Loan Amount</p>
                          <p className="font-medium">${parseFloat(loan.loanAmount).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Outstanding</p>
                          <p className="font-medium">${parseFloat(loan.outstandingBalance || '0').toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Interest Rate</p>
                          <p className="font-medium">{loan.interestRate}%</p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Term</p>
                          <p className="font-medium">{loan.term} months</p>
                        </div>
                      </div>
                      
                      {loan.status === 'active' || loan.status === 'disbursed' ? (
                        <div className="mt-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Payment Progress</span>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {Math.round(calculateProgress(loan.id))}%
                            </span>
                          </div>
                          <Progress 
                            value={calculateProgress(loan.id)} 
                            className="h-2"
                          />
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Upcoming Payments & Quick Actions */}
          <div className="space-y-6">
            {/* Next Payment */}
            <Card className="glass-card slide-in-up" style={{ animationDelay: '0.5s' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-orange-600" />
                  Next Payment
                </CardTitle>
              </CardHeader>
              <CardContent>
                {nextPayment ? (
                  <div className="space-y-4">
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        ${parseFloat(nextPayment.amount).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Due {format(new Date(nextPayment.dueDate), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Principal</p>
                        <p className="font-medium">${parseFloat(nextPayment.principalAmount).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Interest</p>
                        <p className="font-medium">${parseFloat(nextPayment.interestAmount).toLocaleString()}</p>
                      </div>
                    </div>
                    
                    <Button className="w-full glass-button bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                      Make Payment
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">All payments up to date!</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Profile Summary */}
            <Card className="glass-card slide-in-up" style={{ animationDelay: '0.6s' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-green-600" />
                  Profile Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">{customer?.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">{customer?.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">{customer?.address}</span>
                  </div>
                  <div className="pt-2 border-t">
                    <Button variant="outline" className="w-full">
                      Edit Profile
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}