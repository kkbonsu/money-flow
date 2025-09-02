import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Building2, 
  User, 
  Settings, 
  CheckCircle, 
  ArrowLeft, 
  ArrowRight,
  Palette,
  Shield,
  Plus,
  Minus,
  Users,
  DollarSign
} from 'lucide-react';

const onboardingSchema = z.object({
  // Step 1: Organization
  orgName: z.string().min(2, 'Organization name is required'),
  orgSlug: z.string().min(2, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Invalid slug format'),
  orgDescription: z.string().optional(),
  
  // Step 2: Admin User
  adminUsername: z.string().min(3, 'Username must be at least 3 characters'),
  adminEmail: z.string().email('Valid email is required'),
  adminPassword: z.string().min(8, 'Password must be at least 8 characters'),
  adminFirstName: z.string().min(1, 'First name is required'),
  adminLastName: z.string().min(1, 'Last name is required'),
  
  // Step 3: MFI Registration
  companyName: z.string().optional(),
  registrationNumber: z.string().optional(),
  licenseNumber: z.string().optional(),
  licenseExpiryDate: z.string().optional(),
  regulatoryBody: z.string().optional(),
  businessType: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  
  // Step 6: Configuration
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Valid hex color required').default('#2563eb'),
  theme: z.enum(['light', 'dark']).default('light'),
});

type OnboardingForm = z.infer<typeof onboardingSchema>;

interface TenantOnboardingWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const steps = [
  { id: 1, title: 'Organization Details', icon: Building2 },
  { id: 2, title: 'Admin User', icon: User },
  { id: 3, title: 'MFI Registration', icon: Shield },
  { id: 4, title: 'Shareholders', icon: Users },
  { id: 5, title: 'Equity Structure', icon: DollarSign },
  { id: 6, title: 'Branding & Features', icon: Palette },
  { id: 7, title: 'Review & Create', icon: CheckCircle },
];

const availableFeatures = [
  'loans', 'payments', 'analytics', 'reports', 'staff', 'inventory', 'assets', 'customer-portal'
];

export function TenantOnboardingWizard({ open, onOpenChange }: TenantOnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(['loans', 'payments', 'analytics']);
  const [shareholders, setShareholders] = useState([{ name: '', shares: 1000, shareType: 'ordinary', nationality: '' }]);
  const [equityEntries, setEquityEntries] = useState([{ accountName: 'Share Capital', amount: 10000, description: 'Initial share capital' }]);
  const { toast } = useToast();

  const form = useForm<OnboardingForm>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      orgName: '',
      orgSlug: '',
      orgDescription: '',
      adminUsername: '',
      adminEmail: '',
      adminPassword: '',
      adminFirstName: '',
      adminLastName: '',
      companyName: '',
      registrationNumber: '',
      licenseNumber: '',
      licenseExpiryDate: '',
      regulatoryBody: '',
      businessType: '',
      address: '',
      phone: '',
      primaryColor: '#2563eb',
      theme: 'light',
    },
  });

  const onboardTenantMutation = useMutation({
    mutationFn: async (data: OnboardingForm) => {
      // Step 1: Create tenant
      const tenant = await apiRequest('/api/admin/tenants', {
        method: 'POST',
        body: JSON.stringify({
          name: data.orgName,
          slug: data.orgSlug,
          settings: {
            theme: data.theme,
            features: selectedFeatures,
            branding: {
              primaryColor: data.primaryColor,
              description: data.orgDescription,
            }
          }
        }),
      });

      // Step 2: Create admin user for the tenant
      const adminUser = await apiRequest('/api/auth/register', {
        method: 'POST',
        headers: {
          'X-Tenant-ID': tenant.id,
        },
        body: JSON.stringify({
          username: data.adminUsername,
          email: data.adminEmail,
          password: data.adminPassword,
          firstName: data.adminFirstName,
          lastName: data.adminLastName,
          role: 'admin',
        }),
      });

      // Step 3: Create MFI Registration
      const mfiRegistration = await apiRequest('/api/mfi-registration', {
        method: 'POST',
        headers: {
          'X-Tenant-ID': tenant.id,
        },
        body: JSON.stringify({
          companyName: data.companyName,
          registrationNumber: data.registrationNumber,
          licenseNumber: data.licenseNumber,
          licenseExpiryDate: data.licenseExpiryDate,
          regulatoryBody: data.regulatoryBody,
          businessType: data.businessType,
          address: data.address,
          phone: data.phone,
        }),
      });

      // Step 4: Create Shareholders
      const shareholderPromises = shareholders.map(shareholder =>
        apiRequest('/api/shareholders', {
          method: 'POST',
          headers: {
            'X-Tenant-ID': tenant.id,
          },
          body: JSON.stringify(shareholder),
        })
      );
      const createdShareholders = await Promise.all(shareholderPromises);

      // Step 5: Create Equity Entries
      const equityPromises = equityEntries.map(equity =>
        apiRequest('/api/equity', {
          method: 'POST',
          headers: {
            'X-Tenant-ID': tenant.id,
          },
          body: JSON.stringify(equity),
        })
      );
      const createdEquity = await Promise.all(equityPromises);

      return { tenant, adminUser, mfiRegistration, shareholders: createdShareholders, equity: createdEquity };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tenants'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      
      toast({
        title: "Success!",
        description: `Tenant "${data.tenant.name}" and admin user created successfully`,
      });
      
      // Reset form and wizard
      form.reset();
      setSelectedFeatures(['loans', 'payments', 'analytics']);
      setCurrentStep(1);
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to onboard tenant",
        variant: "destructive",
      });
    },
  });

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleOrgNameChange = (name: string) => {
    form.setValue('orgName', name);
    if (!form.getValues('orgSlug')) {
      form.setValue('orgSlug', generateSlug(name));
    }
  };

  const toggleFeature = (feature: string) => {
    const newFeatures = selectedFeatures.includes(feature)
      ? selectedFeatures.filter(f => f !== feature)
      : [...selectedFeatures, feature];
    setSelectedFeatures(newFeatures);
    form.setValue('features', newFeatures);
  };

  const nextStep = () => {
    if (currentStep < 7) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const addShareholder = () => {
    setShareholders([...shareholders, { name: '', shares: 100, shareType: 'ordinary', nationality: '' }]);
  };

  const removeShareholder = (index: number) => {
    if (shareholders.length > 1) {
      setShareholders(shareholders.filter((_, i) => i !== index));
    }
  };

  const updateShareholder = (index: number, field: string, value: any) => {
    const updated = [...shareholders];
    updated[index] = { ...updated[index], [field]: value };
    setShareholders(updated);
  };

  const addEquityEntry = () => {
    setEquityEntries([...equityEntries, { accountName: '', amount: 0, description: '' }]);
  };

  const removeEquityEntry = (index: number) => {
    if (equityEntries.length > 1) {
      setEquityEntries(equityEntries.filter((_, i) => i !== index));
    }
  };

  const updateEquityEntry = (index: number, field: string, value: any) => {
    const updated = [...equityEntries];
    updated[index] = { ...updated[index], [field]: value };
    setEquityEntries(updated);
  };

  const onSubmit = (data: OnboardingForm) => {
    if (currentStep === 7) {
      onboardTenantMutation.mutate({ ...data, features: selectedFeatures, shareholders, equityEntries });
    } else {
      // Validate current step before proceeding
      let isValid = true;
      
      if (currentStep === 1) {
        isValid = !!data.orgName && !!data.orgSlug;
      } else if (currentStep === 2) {
        isValid = !!data.adminUsername && !!data.adminEmail && !!data.adminPassword && !!data.adminFirstName && !!data.adminLastName;
      } else if (currentStep === 4) {
        isValid = shareholders.every(s => s.name && s.shares > 0 && s.shareType);
      } else if (currentStep === 5) {
        isValid = equityEntries.every(e => e.accountName && e.amount >= 0);
      }
      
      if (isValid) {
        nextStep();
      } else {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields before proceeding",
          variant: "destructive",
        });
      }
    }
  };

  const progress = (currentStep / 7) * 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Tenant Onboarding Wizard
          </DialogTitle>
          <DialogDescription>
            Complete setup for a new tenant organization with admin user
          </DialogDescription>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="space-y-4">
          <Progress value={progress} className="w-full" />
          <div className="flex justify-between text-sm">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div 
                  key={step.id}
                  className={`flex flex-col items-center gap-1 ${
                    currentStep >= step.id ? 'text-blue-600' : 'text-gray-400'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{step.title}</span>
                </div>
              );
            })}
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Step 1: Organization Details */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Organization Details
                </h3>
                
                <FormField
                  control={form.control}
                  name="orgName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="ABC Microfinance Ltd"
                          {...field}
                          onChange={(e) => handleOrgNameChange(e.target.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="orgSlug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tenant Slug</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="abc-microfinance"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="orgDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Brief description of the organization..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Step 2: Admin User */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Admin User Setup
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="adminFirstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="adminLastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="adminUsername"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="admin" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="adminEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="admin@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="adminPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Step 3: MFI Registration */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  MFI Registration
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name</FormLabel>
                        <FormControl>
                          <Input placeholder="ABC Microfinance Ltd" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="registrationNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Registration Number</FormLabel>
                        <FormControl>
                          <Input placeholder="REG-123456" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="licenseNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>License Number</FormLabel>
                        <FormControl>
                          <Input placeholder="LIC-789012" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="licenseExpiryDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>License Expiry Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="regulatoryBody"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Regulatory Body</FormLabel>
                        <FormControl>
                          <Input placeholder="Bank of Ghana" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="businessType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Type</FormLabel>
                        <FormControl>
                          <Input placeholder="Microfinance Institution" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Complete business address..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="+233 XX XXX XXXX" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Step 4: Shareholders */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Shareholders
                </h3>
                
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Add initial shareholders for the microfinance institution
                </p>
                
                {shareholders.map((shareholder, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">Shareholder {index + 1}</h4>
                      {shareholders.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeShareholder(index)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Name</label>
                        <Input
                          placeholder="Shareholder name"
                          value={shareholder.name}
                          onChange={(e) => updateShareholder(index, 'name', e.target.value)}
                        />
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium">Shares</label>
                        <Input
                          type="number"
                          placeholder="1000"
                          value={shareholder.shares}
                          onChange={(e) => updateShareholder(index, 'shares', parseInt(e.target.value) || 0)}
                        />
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium">Share Type</label>
                        <Input
                          placeholder="ordinary"
                          value={shareholder.shareType}
                          onChange={(e) => updateShareholder(index, 'shareType', e.target.value)}
                        />
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium">Nationality</label>
                        <Input
                          placeholder="Ghanaian"
                          value={shareholder.nationality}
                          onChange={(e) => updateShareholder(index, 'nationality', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={addShareholder}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Shareholder
                </Button>
              </div>
            )}

            {/* Step 5: Equity Structure */}
            {currentStep === 5 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Equity Structure
                </h3>
                
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Set up initial equity accounts and their values
                </p>
                
                {equityEntries.map((equity, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">Equity Entry {index + 1}</h4>
                      {equityEntries.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeEquityEntry(index)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Account Name</label>
                        <Input
                          placeholder="Share Capital"
                          value={equity.accountName}
                          onChange={(e) => updateEquityEntry(index, 'accountName', e.target.value)}
                        />
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium">Amount</label>
                        <Input
                          type="number"
                          placeholder="10000"
                          value={equity.amount}
                          onChange={(e) => updateEquityEntry(index, 'amount', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Description</label>
                      <Textarea
                        placeholder="Initial equity contribution..."
                        value={equity.description}
                        onChange={(e) => updateEquityEntry(index, 'description', e.target.value)}
                      />
                    </div>
                  </div>
                ))}
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={addEquityEntry}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Equity Entry
                </Button>
              </div>
            )}

            {/* Step 6: Configuration */}
            {currentStep === 6 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Branding & Features
                </h3>
                
                <FormField
                  control={form.control}
                  name="primaryColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Color</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <Input 
                            type="color"
                            className="w-12 h-10 p-1 border rounded"
                            {...field}
                          />
                          <Input 
                            placeholder="#2563eb"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <FormLabel>Features</FormLabel>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Select features for this tenant
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {availableFeatures.map((feature) => (
                      <Badge
                        key={feature}
                        variant={selectedFeatures.includes(feature) ? "default" : "outline"}
                        className="cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => toggleFeature(feature)}
                      >
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 7: Review */}
            {currentStep === 7 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Review & Create
                </h3>
                
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-3">
                  <div>
                    <h4 className="font-medium">Organization</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {form.getValues('orgName')} ({form.getValues('orgSlug')})
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium">Admin User</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {form.getValues('adminFirstName')} {form.getValues('adminLastName')} 
                      ({form.getValues('adminEmail')})
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium">MFI Registration</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {form.getValues('companyName')} - {form.getValues('licenseNumber')}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium">Shareholders</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {shareholders.length} shareholders, Total shares: {shareholders.reduce((sum, s) => sum + s.shares, 0)}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium">Equity Structure</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {equityEntries.length} entries, Total value: GHS {equityEntries.reduce((sum, e) => sum + e.amount, 0).toLocaleString()}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium">Features</h4>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedFeatures.map((feature) => (
                        <Badge key={feature} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6">
              <Button 
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1 || onboardTenantMutation.isPending}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>
              
              <div className="flex gap-2">
                <Button 
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={onboardTenantMutation.isPending}
                >
                  Cancel
                </Button>
                
                <Button 
                  type="submit"
                  disabled={onboardTenantMutation.isPending}
                >
                  {currentStep === 7 ? (
                    onboardTenantMutation.isPending ? 'Creating...' : 'Create Tenant'
                  ) : (
                    <>
                      Next
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}