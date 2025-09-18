import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api';
import { LoanBook, Customer, PaymentSchedule, User, LoanProduct } from '@shared/schema';
import { format } from 'date-fns';
import { CheckCircle, Clock, User as UserIcon, Calendar, DollarSign, CreditCard } from 'lucide-react';

interface ViewLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  loan: LoanBook | null;
}

export default function ViewLoanModal({ isOpen, onClose, loan }: ViewLoanModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: customers = [] } = useQuery({
    queryKey: ['/api/customers'],
  });

  const { data: users = [] } = useQuery({
    queryKey: ['/api/users'],
  });

  const { data: loanProducts = [] } = useQuery({
    queryKey: ['/api/loan-products'],
  });

  const { data: paymentSchedules = [] } = useQuery({
    queryKey: ['/api/payment-schedules/loan', loan?.id],
    queryFn: () => apiClient.get(`/payment-schedules/loan/${loan?.id}`),
    enabled: !!loan?.id,
  });

  const updateLoanStatusMutation = useMutation({
    mutationFn: (newStatus: string) => apiClient.put(`/loans/${loan?.id}`, { 
      customerId: loan?.customerId,
      loanAmount: loan?.loanAmount,
      interestRate: loan?.interestRate,
      term: loan?.term,
      purpose: loan?.purpose,
      dateApplied: loan?.dateApplied,
      status: newStatus 
    }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Loan status updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/loans'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update loan status",
        variant: "destructive",
      });
    },
  });

  const handleStatusChange = (newStatus: string) => {
    if (window.confirm(`Are you sure you want to change the loan status to "${newStatus}"?`)) {
      updateLoanStatusMutation.mutate(newStatus);
    }
  };

  if (!loan) return null;

  const getCustomerName = (customerId: number) => {
    const customer = (customers as Customer[]).find((c: Customer) => c.id === customerId);
    return customer ? `${customer.firstName} ${customer.lastName}` : `Customer #${customerId}`;
  };

  const getUserName = (userId: number | null) => {
    if (!userId) return 'Not assigned';
    const user = (users as User[]).find((u: User) => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` || user.username : 'Unknown User';
  };

  const getLoanProductName = (loanProductId: number | null) => {
    if (!loanProductId) return 'N/A';
    const loanProduct = (loanProducts as LoanProduct[]).find((p: LoanProduct) => p.id === loanProductId);
    return loanProduct ? loanProduct.name : 'Unknown Product';
  };

  const formatCurrency = (amount: string | number) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
    }).format(numAmount);
  };

  const paidPayments = (paymentSchedules as PaymentSchedule[]).filter((p: PaymentSchedule) => p.status === 'paid');
  const upcomingPayments = (paymentSchedules as PaymentSchedule[]).filter((p: PaymentSchedule) => p.status === 'pending');
  const totalScheduled = (paymentSchedules as PaymentSchedule[]).reduce((sum: number, p: PaymentSchedule) => sum + parseFloat(p.amount), 0);
  const totalPaid = paidPayments.reduce((sum: number, p: PaymentSchedule) => sum + parseFloat(p.amount), 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'disbursed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };



  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Loan Application Details
          </DialogTitle>
          <DialogDescription>
            Complete loan information, payment history, and assigned officers.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Loan Details</TabsTrigger>
            <TabsTrigger value="payments">Payment History</TabsTrigger>
            <TabsTrigger value="schedule">Payment Schedule</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Loan ID</p>
                      <p className="text-sm">{loan.id}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Customer</p>
                      <p className="text-sm">{getCustomerName(loan.customerId)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Loan Product</p>
                      <p className="text-sm">{getLoanProductName(loan.loanProductId)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Loan Amount</p>
                      <p className="text-sm font-semibold">{formatCurrency(loan.loanAmount)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Interest Rate</p>
                      <p className="text-sm">{loan.interestRate}% per year</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Term</p>
                      <p className="text-sm">{loan.term} months</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Status</p>
                      <Badge className={getStatusColor(loan.status)}>
                        {loan.status}
                      </Badge>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Purpose</p>
                    <p className="text-sm">{loan.purpose}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Date Applied</p>
                    <p className="text-sm">{loan.dateApplied ? new Date(loan.dateApplied).toLocaleDateString() : 'N/A'}</p>
                  </div>
                  
                  {loan.dateApproved && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Date Approved</p>
                      <p className="text-sm">{new Date(loan.dateApproved).toLocaleDateString()}</p>
                    </div>
                  )}
                  
                  {loan.dateDisbursed && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Date Disbursed</p>
                      <p className="text-sm">{new Date(loan.dateDisbursed).toLocaleDateString()}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <UserIcon className="w-4 h-4" />
                    Assigned Officers
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Primary Officer</p>
                    <p className="text-sm">{getUserName(loan.assignedOfficer)}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Approved By</p>
                    <p className="text-sm">{getUserName(loan.approvedBy)}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Disbursed By</p>
                    <p className="text-sm">{getUserName(loan.disbursedBy)}</p>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Monthly Payment</p>
                    <p className="text-sm font-bold">
                      {formatCurrency((parseFloat(loan.loanAmount) * (parseFloat(loan.interestRate) / 100 / 12)) / (1 - Math.pow(1 + (parseFloat(loan.interestRate) / 100 / 12), -loan.term)))}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Interest</p>
                    <p className="text-sm font-bold">
                      {formatCurrency((parseFloat(loan.loanAmount) * (parseFloat(loan.interestRate) / 100 / 12)) / (1 - Math.pow(1 + (parseFloat(loan.interestRate) / 100 / 12), -loan.term)) * loan.term - parseFloat(loan.loanAmount))}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="payments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Payment Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Scheduled</p>
                    <p className="text-sm font-bold">{formatCurrency(totalScheduled)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Paid</p>
                    <p className="text-sm font-bold text-green-600">{formatCurrency(totalPaid)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Remaining</p>
                    <p className="text-sm font-bold text-orange-600">{formatCurrency(totalScheduled - totalPaid)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Progress</p>
                    <p className="text-sm font-bold">{totalScheduled > 0 ? ((totalPaid / totalScheduled) * 100).toFixed(1) : 0}%</p>
                  </div>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${totalScheduled > 0 ? Math.min((totalPaid / totalScheduled) * 100, 100) : 0}%` }}
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Paid Payments</CardTitle>
              </CardHeader>
              <CardContent>
                {paidPayments.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Payment Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Principal</TableHead>
                        <TableHead>Interest</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paidPayments.map((payment: PaymentSchedule) => (
                        <TableRow key={payment.id}>
                          <TableCell>
                            {payment.paidDate ? format(new Date(payment.paidDate), 'MMM dd, yyyy') : 'N/A'}
                          </TableCell>
                          <TableCell className="font-medium">{formatCurrency(payment.amount)}</TableCell>
                          <TableCell className="text-green-600">{formatCurrency(payment.principalAmount)}</TableCell>
                          <TableCell className="text-orange-600">{formatCurrency(payment.interestAmount)}</TableCell>
                          <TableCell>
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Paid
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No payments made yet.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="schedule" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Upcoming Payments
                </CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingPayments.length > 0 ? (
                  <div className="max-h-96 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Due Date</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Principal</TableHead>
                          <TableHead>Interest</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {upcomingPayments.map((payment: PaymentSchedule) => (
                          <TableRow key={payment.id}>
                            <TableCell>{format(new Date(payment.dueDate), 'MMM dd, yyyy')}</TableCell>
                            <TableCell className="font-medium">{formatCurrency(payment.amount)}</TableCell>
                            <TableCell className="text-green-600">{formatCurrency(payment.principalAmount)}</TableCell>
                            <TableCell className="text-orange-600">{formatCurrency(payment.interestAmount)}</TableCell>
                            <TableCell>
                              <Badge className="bg-yellow-100 text-yellow-800">
                                <Clock className="w-3 h-3 mr-1" />
                                Pending
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">All payments completed.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <Separator />
        
        <div className="flex justify-between items-center">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={loan.status === 'pending' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStatusChange('pending')}
              disabled={loan.status === 'pending' || updateLoanStatusMutation.isPending}
            >
              Pending
            </Button>
            <Button
              variant={loan.status === 'approved' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStatusChange('approved')}
              disabled={loan.status === 'approved' || updateLoanStatusMutation.isPending}
            >
              Approved
            </Button>
            <Button
              variant={loan.status === 'rejected' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStatusChange('rejected')}
              disabled={loan.status === 'rejected' || updateLoanStatusMutation.isPending}
            >
              Rejected
            </Button>
            <Button
              variant={loan.status === 'disbursed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStatusChange('disbursed')}
              disabled={loan.status === 'disbursed' || updateLoanStatusMutation.isPending}
            >
              Disbursed
            </Button>
          </div>
          
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}