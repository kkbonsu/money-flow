import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { 
  Settings, 
  Palette, 
  Shield, 
  CreditCard, 
  Save, 
  AlertTriangle 
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface TenantSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId: string | null;
}

interface TenantSettings {
  name: string;
  slug: string;
  isActive: boolean;
  plan: string;
  branding: {
    primaryColor: string;
    description: string;
    features: string[];
  };
  settings: {
    theme: string;
    timezone: string;
    currency: string;
    language: string;
    emailNotifications: boolean;
    smsNotifications: boolean;
    twoFactorRequired: boolean;
  };
}

// Real application features that correspond to actual Money Flow functionality
const availableFeatures = [
  'Loan Management',
  'Payment Schedules',
  'Customer Portal',
  'Financial Analytics',
  'Financial Reporting',
  'Staff Management',
  'Inventory Management',
  'Asset Tracking',
  'BoG Regulatory Reports',
  'LIORA AI Assistant',
  'Loan Simulator',
  'Bank Integration',
  'Multi-Currency Support',
  'Audit Logging'
];

const subscriptionPlans = [
  { value: 'basic', label: 'Basic Plan' },
  { value: 'standard', label: 'Standard Plan' },
  { value: 'premium', label: 'Premium Plan' },
  { value: 'enterprise', label: 'Enterprise Plan' }
];

export function TenantSettingsModal({ open, onOpenChange, tenantId }: TenantSettingsModalProps) {
  const [settings, setSettings] = useState<TenantSettings>({
    name: '',
    slug: '',
    isActive: true,
    plan: 'basic',
    branding: {
      primaryColor: '#2563eb',
      description: '',
      features: []
    },
    settings: {
      theme: 'light',
      timezone: 'UTC',
      currency: 'GHS',
      language: 'en',
      emailNotifications: true,
      smsNotifications: false,
      twoFactorRequired: false
    }
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tenant, isLoading } = useQuery({
    queryKey: ['/api/admin/tenants', tenantId],
    enabled: !!tenantId && open,
  });

  const updateTenantMutation = useMutation({
    mutationFn: async (updatedSettings: Partial<TenantSettings>) => {
      return await apiRequest('PATCH', `/api/admin/tenants/${tenantId}`, updatedSettings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tenants'] });
      toast({
        title: "Success",
        description: "Tenant settings updated successfully",
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update settings",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (tenant) {
      // Parse settings from JSONB field in simpleTenants
      const tenantSettings = tenant.settings || {};
      
      setSettings({
        name: tenant.name || '',
        slug: tenant.slug || '',
        isActive: tenantSettings.isActive !== false,
        plan: tenantSettings.plan || 'basic',
        branding: {
          primaryColor: tenantSettings.branding?.primaryColor || '#2563eb',
          description: tenantSettings.branding?.description || '',
          features: tenantSettings.branding?.features || []
        },
        settings: {
          theme: tenantSettings.preferences?.theme || 'light',
          timezone: tenantSettings.preferences?.timezone || 'UTC',
          currency: tenantSettings.preferences?.currency || 'GHS',
          language: tenantSettings.preferences?.language || 'en',
          emailNotifications: tenantSettings.preferences?.emailNotifications !== false,
          smsNotifications: tenantSettings.preferences?.smsNotifications === true,
          twoFactorRequired: tenantSettings.preferences?.twoFactorRequired === true
        }
      });
    }
  }, [tenant]);

  const handleSave = () => {
    // Transform settings back to the server format - simpleTenants only has id, name, slug, settings
    const updateData = {
      name: settings.name,
      slug: settings.slug,
      settings: {
        isActive: settings.isActive,
        plan: settings.plan,
        branding: settings.branding,
        preferences: settings.settings
      }
    };
    updateTenantMutation.mutate(updateData);
  };

  const toggleFeature = (featureId: string) => {
    setSettings(prev => ({
      ...prev,
      branding: {
        ...prev.branding,
        features: prev.branding.features.includes(featureId)
          ? prev.branding.features.filter(f => f !== featureId)
          : [...prev.branding.features, featureId]
      }
    }));
  };

  const updateSetting = (category: keyof TenantSettings, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: typeof prev[category] === 'object' 
        ? { ...prev[category], [key]: value }
        : value
    }));
  };

  if (!tenantId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Tenant Settings
          </DialogTitle>
          <DialogDescription>
            Configure tenant settings, branding, and subscription details
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-pulse">Loading tenant settings...</div>
          </div>
        ) : (
          <Tabs defaultValue="general" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="branding">Branding</TabsTrigger>
              <TabsTrigger value="features">Features</TabsTrigger>
              <TabsTrigger value="subscription">Subscription</TabsTrigger>
            </TabsList>

            {/* General Settings */}
            <TabsContent value="general" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Organization Name</Label>
                      <Input
                        id="name"
                        value={settings.name}
                        onChange={(e) => updateSetting('name', '', e.target.value)}
                        placeholder="Organization Name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="slug">Slug</Label>
                      <Input
                        id="slug"
                        value={settings.slug}
                        onChange={(e) => updateSetting('slug', '', e.target.value)}
                        placeholder="organization-slug"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={settings.branding.description}
                      onChange={(e) => updateSetting('branding', 'description', e.target.value)}
                      placeholder="Brief description of the organization"
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isActive"
                      checked={settings.isActive}
                      onCheckedChange={(checked) => updateSetting('isActive', '', checked)}
                    />
                    <Label htmlFor="isActive">Active Tenant</Label>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Preferences</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="theme">Theme</Label>
                      <Select 
                        value={settings.settings.theme} 
                        onValueChange={(value) => updateSetting('settings', 'theme', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">Light</SelectItem>
                          <SelectItem value="dark">Dark</SelectItem>
                          <SelectItem value="system">System</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="currency">Currency</Label>
                      <Select 
                        value={settings.settings.currency} 
                        onValueChange={(value) => updateSetting('settings', 'currency', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GHS">GHS (Ghana Cedi)</SelectItem>
                          <SelectItem value="USD">USD (US Dollar)</SelectItem>
                          <SelectItem value="EUR">EUR (Euro)</SelectItem>
                          <SelectItem value="GBP">GBP (British Pound)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="timezone">Timezone</Label>
                      <Select 
                        value={settings.settings.timezone} 
                        onValueChange={(value) => updateSetting('settings', 'timezone', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UTC">UTC</SelectItem>
                          <SelectItem value="Africa/Accra">Africa/Accra</SelectItem>
                          <SelectItem value="America/New_York">America/New_York</SelectItem>
                          <SelectItem value="Europe/London">Europe/London</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="language">Language</Label>
                      <Select 
                        value={settings.settings.language} 
                        onValueChange={(value) => updateSetting('settings', 'language', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="fr">French</SelectItem>
                          <SelectItem value="es">Spanish</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Branding Settings */}
            <TabsContent value="branding" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Brand Customization
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="primaryColor">Primary Color</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        className="w-12 h-10 p-1 border rounded"
                        value={settings.branding.primaryColor}
                        onChange={(e) => updateSetting('branding', 'primaryColor', e.target.value)}
                      />
                      <Input
                        placeholder="#2563eb"
                        value={settings.branding.primaryColor}
                        onChange={(e) => updateSetting('branding', 'primaryColor', e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded-lg" style={{ borderColor: settings.branding.primaryColor }}>
                    <h4 className="font-medium mb-2">Brand Preview</h4>
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-8 h-8 rounded-full"
                        style={{ backgroundColor: settings.branding.primaryColor }}
                      />
                      <div>
                        <p className="font-medium">{settings.name || 'Organization Name'}</p>
                        <p className="text-sm text-gray-600">{settings.branding.description || 'Organization description'}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Features Settings */}
            <TabsContent value="features" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Available Features</CardTitle>
                  <DialogDescription>
                    Select the features available to this tenant
                  </DialogDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {availableFeatures.map((feature) => (
                      <div
                        key={feature}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          settings.branding.features.includes(feature)
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => toggleFeature(feature)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{feature}</span>
                          <Badge 
                            variant={settings.branding.features.includes(feature) ? "default" : "outline"}
                          >
                            {settings.branding.features.includes(feature) ? "Enabled" : "Disabled"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <strong>{settings.branding.features.length}</strong> features enabled
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Subscription Settings */}
            <TabsContent value="subscription" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Subscription Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="plan">Subscription Plan</Label>
                    <Select 
                      value={settings.plan} 
                      onValueChange={(value) => updateSetting('plan', '', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {subscriptionPlans.map((plan) => (
                          <SelectItem key={plan.value} value={plan.value}>
                            {plan.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Email Notifications</p>
                        <p className="text-sm text-gray-600">Send email alerts for important events</p>
                      </div>
                      <Switch
                        checked={settings.settings.emailNotifications}
                        onCheckedChange={(checked) => updateSetting('settings', 'emailNotifications', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">SMS Notifications</p>
                        <p className="text-sm text-gray-600">Send SMS alerts for critical events</p>
                      </div>
                      <Switch
                        checked={settings.settings.smsNotifications}
                        onCheckedChange={(checked) => updateSetting('settings', 'smsNotifications', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Two-Factor Authentication Required</p>
                        <p className="text-sm text-gray-600">Require 2FA for all users</p>
                      </div>
                      <Switch
                        checked={settings.settings.twoFactorRequired}
                        onCheckedChange={(checked) => updateSetting('settings', 'twoFactorRequired', checked)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-600">
                    <AlertTriangle className="h-4 w-4" />
                    Danger Zone
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg">
                    <div>
                      <p className="font-medium text-red-800">Deactivate Tenant</p>
                      <p className="text-sm text-red-600">
                        Temporarily disable access to this tenant
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      className="border-red-300 text-red-700 hover:bg-red-50"
                      onClick={() => updateSetting('isActive', '', false)}
                    >
                      {settings.isActive ? 'Deactivate' : 'Reactivate'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Save Button */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSave}
                disabled={updateTenantMutation.isPending}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {updateTenantMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}