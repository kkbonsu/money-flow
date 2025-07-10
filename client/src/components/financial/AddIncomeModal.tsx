import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { insertIncomeManagementSchema, InsertIncomeManagement } from '@shared/schema';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface AddIncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddIncomeModal({ isOpen, onClose }: AddIncomeModalProps) {
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
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
    },
  });

  const createIncomeMutation = useMutation({
    mutationFn: (data: InsertIncomeManagement) => apiClient.post('/income', data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Income record created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/income'] });
      reset();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create income record",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertIncomeManagement) => {
    createIncomeMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Income</DialogTitle>
          <DialogDescription>
            Add a new income record to the system.
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
            <Button type="submit" disabled={createIncomeMutation.isPending}>
              {createIncomeMutation.isPending ? 'Creating...' : 'Create Income'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}