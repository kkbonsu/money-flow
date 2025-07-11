import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { 
  Home, 
  Users, 
  BookOpen, 
  Calendar, 
  UserCheck, 
  DollarSign, 
  Receipt, 
  Building, 

  Package, 
  HomeIcon, 
  BarChart, 
  CreditCard, 
  FileText, 
  Scale 
} from 'lucide-react';

const navigationItems = [
  { name: 'Dashboard', href: '/', icon: Home },
  { 
    name: 'Management', 
    items: [
      { name: 'Customers', href: '/customers', icon: Users },
      { name: 'Loan Book', href: '/loan-book', icon: BookOpen },
      { name: 'Payment Schedule', href: '/payment-schedule', icon: Calendar },
      { name: 'Income Management', href: '/income', icon: DollarSign },
      { name: 'Expenses', href: '/expenses', icon: Receipt },
      { name: 'Banking (coming soon)', href: '/bank-management', icon: Building },
    ]
  },
  { 
    name: 'Assets & Operations', 
    items: [
      { name: 'Staff', href: '/staff', icon: UserCheck },
      { name: 'Inventory', href: '/inventory', icon: Package },
      { name: 'Rent Management', href: '/rent-management', icon: HomeIcon },
      { name: 'Assets', href: '/assets', icon: BarChart },
      { name: 'Liabilities', href: '/liabilities', icon: CreditCard },
    ]
  },
  { 
    name: 'Reports', 
    items: [
      { name: 'Financial Reports', href: '/reports', icon: FileText },
      { name: 'Equity', href: '/equity', icon: Scale },
    ]
  },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  return (
    <div className="hidden md:flex md:w-80 bg-sidebar-background shadow-lg border-r border-sidebar-border flex-col">
      {/* Logo Section */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-sidebar-primary rounded-lg flex items-center justify-center">
            <BarChart className="w-6 h-6 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-sidebar-foreground">Money Flow</h1>
            <p className="text-sm text-sidebar-foreground/70">Loan Management</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {navigationItems.map((section) => (
          <div key={section.name} className="space-y-1">
            {section.href ? (
              <Link href={section.href}>
                <div
                  className={cn(
                    'sidebar-nav-item',
                    location === section.href && 'active'
                  )}
                >
                  <section.icon className="w-5 h-5 mr-3" />
                  {section.name}
                </div>
              </Link>
            ) : (
              <>
                <div className="text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider mt-6 mb-3">
                  {section.name}
                </div>
                {section.items?.map((item) => (
                  <Link key={item.name} href={item.href}>
                    <div
                      className={cn(
                        'sidebar-nav-item',
                        location === item.href && 'active'
                      )}
                    >
                      <item.icon className="w-5 h-5 mr-3" />
                      {item.name}
                    </div>
                  </Link>
                ))}
              </>
            )}
          </div>
        ))}
      </nav>


    </div>
  );
}
