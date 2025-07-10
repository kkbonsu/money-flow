import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { PettyCash } from '@shared/schema';

interface DeletePettyCashDialogProps {
  isOpen: boolean;
  onClose: () => void;
  record: PettyCash | null;
}

export default function DeletePettyCashDialog({ isOpen, onClose, record }: DeletePettyCashDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteRecordMutation = useMutation({
    mutationFn: () => apiClient.delete(`/petty-cash/${record?.id}`),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Petty cash record deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/petty-cash'] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete petty cash record",
        variant: "destructive",
      });
    },
  });

  const handleDelete = () => {
    deleteRecordMutation.mutate();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the petty cash record
            {record && ` "${record.description}"`} and remove it from the system.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDelete}
            disabled={deleteRecordMutation.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteRecordMutation.isPending ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}