import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { insertCustomerSchema, InsertCustomer } from '@shared/schema';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Copy, Check } from 'lucide-react';

interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddCustomerModal({ isOpen, onClose }: AddCustomerModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [portalCredentials, setPortalCredentials] = useState<{
    email: string;
    password: string;
    loginUrl: string;
  } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<InsertCustomer>({
    resolver: zodResolver(insertCustomerSchema),
    defaultValues: {
      status: 'active',
    },
  });

  const createCustomerMutation = useMutation({
    mutationFn: (data: InsertCustomer) => apiClient.post('/customers', data),
    onSuccess: (response) => {
      // Store portal credentials if provided
      if (response.portalCredentials) {
        setPortalCredentials(response.portalCredentials);
      }
      
      toast({
        title: "Success",
        description: "Customer created successfully with portal access",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
      reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create customer",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertCustomer) => {
    createCustomerMutation.mutate(data);
  };

  const handleClose = () => {
    setPortalCredentials(null);
    setCopiedField(null);
    reset();
    onClose();
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {portalCredentials ? "Customer Portal Credentials" : "Add New Customer"}
          </DialogTitle>
          <DialogDescription>
            {portalCredentials 
              ? "Customer portal credentials have been generated. Please share these with the customer."
              : "Add a new customer to the system with their details."
            }
          </DialogDescription>
        </DialogHeader>
        
        {portalCredentials ? (
          <div className="space-y-4">
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                Customer Portal Access Created
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium">Login URL:</span> 
                    <code className="ml-2 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                      {window.location.origin}{portalCredentials.loginUrl}
                    </code>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(`${window.location.origin}${portalCredentials.loginUrl}`, 'url')}
                    className="ml-2"
                  >
                    {copiedField === 'url' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium">Email:</span> 
                    <code className="ml-2 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                      {portalCredentials.email}
                    </code>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(portalCredentials.email, 'email')}
                    className="ml-2"
                  >
                    {copiedField === 'email' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium">Password:</span> 
                    <code className="ml-2 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                      {portalCredentials.password}
                    </code>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(portalCredentials.password, 'password')}
                    className="ml-2"
                  >
                    {copiedField === 'password' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <p className="text-green-700 dark:text-green-300 text-sm mt-3">
                Please share these credentials with the customer. They can change their password after first login.
              </p>
            </div>
            
            <div className="flex justify-end pt-4">
              <Button onClick={handleClose} className="btn-primary">
                Done
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                {...register('firstName')}
                placeholder="Enter first name"
              />
              {errors.firstName && (
                <p className="text-sm text-destructive mt-1">
                  {errors.firstName.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                {...register('lastName')}
                placeholder="Enter last name"
              />
              {errors.lastName && (
                <p className="text-sm text-destructive mt-1">
                  {errors.lastName.message}
                </p>
              )}
            </div>
          </div>
          
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              placeholder="Enter email address"
            />
            {errors.email && (
              <p className="text-sm text-destructive mt-1">
                {errors.email.message}
              </p>
            )}
          </div>
          
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              {...register('phone')}
              placeholder="Enter phone number"
            />
            {errors.phone && (
              <p className="text-sm text-destructive mt-1">
                {errors.phone.message}
              </p>
            )}
          </div>
          
          <div>
            <Label htmlFor="nationalId">National ID</Label>
            <Input
              id="nationalId"
              {...register('nationalId')}
              placeholder="Enter national ID"
            />
            {errors.nationalId && (
              <p className="text-sm text-destructive mt-1">
                {errors.nationalId.message}
              </p>
            )}
          </div>
          
          <div>
            <Label htmlFor="creditScore">Credit Score</Label>
            <Input
              id="creditScore"
              type="number"
              {...register('creditScore', { valueAsNumber: true })}
              placeholder="Enter credit score"
            />
            {errors.creditScore && (
              <p className="text-sm text-destructive mt-1">
                {errors.creditScore.message}
              </p>
            )}
          </div>
          
          <div>
            <Label htmlFor="status">Status</Label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.status && (
              <p className="text-sm text-destructive mt-1">
                {errors.status.message}
              </p>
            )}
          </div>
          
          <div>
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              {...register('address')}
              placeholder="Enter address"
              rows={3}
            />
            {errors.address && (
              <p className="text-sm text-destructive mt-1">
                {errors.address.message}
              </p>
            )}
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="btn-primary"
              disabled={createCustomerMutation.isPending}
            >
              {createCustomerMutation.isPending ? 'Creating...' : 'Save Customer'}
            </Button>
          </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
