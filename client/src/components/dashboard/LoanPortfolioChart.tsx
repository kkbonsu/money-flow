import { useQuery } from '@tanstack/react-query';
import { useTenantContext } from '@/contexts/TenantContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingUp, Building2, AlertCircle } from 'lucide-react';

interface LoanPortfolioData {
  month: string;
  totalLoans: number;
  loanCount: number;
}

export default function LoanPortfolioChart() {
  const { currentTenant, tenantName, isLoading: tenantLoading } = useTenantContext();
  
  const { data: portfolioData, isLoading: dataLoading, error } = useQuery<LoanPortfolioData[]>({
    queryKey: ['tenant', currentTenant?.slug || 'default', '/api/dashboard/loan-portfolio'],
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!currentTenant, // Only fetch when tenant is loaded
  });
  
  const isLoading = tenantLoading || dataLoading;

  // Error state
  if (error) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <Building2 className="w-5 h-5" />
              Loan Portfolio Overview
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
              Failed to load portfolio data: {error.message}
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
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <Building2 className="w-5 h-5" />
              Loan Portfolio Overview
            </CardTitle>
            {currentTenant && (
              <Badge variant="outline" className="text-xs">
                {tenantName}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-80 bg-muted rounded animate-pulse"></div>
        </CardContent>
      </Card>
    );
  }

  // Format data for display
  const formattedData = portfolioData?.map(item => ({
    ...item,
    totalLoans: item.totalLoans / 1000, // Convert to thousands for better display
  })) || [];

  return (
    <Card data-testid="card-loan-portfolio-chart">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Building2 className="w-5 h-5" />
            Loan Portfolio Overview
          </CardTitle>
          <div className="flex items-center space-x-2">
            {currentTenant && (
              <Badge variant="outline" className="text-xs">
                {tenantName}
              </Badge>
            )}
            <TrendingUp className="w-4 h-4 text-green-600" />
            <Button variant="outline" size="sm">2025</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={formattedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="month" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value}K`}
              />
              <Tooltip 
                formatter={(value: number) => [`$${(value * 1000).toLocaleString()}`, 'Total Loans']}
                labelFormatter={(label) => `Month: ${label}`}
              />
              <Line 
                type="monotone" 
                dataKey="totalLoans" 
                stroke="#8884d8" 
                strokeWidth={2}
                dot={{ fill: '#8884d8' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}