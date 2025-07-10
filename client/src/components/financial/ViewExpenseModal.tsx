import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Expense } from '@shared/schema';

interface ViewExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense: Expense | null;
}

export default function ViewExpenseModal({ isOpen, onClose, expense }: ViewExpenseModalProps) {
  if (!expense) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'operations':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'marketing':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'utilities':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'other':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Expense Record Details</DialogTitle>
          <DialogDescription>
            View complete expense record information and details.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Expense Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Description</p>
                  <p className="text-sm">{expense.description}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Amount</p>
                  <p className="text-sm font-bold">{formatCurrency(expense.amount)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Category</p>
                  <Badge className={getCategoryColor(expense.category)}>
                    {expense.category}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Date</p>
                  <p className="text-sm">{new Date(expense.date).toLocaleDateString()}</p>
                </div>
                {expense.vendor && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Vendor</p>
                    <p className="text-sm">{expense.vendor}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Record Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Record ID</p>
                  <p className="text-sm">{expense.id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Created Date</p>
                  <p className="text-sm">{new Date(expense.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end">
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}