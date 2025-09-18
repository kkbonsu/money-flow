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
  Shield
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
  
  // Step 3: Configuration
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Valid hex color required').default('#2563eb'),
  features: z.array(z.string()).min(1, 'At least one feature must be selected'),
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
  { id: 3, title: 'Configuration', icon: Settings },
  { id: 4, title: 'Review & Create', icon: CheckCircle },
];

const availableFeatures = [
  'loans', 'payments', 'analytics', 'reports', 'staff', 'inventory', 'assets', 'customer-portal'
];

export function TenantOnboardingWizard({ open, onOpenChange }: TenantOnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(['loans', 'payments', 'analytics']);
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
      primaryColor: '#2563eb',
      features: ['loans', 'payments', 'analytics'],
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

      return { tenant, adminUser };
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
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = (data: OnboardingForm) => {
    if (currentStep === 4) {
      onboardTenantMutation.mutate({ ...data, features: selectedFeatures });
    } else {
      nextStep();
    }
  };

  const progress = (currentStep / 4) * 100;

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

            {/* Step 3: Configuration */}
            {currentStep === 3 && (
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

            {/* Step 4: Review */}
            {currentStep === 4 && (
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
                  {currentStep === 4 ? (
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