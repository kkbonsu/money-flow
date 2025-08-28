import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/customerQueryClient';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { 
  CreditCard, 
  Calendar, 
  DollarSign, 
  TrendingUp,
  FileText,
  Eye,
  Download,
  Plus
} from 'lucide-react';
import { format } from 'date-fns';
import type { Customer, LoanBook, PaymentSchedule } from '@shared/schema';

const loanApplicationSchema = z.object({
  amount: z.string().min(1, 'Amount is required'),
  purpose: z.string().min(1, 'Purpose is required'),
  duration: z.string().min(1, 'Duration is required'),
  collateral: z.string().optional(),
  monthlyIncome: z.string().min(1, 'Monthly income is required'),
  employmentStatus: z.string().min(1, 'Employment status is required'),
  additionalInfo: z.string().optional(),
});

type LoanApplicationForm = z.infer<typeof loanApplicationSchema>;

export default function CustomerLoans() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showApplication, setShowApplication] = useState(false);

  const form = useForm<LoanApplicationForm>({
    resolver: zodResolver(loanApplicationSchema),
    defaultValues: {
      amount: '',
      purpose: '',
      duration: '',
      collateral: '',
      monthlyIncome: '',
      employmentStatus: '',
      additionalInfo: '',
    },
  });

  const applyLoanMutation = useMutation({
    mutationFn: async (data: LoanApplicationForm) => {
      return apiRequest('/api/customer/loan-application', 'POST', data);
    },
    onSuccess: () => {
      toast({ 
        title: "Success", 
        description: "Your loan application has been submitted successfully!" 
      });
      setShowApplication(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/customer/loans'] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to submit loan application",
        variant: "destructive" 
      });
    },
  });

  const handleSubmitApplication = (data: LoanApplicationForm) => {
    applyLoanMutation.mutate(data);
  };
  const { data: loans, isLoading } = useQuery<LoanBook[]>({
    queryKey: ['/api/customer/loans'],
  });

  const { data: customer } = useQuery<Customer>({
    queryKey: ['/api/customer/profile'],
  });

  const { data: payments } = useQuery<PaymentSchedule[]>({
    queryKey: ['/api/customer/payments'],
  });

  const { data: upcomingPayments } = useQuery<PaymentSchedule[]>({
    queryKey: ['/api/customer/payments/upcoming'],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'disbursed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const calculateProgress = (loanId: number) => {
    if (!payments) return 0;
    
    const loanPayments = payments.filter((payment: any) => payment.loanId === loanId);
    const totalPayments = loanPayments.length;
    const paidPayments = loanPayments.filter((payment: any) => payment.status === 'paid').length;
    
    return totalPayments > 0 ? (paidPayments / totalPayments) * 100 : 0;
  };

  const getNextPaymentDate = (loanId: number) => {
    if (!upcomingPayments) return null;
    
    const nextPayment = upcomingPayments
      .filter((payment: any) => payment.loanId === loanId)
      .sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];
    
    return nextPayment ? new Date(nextPayment.dueDate) : null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              My Loans
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              View and manage all your loan applications and active loans
            </p>
          </div>
          <Dialog open={showApplication} onOpenChange={setShowApplication}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Apply for Loan
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Loan Application
                </DialogTitle>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmitApplication)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Loan Amount *</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="e.g. 50000" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="duration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duration (months) *</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="e.g. 12" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="purpose"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Loan Purpose *</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select loan purpose" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="business_expansion">Business Expansion</SelectItem>
                              <SelectItem value="working_capital">Working Capital</SelectItem>
                              <SelectItem value="equipment_purchase">Equipment Purchase</SelectItem>
                              <SelectItem value="inventory">Inventory</SelectItem>
                              <SelectItem value="education">Education</SelectItem>
                              <SelectItem value="medical">Medical Emergency</SelectItem>
                              <SelectItem value="home_improvement">Home Improvement</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="monthlyIncome"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Monthly Income *</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="e.g. 25000" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="employmentStatus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Employment Status *</FormLabel>
                          <FormControl>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select employment status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="employed">Employed</SelectItem>
                                <SelectItem value="self_employed">Self Employed</SelectItem>
                                <SelectItem value="business_owner">Business Owner</SelectItem>
                                <SelectItem value="freelancer">Freelancer</SelectItem>
                                <SelectItem value="student">Student</SelectItem>
                                <SelectItem value="retired">Retired</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="collateral"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Collateral/Security (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Describe any collateral you can provide" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="additionalInfo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Information (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Any additional information about your application" 
                            rows={3}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-4 justify-end">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowApplication(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={applyLoanMutation.isPending}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      {applyLoanMutation.isPending ? 'Submitting...' : 'Submit Application'}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Loan Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="glass-card slide-in-up">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Loans</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {loans?.length || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card slide-in-up" style={{ animationDelay: '0.1s' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Loans</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {loans?.filter((loan: any) => loan.status === 'active' || loan.status === 'disbursed').length || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card slide-in-up" style={{ animationDelay: '0.2s' }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Outstanding</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    ${loans?.reduce((sum: number, loan: any) => sum + parseFloat(loan.outstandingBalance || '0'), 0).toLocaleString() || '0'}
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Loans List */}
        <div className="space-y-6">
          {loans && loans.length > 0 ? (
            loans.map((loan: any, index: number) => (
              <Card key={loan.id} className="glass-card slide-in-up" style={{ animationDelay: `${0.1 * index}s` }}>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        <CreditCard className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Loan #{loan.id}</CardTitle>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {loan.purpose || 'General Purpose'}
                        </p>
                      </div>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={getStatusColor(loan.status)}
                    >
                      {loan.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Loan Amount</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        ${parseFloat(loan.loanAmount).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Outstanding Balance</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        ${parseFloat(loan.outstandingBalance || '0').toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Interest Rate</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {loan.interestRate}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Term</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {loan.term} months
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Application Date</p>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {format(new Date(loan.createdAt), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Next Payment Date</p>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {getNextPaymentDate(loan.id) ? format(getNextPaymentDate(loan.id)!, 'MMM dd, yyyy') : 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar for Active Loans */}
                  {(loan.status === 'active' || loan.status === 'disbursed') && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Repayment Progress
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {Math.round(calculateProgress(loan.id))}%
                        </span>
                      </div>
                      <Progress 
                        value={calculateProgress(loan.id)} 
                        className="h-2"
                      />
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      View Details
                    </Button>
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Documents
                    </Button>
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                      <Download className="w-4 h-4" />
                      Download Statement
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="glass-card">
              <CardContent className="p-8 text-center">
                <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No loans found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  You don't have any loans yet. Contact us to apply for a loan.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}