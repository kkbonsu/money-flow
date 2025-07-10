import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';
import InventoryTable from '@/components/assets/InventoryTable';

export default function InventoryPage() {
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
          <h1 className="text-2xl font-bold text-foreground">Inventory</h1>
          <p className="text-muted-foreground">Manage inventory items and stock levels</p>
        </div>
      </div>

      <InventoryTable />
    </div>
  );
}