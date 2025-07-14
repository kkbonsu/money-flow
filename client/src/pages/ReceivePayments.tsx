import { motion } from 'framer-motion';
import { Calendar, CheckCircle, Clock, DollarSign, CreditCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function ReceivePayments() {
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
            <Calendar className="w-7 h-7 text-primary" />
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
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Next Processing</span>
                <span className="text-sm text-muted-foreground">In 2 hours</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Success Rate</span>
                <span className="text-sm text-green-600">98.5%</span>
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
              <div className="text-2xl font-bold text-primary">$12,450.00</div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Successful</span>
                  <span className="text-sm text-green-600">15 payments</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Pending</span>
                  <span className="text-sm text-yellow-600">3 payments</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Failed</span>
                  <span className="text-sm text-red-600">1 payment</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Payment Methods */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                Payment Methods
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Bank Transfer</span>
                  <span className="text-sm text-muted-foreground">85%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Direct Debit</span>
                  <span className="text-sm text-muted-foreground">12%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Card Payment</span>
                  <span className="text-sm text-muted-foreground">3%</span>
                </div>
              </div>
              <Button variant="outline" className="w-full">
                Configure Methods
              </Button>
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
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div>
                  <p className="font-medium">Payment #1234</p>
                  <p className="text-sm text-muted-foreground">Customer: John Doe</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">$850.00</p>
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    Successful
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div>
                  <p className="font-medium">Payment #1235</p>
                  <p className="text-sm text-muted-foreground">Customer: Jane Smith</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">$1,200.00</p>
                  <Badge variant="default" className="bg-yellow-100 text-yellow-800">
                    Pending
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div>
                  <p className="font-medium">Payment #1236</p>
                  <p className="text-sm text-muted-foreground">Customer: Bob Johnson</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">$675.00</p>
                  <Badge variant="destructive">
                    Failed
                  </Badge>
                </div>
              </div>
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