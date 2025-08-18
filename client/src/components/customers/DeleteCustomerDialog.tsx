import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Customer } from '@shared/schema';

interface DeleteCustomerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
}

export default function DeleteCustomerDialog({ isOpen, onClose, customer }: DeleteCustomerDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Store customer ID locally to prevent race conditions
  const customerIdToDelete = customer?.id;

  const deleteCustomerMutation = useMutation({
    mutationFn: () => {
      if (!customerIdToDelete) {
        console.error('Delete customer mutation: No customer ID available', { customer, customerIdToDelete });
        throw new Error('No customer selected');
      }
      console.log('Delete customer mutation: Starting deletion for customer', customerIdToDelete);
      return apiRequest('DELETE', `/api/customers/${customerIdToDelete}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Customer deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete customer",
        variant: "destructive",
      });
    },
  });

  const handleDelete = () => {
    console.log('Handle delete clicked', { customer, customerIdToDelete });
    if (customerIdToDelete) {
      deleteCustomerMutation.mutate();
    } else {
      console.error('Handle delete: No customer ID available', { customer, customerIdToDelete });
      toast({
        title: "Error",
        description: "No customer selected for deletion",
        variant: "destructive",
      });
    }
  };

  if (!customer) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the customer{' '}
            <strong>{customer.firstName} {customer.lastName}</strong> and all associated data.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={deleteCustomerMutation.isPending}
          >
            {deleteCustomerMutation.isPending ? 'Deleting...' : 'Delete Customer'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}