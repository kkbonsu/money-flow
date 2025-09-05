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
import { Building2, MapPin, Users, Settings, FileText, UserPlus, DollarSign, Plus, Trash2 } from "lucide-react";

interface Shareholder {
  id?: string;
  shareholderType: 'individual' | 'corporate';
  name: string;
  nationality: string;
  idType: 'passport' | 'national_id' | 'voters_id' | 'corporate_registration';
  idNumber: string;
  address: string;
  contactPhone?: string;
  contactEmail?: string;
  sharesOwned: number;
  sharePercentage: number;
  investmentAmount: number;
  investmentCurrency: string;
}

interface MfiRegistration {
  companyName: string;
  registrationNumber: string;
  licenseExpiryDate?: string;
  registeredAddress: string;
  physicalAddress?: string;
  contactPhone?: string;
  contactEmail?: string;
  paidUpCapital?: number;
  minimumCapitalRequired?: number;
  bogLicenseNumber?: string;
}

interface EquityEntry {
  equityType: 'share_capital' | 'retained_earnings' | 'reserves' | 'other';
  amount: number;
  description?: string;
}

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
  mfiRegistration: MfiRegistration;
  shareholders: Shareholder[];
  initialEquity: EquityEntry[];
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
    },
    mfiRegistration: {
      companyName: "",
      registrationNumber: "",
      registeredAddress: "",
      paidUpCapital: 0,
      minimumCapitalRequired: 0
    },
    shareholders: [],
    initialEquity: [
      {
        equityType: 'share_capital',
        amount: 0,
        description: 'Initial Share Capital'
      }
    ]
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
        description: `${form.name} has been successfully set up. You can now login with username: ${data.user?.username}`,
      });
      
      // Auto-login with the admin user
      if (data.token) {
        localStorage.setItem('token', data.token);
        
        // Force a page reload to ensure auth state is updated
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1000);
      } else {
        // Redirect to login page with a message
        setLocation('/login');
      }
    },
    onError: (error: any) => {
      let description = error.message || "Failed to create organization";
      
      // Handle duplicate code error with helpful suggestion
      if (error.message?.includes('already exists')) {
        description = `${error.message} Try adding numbers or your location (e.g., ${form.code}-01, ${form.code}-ACCRA)`;
      }
      
      toast({
        title: "Setup Failed", 
        description,
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
      case 4:
        return form.mfiRegistration.companyName && form.mfiRegistration.registrationNumber && 
               form.mfiRegistration.registeredAddress;
      case 5:
        return form.shareholders.length > 0 && 
               form.shareholders.every(s => s.name && s.shareholderType && s.sharesOwned > 0);
      case 6:
        return form.initialEquity.length > 0 && 
               form.initialEquity.every(e => e.amount > 0);
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
            Step {step} of 6: {
              step === 1 ? "Organization Details" : 
              step === 2 ? "Branch & Contact" : 
              step === 3 ? "Admin User" :
              step === 4 ? "MFI Registration" :
              step === 5 ? "Shareholders" :
              "Initial Equity"
            }
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress Bar */}
          <div className="flex space-x-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
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

          {/* Step 4: MFI Registration */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <FileText className="h-5 w-5" />
                MFI Registration Details
              </div>
              
              <div>
                <Label htmlFor="companyName">Company Name (as registered)</Label>
                <Input
                  id="companyName"
                  value={form.mfiRegistration.companyName}
                  onChange={(e) => updateForm('mfiRegistration.companyName', e.target.value)}
                  placeholder="e.g., ABC Microfinance Limited"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="registrationNumber">Registration Number</Label>
                  <Input
                    id="registrationNumber"
                    value={form.mfiRegistration.registrationNumber}
                    onChange={(e) => updateForm('mfiRegistration.registrationNumber', e.target.value)}
                    placeholder="e.g., CS-123456789"
                  />
                </div>
                <div>
                  <Label htmlFor="bogLicenseNumber">BoG License Number</Label>
                  <Input
                    id="bogLicenseNumber"
                    value={form.mfiRegistration.bogLicenseNumber || ''}
                    onChange={(e) => updateForm('mfiRegistration.bogLicenseNumber', e.target.value)}
                    placeholder="e.g., MFI-2024-001"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="registeredAddress">Registered Address</Label>
                <Textarea
                  id="registeredAddress"
                  value={form.mfiRegistration.registeredAddress}
                  onChange={(e) => updateForm('mfiRegistration.registeredAddress', e.target.value)}
                  placeholder="Enter the official registered address"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="paidUpCapital">Paid Up Capital (GHS)</Label>
                  <Input
                    id="paidUpCapital"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.mfiRegistration.paidUpCapital || ''}
                    onChange={(e) => updateForm('mfiRegistration.paidUpCapital', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label htmlFor="minimumCapitalRequired">Minimum Capital Required (GHS)</Label>
                  <Input
                    id="minimumCapitalRequired"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.mfiRegistration.minimumCapitalRequired || ''}
                    onChange={(e) => updateForm('mfiRegistration.minimumCapitalRequired', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="licenseExpiryDate">License Expiry Date (Optional)</Label>
                <Input
                  id="licenseExpiryDate"
                  type="date"
                  value={form.mfiRegistration.licenseExpiryDate || ''}
                  onChange={(e) => updateForm('mfiRegistration.licenseExpiryDate', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Step 5: Shareholders */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <UserPlus className="h-5 w-5" />
                  Shareholders & Equity Structure
                </div>
                <Button
                  onClick={() => {
                    const newShareholder: Shareholder = {
                      id: Date.now().toString(),
                      shareholderType: 'individual',
                      name: '',
                      nationality: 'Ghana',
                      idType: 'national_id',
                      idNumber: '',
                      address: '',
                      sharesOwned: 0,
                      sharePercentage: 0,
                      investmentAmount: 0,
                      investmentCurrency: 'GHS'
                    };
                    setForm(prev => ({
                      ...prev,
                      shareholders: [...prev.shareholders, newShareholder]
                    }));
                  }}
                  variant="outline"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Shareholder
                </Button>
              </div>
              
              {form.shareholders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No shareholders added yet. Click "Add Shareholder" to get started.
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {form.shareholders.map((shareholder, index) => (
                    <div key={shareholder.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Shareholder {index + 1}</h4>
                        <Button
                          onClick={() => {
                            setForm(prev => ({
                              ...prev,
                              shareholders: prev.shareholders.filter(s => s.id !== shareholder.id)
                            }));
                          }}
                          variant="ghost"
                          size="sm"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Shareholder Type</Label>
                          <Select
                            value={shareholder.shareholderType}
                            onValueChange={(value: 'individual' | 'corporate') => {
                              setForm(prev => ({
                                ...prev,
                                shareholders: prev.shareholders.map(s => 
                                  s.id === shareholder.id ? { ...s, shareholderType: value } : s
                                )
                              }));
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="individual">Individual</SelectItem>
                              <SelectItem value="corporate">Corporate</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label>Full Name</Label>
                          <Input
                            value={shareholder.name}
                            onChange={(e) => {
                              setForm(prev => ({
                                ...prev,
                                shareholders: prev.shareholders.map(s => 
                                  s.id === shareholder.id ? { ...s, name: e.target.value } : s
                                )
                              }));
                            }}
                            placeholder="Enter full name"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <Label>Shares Owned</Label>
                          <Input
                            type="number"
                            min="0"
                            value={shareholder.sharesOwned || ''}
                            onChange={(e) => {
                              const shares = parseInt(e.target.value) || 0;
                              setForm(prev => ({
                                ...prev,
                                shareholders: prev.shareholders.map(s => 
                                  s.id === shareholder.id ? { ...s, sharesOwned: shares } : s
                                )
                              }));
                            }}
                          />
                        </div>
                        
                        <div>
                          <Label>Share %</Label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={shareholder.sharePercentage || ''}
                            onChange={(e) => {
                              const percentage = parseFloat(e.target.value) || 0;
                              setForm(prev => ({
                                ...prev,
                                shareholders: prev.shareholders.map(s => 
                                  s.id === shareholder.id ? { ...s, sharePercentage: percentage } : s
                                )
                              }));
                            }}
                          />
                        </div>
                        
                        <div>
                          <Label>Investment (GHS)</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={shareholder.investmentAmount || ''}
                            onChange={(e) => {
                              const amount = parseFloat(e.target.value) || 0;
                              setForm(prev => ({
                                ...prev,
                                shareholders: prev.shareholders.map(s => 
                                  s.id === shareholder.id ? { ...s, investmentAmount: amount } : s
                                )
                              }));
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {form.shareholders.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  Total Shares: {form.shareholders.reduce((sum, s) => sum + s.sharesOwned, 0)} | 
                  Total Percentage: {form.shareholders.reduce((sum, s) => sum + s.sharePercentage, 0).toFixed(2)}% |
                  Total Investment: GHS {form.shareholders.reduce((sum, s) => sum + s.investmentAmount, 0).toLocaleString()}
                </div>
              )}
            </div>
          )}

          {/* Step 6: Initial Equity */}
          {step === 6 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <DollarSign className="h-5 w-5" />
                  Initial Equity & Capital Structure
                </div>
                <Button
                  onClick={() => {
                    const newEquity: EquityEntry = {
                      equityType: 'share_capital',
                      amount: 0,
                      description: ''
                    };
                    setForm(prev => ({
                      ...prev,
                      initialEquity: [...prev.initialEquity, newEquity]
                    }));
                  }}
                  variant="outline"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Equity Item
                </Button>
              </div>
              
              <div className="space-y-4">
                {form.initialEquity.map((equity, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Equity Item {index + 1}</h4>
                      {form.initialEquity.length > 1 && (
                        <Button
                          onClick={() => {
                            setForm(prev => ({
                              ...prev,
                              initialEquity: prev.initialEquity.filter((_, i) => i !== index)
                            }));
                          }}
                          variant="ghost"
                          size="sm"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Equity Type</Label>
                        <Select
                          value={equity.equityType}
                          onValueChange={(value: 'share_capital' | 'retained_earnings' | 'reserves' | 'other') => {
                            setForm(prev => ({
                              ...prev,
                              initialEquity: prev.initialEquity.map((e, i) => 
                                i === index ? { ...e, equityType: value } : e
                              )
                            }));
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="share_capital">Share Capital</SelectItem>
                            <SelectItem value="retained_earnings">Retained Earnings</SelectItem>
                            <SelectItem value="reserves">Reserves</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label>Amount (GHS)</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={equity.amount || ''}
                          onChange={(e) => {
                            const amount = parseFloat(e.target.value) || 0;
                            setForm(prev => ({
                              ...prev,
                              initialEquity: prev.initialEquity.map((e, i) => 
                                i === index ? { ...e, amount } : e
                              )
                            }));
                          }}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label>Description</Label>
                      <Input
                        value={equity.description || ''}
                        onChange={(e) => {
                          setForm(prev => ({
                            ...prev,
                            initialEquity: prev.initialEquity.map((eq, i) => 
                              i === index ? { ...eq, description: e.target.value } : eq
                            )
                          }));
                        }}
                        placeholder="Brief description of this equity item"
                      />
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="text-sm text-muted-foreground">
                Total Initial Equity: GHS {form.initialEquity.reduce((sum, e) => sum + e.amount, 0).toLocaleString()}
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
            
            {step < 6 ? (
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