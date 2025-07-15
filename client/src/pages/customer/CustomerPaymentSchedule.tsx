import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  DollarSign, 
  Clock, 
  CheckCircle,
  AlertCircle,
  CreditCard,
  Eye,
  Filter
} from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';

export default function CustomerPaymentSchedule() {
  const [selectedLoan, setSelectedLoan] = useState<number | null>(null);
  
  const { data: loans, isLoading: isLoadingLoans } = useQuery({
    queryKey: ['/api/customer/loans'],
  });

  const { data: payments, isLoading: isLoadingPayments } = useQuery({
    queryKey: ['/api/customer/payments'],
  });

  const { data: upcomingPayments } = useQuery({
    queryKey: ['/api/customer/payments/upcoming'],
  });

  if (isLoadingLoans || isLoadingPayments) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-4 h-4" />;
      case 'overdue':
        return <AlertCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const activeLoans = loans?.filter((loan: any) => loan.status === 'active' || loan.status === 'disbursed') || [];
  const filteredPayments = selectedLoan 
    ? payments?.filter((payment: any) => payment.loanId === selectedLoan) 
    : payments;

  const nextPayment = upcomingPayments?.[0];
  const totalOutstanding = upcomingPayments?.reduce((sum: number, payment: any) => sum + parseFloat(payment.amount), 0) || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Payment Schedule
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            View your loan payment schedules and upcoming payments
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="glass-card slide-in-up">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Next Payment</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    ${nextPayment ? parseFloat(nextPayment.amount).toLocaleString() : '0'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {nextPayment ? format(new Date(nextPayment.dueDate), 'MMM dd, yyyy') : 'No upcoming payments'}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card slide-in-up" style={{ animationDelay: '0.1s' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Outstanding</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    ${totalOutstanding.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Across all loans
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card slide-in-up" style={{ animationDelay: '0.2s' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Upcoming Payments</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {upcomingPayments?.length || 0}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    This month
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Loan Filter */}
        <div className="mb-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filter by Loan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedLoan === null ? "default" : "outline"}
                  onClick={() => setSelectedLoan(null)}
                  size="sm"
                >
                  All Loans
                </Button>
                {activeLoans.map((loan: any) => (
                  <Button
                    key={loan.id}
                    variant={selectedLoan === loan.id ? "default" : "outline"}
                    onClick={() => setSelectedLoan(loan.id)}
                    size="sm"
                  >
                    Loan #{loan.id}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Schedule Table */}
        <Card className="glass-card slide-in-up" style={{ animationDelay: '0.3s' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Payment Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredPayments && filteredPayments.length > 0 ? (
                filteredPayments.map((payment: any) => (
                  <div key={payment.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                          {getStatusIcon(payment.status)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            Payment #{payment.id}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Loan #{payment.loanId}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          ${parseFloat(payment.amount).toLocaleString()}
                        </p>
                        <Badge variant="outline" className={getStatusColor(payment.status)}>
                          {payment.status}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Due Date</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {format(new Date(payment.dueDate), 'MMM dd, yyyy')}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Principal</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          ${parseFloat(payment.principalAmount).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Interest</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          ${parseFloat(payment.interestAmount).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">
                          {payment.status === 'paid' ? 'Paid Date' : 'Status'}
                        </p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {payment.status === 'paid' && payment.paidDate
                            ? format(new Date(payment.paidDate), 'MMM dd, yyyy')
                            : payment.status === 'overdue'
                            ? 'Overdue'
                            : 'Pending'
                          }
                        </p>
                      </div>
                    </div>

                    {payment.status === 'pending' && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <Button size="sm" className="glass-button bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                          Make Payment
                        </Button>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No payments found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {selectedLoan ? `No payments found for Loan #${selectedLoan}` : 'No payment schedules available'}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}