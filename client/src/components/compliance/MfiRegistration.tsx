import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Building, FileText, DollarSign, Phone, Mail, Calendar, Shield, Upload, Plus, Edit, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const mfiRegistrationSchema = z.object({
  companyName: z.string().min(2, "Company name must be at least 2 characters"),
  registrationNumber: z.string().min(5, "Registration number is required"),
  registeredAddress: z.string().min(10, "Registered address is required"),
  physicalAddress: z.string().min(10, "Physical address is required"),
  paidUpCapital: z.string().min(1, "Paid up capital is required"),
  contactPhone: z.string().min(10, "Contact phone is required"),
  contactEmail: z.string().email("Valid email is required"),
  boGLicenseNumber: z.string().optional(),
  licenseExpiryDate: z.string().optional(),
});

type MfiRegistrationFormData = z.infer<typeof mfiRegistrationSchema>;

export default function MfiRegistration() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMfi, setEditingMfi] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: mfiRegistrations = [], isLoading } = useQuery({
    queryKey: ["/api/mfi-registration"],
  });

  const form = useForm<MfiRegistrationFormData>({
    resolver: zodResolver(mfiRegistrationSchema),
    defaultValues: {
      companyName: "",
      registrationNumber: "",
      registeredAddress: "",
      physicalAddress: "",
      paidUpCapital: "",
      contactPhone: "",
      contactEmail: "",
      boGLicenseNumber: "",
      licenseExpiryDate: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: MfiRegistrationFormData) => {
      await apiRequest("/api/mfi-registration", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mfi-registration"] });
      setIsAddModalOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "MFI registration created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create MFI registration",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: MfiRegistrationFormData) => {
      await apiRequest(`/api/mfi-registration/${editingMfi.id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mfi-registration"] });
      setEditingMfi(null);
      form.reset();
      toast({
        title: "Success",
        description: "MFI registration updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update MFI registration",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`/api/mfi-registration/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mfi-registration"] });
      toast({
        title: "Success",
        description: "MFI registration deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete MFI registration",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: MfiRegistrationFormData) => {
    if (editingMfi) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (mfi: any) => {
    setEditingMfi(mfi);
    form.reset({
      companyName: mfi.companyName,
      registrationNumber: mfi.registrationNumber,
      registeredAddress: mfi.registeredAddress,
      physicalAddress: mfi.physicalAddress,
      paidUpCapital: mfi.paidUpCapital,
      contactPhone: mfi.contactPhone,
      contactEmail: mfi.contactEmail,
      boGLicenseNumber: mfi.boGLicenseNumber || "",
      licenseExpiryDate: mfi.licenseExpiryDate || "",
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this MFI registration?")) {
      deleteMutation.mutate(id);
    }
  };

  const formatCurrency = (amount: string) => {
    return `GHS ${parseFloat(amount).toLocaleString()}`;
  };

  const isCapitalCompliant = (capital: string) => {
    return parseFloat(capital) >= 2000000; // GHS 2M minimum
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">MFI Registration</h2>
          <p className="text-muted-foreground">
            Manage microfinance institution registration for BoG compliance
          </p>
        </div>
        <Dialog open={isAddModalOpen || !!editingMfi} onOpenChange={(open) => {
          if (!open) {
            setIsAddModalOpen(false);
            setEditingMfi(null);
            form.reset();
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsAddModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add MFI Registration
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingMfi ? "Edit MFI Registration" : "Add New MFI Registration"}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name</FormLabel>
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
                        <FormLabel>Registration Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter registration number" {...field} />
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
                      <FormLabel>Registered Address</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter registered address" {...field} />
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
                        <Textarea placeholder="Enter physical address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contactPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter contact phone" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="contactEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Enter contact email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="boGLicenseNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>BoG License Number (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter BoG license number" {...field} />
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
                        <FormLabel>License Expiry Date (Optional)</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsAddModalOpen(false);
                      setEditingMfi(null);
                      form.reset();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {editingMfi ? "Update" : "Create"} Registration
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {mfiRegistrations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No MFI Registrations</h3>
            <p className="text-muted-foreground text-center mb-4">
              Register your microfinance institution to ensure BoG compliance
            </p>
            <Button onClick={() => setIsAddModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add First Registration
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {mfiRegistrations.map((mfi: any) => (
            <Card key={mfi.id} className="relative">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Building className="h-5 w-5" />
                      {mfi.companyName}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Registration: {mfi.registrationNumber}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={isCapitalCompliant(mfi.paidUpCapital) ? "default" : "destructive"}>
                      {isCapitalCompliant(mfi.paidUpCapital) ? "Compliant" : "Non-Compliant"}
                    </Badge>
                    <Badge variant={mfi.isActive ? "default" : "secondary"}>
                      {mfi.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Paid Up Capital</p>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(mfi.paidUpCapital)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Minimum Required</p>
                        <p className="text-sm text-muted-foreground">GHS 2,000,000</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Contact Phone</p>
                        <p className="text-sm text-muted-foreground">{mfi.contactPhone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Contact Email</p>
                        <p className="text-sm text-muted-foreground">{mfi.contactEmail}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {mfi.boGLicenseNumber && (
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">BoG License</p>
                          <p className="text-sm text-muted-foreground">{mfi.boGLicenseNumber}</p>
                        </div>
                      </div>
                    )}
                    {mfi.licenseExpiryDate && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">License Expiry</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(mfi.licenseExpiryDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t flex justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Registered Address</p>
                    <p className="text-sm text-muted-foreground">{mfi.registeredAddress}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(mfi)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(mfi.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}