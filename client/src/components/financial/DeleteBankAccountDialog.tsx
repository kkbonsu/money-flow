import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { BankManagement } from '@shared/schema';

interface DeleteBankAccountDialogProps {
  isOpen: boolean;
  onClose: () => void;
  account: BankManagement | null;
}

export default function DeleteBankAccountDialog({ isOpen, onClose, account }: DeleteBankAccountDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const accountIdToDelete = account?.id;

  const deleteAccountMutation = useMutation({
    mutationFn: () => {
      if (!accountIdToDelete) {
        throw new Error('No bank account selected');
      }
      return apiClient.delete(`/bank-accounts/${accountIdToDelete}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Bank account deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/bank-accounts'] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete bank account",
        variant: "destructive",
      });
    },
  });

  const handleDelete = () => {
    if (accountIdToDelete) {
      deleteAccountMutation.mutate();
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the bank account
            {account && ` "${account.accountName}"`} and remove it from the system.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDelete}
            disabled={deleteAccountMutation.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteAccountMutation.isPending ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}