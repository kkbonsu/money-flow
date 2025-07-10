import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { insertBankManagementSchema, InsertBankManagement } from '@shared/schema';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface AddBankAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddBankAccountModal({ isOpen, onClose }: AddBankAccountModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<InsertBankManagement>({
    resolver: zodResolver(insertBankManagementSchema),
    defaultValues: {
      status: 'active',
      balance: 0,
    },
  });

  const createAccountMutation = useMutation({
    mutationFn: (data: InsertBankManagement) => apiClient.post('/bank-accounts', data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Bank account created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/bank-accounts'] });
      reset();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create bank account",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertBankManagement) => {
    createAccountMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Bank Account</DialogTitle>
          <DialogDescription>
            Add a new bank account to the system.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="accountName">Account Name</Label>
            <Input
              id="accountName"
              {...register('accountName')}
              placeholder="Enter account name"
            />
            {errors.accountName && (
              <p className="text-sm text-destructive mt-1">
                {errors.accountName.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="bankName">Bank Name</Label>
            <Input
              id="bankName"
              {...register('bankName')}
              placeholder="Enter bank name"
            />
            {errors.bankName && (
              <p className="text-sm text-destructive mt-1">
                {errors.bankName.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="accountNumber">Account Number</Label>
            <Input
              id="accountNumber"
              {...register('accountNumber')}
              placeholder="Enter account number"
            />
            {errors.accountNumber && (
              <p className="text-sm text-destructive mt-1">
                {errors.accountNumber.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="balance">Balance</Label>
            <Input
              id="balance"
              type="number"
              step="0.01"
              {...register('balance', { valueAsNumber: true })}
              placeholder="Enter initial balance"
            />
            {errors.balance && (
              <p className="text-sm text-destructive mt-1">
                {errors.balance.message}
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
                    <SelectItem value="closed">Closed</SelectItem>
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

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createAccountMutation.isPending}>
              {createAccountMutation.isPending ? 'Creating...' : 'Create Account'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}