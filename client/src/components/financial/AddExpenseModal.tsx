import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { insertExpenseSchema, InsertExpense } from '@shared/schema';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddExpenseModal({ isOpen, onClose }: AddExpenseModalProps) {
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
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
    },
  });

  const createExpenseMutation = useMutation({
    mutationFn: (data: InsertExpense) => apiClient.post('/expenses', data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Expense record created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
      reset();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create expense record",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertExpense) => {
    createExpenseMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Expense</DialogTitle>
          <DialogDescription>
            Add a new expense record to the system.
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
            <Button type="submit" disabled={createExpenseMutation.isPending}>
              {createExpenseMutation.isPending ? 'Creating...' : 'Create Expense'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}