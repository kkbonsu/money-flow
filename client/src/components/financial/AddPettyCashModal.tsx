import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { insertPettyCashSchema, InsertPettyCash } from '@shared/schema';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface AddPettyCashModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddPettyCashModal({ isOpen, onClose }: AddPettyCashModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<InsertPettyCash>({
    resolver: zodResolver(insertPettyCashSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
    },
  });

  const createRecordMutation = useMutation({
    mutationFn: (data: InsertPettyCash) => apiClient.post('/petty-cash', data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Petty cash record created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/petty-cash'] });
      reset();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create petty cash record",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertPettyCash) => {
    createRecordMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Petty Cash Record</DialogTitle>
          <DialogDescription>
            Add a new petty cash transaction to the system.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              {...register('description')}
              placeholder="Enter description"
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
            <Label htmlFor="type">Type</Label>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.type && (
              <p className="text-sm text-destructive mt-1">
                {errors.type.message}
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
            <Label htmlFor="purpose">Purpose</Label>
            <Textarea
              id="purpose"
              {...register('purpose')}
              placeholder="Enter purpose (optional)"
              rows={3}
            />
            {errors.purpose && (
              <p className="text-sm text-destructive mt-1">
                {errors.purpose.message}
              </p>
            )}
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createRecordMutation.isPending}>
              {createRecordMutation.isPending ? 'Creating...' : 'Create Record'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}