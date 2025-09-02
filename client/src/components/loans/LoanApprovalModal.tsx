import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { LoanBook, Customer, User } from '@shared/schema';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { CheckCircle, XCircle, User as UserIcon, CreditCard, Calendar, DollarSign, FileText, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { z } from 'zod';

interface LoanApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  loan: LoanBook | null;
}

const approvalSchema = z.object({
  assignedOfficer: z.number().optional(),
  status: z.enum(['pending', 'approved', 'rejected', 'disbursed']),
  rejectionReason: z.string().optional(),
  disbursedAmount: z.union([z.string(), z.number()]).transform((val) => val.toString()).optional(),
  notes: z.string().optional(),
});

type ApprovalFormData = z.infer<typeof approvalSchema>;

export default function LoanApprovalModal({ isOpen, onClose, loan }: LoanApprovalModalProps) {
  const [actionType, setActionType] = useState<'assign' | 'approve' | 'reject' | 'disburse' | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch users for loan officer assignment
  const { data: users = [] } = useQuery({
    queryKey: ['/api/users'],
    enabled: isOpen,
  });

  // Fetch customers for loan details
  const { data: customers = [] } = useQuery({
    queryKey: ['/api/customers'],
    enabled: isOpen,
  });

  // Fetch loan products for details
  const { data: loanProducts = [] } = useQuery({
    queryKey: ['/api/loan-products'],
    enabled: isOpen,
  });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    watch,
  } = useForm<ApprovalFormData>({
    resolver: zodResolver(approvalSchema),
    defaultValues: {
      status: loan?.status as any,
      assignedOfficer: loan?.assignedOfficer || undefined,
      notes: loan?.notes || '',
    },
  });

  const selectedStatus = watch('status');

  const updateLoanMutation = useMutation({
    mutationFn: async (data: ApprovalFormData) => {
      // Build the complete loan data with only the changed fields
      const updateData: any = {
        customerId: loan?.customerId,
        loanProductId: loan?.loanProductId,
        loanAmount: loan?.loanAmount,
        interestRate: loan?.interestRate,
        term: loan?.term,
        status: data.status,
        purpose: loan?.purpose,
        dateApplied: loan?.dateApplied,
        assignedOfficer: data.assignedOfficer,
        rejectionReason: data.rejectionReason,
        disbursedAmount: data.disbursedAmount,
        notes: data.notes,
        approvalDate: (data.status === 'approved' || data.status === 'disbursed') ? new Date().toISOString() : undefined,
        disbursementDate: data.status === 'disbursed' ? new Date().toISOString() : undefined,
        approvedBy: (data.status === 'approved' || data.status === 'disbursed') ? user?.id : undefined,
        disbursedBy: data.status === 'disbursed' ? user?.id : undefined
      };

      return apiClient.put(`/loans/${loan?.id}`, updateData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Loan updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/loans'] });
      onClose();
      reset();
      setActionType(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update loan",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ApprovalFormData) => {
    updateLoanMutation.mutate(data);
  };

  if (!loan) return null;

  // Helper functions
  const getCustomerName = (customerId: number) => {
    const customer = customers.find((c: Customer) => c.id === customerId);
    return customer ? `${customer.firstName} ${customer.lastName}` : 'Unknown Customer';
  };

  const getUserName = (userId: number | null) => {
    if (!userId) return 'Not assigned';
    const user = users.find((u: User) => u.id === userId);
    return user ? user.username : 'Unknown User';
  };

  const getLoanProductName = (loanProductId: number | null) => {
    if (!loanProductId) return 'No product selected';
    const product = loanProducts.find((p: any) => p.id === loanProductId);
    return product ? product.name : 'Unknown Product';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'disbursed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'disbursed': return <DollarSign className="h-4 w-4 text-blue-600" />;
      default: return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Loan Approval Workflow - #{loan.id}
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Loan Details */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Loan Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Customer</p>
                    <p className="font-semibold">{getCustomerName(loan.customerId)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    <Badge className={getStatusColor(loan.status)}>
                      {getStatusIcon(loan.status)}
                      <span className="ml-1">{loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}</span>
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Loan Amount</p>
                    <p className="font-semibold text-green-600">GHS {parseFloat(loan.loanAmount).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Interest Rate</p>
                    <p className="font-semibold">{loan.interestRate}%</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Term</p>
                    <p className="font-semibold">{loan.term} months</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Loan Product</p>
                    <p className="font-semibold">{getLoanProductName(loan.loanProductId)}</p>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Purpose</p>
                  <p className="text-sm">{loan.purpose || 'No purpose specified'}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Date Applied</p>
                    <p className="text-sm">{loan.dateApplied ? format(new Date(loan.dateApplied), 'MMM dd, yyyy') : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Assigned Officer</p>
                    <p className="text-sm">{getUserName(loan.assignedOfficer)}</p>
                  </div>
                </div>
                
                {loan.notes && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Notes</p>
                    <p className="text-sm bg-gray-50 dark:bg-gray-800 p-2 rounded">{loan.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Approval Actions */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserIcon className="h-5 w-5" />
                  Loan Actions
                </CardTitle>
                <CardDescription>
                  Assign loan officer, approve, reject, or disburse loan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <Label htmlFor="assignedOfficer">Assign Loan Officer</Label>
                    <Controller
                      name="assignedOfficer"
                      control={control}
                      render={({ field }) => (
                        <Select 
                          value={field.value?.toString() || ''} 
                          onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select loan officer" />
                          </SelectTrigger>
                          <SelectContent>
                            {users.filter((user: User) => user.role === 'manager' || user.role === 'admin').map((user: User) => (
                              <SelectItem key={user.id} value={user.id.toString()}>
                                {user.firstName} {user.lastName} ({user.username})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  <div>
                    <Label htmlFor="status">Loan Status</Label>
                    <Controller
                      name="status"
                      control={control}
                      render={({ field }) => (
                        <Select 
                          value={field.value} 
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                            <SelectItem value="disbursed">Disbursed</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  {selectedStatus === 'rejected' && (
                    <div>
                      <Label htmlFor="rejectionReason">Rejection Reason</Label>
                      <Textarea
                        id="rejectionReason"
                        {...register('rejectionReason')}
                        placeholder="Enter reason for rejection"
                        rows={3}
                      />
                      {errors.rejectionReason && (
                        <p className="text-sm text-destructive mt-1">
                          {errors.rejectionReason.message}
                        </p>
                      )}
                    </div>
                  )}

                  {selectedStatus === 'disbursed' && (
                    <div>
                      <Label htmlFor="disbursedAmount">Disbursed Amount</Label>
                      <Input
                        id="disbursedAmount"
                        type="number"
                        step="0.01"
                        {...register('disbursedAmount')}
                        placeholder="Enter disbursed amount"
                      />
                      {errors.disbursedAmount && (
                        <p className="text-sm text-destructive mt-1">
                          {errors.disbursedAmount.message}
                        </p>
                      )}
                    </div>
                  )}

                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      {...register('notes')}
                      placeholder="Add any additional notes"
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onClose}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={updateLoanMutation.isPending}
                    >
                      {updateLoanMutation.isPending ? "Updating..." : "Update Loan"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}