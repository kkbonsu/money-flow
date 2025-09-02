import { Link, useLocation } from 'wouter';
import { 
  Home, 
  CreditCard, 
  User, 
  FileText, 
  DollarSign,
  Calendar,
  MessageSquare,
  HelpCircle,
  TrendingUp
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/customer/dashboard', icon: Home },
  { name: 'My Loans', href: '/customer/loans', icon: CreditCard },
  { name: 'Payments', href: '/customer/payments', icon: DollarSign },
  { name: 'Credit Status', href: '/customer/credit-status', icon: TrendingUp },
  { name: 'Payment Schedule', href: '/customer/schedule', icon: Calendar },
  { name: 'Documents', href: '/customer/documents', icon: FileText },
  { name: 'Profile', href: '/customer/profile', icon: User },
  { name: 'Support', href: '/customer/support', icon: MessageSquare },
  { name: 'Help', href: '/customer/help', icon: HelpCircle },
];

export default function CustomerSidebar() {
  const [location] = useLocation();

  return (
    <div className="glass-card w-64 border-r border-gray-200/20 dark:border-gray-700/20 backdrop-blur-md">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="px-4 py-6 border-b border-gray-200/20 dark:border-gray-700/20">
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Money Flow Customer Portal
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              v1.0.0
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <div className={`
                  flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                  ${isActive 
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-white/10 dark:hover:bg-gray-800/10 hover:scale-105'
                  }
                `}>
                  <item.icon className={`w-5 h-5 mr-3 ${isActive ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`} />
                  {item.name}
                </div>
              </Link>
            );
          })}
        </nav>

      </div>
    </div>
  );
}