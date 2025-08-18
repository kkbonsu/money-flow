import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Search, 
  Filter, 
  Download, 
  Upload, 
  Plus, 
  Edit, 
  Trash2,
  ArrowUpDown,
  X,
  Eye,
  TrendingUp,
  Calendar,
  DollarSign
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Liability } from '@shared/schema';

interface EnhancedLiabilityTableProps {
  onAddLiability: () => void;
}

export default function EnhancedLiabilityTable({ onAddLiability }: EnhancedLiabilityTableProps) {
  const { toast } = useToast();

  // State for filtering and sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [creditorFilter, setCreditorFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState({ from: '', to: '' });
  const [amountFilter, setAmountFilter] = useState({ min: '', max: '' });
  const [sortBy, setSortBy] = useState('dueDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [pageSize, setPageSize] = useState(25);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Fetch liability data
  const { data: liabilities = [], isLoading } = useQuery<Liability[]>({
    queryKey: ['/api/liabilities'],
  });

  // Available creditors and statuses for filtering
  const availableCreditors = useMemo(() => {
    const creditors = [...new Set(liabilities.map(liability => liability.creditor).filter(Boolean))];
    return creditors.sort();
  }, [liabilities]);

  const availableStatuses = ['pending', 'paid', 'overdue'];

  // Filter and sort liabilities
  const filteredLiabilities = useMemo(() => {
    let filtered = liabilities.filter(liability => {
      // Search term filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          liability.liabilityName.toLowerCase().includes(searchLower) ||
          liability.creditor?.toLowerCase().includes(searchLower) ||
          liability.amount.toString().includes(searchLower);
        
        if (!matchesSearch) return false;
      }

      // Status filter
      if (statusFilter !== 'all' && liability.status !== statusFilter) {
        return false;
      }

      // Creditor filter
      if (creditorFilter !== 'all' && liability.creditor !== creditorFilter) {
        return false;
      }

      // Date range filter
      if (dateFilter.from || dateFilter.to) {
        if (liability.dueDate) {
          const liabilityDate = new Date(liability.dueDate);
          if (dateFilter.from && liabilityDate < new Date(dateFilter.from)) return false;
          if (dateFilter.to && liabilityDate > new Date(dateFilter.to)) return false;
        }
      }

      // Amount range filter
      if (amountFilter.min || amountFilter.max) {
        const amount = parseFloat(liability.amount);
        if (amountFilter.min && amount < parseFloat(amountFilter.min)) return false;
        if (amountFilter.max && amount > parseFloat(amountFilter.max)) return false;
      }

      return true;
    });

    // Sort filtered results
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'dueDate':
          aValue = a.dueDate ? new Date(a.dueDate) : new Date('9999-12-31');
          bValue = b.dueDate ? new Date(b.dueDate) : new Date('9999-12-31');
          break;
        case 'amount':
          aValue = parseFloat(a.amount);
          bValue = parseFloat(b.amount);
          break;
        case 'liabilityName':
          aValue = a.liabilityName.toLowerCase();
          bValue = b.liabilityName.toLowerCase();
          break;
        case 'creditor':
          aValue = (a.creditor || '').toLowerCase();
          bValue = (b.creditor || '').toLowerCase();
          break;
        case 'status':
          aValue = a.status.toLowerCase();
          bValue = b.status.toLowerCase();
          break;
        default:
          aValue = a.createdAt || a.dueDate;
          bValue = b.createdAt || b.dueDate;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [liabilities, searchTerm, statusFilter, creditorFilter, dateFilter, amountFilter, sortBy, sortOrder]);

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Liability Name', 'Amount', 'Creditor', 'Interest Rate', 'Due Date', 'Status'];
    const csvData = [
      headers.join(','),
      ...filteredLiabilities.map(liability => [
        `"${liability.liabilityName}"`,
        liability.amount,
        `"${liability.creditor || ''}"`,
        liability.interestRate || '',
        liability.dueDate || '',
        `"${liability.status}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `liabilities_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "Export Successful",
      description: `Exported ${filteredLiabilities.length} liability records to CSV`,
    });
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setCreditorFilter('all');
    setDateFilter({ from: '', to: '' });
    setAmountFilter({ min: '', max: '' });
    setSortBy('dueDate');
    setSortOrder('asc');
  };

  // Check if any filters are active
  const hasActiveFilters = searchTerm || statusFilter !== 'all' || 
                          creditorFilter !== 'all' || dateFilter.from || 
                          dateFilter.to || amountFilter.min || amountFilter.max;

  // Helper functions
  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD' 
    }).format(num);
  };

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

  const isOverdue = (dueDate: string | null, status: string) => {
    if (!dueDate || status === 'paid') return false;
    return new Date(dueDate) < new Date();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="text-muted-foreground">Loading liabilities...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Liability Management</CardTitle>
          <div className="flex space-x-3">
            <Button onClick={onAddLiability} className="btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Add Liability
            </Button>
            <Button variant="outline" onClick={exportToCSV}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Search and Basic Filters */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search liabilities..."
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
                {availableStatuses.map(status => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={showAdvancedFilters ? 'bg-primary text-primary-foreground' : ''}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="w-4 h-4 mr-2" />
                Clear
              </Button>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Label className="text-sm text-muted-foreground">Sort by:</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dueDate">Due Date</SelectItem>
                  <SelectItem value="amount">Amount</SelectItem>
                  <SelectItem value="liabilityName">Name</SelectItem>
                  <SelectItem value="creditor">Creditor</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                <ArrowUpDown className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">Show:</span>
              <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(parseInt(value))}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted rounded-lg mb-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Creditor</Label>
              <Select value={creditorFilter} onValueChange={setCreditorFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Creditors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Creditors</SelectItem>
                  {availableCreditors.map(creditor => (
                    <SelectItem key={creditor} value={creditor}>{creditor}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Amount Range</Label>
              <div className="flex space-x-2">
                <Input
                  placeholder="Min"
                  type="number"
                  value={amountFilter.min}
                  onChange={(e) => setAmountFilter(prev => ({ ...prev, min: e.target.value }))}
                  className="w-20"
                />
                <span className="text-muted-foreground self-center">to</span>
                <Input
                  placeholder="Max"
                  type="number"
                  value={amountFilter.max}
                  onChange={(e) => setAmountFilter(prev => ({ ...prev, max: e.target.value }))}
                  className="w-20"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Due Date From</Label>
              <Input
                type="date"
                value={dateFilter.from}
                onChange={(e) => setDateFilter(prev => ({ ...prev, from: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Due Date To</Label>
              <Input
                type="date"
                value={dateFilter.to}
                onChange={(e) => setDateFilter(prev => ({ ...prev, to: e.target.value }))}
              />
            </div>
          </div>
        )}

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-red-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="text-lg font-semibold">
                    {formatCurrency(filteredLiabilities.reduce((sum, liability) => sum + parseFloat(liability.amount), 0))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-orange-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Liability Count</p>
                  <p className="text-lg font-semibold">{filteredLiabilities.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-purple-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Average Amount</p>
                  <p className="text-lg font-semibold">
                    {filteredLiabilities.length > 0 
                      ? formatCurrency(filteredLiabilities.reduce((sum, liability) => sum + parseFloat(liability.amount), 0) / filteredLiabilities.length)
                      : formatCurrency(0)
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Liability Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Liability Name</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Creditor</TableHead>
                <TableHead>Interest Rate</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLiabilities.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {hasActiveFilters ? 'No liabilities match your filters' : 'No liabilities found'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredLiabilities.slice(0, pageSize).map((liability) => (
                  <TableRow key={liability.id} className={isOverdue(liability.dueDate, liability.status) ? 'bg-red-50 dark:bg-red-950/20' : ''}>
                    <TableCell>
                      <span className="text-sm font-medium">{liability.liabilityName}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-semibold text-red-600">
                        {formatCurrency(liability.amount)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{liability.creditor || 'N/A'}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {liability.interestRate ? `${liability.interestRate}%` : 'N/A'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`text-sm ${isOverdue(liability.dueDate, liability.status) ? 'text-red-600 font-medium' : ''}`}>
                        {liability.dueDate ? new Date(liability.dueDate).toLocaleDateString() : 'N/A'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(liability.status)}>
                        {liability.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          title="Edit Liability"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {filteredLiabilities.length > pageSize && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Showing {Math.min(pageSize, filteredLiabilities.length)} of {filteredLiabilities.length} records
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                Previous
              </Button>
              <Button variant="outline" size="sm">
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}