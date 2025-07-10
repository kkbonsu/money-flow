import { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { insertExpenseSchema, InsertExpense, Expense } from '@shared/schema';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface EditExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense: Expense | null;
}

export default function EditExpenseModal({ isOpen, onClose, expense }: EditExpenseModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<InsertExpense>({
    resolver: zodResolver(insertExpenseSchema),
  });

  const updateExpenseMutation = useMutation({
    mutationFn: (data: InsertExpense) => apiClient.put(`/expenses/${expense?.id}`, data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Expense record updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update expense record",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (expense && isOpen) {
      reset({
        description: expense.description,
        amount: expense.amount,
        category: expense.category,
        vendor: expense.vendor || '',
        date: expense.date,
      });
    }
  }, [expense, isOpen, reset]);

  const onSubmit = (data: InsertExpense) => {
    updateExpenseMutation.mutate(data);
  };

  if (!expense) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Expense Record</DialogTitle>
          <DialogDescription>
            Update expense record information and details.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              {...register('description')}
              placeholder="Enter expense description"
            />
            {errors.description && (
              <p className="text-sm text-destructive mt-1">
                {errors.description.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              {...register('amount', { valueAsNumber: true })}
              placeholder="Enter amount"
            />
            {errors.amount && (
              <p className="text-sm text-destructive mt-1">
                {errors.amount.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="category">Category</Label>
            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="operations">Operations</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="utilities">Utilities</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.category && (
              <p className="text-sm text-destructive mt-1">
                {errors.category.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="vendor">Vendor</Label>
            <Input
              id="vendor"
              {...register('vendor')}
              placeholder="Enter vendor name (optional)"
            />
            {errors.vendor && (
              <p className="text-sm text-destructive mt-1">
                {errors.vendor.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              {...register('date')}
            />
            {errors.date && (
              <p className="text-sm text-destructive mt-1">
                {errors.date.message}
              </p>
            )}
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateExpenseMutation.isPending}>
              {updateExpenseMutation.isPending ? 'Updating...' : 'Update Expense'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}