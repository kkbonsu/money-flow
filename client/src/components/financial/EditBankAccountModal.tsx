import { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { insertBankManagementSchema, InsertBankManagement, BankManagement } from '@shared/schema';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface EditBankAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: BankManagement | null;
}

export default function EditBankAccountModal({ isOpen, onClose, account }: EditBankAccountModalProps) {
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
  });

  const updateAccountMutation = useMutation({
    mutationFn: (data: InsertBankManagement) => apiClient.put(`/bank-accounts/${account?.id}`, data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Bank account updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/bank-accounts'] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update bank account",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (account && isOpen) {
      reset({
        accountName: account.accountName,
        bankName: account.bankName,
        accountNumber: account.accountNumber,
        balance: account.balance,
        status: account.status,
      });
    }
  }, [account, isOpen, reset]);

  const onSubmit = (data: InsertBankManagement) => {
    updateAccountMutation.mutate(data);
  };

  if (!account) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Bank Account</DialogTitle>
          <DialogDescription>
            Update bank account information and details.
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
              placeholder="Enter balance"
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
            <Button type="submit" disabled={updateAccountMutation.isPending}>
              {updateAccountMutation.isPending ? 'Updating...' : 'Update Account'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}