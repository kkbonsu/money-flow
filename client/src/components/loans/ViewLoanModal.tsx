import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api';
import { LoanBook, Customer } from '@shared/schema';

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

  const updateLoanStatusMutation = useMutation({
    mutationFn: (newStatus: string) => apiClient.put(`/loans/${loan?.id}`, { 
      ...loan, 
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
    const customer = customers.find((c: Customer) => c.id === customerId);
    return customer ? `${customer.firstName} ${customer.lastName}` : `Customer #${customerId}`;
  };

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

  const formatCurrency = (amount: string | number) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(numAmount);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Loan Application Details</DialogTitle>
          <DialogDescription>
            View complete loan application information and details.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
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
                  <p className="text-sm font-medium text-muted-foreground">Amount</p>
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
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge className={getStatusColor(loan.status)}>
                    {loan.status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Application Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
              <CardTitle className="text-lg">Financial Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
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
              </div>
            </CardContent>
          </Card>
        </div>

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