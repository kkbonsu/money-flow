import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Eye, Edit, Trash2, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Expense } from '@shared/schema';

export default function ExpenseTable() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ['/api/expenses'],
  });

  const filteredExpenses = expenses.filter((expense: Expense) => {
    const matchesSearch = 
      expense.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || expense.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="text-muted-foreground">Loading expenses...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Expense Records</CardTitle>
          <Button className="btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            Add Expense
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search expenses..."
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
              <SelectItem value="operational">Operational</SelectItem>
              <SelectItem value="administrative">Administrative</SelectItem>
              <SelectItem value="marketing">Marketing</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Payment Method</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-muted-foreground">
                    No expenses found
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((expense: Expense) => (
                  <tr key={expense.id}>
                    <td>
                      <span className="text-sm font-medium capitalize">{expense.category}</span>
                    </td>
                    <td>
                      <span className="text-sm font-medium text-destructive">
                        ${parseFloat(expense.amount).toLocaleString()}
                      </span>
                    </td>
                    <td>
                      <span className="text-sm">
                        {new Date(expense.date).toLocaleDateString()}
                      </span>
                    </td>
                    <td>
                      <span className="text-sm capitalize">
                        {expense.paymentMethod || 'N/A'}
                      </span>
                    </td>
                    <td>
                      <span className="text-sm text-muted-foreground">
                        {expense.description || 'N/A'}
                      </span>
                    </td>
                    <td>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
