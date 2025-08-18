import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';
import IncomePortfolioMetrics from '@/components/income/IncomePortfolioMetrics';
import EnhancedIncomeTable from '@/components/income/EnhancedIncomeTable';
import AddIncomeModal from '@/components/financial/AddIncomeModal';

export default function Income() {
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
          <h1 className="text-2xl font-bold text-foreground">Income Management</h1>
          <p className="text-muted-foreground">Track revenue from loans, fees, and other sources</p>
        </div>
      </div>

      <IncomePortfolioMetrics />

      <EnhancedIncomeTable onAddIncome={() => setIsAddModalOpen(true)} />

      <AddIncomeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
}
