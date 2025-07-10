import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { insertLoanBookSchema, InsertLoanBook } from '@shared/schema';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface AddLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddLoanModal({ isOpen, onClose }: AddLoanModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: customers = [] } = useQuery({
    queryKey: ['/api/customers'],
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<InsertLoanBook>({
    resolver: zodResolver(insertLoanBookSchema),
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
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create loan",
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
          <DialogTitle>New Loan Application</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="customerId">Customer</Label>
            <Select onValueChange={(value) => setValue('customerId', parseInt(value))}>
              <SelectTrigger>
                <SelectValue placeholder="Select customer" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((customer: any) => (
                  <SelectItem key={customer.id} value={customer.id.toString()}>
                    {customer.firstName} {customer.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.customerId && (
              <p className="text-sm text-destructive mt-1">
                Customer is required
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
              {...register('interestRate')}
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
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="btn-primary"
              disabled={createLoanMutation.isPending}
            >
              {createLoanMutation.isPending ? 'Creating...' : 'Create Loan'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
