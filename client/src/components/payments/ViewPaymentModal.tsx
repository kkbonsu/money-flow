import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PaymentSchedule, LoanBook, Customer } from '@shared/schema';
import { apiClient } from '@/lib/api';
import { CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ViewPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: PaymentSchedule | null;
  loan: LoanBook | null;
}

export default function ViewPaymentModal({ isOpen, onClose, payment, loan }: ViewPaymentModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: customers = [] } = useQuery({
    queryKey: ['/api/customers'],
  });

  const { data: allPayments = [] } = useQuery({
    queryKey: ['/api/payment-schedules'],
  });

  const markAsPaidMutation = useMutation({
    mutationFn: (paymentId: number) => {
      const paymentToUpdate = allPayments.find((p: PaymentSchedule) => p.id === paymentId);
      if (!paymentToUpdate) throw new Error('Payment not found');
      
      return apiClient.put(`/payment-schedules/${paymentId}`, {
        loanId: paymentToUpdate.loanId,
        dueDate: paymentToUpdate.dueDate,
        amount: paymentToUpdate.amount,
        principalAmount: paymentToUpdate.principalAmount,
        interestAmount: paymentToUpdate.interestAmount,
        status: 'paid',
        paidDate: new Date().toISOString(), // Send as full ISO timestamp
        paidAmount: paymentToUpdate.amount
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payment-schedules'] });
      toast({
        title: "Payment Updated",
        description: "Payment has been marked as paid successfully.",
      });
    },
    onError: (error: any) => {
      console.error('Payment update error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update payment status.",
        variant: "destructive",
      });
    },
  });

  if (!payment || !loan) return null;

  const customer = customers.find((c: Customer) => c.id === loan.customerId);
  const customerName = customer ? `${customer.firstName} ${customer.lastName}` : 'N/A';

  // Get all payments for this loan to show complete payment breakdown
  const loanPayments = allPayments.filter((p: PaymentSchedule) => p.loanId === payment.loanId);
  
  // Calculate totals
  const totalPaid = loanPayments
    .filter((p: PaymentSchedule) => p.status === 'paid')
    .reduce((sum, p: PaymentSchedule) => sum + parseFloat(p.amount), 0);
  const totalScheduled = loanPayments
    .reduce((sum, p: PaymentSchedule) => sum + parseFloat(p.amount), 0);

  // Find the next unpaid payment to show as current payment
  const nextPayment = loanPayments
    .filter((p: PaymentSchedule) => p.status === 'pending')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0] || payment;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'overdue':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatCurrency = (amount: string | number) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(numAmount);
  };

  const calculateMonthlyPayment = () => {
    const principal = parseFloat(loan.loanAmount);
    const monthlyRate = parseFloat(loan.interestRate) / 100 / 12;
    const numPayments = loan.term;
    
    return principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
           (Math.pow(1 + monthlyRate, numPayments) - 1);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Payment Schedule Details</DialogTitle>
          <DialogDescription>
            Complete payment breakdown for this loan and current payment details.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Loan Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Loan Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Customer</p>
                  <p className="text-sm">{customerName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Loan ID</p>
                  <p className="text-sm">{loan.id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Loan Amount</p>
                  <p className="text-sm font-bold">{formatCurrency(loan.loanAmount)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Interest Rate</p>
                  <p className="text-sm">{loan.interestRate}%</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Term</p>
                  <p className="text-sm">{loan.term} months</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Monthly Payment</p>
                  <p className="text-sm font-bold">{formatCurrency(calculateMonthlyPayment())}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Payment Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Scheduled</p>
                  <p className="text-sm font-bold">{formatCurrency(totalScheduled)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Paid</p>
                  <p className="text-sm font-bold text-green-600">{formatCurrency(totalPaid)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Remaining Balance</p>
                  <p className="text-sm font-bold text-orange-600">{formatCurrency(totalScheduled - totalPaid)}</p>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(totalPaid / totalScheduled) * 100}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                {((totalPaid / totalScheduled) * 100).toFixed(1)}% paid
              </p>
            </CardContent>
          </Card>

          {/* Current Payment Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Current Payment Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Payment ID</p>
                  <p className="text-sm">{nextPayment.id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Due Date</p>
                  <p className="text-sm">{new Date(nextPayment.dueDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
                  <p className="text-sm font-bold">{formatCurrency(nextPayment.amount)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge className={getStatusColor(nextPayment.status)}>
                    {nextPayment.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Principal Amount</p>
                  <p className="text-sm">{formatCurrency(nextPayment.principalAmount)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Interest Amount</p>
                  <p className="text-sm">{formatCurrency(nextPayment.interestAmount)}</p>
                </div>
              </div>
              {nextPayment.status === 'pending' && (
                <div className="pt-4 border-t">
                  <Button
                    onClick={() => markAsPaidMutation.mutate(nextPayment.id)}
                    disabled={markAsPaidMutation.isPending}
                    className="w-full"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {markAsPaidMutation.isPending ? 'Processing...' : 'Mark as Paid'}
                  </Button>
                </div>
              )}
              {nextPayment.status === 'paid' && (
                <div className="pt-4 border-t">
                  <Button disabled className="w-full bg-green-100 text-green-800 cursor-not-allowed">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Paid
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Complete Payment Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Complete Payment Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-64 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-background">
                    <tr className="border-b">
                      <th className="text-left p-2">Payment #</th>
                      <th className="text-left p-2">Due Date</th>
                      <th className="text-left p-2">Amount</th>
                      <th className="text-left p-2">Principal</th>
                      <th className="text-left p-2">Interest</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-left p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loanPayments
                      .sort((a: PaymentSchedule, b: PaymentSchedule) => 
                        new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
                      )
                      .map((p: PaymentSchedule, index: number) => (
                        <tr 
                          key={p.id} 
                          className={`border-b hover:bg-muted/50 ${p.id === payment.id ? 'bg-blue-50 dark:bg-blue-950' : ''}`}
                        >
                          <td className="p-2 font-medium">{index + 1}</td>
                          <td className="p-2">{new Date(p.dueDate).toLocaleDateString()}</td>
                          <td className="p-2">{formatCurrency(p.amount)}</td>
                          <td className="p-2">{formatCurrency(p.principalAmount)}</td>
                          <td className="p-2">{formatCurrency(p.interestAmount)}</td>
                          <td className="p-2">
                            <Badge className={getStatusColor(p.status)} size="sm">
                              {p.status}
                            </Badge>
                          </td>
                          <td className="p-2">
                            {p.status === 'pending' ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => markAsPaidMutation.mutate(p.id)}
                                disabled={markAsPaidMutation.isPending}
                                className="h-6 px-2 text-xs"
                              >
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Mark Paid
                              </Button>
                            ) : p.status === 'paid' ? (
                              <Button
                                variant="outline"
                                size="sm"
                                disabled
                                className="h-6 px-2 text-xs bg-green-100 text-green-800 cursor-not-allowed"
                              >
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Paid
                              </Button>
                            ) : null}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end">
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}