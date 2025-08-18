import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';
import AssetPortfolioMetrics from '@/components/assets/AssetPortfolioMetrics';
import EnhancedAssetTable from '@/components/assets/EnhancedAssetTable';

export default function AssetsPage() {
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
          <h1 className="text-2xl font-bold text-foreground">Asset Management</h1>
          <p className="text-muted-foreground">Track and manage company assets with comprehensive portfolio insights</p>
        </div>
      </div>

      <AssetPortfolioMetrics />

      <EnhancedAssetTable onAddAsset={() => setIsAddModalOpen(true)} />
    </div>
  );
}
