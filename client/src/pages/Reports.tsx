import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Download, Plus, Eye, Search, BarChart, TrendingUp, AlertTriangle, Target, Shield } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Report } from '@shared/schema';

export default function ReportsPage() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    setLocation('/login');
    return null;
  }

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['/api/reports'],
  });

  const filteredReports = reports.filter((report: Report) => {
    const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || report.reportType === typeFilter;
    return matchesSearch && matchesType;
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Financial Reports</h1>
            <p className="text-muted-foreground">Generate and view financial reports</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center h-32">
              <div className="text-muted-foreground">Loading reports...</div>
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
          <h1 className="text-2xl font-bold text-foreground">Financial Reports</h1>
          <p className="text-muted-foreground">Generate and view financial reports</p>
        </div>
      </div>

      {/* Quick Report Generation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <FileText className="w-8 h-8 text-primary" />
              <div>
                <h3 className="font-semibold">Income Statement</h3>
                <p className="text-sm text-muted-foreground">Profit & Loss report</p>
              </div>
            </div>
            <Button className="w-full btn-primary">
              Generate Report
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <FileText className="w-8 h-8 text-secondary" />
              <div>
                <h3 className="font-semibold">Balance Sheet</h3>
                <p className="text-sm text-muted-foreground">Assets & Liabilities</p>
              </div>
            </div>
            <Button className="w-full btn-secondary">
              Generate Report
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <FileText className="w-8 h-8 text-accent" />
              <div>
                <h3 className="font-semibold">Cash Flow</h3>
                <p className="text-sm text-muted-foreground">Cash movements</p>
              </div>
            </div>
            <Button className="w-full btn-accent">
              Generate Report
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Generated Reports</CardTitle>
            <Button className="btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Custom Report
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search reports..."
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
                <SelectItem value="financial">Financial</SelectItem>
                <SelectItem value="loan">Loan</SelectItem>
                <SelectItem value="customer">Customer</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Report Title</th>
                  <th>Type</th>
                  <th>Generated By</th>
                  <th>Created Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-muted-foreground">
                      No reports found
                    </td>
                  </tr>
                ) : (
                  filteredReports.map((report: Report) => (
                    <tr key={report.id}>
                      <td>
                        <span className="text-sm font-medium">{report.title}</span>
                      </td>
                      <td>
                        <span className="text-sm capitalize">{report.reportType}</span>
                      </td>
                      <td>
                        <span className="text-sm">User #{report.generatedBy}</span>
                      </td>
                      <td>
                        <span className="text-sm text-muted-foreground">
                          {new Date(report.createdAt || '').toLocaleDateString()}
                        </span>
                      </td>
                      <td>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Download className="w-4 h-4" />
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
