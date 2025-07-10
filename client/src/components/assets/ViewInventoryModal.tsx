import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Inventory } from '@shared/schema';

interface ViewInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: Inventory | null;
}

export default function ViewInventoryModal({ isOpen, onClose, item }: ViewInventoryModalProps) {
  if (!item) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_stock':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'low_stock':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'out_of_stock':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Inventory Item Details</DialogTitle>
          <DialogDescription>
            View complete inventory item information and details.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Item Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Item Name</p>
                  <p className="text-sm">{item.itemName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Category</p>
                  <p className="text-sm">{item.category || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Quantity</p>
                  <p className="text-sm font-bold">{item.quantity}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Unit Price</p>
                  <p className="text-sm font-bold">{formatCurrency(item.unitPrice)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                  <p className="text-sm font-bold">{formatCurrency(item.totalValue)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge className={getStatusColor(item.status)}>
                    {item.status?.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
              {item.description && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Description</p>
                  <p className="text-sm">{item.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Item Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Item ID</p>
                  <p className="text-sm">{item.id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Created Date</p>
                  <p className="text-sm">{new Date(item.createdAt).toLocaleDateString()}</p>
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