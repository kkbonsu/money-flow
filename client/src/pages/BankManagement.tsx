import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';
import BankManagementTable from '@/components/financial/BankManagementTable';

export default function BankManagementPage() {
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
          <h1 className="text-2xl font-bold text-foreground">Bank Management</h1>
          <p className="text-muted-foreground">Manage bank accounts and balances</p>
        </div>
      </div>

      <BankManagementTable />
    </div>
  );
}