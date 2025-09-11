import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useQuery } from '@tanstack/react-query';
import { useTenantContext } from '@/contexts/TenantContext';
import { BarChart, TrendingUp, AlertTriangle, Target, Shield, Activity, Building2, AlertCircle } from 'lucide-react';

interface AdvancedAnalyticsData {
  // Basic metrics
  default_rate?: string;
  at_risk_loans?: number;
  approval_rate?: number;
  approved_today?: number;
  pending_review?: number;
  total_customers?: number;
  total_loans?: number;
  avg_loan_amount?: number;
  total_collected?: number;
  
  // Compliance metrics
  compliance_score?: number;
  compliance_status?: string;
  
  // Capital adequacy
  capital_adequacy_ratio?: number;
  current_capital?: number;
  required_capital?: number;
  capital_status?: string;
  
  // Portfolio performance
  portfolio_return?: string;
  portfolio_value?: number;
  portfolio_status?: string;
  
  // AML monitoring
  flagged_transactions?: number;
  transactions_today?: number;
  aml_status?: string;
}

export default function AdvancedAnalytics() {
  const { currentTenant, tenantName, isLoading: tenantLoading } = useTenantContext();
  
  // Fetch advanced analytics data with proper tenant isolation
  const { data: analytics, isLoading: dataLoading, error } = useQuery<AdvancedAnalyticsData>({
    queryKey: ['tenant', currentTenant?.slug || 'default', '/api/dashboard/advanced-analytics'],
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!currentTenant, // Only fetch when tenant is loaded
  });
  
  const isLoading = tenantLoading || dataLoading;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="pulse-animation">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded-lg w-3/4 mb-2"></div>
              <div className="h-8 bg-muted rounded-lg w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Advanced Analytics & Compliance</h2>
          {currentTenant && (
            <Badge variant="outline">
              <Building2 className="w-3 h-3 mr-1" />
              {tenantName}
            </Badge>
          )}
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load analytics data: {error.message}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="section-advanced-analytics">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Advanced Analytics & Compliance</h2>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-green-600 border-green-200">
            <Activity className="w-3 h-3 mr-1" />
            Live Data
          </Badge>
          {currentTenant && (
            <Badge variant="secondary">
              <Building2 className="w-3 h-3 mr-1" />
              {tenantName}
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Compliance Metrics */}
        <Card className="border-green-200 bg-green-50 dark:bg-green-900/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
              <Shield className="h-5 w-5" />
              Compliance Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {isLoading ? '---' : `${analytics?.compliance_score || 0}%`}
                </div>
                <p className="text-sm text-muted-foreground">Overall Compliance</p>
              </div>
              <Progress value={isLoading ? 0 : (analytics?.compliance_score || 0)} className="h-2" />
              <div className="flex justify-between text-xs">
                <span>BoG Requirements</span>
                <span className={`font-medium ${
                  (analytics?.compliance_score || 0) >= 95 ? 'text-green-600' : 
                  (analytics?.compliance_score || 0) >= 85 ? 'text-yellow-600' : 'text-red-600'
                }`}>{isLoading ? '---' : analytics?.compliance_status || 'Unknown'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Risk Assessment */}
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-900/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
              <AlertTriangle className="h-5 w-5" />
              Risk Assessment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600">
                  {isLoading ? '---' : analytics?.default_rate === "0.0" ? "Low" : parseFloat(analytics?.default_rate || "0") < 5 ? "Medium" : "High"}
                </div>
                <p className="text-sm text-muted-foreground">Portfolio Risk</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Default Rate:</span>
                  <span className="font-medium">{isLoading ? '---' : analytics?.default_rate}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>At Risk Loans:</span>
                  <span className="font-medium">{isLoading ? '---' : analytics?.at_risk_loans || '0'}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Capital Adequacy */}
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
              <Target className="h-5 w-5" />
              Capital Adequacy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {isLoading ? '---' : `${analytics?.capital_adequacy_ratio || 0}%`}
                </div>
                <p className="text-sm text-muted-foreground">{isLoading ? 'Loading...' : analytics?.capital_status || 'Unknown'}</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Current Capital:</span>
                  <span className="font-medium">{isLoading ? '---' : `GHS ${((analytics?.current_capital || 0) / 1000000).toFixed(1)}M`}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Required:</span>
                  <span className="font-medium">{isLoading ? '---' : `GHS ${((analytics?.required_capital || 0) / 1000000).toFixed(1)}M`}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Portfolio Performance */}
        <Card className="border-purple-200 bg-purple-50 dark:bg-purple-900/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-purple-800 dark:text-purple-200">
              <BarChart className="h-5 w-5" />
              Portfolio Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">
                  {isLoading ? '---' : `${analytics?.portfolio_return || '0.0'}%`}
                </div>
                <p className="text-sm text-muted-foreground">{isLoading ? 'Loading...' : analytics?.portfolio_status || 'Annual Return'}</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Active Loans:</span>
                  <span className="font-medium">{isLoading ? '---' : analytics?.total_loans || '0'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Avg. Loan Size:</span>
                  <span className="font-medium">{isLoading ? '---' : `GHS ${(analytics?.avg_loan_amount || 0).toLocaleString()}`}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AML Monitoring */}
        <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-red-800 dark:text-red-200">
              <AlertTriangle className="h-5 w-5" />
              AML Monitoring
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600">
                  {isLoading ? '---' : analytics?.flagged_transactions || 0}
                </div>
                <p className="text-sm text-muted-foreground">Flagged Transactions</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Transactions Today:</span>
                  <span className="font-medium">{isLoading ? '---' : analytics?.transactions_today || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Status:</span>
                  <span className={`font-medium ${
                    analytics?.aml_status === 'Clean' ? 'text-green-600' :
                    analytics?.aml_status === 'Monitoring' ? 'text-yellow-600' : 'text-red-600'
                  }`}>{isLoading ? '---' : analytics?.aml_status || 'Unknown'}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loan Approval Rate */}
        <Card className="border-indigo-200 bg-indigo-50 dark:bg-indigo-900/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-indigo-800 dark:text-indigo-200">
              <TrendingUp className="h-5 w-5" />
              Approval Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-indigo-600">
                  {isLoading ? '---' : `${analytics?.approval_rate || 0}%`}
                </div>
                <p className="text-sm text-muted-foreground">Approval Rate</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Approved Today:</span>
                  <span className="font-medium">{isLoading ? '---' : analytics?.approved_today || '0'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Pending Review:</span>
                  <span className="font-medium">{isLoading ? '---' : analytics?.pending_review || '0'}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}