import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, CheckCircle, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { PaymentSchedule } from '@shared/schema';

export default function PaymentTable() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['/api/payment-schedules'],
  });

  const filteredPayments = payments.filter((payment: PaymentSchedule) => {
    const matchesSearch = payment.id.toString().includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-secondary/10 text-secondary';
      case 'pending':
        return 'bg-accent/10 text-accent';
      case 'overdue':
        return 'bg-destructive/10 text-destructive';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="text-muted-foreground">Loading payment schedules...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Payment Schedules</CardTitle>
          <Button className="btn-primary">
            <Calendar className="w-4 h-4 mr-2" />
            Schedule Payment
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search payments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64 pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Payment ID</th>
                <th>Loan ID</th>
                <th>Due Date</th>
                <th>Amount</th>
                <th>Principal</th>
                <th>Interest</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-muted-foreground">
                    No payment schedules found
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment: PaymentSchedule) => (
                  <tr key={payment.id}>
                    <td>
                      <span className="font-medium">#{payment.id}</span>
                    </td>
                    <td>
                      <span className="text-sm">#{payment.loanId}</span>
                    </td>
                    <td>
                      <span className="text-sm">
                        {new Date(payment.dueDate).toLocaleDateString()}
                      </span>
                    </td>
                    <td>
                      <span className="text-sm font-medium">
                        ${parseFloat(payment.amount).toLocaleString()}
                      </span>
                    </td>
                    <td>
                      <span className="text-sm">
                        ${parseFloat(payment.principalAmount).toLocaleString()}
                      </span>
                    </td>
                    <td>
                      <span className="text-sm">
                        ${parseFloat(payment.interestAmount).toLocaleString()}
                      </span>
                    </td>
                    <td>
                      <Badge className={`status-badge ${getStatusColor(payment.status)}`}>
                        {payment.status}
                      </Badge>
                    </td>
                    <td>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm">
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
