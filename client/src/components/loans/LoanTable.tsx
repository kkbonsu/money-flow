import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Eye, Edit, Trash2, Search, CheckCircle2, Download, Filter, X } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { LoanBook } from '@shared/schema';
import AddLoanModal from './AddLoanModal';
import ViewLoanModal from './ViewLoanModal';
import EditLoanModal from './EditLoanModal';
import LoanApprovalModal from './LoanApprovalModal';

export default function LoanTable() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [amountFilter, setAmountFilter] = useState({ min: '', max: '' });
  const [dateFilter, setDateFilter] = useState({ from: '', to: '' });
  const [sortBy, setSortBy] = useState('dateApplied');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<LoanBook | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: loans = [], isLoading } = useQuery({
    queryKey: ['/api/loans'],
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['/api/customers'],
  });

  const filteredLoans = loans.filter((loan: LoanBook) => {
    // Search filter - check ID, customer name, purpose
    const customer = customers.find((c: any) => c.id === loan.customerId);
    const customerName = customer ? `${customer.firstName} ${customer.lastName}`.toLowerCase() : '';
    const matchesSearch = searchTerm === '' || 
      loan.id.toString().includes(searchTerm) ||
      customerName.includes(searchTerm.toLowerCase()) ||
      (loan.purpose && loan.purpose.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Status filter
    const matchesStatus = statusFilter === 'all' || loan.status === statusFilter;
    
    // Amount filter
    const loanAmount = parseFloat(loan.loanAmount);
    const matchesAmount = (!amountFilter.min || loanAmount >= parseFloat(amountFilter.min)) &&
                         (!amountFilter.max || loanAmount <= parseFloat(amountFilter.max));
    
    // Date filter
    const loanDate = loan.dateApplied ? new Date(loan.dateApplied) : null;
    const matchesDate = (!dateFilter.from || !loanDate || loanDate >= new Date(dateFilter.from)) &&
                       (!dateFilter.to || !loanDate || loanDate <= new Date(dateFilter.to));
    
    return matchesSearch && matchesStatus && matchesAmount && matchesDate;
  }).sort((a: LoanBook, b: LoanBook) => {
    let aValue: any, bValue: any;
    
    switch (sortBy) {
      case 'loanAmount':
        aValue = parseFloat(a.loanAmount);
        bValue = parseFloat(b.loanAmount);
        break;
      case 'customerName':
        const customerA = customers.find((c: any) => c.id === a.customerId);
        const customerB = customers.find((c: any) => c.id === b.customerId);
        aValue = customerA ? `${customerA.firstName} ${customerA.lastName}` : '';
        bValue = customerB ? `${customerB.firstName} ${customerB.lastName}` : '';
        break;
      case 'dateApplied':
        aValue = a.dateApplied ? new Date(a.dateApplied).getTime() : 0;
        bValue = b.dateApplied ? new Date(b.dateApplied).getTime() : 0;
        break;
      default:
        aValue = a.id;
        bValue = b.id;
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

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

  const getCustomerName = (customerId: number) => {
    const customer = customers.find((c: any) => c.id === customerId);
    return customer ? `${customer.firstName} ${customer.lastName}` : `Customer #${customerId}`;
  };

  const handleViewClick = (loan: LoanBook) => {
    setSelectedLoan(loan);
    setIsViewModalOpen(true);
  };

  const handleEditClick = (loan: LoanBook) => {
    setSelectedLoan(loan);
    setIsEditModalOpen(true);
  };

  const handleApprovalClick = (loan: LoanBook) => {
    setSelectedLoan(loan);
    setIsApprovalModalOpen(true);
  };

  const deleteLoanMutation = useMutation({
    mutationFn: (loanId: number) => apiClient.delete(`/loans/${loanId}`),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Loan deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/loans'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete loan",
        variant: "destructive",
      });
    },
  });

  const handleDeleteClick = (loan: LoanBook) => {
    if (window.confirm(`Are you sure you want to delete loan #${loan.id}?`)) {
      deleteLoanMutation.mutate(loan.id);
    }
  };

  const closeModals = () => {
    setIsAddModalOpen(false);
    setIsViewModalOpen(false);
    setIsEditModalOpen(false);
    setIsApprovalModalOpen(false);
    setSelectedLoan(null);
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Customer', 'Loan Amount', 'Interest Rate', 'Term (months)', 'Status', 'Purpose', 'Date Applied', 'Outstanding Balance'];
    const csvData = filteredLoans.map((loan: LoanBook) => [
      loan.id,
      getCustomerName(loan.customerId),
      loan.loanAmount,
      loan.interestRate,
      loan.term,
      loan.status,
      loan.purpose || '',
      loan.dateApplied ? new Date(loan.dateApplied).toLocaleDateString() : '',
      loan.outstandingBalance || ''
    ]);
    
    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `loan-book-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Export Successful",
      description: `Exported ${filteredLoans.length} loans to CSV`,
    });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setAmountFilter({ min: '', max: '' });
    setDateFilter({ from: '', to: '' });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="text-muted-foreground">Loading loans...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Loan Applications ({filteredLoans.length})</CardTitle>
          <div className="flex gap-2">
            <Button onClick={exportToCSV} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button onClick={() => setIsAddModalOpen(true)} className="btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Add Loan
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by ID, customer name, or purpose..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="disbursed">Disbursed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dateApplied">Date Applied</SelectItem>
                <SelectItem value="loanAmount">Loan Amount</SelectItem>
                <SelectItem value="customerName">Customer Name</SelectItem>
                <SelectItem value="id">Loan ID</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
            {(searchTerm || statusFilter !== 'all' || amountFilter.min || amountFilter.max || dateFilter.from || dateFilter.to) && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="w-4 h-4 mr-2" />
                Clear
              </Button>
            )}
          </div>
          
          {showAdvancedFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
              <div>
                <Label className="text-sm font-medium">Min Amount</Label>
                <Input
                  placeholder="0"
                  type="number"
                  value={amountFilter.min}
                  onChange={(e) => setAmountFilter({ ...amountFilter, min: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Max Amount</Label>
                <Input
                  placeholder="1000000"
                  type="number"
                  value={amountFilter.max}
                  onChange={(e) => setAmountFilter({ ...amountFilter, max: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">From Date</Label>
                <Input
                  type="date"
                  value={dateFilter.from}
                  onChange={(e) => setDateFilter({ ...dateFilter, from: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">To Date</Label>
                <Input
                  type="date"
                  value={dateFilter.to}
                  onChange={(e) => setDateFilter({ ...dateFilter, to: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
          )}
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Interest Rate</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date Applied</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLoans.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="text-muted-foreground">
                      {searchTerm || statusFilter !== 'all' ? 'No loans found matching your criteria' : 'No loans found'}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredLoans.map((loan: LoanBook) => (
                  <TableRow key={loan.id}>
                    <TableCell className="font-medium">{loan.id}</TableCell>
                    <TableCell>{getCustomerName(loan.customerId)}</TableCell>
                    <TableCell>{formatCurrency(loan.loanAmount)}</TableCell>
                    <TableCell>{loan.interestRate}%</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(loan.status)}>
                        {loan.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{loan.dateApplied ? new Date(loan.dateApplied).toLocaleDateString() : 'N/A'}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewClick(loan)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleApprovalClick(loan)}
                          className="text-green-600 hover:text-green-700"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClick(loan)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(loan)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-muted-foreground">
            Showing {filteredLoans.length} of {loans.length} loans
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled>
              Next
            </Button>
          </div>
        </div>
      </CardContent>

      {/* Modals */}
      <AddLoanModal isOpen={isAddModalOpen} onClose={closeModals} />
      <ViewLoanModal isOpen={isViewModalOpen} onClose={closeModals} loan={selectedLoan} />
      <EditLoanModal isOpen={isEditModalOpen} onClose={closeModals} loan={selectedLoan} />
      <LoanApprovalModal isOpen={isApprovalModalOpen} onClose={closeModals} loan={selectedLoan} />
    </Card>
  );
}