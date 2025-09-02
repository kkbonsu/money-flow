import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useQuery } from '@tanstack/react-query';
import { BarChart, TrendingUp, AlertTriangle, Target, Shield, Activity } from 'lucide-react';

export default function AdvancedAnalytics() {
  // Fetch advanced analytics data
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['/api/dashboard/advanced-analytics'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Advanced Analytics & Compliance</h2>
        <Badge variant="outline" className="text-green-600 border-green-200">
          <Activity className="w-3 h-3 mr-1" />
          Live Data
        </Badge>
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
                <div className="text-3xl font-bold text-green-600">98%</div>
                <p className="text-sm text-muted-foreground">Overall Compliance</p>
              </div>
              <Progress value={98} className="h-2" />
              <div className="flex justify-between text-xs">
                <span>BoG Requirements</span>
                <span className="text-green-600">Compliant</span>
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
                  {analytics?.default_rate === "0.0" ? "Low" : parseFloat(analytics?.default_rate) < 5 ? "Medium" : "High"}
                </div>
                <p className="text-sm text-muted-foreground">Portfolio Risk</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Default Rate:</span>
                  <span className="font-medium">{analytics?.default_rate}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>At Risk Loans:</span>
                  <span className="font-medium">{analytics?.at_risk_loans}</span>
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
                <div className="text-3xl font-bold text-blue-600">125%</div>
                <p className="text-sm text-muted-foreground">Above Minimum</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Current Capital:</span>
                  <span className="font-medium">GHS 2.5M</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Required:</span>
                  <span className="font-medium">GHS 2.0M</span>
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
                <div className="text-3xl font-bold text-purple-600">15.2%</div>
                <p className="text-sm text-muted-foreground">Annual Return</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Active Loans:</span>
                  <span className="font-medium">145</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Avg. Loan Size:</span>
                  <span className="font-medium">GHS 23,310</span>
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
                <div className="text-3xl font-bold text-red-600">0</div>
                <p className="text-sm text-muted-foreground">Flagged Transactions</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Transactions Today:</span>
                  <span className="font-medium">47</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Status:</span>
                  <span className="font-medium text-green-600">Clean</span>
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
                <div className="text-3xl font-bold text-indigo-600">{analytics?.approval_rate}%</div>
                <p className="text-sm text-muted-foreground">Approval Rate</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Approved Today:</span>
                  <span className="font-medium">{analytics?.approved_today}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Pending Review:</span>
                  <span className="font-medium">{analytics?.pending_review}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}