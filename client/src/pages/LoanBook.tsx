import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, Edit, Plus, Download, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { LoanBook } from '@shared/schema';

export default function LoanBookPage() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    setLocation('/login');
    return null;
  }

  const { data: loans = [], isLoading } = useQuery({
    queryKey: ['/api/loans'],
  });

  const filteredLoans = loans.filter((loan: LoanBook) => {
    const matchesSearch = loan.id.toString().includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || loan.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-secondary/10 text-secondary';
      case 'pending':
        return 'bg-accent/10 text-accent';
      case 'rejected':
        return 'bg-destructive/10 text-destructive';
      case 'disbursed':
        return 'bg-primary/10 text-primary';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Loan Book</h1>
            <p className="text-muted-foreground">Manage loan applications and tracking</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center h-32">
              <div className="text-muted-foreground">Loading loans...</div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Loan Book</h1>
          <p className="text-muted-foreground">Manage loan applications and tracking</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Loan Applications</CardTitle>
            <div className="flex space-x-3">
              <Button className="btn-primary">
                <Plus className="w-4 h-4 mr-2" />
                New Loan
              </Button>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search loans..."
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
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="disbursed">Disbursed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Loan ID</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Interest Rate</th>
                  <th>Term</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLoans.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-muted-foreground">
                      No loans found
                    </td>
                  </tr>
                ) : (
                  filteredLoans.map((loan: LoanBook) => (
                    <tr key={loan.id}>
                      <td>
                        <span className="font-medium">#{loan.id}</span>
                      </td>
                      <td>
                        <span className="text-sm">Customer #{loan.customerId}</span>
                      </td>
                      <td>
                        <span className="text-sm font-medium">
                          ${parseFloat(loan.loanAmount).toLocaleString()}
                        </span>
                      </td>
                      <td>
                        <span className="text-sm">{loan.interestRate}%</span>
                      </td>
                      <td>
                        <span className="text-sm">{loan.term} months</span>
                      </td>
                      <td>
                        <Badge className={`status-badge ${getStatusColor(loan.status)}`}>
                          {loan.status}
                        </Badge>
                      </td>
                      <td>
                        <span className="text-sm text-muted-foreground">
                          {new Date(loan.createdAt || '').toLocaleDateString()}
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
    </div>
  );
}
