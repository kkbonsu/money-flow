import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';
import PaymentTable from '@/components/payments/PaymentTable';

export default function PaymentSchedulePage() {
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
          <h1 className="text-2xl font-bold text-foreground">Payment Schedule</h1>
          <p className="text-muted-foreground">Track and manage payment schedules</p>
        </div>
      </div>

      <PaymentTable />
    </div>
  );
}
