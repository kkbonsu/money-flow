import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, CheckCircle, Search, Eye } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { PaymentSchedule, LoanBook, Customer } from '@shared/schema';
import ViewPaymentModal from './ViewPaymentModal';

export default function PaymentTable() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewPayment, setViewPayment] = useState<PaymentSchedule | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['/api/payment-schedules'],
  });

  const { data: loans = [] } = useQuery({
    queryKey: ['/api/loans'],
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['/api/customers'],
  });

  // Group payments by loan and create summary rows
  const loanSummaries = loans.map((loan: LoanBook) => {
    const loanPayments = payments.filter((p: PaymentSchedule) => p.loanId === loan.id);
    if (loanPayments.length === 0) return null;

    const customer = customers.find((c: Customer) => c.id === loan.customerId);
    const customerName = customer ? `${customer.firstName} ${customer.lastName}` : 'N/A';

    // Find next payment due (earliest unpaid payment)
    const nextPayment = loanPayments
      .filter((p: PaymentSchedule) => p.status === 'pending')
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];

    // Calculate totals
    const totalPrincipal = loanPayments.reduce((sum, p) => sum + parseFloat(p.principalAmount), 0);
    const totalInterest = loanPayments.reduce((sum, p) => sum + parseFloat(p.interestAmount), 0);

    return {
      loan,
      customerName,
      nextPayment,
      totalPrincipal,
      totalInterest,
      loanPayments
    };
  }).filter(Boolean);

  const filteredSummaries = loanSummaries.filter((summary: any) => {
    if (!summary) return false;
    const matchesSearch = 
      summary.loan.id.toString().includes(searchTerm) ||
      summary.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'pending' && summary.nextPayment) ||
      (statusFilter === 'paid' && !summary.nextPayment) ||
      (statusFilter === 'overdue' && summary.nextPayment && new Date(summary.nextPayment.dueDate) < new Date());
    return matchesSearch && matchesStatus;
  });

  const handleViewClick = (summary: any) => {
    setViewPayment(summary.nextPayment || summary.loanPayments[0]);
    setIsViewModalOpen(true);
  };

  const formatCurrency = (amount: string | number) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(numAmount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-secondary/10 text-secondary';
      case 'pending':
        return 'bg-accent/10 text-accent';
      case 'overdue':
        return 'bg-destructive/10 text-destructive';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="text-muted-foreground">Loading payment schedules...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Payment Schedules</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search payments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64 pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Loan ID</TableHead>
                <TableHead>Next Due Date</TableHead>
                <TableHead>Loan Amount</TableHead>
                <TableHead>Total Principal</TableHead>
                <TableHead>Total Interest</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSummaries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="text-muted-foreground">
                      {searchTerm || statusFilter !== 'all' ? 'No loans found matching your criteria' : 'No payment schedules found'}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredSummaries.map((summary: any) => {
                  const getOverallStatus = () => {
                    if (!summary.nextPayment) return 'paid';
                    if (new Date(summary.nextPayment.dueDate) < new Date()) return 'overdue';
                    return 'pending';
                  };

                  const status = getOverallStatus();

                  return (
                    <TableRow key={summary.loan.id}>
                      <TableCell className="font-medium">{summary.customerName}</TableCell>
                      <TableCell>{summary.loan.id}</TableCell>
                      <TableCell>
                        {summary.nextPayment 
                          ? new Date(summary.nextPayment.dueDate).toLocaleDateString()
                          : 'All paid'
                        }
                      </TableCell>
                      <TableCell className="font-medium">{formatCurrency(summary.loan.loanAmount)}</TableCell>
                      <TableCell>{formatCurrency(summary.totalPrincipal)}</TableCell>
                      <TableCell>{formatCurrency(summary.totalInterest)}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(status)}>
                          {status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewClick(summary)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <ViewPaymentModal
          isOpen={isViewModalOpen}
          onClose={() => {
            setIsViewModalOpen(false);
            setViewPayment(null);
          }}
          payment={viewPayment}
          loan={viewPayment ? loans.find((l: LoanBook) => l.id === viewPayment.loanId) : null}
        />
      </CardContent>
    </Card>
  );
}
