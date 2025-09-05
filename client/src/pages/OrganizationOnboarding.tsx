import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Building2, MapPin, Users, Settings } from "lucide-react";

interface OrganizationForm {
  name: string;
  code: string;
  type: 'single_branch' | 'multi_branch';
  branchName: string;
  branchCode: string;
  address: {
    street: string;
    city: string;
    region: string;
    country: string;
  };
  contact: {
    phone: string;
    email: string;
  };
  adminUser: {
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    password: string;
  };
}

export default function OrganizationOnboarding() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  
  const [form, setForm] = useState<OrganizationForm>({
    name: "",
    code: "",
    type: "multi_branch",
    branchName: "Main Branch",
    branchCode: "MAIN",
    address: {
      street: "",
      city: "",
      region: "",
      country: "Ghana"
    },
    contact: {
      phone: "",
      email: ""
    },
    adminUser: {
      firstName: "",
      lastName: "",
      username: "",
      email: "",
      password: ""
    }
  });

  const createOrganizationMutation = useMutation({
    mutationFn: async (data: OrganizationForm) => {
      const response = await fetch('/api/organizations/onboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create organization');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Organization Created!",
        description: `${form.name} has been successfully set up.`,
      });
      
      // Auto-login with the admin user
      if (data.token) {
        localStorage.setItem('token', data.token);
        setLocation('/dashboard');
      }
    },
    onError: (error: any) => {
      toast({
        title: "Setup Failed",
        description: error.message || "Failed to create organization",
        variant: "destructive",
      });
    },
  });

  const updateForm = (field: string, value: any) => {
    setForm(prev => {
      const keys = field.split('.');
      if (keys.length === 1) {
        return { ...prev, [field]: value };
      } else {
        return {
          ...prev,
          [keys[0]]: {
            ...prev[keys[0] as keyof OrganizationForm],
            [keys[1]]: value
          }
        };
      }
    });
  };

  const handleSubmit = () => {
    createOrganizationMutation.mutate(form);
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return form.name && form.code && form.type;
      case 2:
        return form.branchName && form.branchCode && form.address.city && form.contact.email;
      case 3:
        return form.adminUser.firstName && form.adminUser.lastName && 
               form.adminUser.username && form.adminUser.email && form.adminUser.password;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
            <Building2 className="h-6 w-6" />
            Setup Your Organization
          </CardTitle>
          <p className="text-muted-foreground">
            Step {step} of 3: {step === 1 ? "Organization Details" : step === 2 ? "Branch & Contact" : "Admin User"}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress Bar */}
          <div className="flex space-x-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`flex-1 h-2 rounded-full ${
                  i <= step ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>

          {/* Step 1: Organization Details */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <Building2 className="h-5 w-5" />
                Organization Information
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Organization Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., ABC Microfinance Institution"
                    value={form.name}
                    onChange={(e) => updateForm('name', e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="code">Organization Code</Label>
                  <Input
                    id="code"
                    placeholder="e.g., ABC_MFI"
                    value={form.code}
                    onChange={(e) => updateForm('code', e.target.value.toUpperCase())}
                  />
                </div>
                
                <div>
                  <Label htmlFor="type">Organization Type</Label>
                  <Select value={form.type} onValueChange={(value: 'single_branch' | 'multi_branch') => updateForm('type', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single_branch">Single Branch</SelectItem>
                      <SelectItem value="multi_branch">Multi Branch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Branch & Contact */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <MapPin className="h-5 w-5" />
                Main Branch & Contact
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="branchName">Branch Name</Label>
                  <Input
                    id="branchName"
                    value={form.branchName}
                    onChange={(e) => updateForm('branchName', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="branchCode">Branch Code</Label>
                  <Input
                    id="branchCode"
                    value={form.branchCode}
                    onChange={(e) => updateForm('branchCode', e.target.value.toUpperCase())}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="street">Street Address</Label>
                <Input
                  id="street"
                  value={form.address.street}
                  onChange={(e) => updateForm('address.street', e.target.value)}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={form.address.city}
                    onChange={(e) => updateForm('address.city', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="region">Region</Label>
                  <Input
                    id="region"
                    value={form.address.region}
                    onChange={(e) => updateForm('address.region', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={form.contact.phone}
                    onChange={(e) => updateForm('contact.phone', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.contact.email}
                    onChange={(e) => updateForm('contact.email', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Admin User */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <Users className="h-5 w-5" />
                Administrator Account
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={form.adminUser.firstName}
                    onChange={(e) => updateForm('adminUser.firstName', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={form.adminUser.lastName}
                    onChange={(e) => updateForm('adminUser.lastName', e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={form.adminUser.username}
                  onChange={(e) => updateForm('adminUser.username', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="adminEmail">Email</Label>
                <Input
                  id="adminEmail"
                  type="email"
                  value={form.adminUser.email}
                  onChange={(e) => updateForm('adminUser.email', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={form.adminUser.password}
                  onChange={(e) => updateForm('adminUser.password', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6">
            <Button
              variant="outline"
              onClick={() => setStep(step - 1)}
              disabled={step === 1}
            >
              Previous
            </Button>
            
            {step < 3 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!canProceed() || createOrganizationMutation.isPending}
              >
                {createOrganizationMutation.isPending ? "Creating..." : "Create Organization"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}