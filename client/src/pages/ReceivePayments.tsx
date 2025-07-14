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
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between slide-in-left">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Banknote className="w-7 h-7 text-primary glow-animation" />
            Receive Loan Payments (auto)
          </h1>
          <p className="text-muted-foreground">Automated payment processing and collection management</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Auto-Payment Status */}
        <div className="slide-in-up" style={{ animationDelay: '0.2s' }}>
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
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    Online
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Cryptocurrency Deposits</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Active
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Today's Collections */}
        <div className="slide-in-up" style={{ animationDelay: '0.3s' }}>
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
        </div>

        {/* This Month's Collections */}
        <div className="slide-in-up" style={{ animationDelay: '0.4s' }}>
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
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="slide-in-up" style={{ animationDelay: '0.5s' }}>
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
      </div>

      {/* Auto-Payment Settings */}
      <div className="slide-in-up" style={{ animationDelay: '0.6s' }}>
        <Card>
          <CardHeader>
            <CardTitle>Auto-Payment Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Paystack POS Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground border-b pb-2">Paystack Payment System</h3>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Paystack Public Key</label>
                  <input 
                    type="text" 
                    placeholder="pk_test_xxxxxxxxxxxxxxxxxxxxxxxx" 
                    className="w-full p-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Environment</label>
                  <select className="w-full p-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                    <option>Test Mode</option>
                    <option>Live Mode</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Supported Currencies</label>
                  <select className="w-full p-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                    <option>NGN (Nigerian Naira)</option>
                    <option>USD (US Dollar)</option>
                    <option>GHS (Ghana Cedi)</option>
                    <option>ZAR (South African Rand)</option>
                    <option>KES (Kenyan Shilling)</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Webhook URL</label>
                  <input 
                    type="url" 
                    placeholder="https://your-domain.com/paystack-webhook" 
                    className="w-full p-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Transaction Fee Bearer</label>
                  <select className="w-full p-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                    <option>Customer pays fees</option>
                    <option>Merchant pays fees</option>
                  </select>
                </div>
              </div>
              
              {/* Privy Crypto Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground border-b pb-2">Privy Wallet Integration</h3>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Privy App ID</label>
                  <input 
                    type="text" 
                    placeholder="Enter your Privy App ID" 
                    className="w-full p-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Supported Chains</label>
                  <select className="w-full p-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                    <option>Ethereum + Base + Arbitrum</option>
                    <option>Ethereum + Polygon + Solana</option>
                    <option>All EVM Chains</option>
                    <option>Custom Selection</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Wallet Creation Mode</label>
                  <select className="w-full p-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                    <option>Auto-create for new users</option>
                    <option>Create on first payment</option>
                    <option>Manual creation only</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Gas Sponsorship</label>
                  <select className="w-full p-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                    <option>Enabled for all transactions</option>
                    <option>Enabled for deposits only</option>
                    <option>Disabled</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Payment Collection Address</label>
                  <input 
                    type="text" 
                    placeholder="Your organization's wallet address" 
                    className="w-full p-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex gap-2">
              <Button>Save Configuration</Button>
              <Button variant="outline">Test Paystack Integration</Button>
              <Button variant="outline">Test Privy Wallets</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}