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
            <p className="text-muted-foreground">Advanced analytics and regulatory reporting</p>
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
          <p className="text-muted-foreground">Advanced analytics and regulatory reporting</p>
        </div>
      </div>

      <Tabs defaultValue="reports" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="reports">BoG Reports</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
          <TabsTrigger value="risk">Risk Assessment</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
        </TabsList>

        {/* Tab 1: BoG Reports - Automated BoG regulatory reports generation */}
        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Automated BoG Regulatory Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <FileText className="w-8 h-8 text-primary" />
                      <div>
                        <h3 className="font-semibold">Monthly Portfolio Report</h3>
                        <p className="text-sm text-muted-foreground">Loan portfolio summary for BoG</p>
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
                        <h3 className="font-semibold">Capital Adequacy Report</h3>
                        <p className="text-sm text-muted-foreground">Capital compliance reporting</p>
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
                        <h3 className="font-semibold">AML Suspicious Activity</h3>
                        <p className="text-sm text-muted-foreground">Suspicious transaction reports</p>
                      </div>
                    </div>
                    <Button className="w-full btn-accent">
                      Generate Report
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <FileText className="w-8 h-8 text-green-600" />
                      <div>
                        <h3 className="font-semibold">GIPC Foreign Investment</h3>
                        <p className="text-sm text-muted-foreground">Foreign shareholder reporting</p>
                      </div>
                    </div>
                    <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                      Generate Report
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* Generated Reports Table */}
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
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-medium">Title</th>
                      <th className="text-left p-4 font-medium">Type</th>
                      <th className="text-left p-4 font-medium">Date Created</th>
                      <th className="text-left p-4 font-medium">Status</th>
                      <th className="text-left p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReports.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center p-8 text-muted-foreground">
                          No reports found
                        </td>
                      </tr>
                    ) : (
                      filteredReports.map((report: Report) => (
                        <tr key={report.id} className="border-b hover:bg-muted/50">
                          <td className="p-4 font-medium">{report.title}</td>
                          <td className="p-4 capitalize">{report.reportType}</td>
                          <td className="p-4">{new Date(report.createdAt).toLocaleDateString()}</td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              report.status === 'completed' ? 'bg-green-100 text-green-800' :
                              report.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {report.status}
                            </span>
                          </td>
                          <td className="p-4 space-x-2">
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4 mr-2" />
                              View
                            </Button>
                            <Button size="sm" variant="outline">
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Compliance Monitoring - Automated compliance monitoring alerts */}
        <TabsContent value="compliance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Automated Compliance Monitoring
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <AlertTriangle className="w-8 h-8 text-yellow-600" />
                      <div>
                        <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">Capital Adequacy Alert</h3>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300">Monitor GHS 2M minimum capital</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Current Capital:</span>
                        <span className="font-medium">GHS 2,500,000</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Minimum Required:</span>
                        <span className="font-medium">GHS 2,000,000</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Compliance Status:</span>
                        <span className="font-medium text-green-600">Compliant</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <Shield className="w-8 h-8 text-blue-600" />
                      <div>
                        <h3 className="font-semibold text-blue-800 dark:text-blue-200">AML Compliance</h3>
                        <p className="text-sm text-blue-700 dark:text-blue-300">Anti-money laundering monitoring</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Flagged Transactions:</span>
                        <span className="font-medium">0</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Pending Reviews:</span>
                        <span className="font-medium">0</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Compliance Status:</span>
                        <span className="font-medium text-green-600">Compliant</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-purple-200 bg-purple-50 dark:bg-purple-900/20">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <FileText className="w-8 h-8 text-purple-600" />
                      <div>
                        <h3 className="font-semibold text-purple-800 dark:text-purple-200">Reporting Deadlines</h3>
                        <p className="text-sm text-purple-700 dark:text-purple-300">Upcoming regulatory deadlines</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Monthly Portfolio Report:</span>
                        <span className="font-medium">Due in 5 days</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Capital Adequacy Report:</span>
                        <span className="font-medium">Due in 12 days</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Status:</span>
                        <span className="font-medium text-yellow-600">Pending</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-green-200 bg-green-50 dark:bg-green-900/20">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <Target className="w-8 h-8 text-green-600" />
                      <div>
                        <h3 className="font-semibold text-green-800 dark:text-green-200">License Compliance</h3>
                        <p className="text-sm text-green-700 dark:text-green-300">Tier 3 MFI license status</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>License Status:</span>
                        <span className="font-medium text-green-600">Active</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Renewal Date:</span>
                        <span className="font-medium">Dec 31, 2025</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Days Remaining:</span>
                        <span className="font-medium">166 days</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Portfolio Performance - Portfolio performance analytics */}
        <TabsContent value="portfolio" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart className="h-5 w-5" />
                Portfolio Performance Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <BarChart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">Portfolio Analytics Coming Soon</h3>
                <p className="text-muted-foreground">
                  Advanced portfolio performance analytics and insights will be available here
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Risk Assessment - Risk assessment algorithms for loan default prediction */}
        <TabsContent value="risk" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Risk Assessment Algorithms
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <TrendingUp className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">Risk Assessment Coming Soon</h3>
                <p className="text-muted-foreground">
                  Advanced risk assessment algorithms for loan default prediction will be available here
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 5: Compliance Monitoring - Automated compliance monitoring alerts */}
        <TabsContent value="monitoring" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Automated Compliance Monitoring
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">Compliance Monitoring Coming Soon</h3>
                <p className="text-muted-foreground">
                  Automated compliance monitoring and alert systems will be available here
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}