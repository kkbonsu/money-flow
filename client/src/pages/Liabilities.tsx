import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';
import LiabilityPortfolioMetrics from '@/components/liabilities/LiabilityPortfolioMetrics';
import EnhancedLiabilityTable from '@/components/liabilities/EnhancedLiabilityTable';

export default function LiabilitiesPage() {
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
          <h1 className="text-2xl font-bold text-foreground">Liability Management</h1>
          <p className="text-muted-foreground">Track and manage company liabilities with detailed portfolio analysis</p>
        </div>
      </div>

      <LiabilityPortfolioMetrics />

      <EnhancedLiabilityTable onAddLiability={() => setIsAddModalOpen(true)} />
    </div>
  );
}
