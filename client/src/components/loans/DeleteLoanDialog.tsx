import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { LoanBook } from '@shared/schema';

interface DeleteLoanDialogProps {
  isOpen: boolean;
  onClose: () => void;
  loan: LoanBook | null;
}

export default function DeleteLoanDialog({ isOpen, onClose, loan }: DeleteLoanDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteLoanMutation = useMutation({
    mutationFn: () => {
      if (!loan?.id) {
        throw new Error('No loan selected');
      }
      return apiClient.delete(`/loans/${loan.id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Loan deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/loans'] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete loan",
        variant: "destructive",
      });
    },
  });

  const handleDelete = () => {
    if (loan && loan.id) {
      deleteLoanMutation.mutate();
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the loan application
            {loan && ` for Customer ID ${loan.customerId}`} and remove it from the system.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDelete}
            disabled={deleteLoanMutation.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteLoanMutation.isPending ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}