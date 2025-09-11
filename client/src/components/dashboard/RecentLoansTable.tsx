import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useQuery } from '@tanstack/react-query';
import { useTenantContext } from '@/contexts/TenantContext';
import { useLocation } from 'wouter';
import { apiClient } from '@/lib/api';
import { LoanBook, Customer } from '@shared/schema';
import { Building2, AlertCircle } from 'lucide-react';

export default function RecentLoansTable() {
  const [, setLocation] = useLocation();
  const { currentTenant, tenantName, isLoading: tenantLoading } = useTenantContext();
  
  const { data: loans = [], isLoading: loansLoading, error: loansError } = useQuery({
    queryKey: ['/api/loans'],
    select: (data: LoanBook[]) => {
      // Sort by creation date (newest first) and get latest 7
      return data
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
        .slice(0, 7);
    },
    enabled: !!currentTenant, // Only fetch when tenant is loaded
  });

  const { data: customers = [], isLoading: customersLoading, error: customersError } = useQuery<Customer[]>({
    queryKey: ['/api/customers'],
    enabled: !!currentTenant, // Only fetch when tenant is loaded
  });

  const isLoading = tenantLoading || loansLoading || customersLoading;
  const hasError = loansError || customersError;

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

  if (hasError) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Recent Loan Applications
            </CardTitle>
            {currentTenant && (
              <Badge variant="outline" className="text-xs">
                {tenantName}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load loan data: {(loansError || customersError)?.message}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Recent Loan Applications
            </CardTitle>
            {currentTenant && (
              <Badge variant="outline" className="text-xs">
                {tenantName}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="text-muted-foreground">Loading tenant-specific loan data...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="card-recent-loans">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Recent Loan Applications
          </CardTitle>
          <div className="flex items-center space-x-2">
            {currentTenant && (
              <Badge variant="outline" className="text-xs">
                {tenantName}
              </Badge>
            )}
            <Button variant="ghost" size="sm" onClick={() => setLocation('/loan-book')} data-testid="button-view-all-loans">
              View All
            </Button>
          </div>
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
              </tr>
            </thead>
            <tbody>
              {loans.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-muted-foreground">
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
