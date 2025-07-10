import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart } from 'lucide-react';

interface ChartCardProps {
  title: string;
  children?: React.ReactNode;
  actions?: React.ReactNode;
}

export default function ChartCard({ title, children, actions }: ChartCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          {actions || (
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">7D</Button>
              <Button variant="ghost" size="sm">30D</Button>
              <Button variant="ghost" size="sm">90D</Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {children || (
          <div className="chart-container">
            <div className="text-center">
              <BarChart className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">Chart data will be displayed here</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
