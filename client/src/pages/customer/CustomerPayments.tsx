import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CreditCard, 
  Clock, 
  DollarSign, 
  Calendar,
  AlertCircle,
  CheckCircle,
  Filter,
  Download
} from 'lucide-react';
import { format } from 'date-fns';

export default function CustomerPayments() {
  const [filter, setFilter] = useState('all');
  
  const { data: payments, isLoading } = useQuery({
    queryKey: ['/api/customer/payments'],
  });

  const { data: upcomingPayments, isLoading: isLoadingUpcoming } = useQuery({
    queryKey: ['/api/customer/payments/upcoming'],
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800 border-green-200';
      case 'overdue': return 'bg-red-100 text-red-800 border-red-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="w-4 h-4" />;
      case 'overdue': return <AlertCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  if (isLoading || isLoadingUpcoming) {
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

  const totalOutstanding = upcomingPayments?.reduce((sum: number, payment: any) => sum + parseFloat(payment.amount), 0) || 0;
  const overduePayments = upcomingPayments?.filter((payment: any) => 
    new Date(payment.dueDate) < new Date() && payment.status === 'pending'
  ) || [];
  const nextPayment = upcomingPayments?.sort((a: any, b: any) => 
    new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  )?.[0];
  
  // Filter payments based on current filter
  const filteredPayments = payments?.filter((payment: any) => {
    if (filter === 'all') return true;
    if (filter === 'paid') return payment.status === 'paid';
    if (filter === 'pending') return payment.status === 'pending';
    if (filter === 'overdue') return new Date(payment.dueDate) < new Date() && payment.status === 'pending';
    return true;
  }) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Payment History
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            View your payment history and upcoming payments
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="glass-card slide-in-up">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Outstanding</p>
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
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Overdue Payments</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {overduePayments.length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card slide-in-up" style={{ animationDelay: '0.2s' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Next Payment</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    ${nextPayment ? parseFloat(nextPayment.amount).toLocaleString() : '0'}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Payments */}
        {upcomingPayments && upcomingPayments.length > 0 && (
          <Card className="glass-card slide-in-up mb-8" style={{ animationDelay: '0.3s' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-600" />
                Upcoming Payments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingPayments.map((payment: any) => (
                  <div key={payment.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          Loan #{payment.loanId}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Due: {format(new Date(payment.dueDate), 'MMM dd, yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-medium text-gray-900 dark:text-white">
                          ${parseFloat(payment.amount).toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Principal: ${parseFloat(payment.principalAmount).toLocaleString()}
                        </p>
                      </div>
                      <Badge className={getStatusColor(payment.status)}>
                        {getStatusIcon(payment.status)}
                        <span className="ml-1 capitalize">{payment.status}</span>
                      </Badge>
                      {payment.status === 'pending' && (
                        <Button size="sm" className="glass-button">
                          Pay Now
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment History */}
        <Card className="glass-card slide-in-up" style={{ animationDelay: '0.4s' }}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
                Payment History
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredPayments?.map((payment: any) => (
                <div key={payment.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      payment.status === 'paid' ? 'bg-green-100 dark:bg-green-900' : 
                      payment.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900' : 
                      'bg-red-100 dark:bg-red-900'
                    }`}>
                      {payment.status === 'paid' && <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />}
                      {payment.status === 'pending' && <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />}
                      {payment.status === 'overdue' && <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        Payment #{payment.id}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Loan #{payment.loanId} • Due: {format(new Date(payment.dueDate), 'MMM dd, yyyy')}
                        {payment.paidDate && ` • Paid: ${format(new Date(payment.paidDate), 'MMM dd, yyyy')}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-medium text-gray-900 dark:text-white">
                        ${parseFloat(payment.paidAmount || payment.amount).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Principal: ${parseFloat(payment.principalAmount).toLocaleString()}
                      </p>
                    </div>
                    <Badge className={getStatusColor(payment.status)}>
                      {getStatusIcon(payment.status)}
                      <span className="ml-1 capitalize">{payment.status}</span>
                    </Badge>
                  </div>
                </div>
              ))}
              
              {!filteredPayments || filteredPayments.length === 0 && (
                <div className="text-center py-8">
                  <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">No payment history found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}