import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { apiRequest } from '@/lib/queryClient';
import type { IncomeManagement } from '@shared/schema';

interface EnhancedIncomeTableProps {
  onAddIncome: () => void;
}

export default function EnhancedIncomeTable({ onAddIncome }: EnhancedIncomeTableProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State for filtering and sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState({ from: '', to: '' });
  const [amountFilter, setAmountFilter] = useState({ min: '', max: '' });
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [pageSize, setPageSize] = useState(25);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Fetch income data
  const { data: incomeRecords = [], isLoading } = useQuery<IncomeManagement[]>({
    queryKey: ['/api/income'],
  });

  // Available categories and sources for filtering
  const availableCategories = useMemo(() => {
    const categories = [...new Set(incomeRecords.map(record => record.category).filter(Boolean))];
    return categories.sort();
  }, [incomeRecords]);

  const availableSources = useMemo(() => {
    const sources = [...new Set(incomeRecords.map(record => record.source).filter(Boolean))];
    return sources.sort();
  }, [incomeRecords]);

  // Filter and sort income records
  const filteredIncomes = useMemo(() => {
    let filtered = incomeRecords.filter(income => {
      // Search term filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          income.source.toLowerCase().includes(searchLower) ||
          income.description?.toLowerCase().includes(searchLower) ||
          income.category?.toLowerCase().includes(searchLower) ||
          income.amount.toString().includes(searchLower);
        
        if (!matchesSearch) return false;
      }

      // Category filter
      if (categoryFilter !== 'all' && income.category !== categoryFilter) {
        return false;
      }

      // Source filter
      if (sourceFilter !== 'all' && income.source !== sourceFilter) {
        return false;
      }

      // Date range filter
      if (dateFilter.from || dateFilter.to) {
        const incomeDate = new Date(income.date);
        if (dateFilter.from && incomeDate < new Date(dateFilter.from)) return false;
        if (dateFilter.to && incomeDate > new Date(dateFilter.to)) return false;
      }

      // Amount range filter
      if (amountFilter.min || amountFilter.max) {
        const amount = parseFloat(income.amount);
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
        case 'date':
          aValue = new Date(a.date);
          bValue = new Date(b.date);
          break;
        case 'amount':
          aValue = parseFloat(a.amount);
          bValue = parseFloat(b.amount);
          break;
        case 'source':
          aValue = a.source.toLowerCase();
          bValue = b.source.toLowerCase();
          break;
        case 'category':
          aValue = (a.category || '').toLowerCase();
          bValue = (b.category || '').toLowerCase();
          break;
        default:
          aValue = a.createdAt || a.date;
          bValue = b.createdAt || b.date;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [incomeRecords, searchTerm, categoryFilter, sourceFilter, dateFilter, amountFilter, sortBy, sortOrder]);

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Date', 'Source', 'Category', 'Amount', 'Description'];
    const csvData = [
      headers.join(','),
      ...filteredIncomes.map(income => [
        income.date,
        `"${income.source}"`,
        `"${income.category || ''}"`,
        income.amount,
        `"${income.description || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `income_records_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "Export Successful",
      description: `Exported ${filteredIncomes.length} income records to CSV`,
    });
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('all');
    setSourceFilter('all');
    setDateFilter({ from: '', to: '' });
    setAmountFilter({ min: '', max: '' });
    setSortBy('date');
    setSortOrder('desc');
  };

  // Check if any filters are active
  const hasActiveFilters = searchTerm || categoryFilter !== 'all' || 
                          sourceFilter !== 'all' || dateFilter.from || 
                          dateFilter.to || amountFilter.min || amountFilter.max;

  // Helper functions
  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD' 
    }).format(num);
  };

  const getCategoryColor = (category: string | null) => {
    if (!category) return 'bg-gray-100 text-gray-800';
    
    const colors: Record<string, string> = {
      'Loan Interest': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'Loan Fees': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'Processing Fee': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'Other': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'Miscellaneous': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    };
    
    return colors[category] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="text-muted-foreground">Loading income records...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Income Management</CardTitle>
          <div className="flex space-x-3">
            <Button onClick={onAddIncome} className="btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Add Income
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
                placeholder="Search income records..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {availableCategories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
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
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="amount">Amount</SelectItem>
                  <SelectItem value="source">Source</SelectItem>
                  <SelectItem value="category">Category</SelectItem>
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
              <Label className="text-sm font-medium">Source</Label>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Sources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  {availableSources.map(source => (
                    <SelectItem key={source} value={source}>{source}</SelectItem>
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
              <Label className="text-sm font-medium">Date From</Label>
              <Input
                type="date"
                value={dateFilter.from}
                onChange={(e) => setDateFilter(prev => ({ ...prev, from: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Date To</Label>
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
                <DollarSign className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="text-lg font-semibold">
                    {formatCurrency(filteredIncomes.reduce((sum, income) => sum + parseFloat(income.amount), 0))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Record Count</p>
                  <p className="text-lg font-semibold">{filteredIncomes.length}</p>
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
                    {filteredIncomes.length > 0 
                      ? formatCurrency(filteredIncomes.reduce((sum, income) => sum + parseFloat(income.amount), 0) / filteredIncomes.length)
                      : formatCurrency(0)
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Income Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredIncomes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {hasActiveFilters ? 'No income records match your filters' : 'No income records found'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredIncomes.slice(0, pageSize).map((income) => (
                  <TableRow key={income.id}>
                    <TableCell>
                      <span className="text-sm">
                        {new Date(income.date).toLocaleDateString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium">{income.source}</span>
                    </TableCell>
                    <TableCell>
                      {income.category ? (
                        <Badge className={getCategoryColor(income.category)}>
                          {income.category}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-semibold text-green-600">
                        {formatCurrency(income.amount)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {income.description || 'N/A'}
                      </span>
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
                          title="Edit Income"
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
        {filteredIncomes.length > pageSize && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Showing {Math.min(pageSize, filteredIncomes.length)} of {filteredIncomes.length} records
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