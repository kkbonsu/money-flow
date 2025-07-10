import { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { insertInventorySchema, InsertInventory, Inventory } from '@shared/schema';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface EditInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: Inventory | null;
}

export default function EditInventoryModal({ isOpen, onClose, item }: EditInventoryModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    watch,
  } = useForm<InsertInventory>({
    resolver: zodResolver(insertInventorySchema),
  });

  const quantity = watch('quantity', 0);
  const unitPrice = watch('unitPrice', 0);

  const updateItemMutation = useMutation({
    mutationFn: (data: InsertInventory) => {
      const totalValue = data.quantity * data.unitPrice;
      return apiClient.put(`/inventory/${item?.id}`, { ...data, totalValue });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Inventory item updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update inventory item",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (item && isOpen) {
      reset({
        itemName: item.itemName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        category: item.category || '',
        status: item.status,
        description: item.description || '',
      });
    }
  }, [item, isOpen, reset]);

  const onSubmit = (data: InsertInventory) => {
    updateItemMutation.mutate(data);
  };

  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Inventory Item</DialogTitle>
          <DialogDescription>
            Update inventory item information and details.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="itemName">Item Name</Label>
            <Input
              id="itemName"
              {...register('itemName')}
              placeholder="Enter item name"
            />
            {errors.itemName && (
              <p className="text-sm text-destructive mt-1">
                {errors.itemName.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                {...register('quantity', { valueAsNumber: true })}
                placeholder="Enter quantity"
              />
              {errors.quantity && (
                <p className="text-sm text-destructive mt-1">
                  {errors.quantity.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="unitPrice">Unit Price</Label>
              <Input
                id="unitPrice"
                type="number"
                step="0.01"
                {...register('unitPrice', { valueAsNumber: true })}
                placeholder="Enter unit price"
              />
              {errors.unitPrice && (
                <p className="text-sm text-destructive mt-1">
                  {errors.unitPrice.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <Label>Total Value</Label>
            <div className="text-sm text-muted-foreground">
              ${(quantity * unitPrice).toFixed(2)}
            </div>
          </div>

          <div>
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              {...register('category')}
              placeholder="Enter category (optional)"
            />
            {errors.category && (
              <p className="text-sm text-destructive mt-1">
                {errors.category.message}
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
                    <SelectItem value="in_stock">In Stock</SelectItem>
                    <SelectItem value="low_stock">Low Stock</SelectItem>
                    <SelectItem value="out_of_stock">Out of Stock</SelectItem>
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

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Enter description (optional)"
              rows={3}
            />
            {errors.description && (
              <p className="text-sm text-destructive mt-1">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateItemMutation.isPending}>
              {updateItemMutation.isPending ? 'Updating...' : 'Update Item'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}