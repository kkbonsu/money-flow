import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Eye, Edit, Trash2, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { IncomeManagement } from '@shared/schema';
import AddIncomeModal from './AddIncomeModal';
import ViewIncomeModal from './ViewIncomeModal';
import EditIncomeModal from './EditIncomeModal';
import DeleteIncomeDialog from './DeleteIncomeDialog';

export default function IncomeTable() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedIncome, setSelectedIncome] = useState<IncomeManagement | null>(null);

  const { data: income = [], isLoading } = useQuery({
    queryKey: ['/api/income'],
  });

  const filteredIncome = income.filter((item: IncomeManagement) => {
    const matchesSearch = 
      item.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handleViewClick = (income: IncomeManagement) => {
    setSelectedIncome(income);
    setIsViewModalOpen(true);
  };

  const handleEditClick = (income: IncomeManagement) => {
    setSelectedIncome(income);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (income: IncomeManagement) => {
    setSelectedIncome(income);
    setIsDeleteDialogOpen(true);
  };

  const closeModals = () => {
    setIsAddModalOpen(false);
    setIsViewModalOpen(false);
    setIsEditModalOpen(false);
    setIsDeleteDialogOpen(false);
    setSelectedIncome(null);
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
          <CardTitle>Income Records</CardTitle>
          <Button onClick={() => setIsAddModalOpen(true)} className="btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            Add Income
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search income..."
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
              <SelectItem value="interest">Interest</SelectItem>
              <SelectItem value="fees">Fees</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Source</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredIncome.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="text-muted-foreground">
                      {searchTerm || categoryFilter !== 'all' ? 'No income records found matching your criteria' : 'No income records found'}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredIncome.map((item: IncomeManagement) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.source}</TableCell>
                    <TableCell>{formatCurrency(item.amount)}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                    <TableCell>{item.description}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewClick(item)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClick(item)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(item)}
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
            Showing {filteredIncome.length} of {income.length} income records
          </div>
        </div>
      </CardContent>

      {/* Modals */}
      <AddIncomeModal isOpen={isAddModalOpen} onClose={closeModals} />
      <ViewIncomeModal isOpen={isViewModalOpen} onClose={closeModals} income={selectedIncome} />
      <EditIncomeModal isOpen={isEditModalOpen} onClose={closeModals} income={selectedIncome} />
      <DeleteIncomeDialog isOpen={isDeleteDialogOpen} onClose={closeModals} income={selectedIncome} />
    </Card>
  );
}