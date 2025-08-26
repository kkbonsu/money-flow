import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useQuery } from '@tanstack/react-query';
import { LoanBook, Customer, LoanProduct, PaymentSchedule } from '@shared/schema';
import { Search, Download, Filter, FileSpreadsheet, Calculator, Eye } from 'lucide-react';
import { format } from 'date-fns';

export default function LoanSheet() {
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch all required data
  const { data: loans = [], isLoading: loansLoading } = useQuery({
    queryKey: ['/api/loans'],
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['/api/customers'],
  });

  const { data: loanProducts = [] } = useQuery({
    queryKey: ['/api/loan-products'],
  });

  const { data: paymentSchedules = [] } = useQuery({
    queryKey: ['/api/payment-schedules'],
  });

  // Process and combine all loan data
  const enrichedLoans = useMemo(() => {
    return (loans as LoanBook[]).map((loan: LoanBook) => {
      const customer = (customers as Customer[]).find((c: Customer) => c.id === loan.customerId);
      const loanProduct = (loanProducts as LoanProduct[]).find((lp: LoanProduct) => lp.id === loan.loanProductId);
      const loanSchedules = (paymentSchedules as PaymentSchedule[]).filter((ps: PaymentSchedule) => ps.loanId === loan.id);
      
      // Calculate loan metrics
      const totalScheduledPayments = loanSchedules.reduce((sum: number, schedule: PaymentSchedule) => 
        sum + parseFloat(schedule.amount || '0'), 0
      );
      const totalPaidAmount = loanSchedules
        .filter((schedule: PaymentSchedule) => schedule.status === 'paid')
        .reduce((sum: number, schedule: PaymentSchedule) => sum + parseFloat(schedule.paidAmount || '0'), 0);
      const totalInterest = loanSchedules.reduce((sum: number, schedule: PaymentSchedule) => 
        sum + parseFloat(schedule.interestAmount || '0'), 0
      );
      const monthlyPayment = loanSchedules.length > 0 ? parseFloat(loanSchedules[0].amount || '0') : 0;
      const remainingPayments = loanSchedules.filter((schedule: PaymentSchedule) => schedule.status === 'pending').length;
      const paidPayments = loanSchedules.filter((schedule: PaymentSchedule) => schedule.status === 'paid').length;
      const nextPaymentDate = loanSchedules.find((schedule: PaymentSchedule) => schedule.status === 'pending')?.dueDate;

      return {
        ...loan,
        customerName: customer ? `${customer.firstName} ${customer.lastName}` : 'Unknown Customer',
        customerEmail: customer?.email || 'N/A',
        customerPhone: customer?.phone || 'N/A',
        loanProductName: loanProduct?.name || 'Unknown Product',
        totalScheduledPayments,
        totalPaidAmount,
        totalInterest,
        monthlyPayment,
        remainingPayments,
        paidPayments,
        nextPaymentDate,
        currentBalance: loan.outstandingBalance ? parseFloat(loan.outstandingBalance) : parseFloat(loan.loanAmount || '0'),
        totalPayable: parseFloat(loan.loanAmount || '0') + totalInterest,
      };
    });
  }, [loans, customers, loanProducts, paymentSchedules]);

  // Filter loans based on search term
  const filteredLoans = enrichedLoans.filter((loan: any) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      loan.id.toString().includes(searchLower) ||
      loan.customerName.toLowerCase().includes(searchLower) ||
      loan.customerEmail.toLowerCase().includes(searchLower) ||
      loan.loanProductName.toLowerCase().includes(searchLower) ||
      loan.status.toLowerCase().includes(searchLower) ||
      loan.purpose?.toLowerCase().includes(searchLower)
    );
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: 'outline' as const, className: 'text-yellow-600 border-yellow-300' },
      approved: { variant: 'default' as const, className: 'bg-blue-100 text-blue-800 border-blue-300' },
      disbursed: { variant: 'default' as const, className: 'bg-green-100 text-green-800 border-green-300' },
      active: { variant: 'default' as const, className: 'bg-green-100 text-green-800 border-green-300' },
      closed: { variant: 'secondary' as const, className: 'bg-gray-100 text-gray-800' },
      defaulted: { variant: 'destructive' as const, className: 'bg-red-100 text-red-800 border-red-300' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return (
      <Badge variant={config.variant} className={config.className}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(num);
  };

  const exportToCSV = () => {
    const headers = [
      'Loan ID', 'Customer Name', 'Email', 'Phone', 'Loan Product', 'Principal Amount',
      'Interest Rate (%)', 'Term (Months)', 'Monthly Payment', 'Total Payable', 'Total Interest',
      'Current Balance', 'Total Paid', 'Payments Made', 'Remaining Payments',
      'Next Payment Date', 'Status', 'Date Applied', 'Purpose'
    ];

    const csvData = filteredLoans.map((loan: any) => [
      loan.id,
      loan.customerName,
      loan.customerEmail,
      loan.customerPhone,
      loan.loanProductName,
      parseFloat(loan.loanAmount || '0'),
      parseFloat(loan.interestRate || '0'),
      loan.term,
      loan.monthlyPayment,
      loan.totalPayable,
      loan.totalInterest,
      loan.currentBalance,
      loan.totalPaidAmount,
      loan.paidPayments,
      loan.remainingPayments,
      loan.nextPaymentDate ? format(new Date(loan.nextPaymentDate), 'MMM dd, yyyy') : 'N/A',
      loan.status,
      loan.dateApplied ? format(new Date(loan.dateApplied), 'MMM dd, yyyy') : 'N/A',
      loan.purpose || 'N/A'
    ]);

    const csvContent = [headers, ...csvData]
      .map((row: any[]) => row.map((cell: any) => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `loan-sheet-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loansLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading loan data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <FileSpreadsheet className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Loan Sheet</h1>
            <p className="text-muted-foreground">Comprehensive view of all loans with detailed metrics</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={exportToCSV} variant="outline" className="flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Loans</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredLoans.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Principal</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                filteredLoans.reduce((sum: number, loan: any) => sum + parseFloat(loan.loanAmount || '0'), 0)
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                filteredLoans.reduce((sum: number, loan: any) => sum + loan.currentBalance, 0)
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Interest</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                filteredLoans.reduce((sum: number, loan: any) => sum + loan.totalInterest, 0)
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by loan ID, customer name, email, product, status, or purpose..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loan Sheet Table */}
      <Card>
        <CardHeader>
          <CardTitle>Loan Details ({filteredLoans.length} loans)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Loan ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Principal</TableHead>
                  <TableHead>Interest Rate</TableHead>
                  <TableHead>Term</TableHead>
                  <TableHead>Monthly Payment</TableHead>
                  <TableHead>Total Payable</TableHead>
                  <TableHead>Current Balance</TableHead>
                  <TableHead>Total Paid</TableHead>
                  <TableHead>Payments Progress</TableHead>
                  <TableHead>Next Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date Applied</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLoans.map((loan: any) => (
                  <TableRow key={loan.id}>
                    <TableCell className="font-medium">#{loan.id}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{loan.customerName}</div>
                        <div className="text-sm text-muted-foreground">{loan.customerEmail}</div>
                        <div className="text-sm text-muted-foreground">{loan.customerPhone}</div>
                      </div>
                    </TableCell>
                    <TableCell>{loan.loanProductName}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(loan.loanAmount || '0')}</TableCell>
                    <TableCell>{loan.interestRate}%</TableCell>
                    <TableCell>{loan.term} months</TableCell>
                    <TableCell>{formatCurrency(loan.monthlyPayment)}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(loan.totalPayable)}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(loan.currentBalance)}</TableCell>
                    <TableCell className="text-green-600">{formatCurrency(loan.totalPaidAmount)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{loan.paidPayments} / {loan.paidPayments + loan.remainingPayments} payments</div>
                        <div className="text-muted-foreground">
                          {loan.remainingPayments} remaining
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {loan.nextPaymentDate ? 
                        format(new Date(loan.nextPaymentDate), 'MMM dd, yyyy') : 
                        'No payments due'
                      }
                    </TableCell>
                    <TableCell>{getStatusBadge(loan.status)}</TableCell>
                    <TableCell>
                      {loan.dateApplied ? 
                        format(new Date(loan.dateApplied), 'MMM dd, yyyy') : 
                        'N/A'
                      }
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {filteredLoans.length === 0 && (
            <div className="text-center py-12">
              <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">No loans found</h3>
              <p className="text-muted-foreground">
                {searchTerm ? 'Try adjusting your search criteria' : 'No loans have been created yet'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}