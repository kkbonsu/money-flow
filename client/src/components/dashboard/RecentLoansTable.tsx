import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Check } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { LoanBook, Customer } from '@shared/schema';

export default function RecentLoansTable() {
  const { data: loans = [], isLoading: loansLoading } = useQuery({
    queryKey: ['/api/loans'],
    select: (data: LoanBook[]) => {
      // Sort by creation date (newest first) and get latest 7
      return data
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
        .slice(0, 7);
    },
  });

  const { data: customers = [], isLoading: customersLoading } = useQuery({
    queryKey: ['/api/customers'],
  });

  const isLoading = loansLoading || customersLoading;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-secondary/10 text-secondary';
      case 'pending':
        return 'bg-accent/10 text-accent';
      case 'rejected':
        return 'bg-destructive/10 text-destructive';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Loan Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Recent Loan Applications</CardTitle>
          <Button variant="ghost" size="sm">
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loans.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-muted-foreground">
                    No recent loan applications found
                  </td>
                </tr>
              ) : (
                loans.map((loan) => {
                  const customer = customers.find((c: Customer) => c.id === loan.customerId);
                  const customerName = customer ? `${customer.firstName} ${customer.lastName}` : `Customer #${loan.customerId}`;
                  const customerInitials = customer ? `${customer.firstName.charAt(0)}${customer.lastName.charAt(0)}` : 'U';
                  
                  return (
                    <tr key={loan.id}>
                      <td>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium">
                              {customerInitials}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium">{customerName}</p>
                            <p className="text-xs text-muted-foreground">Loan ID: {loan.id}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="text-sm font-medium">
                          ${parseFloat(loan.loanAmount).toLocaleString()}
                        </span>
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
                            <Check className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
