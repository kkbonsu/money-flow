import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend: {
    value: number;
    label: string;
  };
  className?: string;
}

export default function MetricCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  className = "" 
}: MetricCardProps) {
  const isPositiveTrend = trend.value > 0;

  return (
    <Card className={`metric-card hover:scale-105 transition-transform duration-300 ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
          </div>
          <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center hover:from-primary/30 hover:to-primary/20 transition-all duration-300">
            <Icon className="w-6 h-6 text-primary glow-animation" />
          </div>
        </div>
        <div className="mt-4 flex items-center">
          <span className={`text-sm font-medium ${
            isPositiveTrend ? 'text-secondary' : 'text-destructive'
          }`}>
            {isPositiveTrend ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
          <span className="text-sm text-muted-foreground ml-2">
            {trend.label}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
