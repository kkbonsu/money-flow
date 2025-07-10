import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Eye, Edit, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { BankManagement } from '@shared/schema';

export default function BankManagementPage() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    setLocation('/login');
    return null;
  }

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['/api/bank-accounts'],
  });

  const filteredAccounts = accounts.filter((account: BankManagement) => {
    return account.bankName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           account.accountNumber.includes(searchTerm);
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Bank Management</h1>
            <p className="text-muted-foreground">Manage bank accounts and balances</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center h-32">
              <div className="text-muted-foreground">Loading bank accounts...</div>
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
          <h1 className="text-2xl font-bold text-foreground">Bank Management</h1>
          <p className="text-muted-foreground">Manage bank accounts and balances</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Bank Accounts</CardTitle>
            <Button className="btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Add Account
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search accounts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 pl-10"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Bank Name</th>
                  <th>Account Number</th>
                  <th>Account Type</th>
                  <th>Balance</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAccounts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-muted-foreground">
                      No bank accounts found
                    </td>
                  </tr>
                ) : (
                  filteredAccounts.map((account: BankManagement) => (
                    <tr key={account.id}>
                      <td>
                        <span className="text-sm font-medium">{account.bankName}</span>
                      </td>
                      <td>
                        <span className="text-sm font-mono">{account.accountNumber}</span>
                      </td>
                      <td>
                        <span className="text-sm capitalize">{account.accountType}</span>
                      </td>
                      <td>
                        <span className="text-sm font-medium">
                          ${parseFloat(account.balance).toLocaleString()}
                        </span>
                      </td>
                      <td>
                        <Badge className={`status-badge ${getStatusColor(account.status)}`}>
                          {account.status}
                        </Badge>
                      </td>
                      <td>
                        <span className="text-sm text-muted-foreground">
                          {new Date(account.createdAt || '').toLocaleDateString()}
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
