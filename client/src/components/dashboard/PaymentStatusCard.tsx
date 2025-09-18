import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, AlertTriangle, CheckCircle } from 'lucide-react';

interface PaymentStatusData {
  onTime: number;
  overdue7Days: number;
  overdue30Days: number;
  overdue90Days: number;
  totalPending: number;
  totalOverdue: number;
}

export default function PaymentStatusCard() {
  const { data: paymentData, isLoading } = useQuery<PaymentStatusData>({
    queryKey: ['/api/dashboard/payment-status'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Payment Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="h-4 bg-muted rounded w-1/3 animate-pulse"></div>
                <div className="h-4 bg-muted rounded w-1/4 animate-pulse"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const total = paymentData?.totalPending || 0;
  const onTimePercentage = total > 0 ? Math.round((paymentData?.onTime || 0) / total * 100) : 0;
  const overdue7Percentage = total > 0 ? Math.round((paymentData?.overdue7Days || 0) / total * 100) : 0;
  const overdue30Percentage = total > 0 ? Math.round((paymentData?.overdue30Days || 0) / total * 100) : 0;
  const overdue90Percentage = total > 0 ? Math.round((paymentData?.overdue90Days || 0) / total * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Payment Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm text-muted-foreground">On-Time/Pending</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">{paymentData?.onTime || 0}</span>
              <span className="text-sm text-green-600">{onTimePercentage}%</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Clock className="w-4 h-4 text-yellow-600" />
              <span className="text-sm text-muted-foreground">Overdue (7 days)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">{paymentData?.overdue7Days || 0}</span>
              <span className="text-sm text-yellow-600">{overdue7Percentage}%</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
              <span className="text-sm text-muted-foreground">Overdue (30 days)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">{paymentData?.overdue30Days || 0}</span>
              <span className="text-sm text-orange-600">{overdue30Percentage}%</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-sm text-muted-foreground">Overdue (90 days)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">{paymentData?.overdue90Days || 0}</span>
              <span className="text-sm text-red-600">{overdue90Percentage}%</span>
            </div>
          </div>
          
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between text-sm font-medium">
              <span>Total Pending</span>
              <span>{paymentData?.totalPending || 0}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}