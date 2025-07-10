import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Expense } from '@shared/schema';

interface DeleteExpenseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  expense: Expense | null;
}

export default function DeleteExpenseDialog({ isOpen, onClose, expense }: DeleteExpenseDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteExpenseMutation = useMutation({
    mutationFn: () => apiClient.delete(`/api/expenses/${expense?.id}`),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Expense record deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete expense record",
        variant: "destructive",
      });
    },
  });

  const handleDelete = () => {
    deleteExpenseMutation.mutate();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the expense record
            {expense && ` "${expense.description}"`} and remove it from the system.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDelete}
            disabled={deleteExpenseMutation.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteExpenseMutation.isPending ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}