import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, Edit, Trash2, Plus, Download, Search, Filter, X, Upload, ArrowUpDown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Customer } from '@shared/schema';
import ViewCustomerModal from './ViewCustomerModal';
import EditCustomerModal from './EditCustomerModal';
import DeleteCustomerDialog from './DeleteCustomerDialog';
import ImportCustomerModal from './ImportCustomerModal';

interface CustomerTableProps {
  onAddCustomer: () => void;
}

export default function CustomerTable({ onAddCustomer }: CustomerTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [creditScoreFilter, setCreditScoreFilter] = useState({ min: '', max: '' });
  const [dateFilter, setDateFilter] = useState({ from: '', to: '' });
  const [portalFilter, setPortalFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [pageSize, setPageSize] = useState(10);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const { toast } = useToast();

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['/api/customers'],
  });

  const filteredCustomers = (customers as Customer[]).filter((customer: Customer) => {
    // Search filter - check ID, name, email, phone, nationalId
    const matchesSearch = searchTerm === '' || 
      customer.id.toString().includes(searchTerm) ||
      customer.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.phone && customer.phone.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (customer.nationalId && customer.nationalId.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Status filter
    const matchesStatus = statusFilter === 'all' || customer.status === statusFilter;
    
    // Credit score filter
    const creditScore = customer.creditScore || 0;
    const matchesCreditScore = (!creditScoreFilter.min || creditScore >= parseInt(creditScoreFilter.min)) &&
                              (!creditScoreFilter.max || creditScore <= parseInt(creditScoreFilter.max));
    
    // Date filter
    const customerDate = customer.createdAt ? new Date(customer.createdAt) : null;
    const matchesDate = (!dateFilter.from || !customerDate || customerDate >= new Date(dateFilter.from)) &&
                       (!dateFilter.to || !customerDate || customerDate <= new Date(dateFilter.to));
    
    // Portal filter
    const matchesPortal = portalFilter === 'all' || 
                         (portalFilter === 'active' && customer.isPortalActive) ||
                         (portalFilter === 'inactive' && !customer.isPortalActive);
    
    return matchesSearch && matchesStatus && matchesCreditScore && matchesDate && matchesPortal;
  }).sort((a: Customer, b: Customer) => {
    let aValue: any, bValue: any;
    
    switch (sortBy) {
      case 'name':
        aValue = `${a.firstName} ${a.lastName}`.toLowerCase();
        bValue = `${b.firstName} ${b.lastName}`.toLowerCase();
        break;
      case 'email':
        aValue = a.email.toLowerCase();
        bValue = b.email.toLowerCase();
        break;
      case 'creditScore':
        aValue = a.creditScore || 0;
        bValue = b.creditScore || 0;
        break;
      case 'createdAt':
        aValue = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        bValue = b.createdAt ? new Date(b.createdAt).getTime() : 0;
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
      case 'active':
        return 'bg-secondary/10 text-secondary';
      case 'inactive':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsViewModalOpen(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsEditModalOpen(true);
  };

  const handleDeleteCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDeleteDialogOpen(true);
  };

  const closeModals = () => {
    setSelectedCustomer(null);
    setIsViewModalOpen(false);
    setIsEditModalOpen(false);
    setIsDeleteDialogOpen(false);
  };

  const exportToCSV = () => {
    const headers = [
      'ID',
      'First Name',
      'Last Name', 
      'Email',
      'Phone',
      'Address',
      'National ID',
      'Credit Score',
      'Status',
      'Portal Active',
      'Created Date'
    ];
    
    const csvData = filteredCustomers.map((customer: Customer) => [
      customer.id,
      customer.firstName,
      customer.lastName,
      customer.email,
      customer.phone || '',
      customer.address || '',
      customer.nationalId || '',
      customer.creditScore || '',
      customer.status,
      customer.isPortalActive ? 'Yes' : 'No',
      customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : ''
    ]);
    
    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "Export Successful",
      description: `Exported ${filteredCustomers.length} customers to CSV`,
    });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setCreditScoreFilter({ min: '', max: '' });
    setDateFilter({ from: '', to: '' });
    setPortalFilter('all');
    setSortBy('createdAt');
    setSortOrder('desc');
  };

  const hasActiveFilters = searchTerm || statusFilter !== 'all' || 
                          creditScoreFilter.min || creditScoreFilter.max || 
                          dateFilter.from || dateFilter.to || portalFilter !== 'all';

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="text-muted-foreground">Loading customers...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Customer Management</CardTitle>
          <div className="flex space-x-3">
            <Button onClick={onAddCustomer} className="btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Add Customer
            </Button>
            <Button variant="outline" onClick={() => setIsImportModalOpen(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Import
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
                placeholder="Search customers..."
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
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
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
                  <SelectItem value="createdAt">Date</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="creditScore">Credit Score</SelectItem>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted rounded-lg mb-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Credit Score Range</Label>
              <div className="flex space-x-2">
                <Input
                  placeholder="Min"
                  type="number"
                  value={creditScoreFilter.min}
                  onChange={(e) => setCreditScoreFilter(prev => ({ ...prev, min: e.target.value }))}
                  className="w-20"
                />
                <span className="text-muted-foreground self-center">to</span>
                <Input
                  placeholder="Max"
                  type="number"
                  value={creditScoreFilter.max}
                  onChange={(e) => setCreditScoreFilter(prev => ({ ...prev, max: e.target.value }))}
                  className="w-20"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Date Range</Label>
              <div className="flex space-x-2">
                <Input
                  type="date"
                  value={dateFilter.from}
                  onChange={(e) => setDateFilter(prev => ({ ...prev, from: e.target.value }))}
                  className="w-32"
                />
                <span className="text-muted-foreground self-center">to</span>
                <Input
                  type="date"
                  value={dateFilter.to}
                  onChange={(e) => setDateFilter(prev => ({ ...prev, to: e.target.value }))}
                  className="w-32"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Portal Status</Label>
              <Select value={portalFilter} onValueChange={setPortalFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Portal Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Portal Status</SelectItem>
                  <SelectItem value="active">Portal Active</SelectItem>
                  <SelectItem value="inactive">Portal Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>National ID</TableHead>
                <TableHead>Credit Score</TableHead>
                <TableHead>Portal</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    {hasActiveFilters ? 'No customers match your filters' : 'No customers found'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredCustomers.slice(0, pageSize).map((customer: Customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium">
                            {customer.firstName.charAt(0)}{customer.lastName.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {customer.firstName} {customer.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {customer.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{customer.phone || 'N/A'}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{customer.nationalId || 'N/A'}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium">
                        {customer.creditScore || 'N/A'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className={customer.isPortalActive ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'}>
                        {customer.isPortalActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getStatusColor(customer.status)}`}>
                        {customer.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {new Date(customer.createdAt || '').toLocaleDateString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleViewCustomer(customer)}
                          title="View Customer"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditCustomer(customer)}
                          title="Edit Customer"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteCustomer(customer)}
                          title="Delete Customer"
                          className="text-destructive hover:text-destructive"
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

        {/* Pagination */}
        <div className="flex items-center justify-between pt-6">
          <div className="text-sm text-muted-foreground">
            Showing <span className="font-medium">1</span> to{' '}
            <span className="font-medium">{Math.min(pageSize, filteredCustomers.length)}</span> of{' '}
            <span className="font-medium">{filteredCustomers.length}</span> results
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
            <Button variant="outline" size="sm" className="bg-primary text-primary-foreground">
              1
            </Button>
            <Button variant="outline" size="sm" disabled>
              Next
            </Button>
          </div>
        </div>
      </CardContent>

      {/* Modals */}
      <ViewCustomerModal
        isOpen={isViewModalOpen}
        onClose={closeModals}
        customer={selectedCustomer}
      />
      
      <EditCustomerModal
        isOpen={isEditModalOpen}
        onClose={closeModals}
        customer={selectedCustomer}
      />
      
      <DeleteCustomerDialog
        isOpen={isDeleteDialogOpen}
        onClose={closeModals}
        customer={selectedCustomer}
      />
      
      <ImportCustomerModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />
    </Card>
  );
}
