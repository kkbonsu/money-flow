import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { IncomeManagement } from '@shared/schema';

interface DeleteIncomeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  income: IncomeManagement | null;
}

export default function DeleteIncomeDialog({ isOpen, onClose, income }: DeleteIncomeDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const incomeIdToDelete = income?.id;

  const deleteIncomeMutation = useMutation({
    mutationFn: () => {
      if (!incomeIdToDelete) {
        throw new Error('No income record selected');
      }
      return apiClient.delete(`/income/${incomeIdToDelete}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Income record deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/income'] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete income record",
        variant: "destructive",
      });
    },
  });

  const handleDelete = () => {
    if (incomeIdToDelete) {
      deleteIncomeMutation.mutate();
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the income record
            {income && ` from ${income.source}`} and remove it from the system.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDelete}
            disabled={deleteIncomeMutation.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteIncomeMutation.isPending ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}