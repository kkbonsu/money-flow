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

  const getCustomerName = (loanId: number) => {
    const loan = loans.find((l: LoanBook) => l.id === loanId);
    if (!loan) return 'N/A';
    const customer = customers.find((c: Customer) => c.id === loan.customerId);
    return customer ? `${customer.firstName} ${customer.lastName}` : 'N/A';
  };

  const getLoanDetails = (loanId: number) => {
    return loans.find((l: LoanBook) => l.id === loanId);
  };

  const filteredPayments = payments.filter((payment: PaymentSchedule) => {
    const customerName = getCustomerName(payment.loanId);
    const matchesSearch = 
      payment.id.toString().includes(searchTerm) ||
      payment.loanId.toString().includes(searchTerm) ||
      customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleViewClick = (payment: PaymentSchedule) => {
    setViewPayment(payment);
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
          <Button className="btn-primary">
            <Calendar className="w-4 h-4 mr-2" />
            Schedule Payment
          </Button>
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
                <TableHead>Payment ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Loan ID</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Principal</TableHead>
                <TableHead>Interest</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <div className="text-muted-foreground">
                      {searchTerm || statusFilter !== 'all' ? 'No payments found matching your criteria' : 'No payment schedules found'}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredPayments.map((payment: PaymentSchedule) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">{payment.id}</TableCell>
                    <TableCell>{getCustomerName(payment.loanId)}</TableCell>
                    <TableCell>{payment.loanId}</TableCell>
                    <TableCell>{new Date(payment.dueDate).toLocaleDateString()}</TableCell>
                    <TableCell>{formatCurrency(payment.amount)}</TableCell>
                    <TableCell>{formatCurrency(payment.principalAmount)}</TableCell>
                    <TableCell>{formatCurrency(payment.interestAmount)}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(payment.status)}>
                        {payment.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewClick(payment)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={payment.status === 'paid'}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Mark Paid
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
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
          loan={viewPayment ? getLoanDetails(viewPayment.loanId) : null}
        />
      </CardContent>
    </Card>
  );
}
