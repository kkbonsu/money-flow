import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Building2, 
  Users, 
  DollarSign, 
  Calendar, 
  MapPin, 
  Phone, 
  Mail,
  Shield,
  FileText,
  TrendingUp
} from 'lucide-react';
import { format } from 'date-fns';

interface TenantDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId: string | null;
}

export function TenantDetailsModal({ open, onOpenChange, tenantId }: TenantDetailsModalProps) {
  const { data: tenant, isLoading } = useQuery({
    queryKey: ['/api/admin/tenants', tenantId],
    enabled: !!tenantId && open,
  });

  const { data: mfiRegistration } = useQuery({
    queryKey: ['/api/mfi-registration', tenantId],
    enabled: !!tenantId && open,
  });

  const { data: shareholders } = useQuery({
    queryKey: ['/api/admin/shareholders', tenantId],
    enabled: !!tenantId && open,
  });

  const { data: equity } = useQuery({
    queryKey: ['/api/admin/equity', tenantId],
    enabled: !!tenantId && open,
  });

  const { data: users } = useQuery({
    queryKey: ['/api/admin/tenant-users', tenantId],
    enabled: !!tenantId && open,
  });

  if (!tenantId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Tenant Details
          </DialogTitle>
          <DialogDescription>
            Comprehensive information about the tenant organization
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-pulse">Loading tenant details...</div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Organization Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Name</label>
                  <p className="text-lg font-semibold">{tenant?.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Slug</label>
                  <p className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm">
                    {tenant?.slug}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <Badge variant={tenant?.status === 'active' ? "default" : "secondary"}>
                    {tenant?.status}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Plan</label>
                  <Badge variant="outline">{tenant?.plan}</Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Created</label>
                  <p>{tenant?.createdAt ? format(new Date(tenant.createdAt), 'MMM dd, yyyy HH:mm') : 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Last Updated</label>
                  <p>{tenant?.updatedAt ? format(new Date(tenant.updatedAt), 'MMM dd, yyyy HH:mm') : 'N/A'}</p>
                </div>
              </CardContent>
            </Card>

            {/* MFI Registration */}
            {mfiRegistration && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    MFI Registration
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Company Name</label>
                    <p>{mfiRegistration.companyName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Registration Number</label>
                    <p className="font-mono">{mfiRegistration.registrationNumber}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">License Number</label>
                    <p className="font-mono">{mfiRegistration.licenseNumber}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">License Expiry</label>
                    <p>{mfiRegistration.licenseExpiryDate ? format(new Date(mfiRegistration.licenseExpiryDate), 'MMM dd, yyyy') : 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Regulatory Body</label>
                    <p>{mfiRegistration.regulatoryBody}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Business Type</label>
                    <p>{mfiRegistration.businessType}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-gray-500">Address</label>
                    <p className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-1 text-gray-400" />
                      {mfiRegistration.address}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Phone</label>
                    <p className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      {mfiRegistration.phone}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Shareholders */}
            {shareholders && shareholders.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Shareholders ({shareholders.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {shareholders.map((shareholder: any, index: number) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div>
                          <p className="font-medium">{shareholder.name}</p>
                          <p className="text-sm text-gray-500">{shareholder.nationality || 'N/A'}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{shareholder.shares.toLocaleString()} shares</p>
                          <p className="text-sm text-gray-500">{shareholder.shareType}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      Total Shares: {shareholders.reduce((sum: number, s: any) => sum + s.shares, 0).toLocaleString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Equity Structure */}
            {equity && equity.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Equity Structure
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {equity.map((equityItem: any, index: number) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div>
                          <p className="font-medium">{equityItem.accountName}</p>
                          {equityItem.description && (
                            <p className="text-sm text-gray-500">{equityItem.description}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-medium">GHS {parseFloat(equityItem.amount).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">
                      Total Equity: GHS {equity.reduce((sum: number, e: any) => sum + parseFloat(e.amount), 0).toLocaleString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* User Summary */}
            {users && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Users Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-2xl font-bold">{users.length}</p>
                      <p className="text-sm text-gray-500">Total Users</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-2xl font-bold">
                        {users.filter((u: any) => u.role === 'admin').length}
                      </p>
                      <p className="text-sm text-gray-500">Admins</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-2xl font-bold">
                        {users.filter((u: any) => u.isActive).length}
                      </p>
                      <p className="text-sm text-gray-500">Active</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Features */}
            {tenant?.branding?.features && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Enabled Features
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {tenant.branding.features.map((feature: string) => (
                      <Badge key={feature} variant="outline">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}