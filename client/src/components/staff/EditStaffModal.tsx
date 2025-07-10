import { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { insertStaffSchema, InsertStaff, Staff } from '@shared/schema';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface EditStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: Staff | null;
}

export default function EditStaffModal({ isOpen, onClose, staff }: EditStaffModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<InsertStaff>({
    resolver: zodResolver(insertStaffSchema),
  });

  const updateStaffMutation = useMutation({
    mutationFn: (data: InsertStaff) => apiClient.put(`/staff/${staff?.id}`, data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Staff member updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/staff'] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update staff member",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (staff && isOpen) {
      reset({
        firstName: staff.firstName,
        lastName: staff.lastName,
        email: staff.email,
        phone: staff.phone,
        position: staff.position,
        department: staff.department,
        hireDate: staff.hireDate ? new Date(staff.hireDate).toISOString().split('T')[0] : '',
        salary: staff.salary,
        status: staff.status,
      });
    }
  }, [staff, isOpen, reset]);

  const onSubmit = (data: InsertStaff) => {
    updateStaffMutation.mutate(data);
  };

  if (!staff) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Staff Member</DialogTitle>
          <DialogDescription>
            Update staff member information and details.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                {...register('firstName')}
                placeholder="Enter first name"
              />
              {errors.firstName && (
                <p className="text-sm text-destructive mt-1">
                  {errors.firstName.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                {...register('lastName')}
                placeholder="Enter last name"
              />
              {errors.lastName && (
                <p className="text-sm text-destructive mt-1">
                  {errors.lastName.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              placeholder="Enter email address"
            />
            {errors.email && (
              <p className="text-sm text-destructive mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              {...register('phone')}
              placeholder="Enter phone number"
            />
            {errors.phone && (
              <p className="text-sm text-destructive mt-1">
                {errors.phone.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="position">Position</Label>
            <Input
              id="position"
              {...register('position')}
              placeholder="Enter position"
            />
            {errors.position && (
              <p className="text-sm text-destructive mt-1">
                {errors.position.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="department">Department</Label>
            <Input
              id="department"
              {...register('department')}
              placeholder="Enter department"
            />
            {errors.department && (
              <p className="text-sm text-destructive mt-1">
                {errors.department.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="hireDate">Hire Date</Label>
            <Input
              id="hireDate"
              type="date"
              {...register('hireDate')}
            />
            {errors.hireDate && (
              <p className="text-sm text-destructive mt-1">
                {errors.hireDate.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="salary">Salary</Label>
            <Input
              id="salary"
              type="number"
              step="0.01"
              {...register('salary', { valueAsNumber: true })}
              placeholder="Enter salary"
            />
            {errors.salary && (
              <p className="text-sm text-destructive mt-1">
                {errors.salary.message}
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
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
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
            <Button type="submit" disabled={updateStaffMutation.isPending}>
              {updateStaffMutation.isPending ? 'Updating...' : 'Update Staff'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}