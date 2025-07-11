import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';
import { BookOpen, Users, Clock, DollarSign } from 'lucide-react';
import MetricCard from '@/components/dashboard/MetricCard';
import ChartCard from '@/components/dashboard/ChartCard';
import LoanPortfolioChart from '@/components/dashboard/LoanPortfolioChart';
import PaymentStatusCard from '@/components/dashboard/PaymentStatusCard';
import RecentLoansTable from '@/components/dashboard/RecentLoansTable';
import { DashboardMetrics } from '@/types';

export default function Dashboard() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    setLocation('/login');
    return null;
  }

  const { data: metrics, isLoading } = useQuery<DashboardMetrics>({
    queryKey: ['/api/dashboard/metrics'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-card rounded-lg border p-6 animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-muted rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Loans"
          value={metrics?.totalLoans || '$0'}
          icon={BookOpen}
          trend={{
            value: metrics?.loanGrowth || 0,
            label: 'from last month',
          }}
        />
        <MetricCard
          title="Active Customers"
          value={metrics?.activeCustomers?.toString() || '0'}
          icon={Users}
          trend={{
            value: metrics?.customerGrowth || 0,
            label: 'from last month',
          }}
        />
        <MetricCard
          title="Pending Payments"
          value={metrics?.pendingPayments || '$0'}
          icon={Clock}
          trend={{
            value: metrics?.paymentGrowth || 0,
            label: 'from last month',
          }}
        />
        <MetricCard
          title="Monthly Income"
          value={metrics?.monthlyIncome || '$0'}
          icon={DollarSign}
          trend={{
            value: metrics?.revenueGrowth || 0,
            label: 'from last month',
          }}
        />
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LoanPortfolioChart />
        <PaymentStatusCard />
      </div>

      {/* Recent Activities */}
      <div className="w-full">
        <RecentLoansTable />
      </div>
    </div>
  );
}
