import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';
import StaffTable from '@/components/staff/StaffTable';

export default function StaffPage() {
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
          <h1 className="text-2xl font-bold text-foreground">Staff Management</h1>
          <p className="text-muted-foreground">Manage your team members</p>
        </div>
      </div>

      <StaffTable />
    </div>
  );
}