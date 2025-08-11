import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useOrganization, useUser } from '@clerk/clerk-react';
import { useNavigate } from 'wouter';
import { Building, FileText, DollarSign, Phone, Mail, Shield, ArrowRight, Loader2 } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";

const organizationSetupSchema = z.object({
  // Organization details
  organizationName: z.string().min(2, "Organization name must be at least 2 characters"),
  
  // MFI Registration details
  registrationNumber: z.string().min(5, "Registration number is required"),
  registeredAddress: z.string().min(10, "Registered address is required"),
  physicalAddress: z.string().min(10, "Physical address is required"),
  paidUpCapital: z.string().min(1, "Paid up capital is required"),
  contactPhone: z.string().min(10, "Contact phone is required"),
  contactEmail: z.string().email("Valid email is required"),
  boGLicenseNumber: z.string().optional(),
});

type OrganizationSetupFormData = z.infer<typeof organizationSetupSchema>;

export default function OrganizationSetup() {
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  const { createOrganization } = useOrganization();
  const { user } = useUser();
  const [, navigate] = useNavigate();

  const form = useForm<OrganizationSetupFormData>({
    resolver: zodResolver(organizationSetupSchema),
    defaultValues: {
      organizationName: "",
      registrationNumber: "",
      registeredAddress: "",
      physicalAddress: "",
      paidUpCapital: "",
      contactPhone: "",
      contactEmail: user?.primaryEmailAddress?.emailAddress || "",
      boGLicenseNumber: "",
    },
  });

  const createMfiMutation = useMutation({
    mutationFn: async (data: OrganizationSetupFormData & { organizationId: string }) => {
      const response = await apiRequest("/api/mfi-registration", {
        method: "POST",
        body: JSON.stringify({
          companyName: data.organizationName,
          registrationNumber: data.registrationNumber,
          registeredAddress: data.registeredAddress,
          physicalAddress: data.physicalAddress,
          paidUpCapital: data.paidUpCapital,
          contactPhone: data.contactPhone,
          contactEmail: data.contactEmail,
          boGLicenseNumber: data.boGLicenseNumber,
          organizationId: data.organizationId,
        }),
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Your organization has been created successfully",
      });
      navigate('/');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to complete organization setup",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: OrganizationSetupFormData) => {
    try {
      setIsCreating(true);
      
      // Step 1: Create Clerk organization
      if (!createOrganization) {
        throw new Error("Organization creation is not available");
      }

      const org = await createOrganization({
        name: data.organizationName,
      });

      // Step 2: Create MFI registration in database
      await createMfiMutation.mutateAsync({
        ...data,
        organizationId: org.id,
      });

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create organization",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const isCapitalCompliant = (capital: string) => {
    return parseFloat(capital) >= 2000000; // GHS 2M minimum
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Welcome to Money Flow</CardTitle>
          <CardDescription className="text-lg mt-2">
            Set up your Microfinance Institution to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-primary">
                  <Building className="h-5 w-5" />
                  <h3 className="font-semibold">Organization Details</h3>
                </div>
                
                <FormField
                  control={form.control}
                  name="organizationName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your MFI name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-primary">
                  <FileText className="h-5 w-5" />
                  <h3 className="font-semibold">Registration Information</h3>
                </div>
                
                <FormField
                  control={form.control}
                  name="registrationNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Registration Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter registration number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="registeredAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Registered Address</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter registered address" 
                            className="min-h-[80px]"
                            {...field} 
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
                        <FormLabel>Physical Address</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter physical address" 
                            className="min-h-[80px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-primary">
                  <DollarSign className="h-5 w-5" />
                  <h3 className="font-semibold">Financial Information</h3>
                </div>
                
                <FormField
                  control={form.control}
                  name="paidUpCapital"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Paid Up Capital (GHS)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="2000000"
                          min="0"
                          step="0.01"
                          {...field}
                        />
                      </FormControl>
                      {field.value && (
                        <p className={`text-sm ${isCapitalCompliant(field.value) ? 'text-green-600' : 'text-red-600'}`}>
                          {isCapitalCompliant(field.value) 
                            ? '✓ Meets minimum capital requirement (GHS 2M)'
                            : '✗ Below minimum capital requirement (GHS 2M)'
                          }
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-primary">
                  <Phone className="h-5 w-5" />
                  <h3 className="font-semibold">Contact Information</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="contactPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="+233 XX XXX XXXX" {...field} />
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
                        <FormLabel>Contact Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="contact@mfi.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-primary">
                  <Shield className="h-5 w-5" />
                  <h3 className="font-semibold">Licensing (Optional)</h3>
                </div>
                
                <FormField
                  control={form.control}
                  name="boGLicenseNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bank of Ghana License Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter BoG license number (if available)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end pt-6">
                <Button
                  type="submit"
                  size="lg"
                  disabled={isCreating}
                  className="min-w-[200px]"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Organization...
                    </>
                  ) : (
                    <>
                      Create Organization
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}