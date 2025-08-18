import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';
import CustomerTable from '@/components/customers/CustomerTable';
import CustomerPortfolioMetrics from '@/components/customers/CustomerPortfolioMetrics';
import AddCustomerModal from '@/components/customers/AddCustomerModal';

export default function Customers() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    setLocation('/login');
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Customers</h1>
          <p className="text-muted-foreground">Manage your customer database</p>
        </div>
      </div>

      <CustomerPortfolioMetrics />

      <CustomerTable onAddCustomer={() => setIsAddModalOpen(true)} />

      <AddCustomerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
}
