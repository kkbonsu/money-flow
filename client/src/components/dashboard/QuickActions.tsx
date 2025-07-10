import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, UserPlus, CalendarPlus, FileText } from 'lucide-react';
import { useLocation } from 'wouter';

export default function QuickActions() {
  const [, setLocation] = useLocation();

  const actions = [
    {
      title: 'New Loan Application',
      icon: Plus,
      onClick: () => setLocation('/loan-book'),
      className: 'btn-primary quick-action-btn',
    },
    {
      title: 'Add Customer',
      icon: UserPlus,
      onClick: () => setLocation('/customers'),
      className: 'btn-secondary quick-action-btn',
    },
    {
      title: 'Schedule Payment',
      icon: CalendarPlus,
      onClick: () => setLocation('/payment-schedule'),
      className: 'btn-accent quick-action-btn',
    },
    {
      title: 'Generate Report',
      icon: FileText,
      onClick: () => setLocation('/reports'),
      className: 'bg-muted text-muted-foreground hover:bg-muted/80 quick-action-btn',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {actions.map((action) => (
            <Button
              key={action.title}
              onClick={action.onClick}
              className={action.className}
            >
              <action.icon className="w-5 h-5" />
              <span>{action.title}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
