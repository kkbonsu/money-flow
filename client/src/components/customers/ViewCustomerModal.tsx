import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Customer } from '@shared/schema';
import { Calendar, CreditCard, Mail, Phone, MapPin, User, Hash, Copy, Check, Key } from 'lucide-react';

interface ViewCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
}

export default function ViewCustomerModal({ isOpen, onClose, customer }: ViewCustomerModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  
  if (!customer) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-secondary/10 text-secondary';
      case 'inactive':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Customer Details</DialogTitle>
          <DialogDescription>
            View complete customer information and details.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Customer Header */}
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <span className="text-xl font-bold text-primary">
                {customer.firstName.charAt(0)}{customer.lastName.charAt(0)}
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-bold">{customer.firstName} {customer.lastName}</h2>
              <p className="text-muted-foreground">Customer ID: {customer.id}</p>
              <Badge className={`status-badge ${getStatusColor(customer.status)} mt-2`}>
                {customer.status}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Customer Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">{customer.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Phone</p>
                    <p className="text-sm text-muted-foreground">{customer.phone}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Address</p>
                    <p className="text-sm text-muted-foreground">{customer.address || 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Financial Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-3">
                  <CreditCard className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Credit Score</p>
                    <p className="text-sm text-muted-foreground">{customer.creditScore || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Hash className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">National ID</p>
                    <p className="text-sm text-muted-foreground">{customer.nationalId || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Created</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(customer.createdAt || '').toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Customer Portal Credentials */}
          {customer.isPortalActive && (
            <>
              <Separator />
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <Key className="w-5 h-5" />
                    <span>Customer Portal Access</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-blue-800 dark:text-blue-200 text-sm mb-3">
                      Customer has access to the customer portal with the following credentials:
                    </p>
                    
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium">Login URL:</span>
                          <code className="ml-2 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                            {window.location.origin}/customer
                          </code>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(`${window.location.origin}/customer`, 'url')}
                          className="ml-2"
                        >
                          {copiedField === 'url' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium">Email:</span>
                          <code className="ml-2 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                            {customer.email}
                          </code>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(customer.email, 'email')}
                          className="ml-2"
                        >
                          {copiedField === 'email' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium">Password:</span>
                          <span className="ml-2 text-muted-foreground">
                            Set during customer creation (customer can change it)
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-blue-700 dark:text-blue-300 text-sm mt-3">
                      Customer can access their loans, payment history, and profile through the portal.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}