import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertMfiRegistrationSchema, type MfiRegistration, type InsertMfiRegistration } from "@shared/schema";
import { Shield, Building, FileText, Phone, Mail, DollarSign, Users, Award } from "lucide-react";

export function MfiRegistration() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  const { data: mfiRegistration, isLoading } = useQuery<MfiRegistration>({
    queryKey: ['/api/mfi-registration']
  });

  const form = useForm<InsertMfiRegistration>({
    resolver: zodResolver(insertMfiRegistrationSchema),
    defaultValues: {
      companyName: "",
      registrationNumber: "",
      licenseNumber: "",
      licenseExpiryDate: "",
      registeredAddress: "",
      contactPhone: "",
      contactEmail: "",
      capitalAmount: "",
      shareholdersCount: 0,
      tierLevel: "tier_3"
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertMfiRegistration) => {
      return await apiRequest('/api/mfi-registration', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "MFI registration created successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/mfi-registration'] });
      setIsEditing(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create MFI registration",
        variant: "destructive"
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: InsertMfiRegistration) => {
      return await apiRequest(`/api/mfi-registration/${mfiRegistration?.id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "MFI registration updated successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/mfi-registration'] });
      setIsEditing(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update MFI registration",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (data: InsertMfiRegistration) => {
    if (mfiRegistration) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = () => {
    if (mfiRegistration) {
      form.reset({
        companyName: mfiRegistration.companyName,
        registrationNumber: mfiRegistration.registrationNumber,
        licenseNumber: mfiRegistration.licenseNumber,
        licenseExpiryDate: mfiRegistration.licenseExpiryDate,
        registeredAddress: mfiRegistration.registeredAddress,
        contactPhone: mfiRegistration.contactPhone,
        contactEmail: mfiRegistration.contactEmail,
        capitalAmount: mfiRegistration.capitalAmount,
        shareholdersCount: mfiRegistration.shareholdersCount,
        tierLevel: mfiRegistration.tierLevel
      });
    }
    setIsEditing(true);
  };

  if (isLoading) {
    return (
      <Card className="bg-white/10 dark:bg-gray-900/10 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            MFI Registration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!mfiRegistration && !isEditing) {
    return (
      <Card className="bg-white/10 dark:bg-gray-900/10 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            MFI Registration
          </CardTitle>
          <CardDescription>
            Register your Microfinance Institution with Bank of Ghana
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Shield className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">No MFI Registration Found</h3>
            <p className="text-gray-600 mb-4">
              Complete your MFI registration to ensure regulatory compliance with Bank of Ghana requirements.
            </p>
            <Button onClick={() => setIsEditing(true)}>
              Register MFI
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isEditing) {
    return (
      <Card className="bg-white/10 dark:bg-gray-900/10 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {mfiRegistration ? 'Edit MFI Registration' : 'Register MFI'}
          </CardTitle>
          <CardDescription>
            Complete your MFI registration details for Bank of Ghana compliance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        Company Name
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Enter company name" {...field} />
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
                      <FormLabel className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Registration Number
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Enter registration number" {...field} />
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
                      <FormLabel className="flex items-center gap-2">
                        <Award className="h-4 w-4" />
                        License Number
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Enter license number" {...field} />
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
                  name="contactPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Contact Phone
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Enter contact phone" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contactEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Contact Email
                      </FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Enter contact email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="capitalAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Capital Amount (GHS)
                      </FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="Enter capital amount" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="shareholdersCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Number of Shareholders
                      </FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Enter number of shareholders" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tierLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tier Level</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select tier level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="tier_1">Tier 1 MFI</SelectItem>
                          <SelectItem value="tier_2">Tier 2 MFI</SelectItem>
                          <SelectItem value="tier_3">Tier 3 MFI</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="registeredAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Registered Address</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter registered address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save Registration'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/10 dark:bg-gray-900/10 backdrop-blur-sm border-white/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          MFI Registration
        </CardTitle>
        <CardDescription>
          Your registered microfinance institution details
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-600">Company Name</Label>
              <p className="text-sm">{mfiRegistration.companyName}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">Registration Number</Label>
              <p className="text-sm">{mfiRegistration.registrationNumber}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">License Number</Label>
              <p className="text-sm">{mfiRegistration.licenseNumber}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">License Expiry Date</Label>
              <p className="text-sm">{new Date(mfiRegistration.licenseExpiryDate).toLocaleDateString()}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">Contact Phone</Label>
              <p className="text-sm">{mfiRegistration.contactPhone}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">Contact Email</Label>
              <p className="text-sm">{mfiRegistration.contactEmail}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">Capital Amount</Label>
              <p className="text-sm">GHS {parseFloat(mfiRegistration.capitalAmount).toLocaleString()}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">Shareholders Count</Label>
              <p className="text-sm">{mfiRegistration.shareholdersCount}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">Tier Level</Label>
              <p className="text-sm capitalize">{mfiRegistration.tierLevel.replace('_', ' ')}</p>
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-600">Registered Address</Label>
            <p className="text-sm">{mfiRegistration.registeredAddress}</p>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <Button onClick={handleEdit}>
            Edit Registration
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}