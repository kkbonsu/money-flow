import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';
import LoanTable from '@/components/loans/LoanTable';
import LoanPortfolioMetrics from '@/components/loans/LoanPortfolioMetrics';

export default function LoanBookPage() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    setLocation('/login');
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Loan Book</h1>
          <p className="text-muted-foreground">Manage loan applications and portfolio health metrics</p>
        </div>
      </div>

      <LoanPortfolioMetrics />
      <LoanTable />
    </div>
  );
}