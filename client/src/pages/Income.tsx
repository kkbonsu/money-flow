import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';
import IncomeTable from '@/components/financial/IncomeTableNew';

export default function Income() {
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
          <h1 className="text-2xl font-bold text-foreground">Income Management</h1>
          <p className="text-muted-foreground">Track and manage income sources</p>
        </div>
      </div>

      <IncomeTable />
    </div>
  );
}
