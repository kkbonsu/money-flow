import { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { insertIncomeManagementSchema, InsertIncomeManagement, IncomeManagement } from '@shared/schema';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface EditIncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  income: IncomeManagement | null;
}

export default function EditIncomeModal({ isOpen, onClose, income }: EditIncomeModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<InsertIncomeManagement>({
    resolver: zodResolver(insertIncomeManagementSchema),
  });

  const updateIncomeMutation = useMutation({
    mutationFn: (data: InsertIncomeManagement) => apiClient.put(`/income/${income?.id}`, data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Income record updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/income'] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update income record",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (income && isOpen) {
      reset({
        source: income.source,
        amount: income.amount,
        category: income.category,
        date: income.date,
        description: income.description || '',
      });
    }
  }, [income, isOpen, reset]);

  const onSubmit = (data: InsertIncomeManagement) => {
    updateIncomeMutation.mutate(data);
  };

  if (!income) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Income Record</DialogTitle>
          <DialogDescription>
            Update income record information and details.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="source">Source</Label>
            <Input
              id="source"
              {...register('source')}
              placeholder="Enter income source"
            />
            {errors.source && (
              <p className="text-sm text-destructive mt-1">
                {errors.source.message}
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
                    <SelectItem value="interest">Interest</SelectItem>
                    <SelectItem value="fees">Fees</SelectItem>
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

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Enter description"
              rows={3}
            />
            {errors.description && (
              <p className="text-sm text-destructive mt-1">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateIncomeMutation.isPending}>
              {updateIncomeMutation.isPending ? 'Updating...' : 'Update Income'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}