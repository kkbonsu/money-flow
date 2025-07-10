import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Staff } from '@shared/schema';

interface DeleteStaffDialogProps {
  isOpen: boolean;
  onClose: () => void;
  staff: Staff | null;
}

export default function DeleteStaffDialog({ isOpen, onClose, staff }: DeleteStaffDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Debug logging
  console.log('DeleteStaffDialog rendered with staff:', staff);

  const deleteStaffMutation = useMutation({
    mutationFn: () => {
      if (!staff?.id) {
        throw new Error('No staff member selected');
      }
      return apiClient.delete(`/staff/${staff.id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Staff member deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/staff'] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete staff member",
        variant: "destructive",
      });
    },
  });

  const handleDelete = () => {
    console.log('Delete button clicked, staff:', staff);
    if (staff && staff.id) {
      console.log('Proceeding with deletion for staff ID:', staff.id);
      deleteStaffMutation.mutate();
    } else {
      console.log('No staff selected, showing error');
      toast({
        title: "Error",
        description: "No staff member selected for deletion",
        variant: "destructive",
      });
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the staff member
            {staff && ` ${staff.firstName} ${staff.lastName}`} and remove them from the system.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDelete}
            disabled={deleteStaffMutation.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteStaffMutation.isPending ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}