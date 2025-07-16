import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Eye, Edit, Search, TrendingUp, TrendingDown, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Equity } from '@shared/schema';
import { ShareholderManagement } from '@/components/ShareholderManagement';

export default function EquityPage() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    setLocation('/login');
    return null;
  }

  const { data: equityRecords = [], isLoading } = useQuery({
    queryKey: ['/api/equity'],
  });

  const filteredEquity = equityRecords.filter((equity: Equity) => {
    const matchesSearch = equity.equityType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || equity.equityType === typeFilter;
    return matchesSearch && matchesType;
  });

  // Calculate total equity
  const totalEquity = equityRecords.reduce((sum: number, equity: Equity) => 
    sum + parseFloat(equity.amount), 0
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Equity Management</h1>
            <p className="text-muted-foreground">Track and manage company equity</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center h-32">
              <div className="text-muted-foreground">Loading equity records...</div>
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
          <h1 className="text-2xl font-bold text-foreground">Equity Management</h1>
          <p className="text-muted-foreground">Track and manage company equity & shareholders</p>
        </div>
      </div>

      <Tabs defaultValue="equity" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="equity">Equity Records</TabsTrigger>
          <TabsTrigger value="shareholders">Shareholders</TabsTrigger>
        </TabsList>

        <TabsContent value="equity">
          <div className="space-y-6">

      {/* Equity Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="metric-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Equity</p>
                <p className="text-2xl font-bold text-foreground">
                  ${totalEquity.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span className="text-sm text-secondary">
                <TrendingUp className="w-4 h-4 inline mr-1" />
                8.3%
              </span>
              <span className="text-sm text-muted-foreground ml-2">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="metric-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Retained Earnings</p>
                <p className="text-2xl font-bold text-foreground">
                  ${(totalEquity * 0.7).toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-secondary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="metric-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Share Capital</p>
                <p className="text-2xl font-bold text-foreground">
                  ${(totalEquity * 0.3).toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Equity Records</CardTitle>
            <Button className="btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Add Equity Entry
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search equity..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="share_capital">Share Capital</SelectItem>
                <SelectItem value="retained_earnings">Retained Earnings</SelectItem>
                <SelectItem value="capital_surplus">Capital Surplus</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Equity Type</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEquity.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-muted-foreground">
                      No equity records found
                    </td>
                  </tr>
                ) : (
                  filteredEquity.map((equity: Equity) => (
                    <tr key={equity.id}>
                      <td>
                        <span className="text-sm font-medium capitalize">
                          {equity.equityType.replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                        <span className="text-sm font-medium text-primary">
                          ${parseFloat(equity.amount).toLocaleString()}
                        </span>
                      </td>
                      <td>
                        <span className="text-sm">
                          {new Date(equity.date).toLocaleDateString()}
                        </span>
                      </td>
                      <td>
                        <span className="text-sm text-muted-foreground">
                          {equity.description || 'N/A'}
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
