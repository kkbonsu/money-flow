import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertShareholderSchema, type Shareholder, type InsertShareholder } from "@shared/schema";
import { Users, Plus, Edit, Trash2, Mail, Phone, Percent, Hash, Flag } from "lucide-react";

export function ShareholderManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingShareholder, setEditingShareholder] = useState<Shareholder | null>(null);

  const { data: shareholders = [], isLoading } = useQuery<Shareholder[]>({
    queryKey: ['/api/shareholders']
  });

  const form = useForm<InsertShareholder>({
    resolver: zodResolver(insertShareholderSchema),
    defaultValues: {
      shareholderType: "local",
      name: "",
      nationality: "",
      idType: "ghana_card",
      idNumber: "",
      address: "",
      contactPhone: "",
      contactEmail: "",
      sharesOwned: 0,
      sharePercentage: "",
      investmentAmount: "",
      investmentCurrency: "GHS"
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertShareholder) => {
      return await apiRequest('POST', '/api/shareholders', data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Shareholder created successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/shareholders'] });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create shareholder",
        variant: "destructive"
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: InsertShareholder) => {
      return await apiRequest('PUT', `/api/shareholders/${editingShareholder?.id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Shareholder updated successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/shareholders'] });
      setIsDialogOpen(false);
      setEditingShareholder(null);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update shareholder",
        variant: "destructive"
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('DELETE', `/api/shareholders/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Shareholder deleted successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/shareholders'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete shareholder",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (data: InsertShareholder) => {
    if (editingShareholder) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (shareholder: Shareholder) => {
    setEditingShareholder(shareholder);
    form.reset({
      shareholderType: shareholder.shareholderType || "local",
      name: shareholder.name,
      nationality: shareholder.nationality,
      idType: shareholder.idType || "ghana_card",
      idNumber: shareholder.idNumber,
      address: shareholder.address || "",
      contactPhone: shareholder.contactPhone || "",
      contactEmail: shareholder.contactEmail || "",
      sharesOwned: shareholder.sharesOwned,
      sharePercentage: shareholder.sharePercentage || "",
      investmentAmount: shareholder.investmentAmount || "",
      investmentCurrency: shareholder.investmentCurrency || "GHS"
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this shareholder?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleAddNew = () => {
    setEditingShareholder(null);
    form.reset();
    setIsDialogOpen(true);
  };

  const totalShares = shareholders.reduce((sum, s) => sum + s.sharesOwned, 0);
  const totalPercentage = shareholders.reduce((sum, s) => sum + parseFloat(s.sharePercentage || "0"), 0);

  return (
    <div className="space-y-6">
      <Card className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            <Users className="h-5 w-5" />
            Shareholder Management
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-300">
            Manage your company shareholders and ownership structure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{shareholders.length}</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Total Shareholders</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{totalShares.toLocaleString()}</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Total Shares</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{totalPercentage.toFixed(2)}%</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Total Ownership</div>
              </div>
            </div>
            <Button onClick={handleAddNew} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Shareholder
            </Button>
          </div>

          {isLoading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ) : shareholders.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">No Shareholders Found</h3>
              <p className="text-gray-600 mb-4">Add shareholders to track your company's ownership structure.</p>
              <Button onClick={handleAddNew}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Shareholder
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Shares Owned</TableHead>
                  <TableHead>Ownership %</TableHead>
                  <TableHead>Nationality</TableHead>
                  <TableHead>ID Number</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shareholders.map((shareholder) => (
                  <TableRow key={shareholder.id}>
                    <TableCell className="font-medium">{shareholder.name}</TableCell>
                    <TableCell>{shareholder.sharesOwned.toLocaleString()}</TableCell>
                    <TableCell>{parseFloat(shareholder.sharePercentage || "0").toFixed(2)}%</TableCell>
                    <TableCell>{shareholder.nationality}</TableCell>
                    <TableCell>{shareholder.idNumber}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {shareholder.contactPhone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {shareholder.contactPhone}
                          </div>
                        )}
                        {shareholder.contactEmail && (
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {shareholder.contactEmail}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(shareholder)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(shareholder.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle>
              {editingShareholder ? 'Edit Shareholder' : 'Add New Shareholder'}
            </DialogTitle>
            <DialogDescription>
              {editingShareholder ? 'Update shareholder information' : 'Add a new shareholder to your company'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter full name" 
                          {...field}
                          className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nationality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Flag className="h-4 w-4" />
                        Nationality
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter nationality" 
                          {...field}
                          className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="idNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Hash className="h-4 w-4" />
                        ID Number
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter ID number" 
                          {...field}
                          className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sharesOwned"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shares Owned</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Enter number of shares" 
                          {...field}
                          className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sharePercentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Percent className="h-4 w-4" />
                        Ownership Percentage
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="Enter percentage" 
                          {...field}
                          className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
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
                      <FormLabel className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Contact Phone
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter phone number" 
                          {...field}
                          className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
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
                      <FormLabel className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Contact Email
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="Enter email address" 
                          {...field}
                          className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="shareholderType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shareholder Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100">
                            <SelectValue placeholder="Select shareholder type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                          <SelectItem value="local">Local Shareholder</SelectItem>
                          <SelectItem value="foreign">Foreign Shareholder</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="idType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ID Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100">
                            <SelectValue placeholder="Select ID type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                          <SelectItem value="ghana_card">Ghana Card</SelectItem>
                          <SelectItem value="passport">Passport</SelectItem>
                          <SelectItem value="drivers_license">Driver's License</SelectItem>
                          <SelectItem value="voters_id">Voter's ID</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="investmentAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Investment Amount</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="Enter investment amount" 
                          {...field}
                          className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="investmentCurrency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Investment Currency</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100">
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                          <SelectItem value="GHS">GHS - Ghana Cedi</SelectItem>
                          <SelectItem value="USD">USD - US Dollar</SelectItem>
                          <SelectItem value="EUR">EUR - Euro</SelectItem>
                          <SelectItem value="GBP">GBP - British Pound</SelectItem>
                        </SelectContent>
                      </Select>
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
                      <Textarea 
                        placeholder="Enter shareholder address" 
                        {...field}
                        className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save Shareholder'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}