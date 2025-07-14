import { motion } from 'framer-motion';
import { Banknote, CheckCircle, Clock, DollarSign, CreditCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';

export default function ReceivePayments() {
  const { data: recentPayments, isLoading: isLoadingRecent } = useQuery({
    queryKey: ['/api/payments/recent'],
  });

  const { data: todaysPayments, isLoading: isLoadingToday } = useQuery({
    queryKey: ['/api/payments/today'],
  });

  const { data: monthlyPayments, isLoading: isLoadingMonthly } = useQuery({
    queryKey: ['/api/payments/monthly'],
  });

  const formatAmount = (amount: string) => {
    return `$${parseFloat(amount).toLocaleString()}`;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Banknote className="w-7 h-7 text-primary" />
            Receive Loan Payments (auto)
          </h1>
          <p className="text-muted-foreground">Automated payment processing and collection management</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Auto-Payment Status */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Auto-Payment Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">System Status</span>
                <Badge variant="default" className="bg-green-100 text-green-800">
                  Active
                </Badge>
              </div>
              
              <div className="space-y-3 pt-2">
                <div className="text-sm font-medium text-muted-foreground">Payment Methods:</div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Point-of-Sale System</span>
                  <Button variant="outline" size="sm" className="h-7 px-3 text-xs">
                    Configure
                  </Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Cryptocurrency Deposits</span>
                  <Button variant="outline" size="sm" className="h-7 px-3 text-xs">
                    Configure
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Today's Collections */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                Today's Collections
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingToday ? (
                <div className="text-2xl font-bold text-primary">Loading...</div>
              ) : (
                <>
                  <div className="text-2xl font-bold text-primary">
                    {formatAmount(todaysPayments?.totalAmount?.toString() || '0')}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Successful</span>
                      <span className="text-sm text-green-600">{todaysPayments?.paidCount || 0} payments</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Pending</span>
                      <span className="text-sm text-yellow-600">{todaysPayments?.pendingCount || 0} payments</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Overdue</span>
                      <span className="text-sm text-red-600">{todaysPayments?.overdueCount || 0} payments</span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* This Month's Collections */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                This Month's Collections
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingMonthly ? (
                <div className="text-2xl font-bold text-primary">Loading...</div>
              ) : (
                <>
                  <div className="text-2xl font-bold text-primary">
                    {formatAmount(monthlyPayments?.totalAmount?.toString() || '0')}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Successful</span>
                      <span className="text-sm text-green-600">{monthlyPayments?.paidCount || 0} payments</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Pending</span>
                      <span className="text-sm text-yellow-600">{monthlyPayments?.pendingCount || 0} payments</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Overdue</span>
                      <span className="text-sm text-red-600">{monthlyPayments?.overdueCount || 0} payments</span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Transactions */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Recent Auto-Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoadingRecent ? (
                <div className="text-center py-4">Loading recent payments...</div>
              ) : recentPayments && recentPayments.length > 0 ? (
                recentPayments.map((payment: any) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div>
                      <p className="font-medium">Payment #{payment.id}</p>
                      <p className="text-sm text-muted-foreground">Customer: {payment.customerName}</p>
                      <p className="text-sm text-muted-foreground">
                        Paid: {format(new Date(payment.paidDate), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatAmount(payment.amount)}</p>
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        Paid
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  No recent payments found
                </div>
              )}
            </div>
            
            <div className="mt-4 pt-4 border-t">
              <Button variant="outline" className="w-full">
                View All Transactions
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Auto-Payment Settings */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Auto-Payment Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Processing Schedule</label>
                <select className="w-full p-2 border rounded-md">
                  <option>Daily at 9:00 AM</option>
                  <option>Twice daily (9:00 AM & 3:00 PM)</option>
                  <option>Weekly on Mondays</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Retry Attempts</label>
                <select className="w-full p-2 border rounded-md">
                  <option>3 attempts</option>
                  <option>5 attempts</option>
                  <option>7 attempts</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Notification Settings</label>
                <select className="w-full p-2 border rounded-md">
                  <option>Email + SMS</option>
                  <option>Email only</option>
                  <option>SMS only</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Grace Period</label>
                <select className="w-full p-2 border rounded-md">
                  <option>3 days</option>
                  <option>5 days</option>
                  <option>7 days</option>
                </select>
              </div>
            </div>
            
            <div className="mt-6 flex gap-2">
              <Button>Save Configuration</Button>
              <Button variant="outline">Test Connection</Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}