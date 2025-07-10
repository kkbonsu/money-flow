import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { insertLoanBookSchema, InsertLoanBook, Customer } from '@shared/schema';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface AddLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddLoanModal({ isOpen, onClose }: AddLoanModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch customers for dropdown
  const { data: customers = [], isLoading: customersLoading } = useQuery({
    queryKey: ['/api/customers'],
  });
  
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<InsertLoanBook>({
    resolver: zodResolver(insertLoanBookSchema),
    defaultValues: {
      status: 'pending',
    },
  });

  const createLoanMutation = useMutation({
    mutationFn: (data: InsertLoanBook) => apiClient.post('/loans', data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Loan application created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/loans'] });
      reset();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create loan application",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertLoanBook) => {
    createLoanMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Loan</DialogTitle>
          <DialogDescription>
            Create a new loan application in the system.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="customerId">Select Customer</Label>
            <Controller
              name="customerId"
              control={control}
              render={({ field }) => (
                <Select 
                  value={field.value?.toString()} 
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  disabled={customersLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={customersLoading ? "Loading customers..." : "Select a customer"} />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer: Customer) => (
                      <SelectItem key={customer.id} value={customer.id.toString()}>
                        {customer.firstName} {customer.lastName} - {customer.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.customerId && (
              <p className="text-sm text-destructive mt-1">
                {errors.customerId.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="loanAmount">Loan Amount</Label>
            <Input
              id="loanAmount"
              type="number"
              step="0.01"
              {...register('loanAmount')}
              placeholder="Enter loan amount"
            />
            {errors.loanAmount && (
              <p className="text-sm text-destructive mt-1">
                {errors.loanAmount.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="interestRate">Interest Rate (%)</Label>
            <Input
              id="interestRate"
              type="number"
              step="0.01"
              {...register('interestRate', { valueAsNumber: true })}
              placeholder="Enter interest rate"
            />
            {errors.interestRate && (
              <p className="text-sm text-destructive mt-1">
                {errors.interestRate.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="term">Term (months)</Label>
            <Input
              id="term"
              type="number"
              {...register('term', { valueAsNumber: true })}
              placeholder="Enter loan term in months"
            />
            {errors.term && (
              <p className="text-sm text-destructive mt-1">
                {errors.term.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="purpose">Purpose</Label>
            <Textarea
              id="purpose"
              {...register('purpose')}
              placeholder="Enter loan purpose"
              rows={3}
            />
            {errors.purpose && (
              <p className="text-sm text-destructive mt-1">
                {errors.purpose.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="dateApplied">Date Applied</Label>
            <Input
              id="dateApplied"
              type="date"
              {...register('dateApplied')}
            />
            {errors.dateApplied && (
              <p className="text-sm text-destructive mt-1">
                {errors.dateApplied.message}
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
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="disbursed">Disbursed</SelectItem>
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
            <Button type="submit" disabled={createLoanMutation.isPending}>
              {createLoanMutation.isPending ? 'Creating...' : 'Create Loan'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}