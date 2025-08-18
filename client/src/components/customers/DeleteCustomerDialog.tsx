import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Customer } from '@shared/schema';
import { useState, useEffect } from 'react';

interface DeleteCustomerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
}

export default function DeleteCustomerDialog({ isOpen, onClose, customer }: DeleteCustomerDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Store customer data locally to prevent race conditions
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  // Update local customer when dialog opens with a customer
  useEffect(() => {
    if (isOpen && customer) {
      setCustomerToDelete(customer);
    } else if (!isOpen) {
      // Clear customer when dialog closes
      setCustomerToDelete(null);
    }
  }, [isOpen, customer]);

  const deleteCustomerMutation = useMutation({
    mutationFn: () => {
      if (!customerToDelete?.id) {
        throw new Error('No customer selected');
      }
      return apiRequest('DELETE', `/api/customers/${customerToDelete.id}`);
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
    if (customerToDelete?.id) {
      deleteCustomerMutation.mutate();
    } else {
      toast({
        title: "Error",
        description: "No customer selected for deletion",
        variant: "destructive",
      });
    }
  };

  if (!customerToDelete) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the customer{' '}
            <strong>{customerToDelete.firstName} {customerToDelete.lastName}</strong> and all associated data.
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