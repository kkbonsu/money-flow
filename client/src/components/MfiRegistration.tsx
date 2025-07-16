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
      registeredAddress: "",
      physicalAddress: "",
      contactPhone: "",
      contactEmail: "",
      paidUpCapital: "",
      boGLicenseNumber: "",
      licenseExpiryDate: ""
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertMfiRegistration) => {
      return await apiRequest('POST', '/api/mfi-registration', data);
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
      return await apiRequest('PUT', `/api/mfi-registration/${mfiRegistration?.id}`, data);
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
        registeredAddress: mfiRegistration.registeredAddress,
        physicalAddress: mfiRegistration.physicalAddress || "",
        contactPhone: mfiRegistration.contactPhone || "",
        contactEmail: mfiRegistration.contactEmail || "",
        paidUpCapital: mfiRegistration.paidUpCapital || "",
        boGLicenseNumber: mfiRegistration.boGLicenseNumber || "",
        licenseExpiryDate: mfiRegistration.licenseExpiryDate || ""
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
      <Card className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            <Shield className="h-5 w-5" />
            {mfiRegistration ? 'Edit MFI Registration' : 'Register MFI'}
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-300">
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
                      <FormLabel className="flex items-center gap-2 text-gray-800 dark:text-gray-200">
                        <FileText className="h-4 w-4" />
                        Registration Number
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter registration number" 
                          {...field} 
                          className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="physicalAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-gray-800 dark:text-gray-200">
                        <Building className="h-4 w-4" />
                        Physical Address
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter physical address" 
                          {...field} 
                          className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                        />
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
                      <FormLabel className="flex items-center gap-2 text-gray-800 dark:text-gray-200">
                        <Phone className="h-4 w-4" />
                        Contact Phone
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter contact phone" 
                          {...field} 
                          className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                        />
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
                      <FormLabel className="flex items-center gap-2 text-gray-800 dark:text-gray-200">
                        <Mail className="h-4 w-4" />
                        Contact Email
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="Enter contact email" 
                          {...field} 
                          className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="paidUpCapital"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-gray-800 dark:text-gray-200">
                        <DollarSign className="h-4 w-4" />
                        Paid Up Capital (GHS)
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="Enter paid up capital" 
                          {...field} 
                          className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="boGLicenseNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-gray-800 dark:text-gray-200">
                        <Award className="h-4 w-4" />
                        Bank of Ghana License Number
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter BoG license number" 
                          {...field} 
                          className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                        />
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
                      <FormLabel className="text-gray-800 dark:text-gray-200">License Expiry Date</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field} 
                          className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                        />
                      </FormControl>
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
                    <FormLabel className="text-gray-800 dark:text-gray-200">Registered Address</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter registered address" 
                        {...field} 
                        className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                      />
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
    <Card className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-white/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
          <Shield className="h-5 w-5" />
          MFI Registration
        </CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-300">
          Your registered microfinance institution details
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-600 dark:text-gray-300">Company Name</Label>
              <p className="text-sm text-gray-900 dark:text-white">{mfiRegistration.companyName}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600 dark:text-gray-300">Registration Number</Label>
              <p className="text-sm text-gray-900 dark:text-white">{mfiRegistration.registrationNumber}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600 dark:text-gray-300">Bank of Ghana License</Label>
              <p className="text-sm text-gray-900 dark:text-white">{mfiRegistration.boGLicenseNumber || 'Not provided'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600 dark:text-gray-300">License Expiry Date</Label>
              <p className="text-sm text-gray-900 dark:text-white">
                {mfiRegistration.licenseExpiryDate ? new Date(mfiRegistration.licenseExpiryDate).toLocaleDateString() : 'Not provided'}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600 dark:text-gray-300">Contact Phone</Label>
              <p className="text-sm text-gray-900 dark:text-white">{mfiRegistration.contactPhone || 'Not provided'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600 dark:text-gray-300">Contact Email</Label>
              <p className="text-sm text-gray-900 dark:text-white">{mfiRegistration.contactEmail || 'Not provided'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600 dark:text-gray-300">Paid Up Capital</Label>
              <p className="text-sm text-gray-900 dark:text-white">
                GHS {mfiRegistration.paidUpCapital ? parseFloat(mfiRegistration.paidUpCapital).toLocaleString() : 'Not provided'}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600 dark:text-gray-300">Physical Address</Label>
              <p className="text-sm text-gray-900 dark:text-white">{mfiRegistration.physicalAddress || 'Not provided'}</p>
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-600 dark:text-gray-300">Registered Address</Label>
            <p className="text-sm text-gray-900 dark:text-white">{mfiRegistration.registeredAddress}</p>
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