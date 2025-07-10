import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { LoanBook } from '@shared/schema';

interface ViewLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  loan: LoanBook | null;
}

export default function ViewLoanModal({ isOpen, onClose, loan }: ViewLoanModalProps) {
  if (!loan) return null;

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
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
                  <p className="text-sm font-medium text-muted-foreground">Customer ID</p>
                  <p className="text-sm">{loan.customerId}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Amount</p>
                  <p className="text-sm font-bold">{formatCurrency(loan.amount)}</p>
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
                <p className="text-sm">{new Date(loan.dateApplied).toLocaleDateString()}</p>
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
                    {formatCurrency((loan.amount * (loan.interestRate / 100 / 12)) / (1 - Math.pow(1 + (loan.interestRate / 100 / 12), -loan.term)))}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Interest</p>
                  <p className="text-sm font-bold">
                    {formatCurrency((loan.amount * (loan.interestRate / 100 / 12)) / (1 - Math.pow(1 + (loan.interestRate / 100 / 12), -loan.term)) * loan.term - loan.amount)}
                  </p>
                </div>
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