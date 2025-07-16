import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useQuery } from '@tanstack/react-query';
import { LoanProduct, LoanBook, Customer } from '@shared/schema';
import { Eye, DollarSign, Calendar, User, CreditCard } from 'lucide-react';
import { format } from 'date-fns';

interface ViewLoanProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  loanProduct: LoanProduct | null;
}

export default function ViewLoanProductModal({ isOpen, onClose, loanProduct }: ViewLoanProductModalProps) {
  // Fetch loans connected to this loan product
  const { data: loans = [], isLoading: loansLoading } = useQuery({
    queryKey: ['/api/loans', loanProduct?.id],
    enabled: !!loanProduct?.id && isOpen,
  });

  // Fetch customers for loan details
  const { data: customers = [] } = useQuery({
    queryKey: ['/api/customers'],
    enabled: isOpen,
  });

  if (!loanProduct) return null;

  // Filter loans for this loan product
  const productLoans = loans.filter((loan: LoanBook) => loan.loanProductId === loanProduct.id);

  // Calculate statistics
  const totalLoanAmount = productLoans.reduce((sum: number, loan: LoanBook) => 
    sum + parseFloat(loan.loanAmount), 0);
  const activeLoanCount = productLoans.filter((loan: LoanBook) => loan.status === 'active').length;
  const pendingLoanCount = productLoans.filter((loan: LoanBook) => loan.status === 'pending').length;
  const completedLoanCount = productLoans.filter((loan: LoanBook) => loan.status === 'completed').length;

  // Helper function to get customer name
  const getCustomerName = (customerId: number) => {
    const customer = customers.find((c: Customer) => c.id === customerId);
    return customer ? `${customer.firstName} ${customer.lastName}` : 'Unknown Customer';
  };

  // Helper function to get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'completed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            {loanProduct.name} - Product Details
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Product Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Product Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Product Name</p>
                  <p className="text-lg font-semibold">{loanProduct.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Processing Fee</p>
                  <p className="text-lg font-semibold text-green-600">
                    GHS {parseFloat(loanProduct.fee).toLocaleString()}
                  </p>
                </div>
              </div>
              {loanProduct.description && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Description</p>
                  <p className="text-sm">{loanProduct.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Loan Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Loan Statistics
              </CardTitle>
              <CardDescription>
                Overview of all loans using this product
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {productLoans.length}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Loans</p>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {activeLoanCount}
                  </p>
                  <p className="text-sm text-muted-foreground">Active Loans</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {pendingLoanCount}
                  </p>
                  <p className="text-sm text-muted-foreground">Pending Loans</p>
                </div>
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    GHS {totalLoanAmount.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Connected Loans */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Connected Loans ({productLoans.length})
              </CardTitle>
              <CardDescription>
                All loans that use this loan product
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loansLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : productLoans.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No loans found using this product</p>
                  <p className="text-sm">Loans will appear here when customers apply using this product</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Loan ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Interest Rate</TableHead>
                        <TableHead>Term</TableHead>
                        <TableHead>Date Applied</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {productLoans.map((loan: LoanBook) => (
                        <TableRow key={loan.id}>
                          <TableCell className="font-medium">#{loan.id}</TableCell>
                          <TableCell>{getCustomerName(loan.customerId)}</TableCell>
                          <TableCell className="font-medium">
                            GHS {parseFloat(loan.loanAmount).toLocaleString()}
                          </TableCell>
                          <TableCell>{loan.interestRate}%</TableCell>
                          <TableCell>{loan.term} months</TableCell>
                          <TableCell>
                            {loan.dateApplied ? format(new Date(loan.dateApplied), 'MMM dd, yyyy') : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(loan.status)}>
                              {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}