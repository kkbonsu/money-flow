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
  Calculator,
  Package, 
  HomeIcon, 
  BarChart, 
  CreditCard, 
  FileText, 
  Scale,
  Bot,
  Banknote,
  Shield,
  Settings
} from 'lucide-react';

const navigationItems = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Loan Simulator', href: '/loan-simulator', icon: Calculator },
  { name: 'LIORA (AI Assistant)', href: '/liora', icon: Bot },
  { name: 'Loan Products', href: '/loan-products', icon: Package },
  { 
    name: 'Management', 
    items: [
      { name: 'Customers', href: '/customers', icon: Users },
      { name: 'Loan Book', href: '/loan-book', icon: BookOpen },
      { name: 'Payment Schedule', href: '/payment-schedule', icon: Calendar },
      { name: 'Receive Loan Payments (auto)', href: '/receive-payments', icon: Banknote },
      { name: 'Income Management', href: '/income', icon: DollarSign },
      { name: 'Expense Management', href: '/expenses', icon: Receipt },
      { name: 'Debt Management (coming soon)', href: '/debt-management', icon: CreditCard },
      { name: 'Banking (coming soon)', href: '/bank-management', icon: Building },
    ]
  },
  { 
    name: 'Assets & Operations', 
    items: [
      { name: 'Staff', href: '/staff', icon: UserCheck },
      { name: 'Role Management', href: '/role-management', icon: Shield },
      { name: 'Inventory', href: '/inventory', icon: Package },
      { name: 'Assets', href: '/assets', icon: BarChart },
      { name: 'Liabilities', href: '/liabilities', icon: CreditCard },
    ]
  },
  { 
    name: 'Executive Functions and Reports', 
    items: [
      { name: 'Financial Reports', href: '/reports', icon: FileText },
      { name: 'Equity Management', href: '/equity', icon: Scale },
    ]
  },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  return (
    <div className="hidden md:flex md:w-80 glass-sidebar flex-col slide-in-left">
      {/* Logo Section */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center space-x-3 scale-in">
          <div className="w-10 h-10 bg-sidebar-primary rounded-xl flex items-center justify-center floating-animation shadow-lg">
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
        {/* Super Admin Link - Only show for super admins */}
        {(user as any)?.isSuperAdmin && (
          <Link href="/super-admin">
            <div
              className={cn(
                'sidebar-nav-item bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-300/30',
                location === '/super-admin' && 'active'
              )}
            >
              <Shield className="w-5 h-5 mr-3 text-red-600" />
              Super Admin
            </div>
          </Link>
        )}
        
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
