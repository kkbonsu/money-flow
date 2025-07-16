import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
      name: "",
      sharesOwned: 0,
      ownershipPercentage: "",
      nationality: "",
      idNumber: "",
      contactPhone: "",
      contactEmail: ""
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertShareholder) => {
      return await apiRequest('/api/shareholders', {
        method: 'POST',
        body: JSON.stringify(data)
      });
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
      return await apiRequest(`/api/shareholders/${editingShareholder?.id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
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
      return await apiRequest(`/api/shareholders/${id}`, {
        method: 'DELETE'
      });
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
      name: shareholder.name,
      sharesOwned: shareholder.sharesOwned,
      ownershipPercentage: shareholder.ownershipPercentage,
      nationality: shareholder.nationality,
      idNumber: shareholder.idNumber,
      contactPhone: shareholder.contactPhone || "",
      contactEmail: shareholder.contactEmail || ""
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
  const totalPercentage = shareholders.reduce((sum, s) => sum + parseFloat(s.ownershipPercentage), 0);

  return (
    <div className="space-y-6">
      <Card className="bg-white/10 dark:bg-gray-900/10 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Shareholder Management
          </CardTitle>
          <CardDescription>
            Manage your company shareholders and ownership structure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{shareholders.length}</div>
                <div className="text-sm text-gray-600">Total Shareholders</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{totalShares.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Total Shares</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{totalPercentage.toFixed(2)}%</div>
                <div className="text-sm text-gray-600">Total Ownership</div>
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
                    <TableCell>{parseFloat(shareholder.ownershipPercentage).toFixed(2)}%</TableCell>
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
                        <Input placeholder="Enter full name" {...field} />
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
                        <Input placeholder="Enter nationality" {...field} />
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
                        <Input placeholder="Enter ID number" {...field} />
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
                        <Input type="number" placeholder="Enter number of shares" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ownershipPercentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Percent className="h-4 w-4" />
                        Ownership Percentage
                      </FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="Enter percentage" {...field} />
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
                        <Input placeholder="Enter phone number" {...field} />
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
                        <Input type="email" placeholder="Enter email address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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