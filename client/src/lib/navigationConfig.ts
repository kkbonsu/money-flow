import { 
  Home, 
  Users, 
  BookOpen, 
  Calendar, 
  UserCheck, 
  DollarSign, 
  Receipt, 
  Calculator,
  Package, 
  BarChart, 
  CreditCard, 
  FileText, 
  Scale,
  Bot,
  Banknote,
  Shield,
  FileSpreadsheet,
  MessageSquare,
  Palette
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';

export interface NavigationItem {
  name: string;
  href: string;
  icon: LucideIcon;
  permission?: string; // Required permission to access
  minRoleLevel?: number; // Minimum role hierarchy level (1 = Super Admin, 4 = Staff)
  roles?: string[]; // Specific roles that can access this item
  adminOnly?: boolean; // Only super admins can access
  testId?: string; // Test ID for automation
}

export interface NavigationSection {
  name: string;
  href?: string;
  icon?: LucideIcon;
  permission?: string;
  minRoleLevel?: number;
  roles?: string[];
  adminOnly?: boolean;
  testId?: string;
  items?: NavigationItem[];
}

/**
 * Navigation configuration with permission requirements
 * Lower hierarchy numbers = higher authority (1 = Super Admin, 2 = Admin, 3 = Manager, 4 = Staff)
 */
export const navigationConfig: NavigationSection[] = [
  {
    name: 'Dashboard',
    href: '/',
    icon: Home,
    testId: 'nav-dashboard'
    // No permission required - everyone can access dashboard
  },
  {
    name: 'Loan Tools',
    items: [
      {
        name: 'Loan Simulator',
        href: '/loan-simulator',
        icon: Calculator,
        permission: 'loans:simulate',
        minRoleLevel: 3, // Manager and above
        testId: 'nav-loan-simulator'
      },
      {
        name: 'Loan Sheet',
        href: '/loan-sheet',
        icon: FileSpreadsheet,
        permission: 'loans:view',
        minRoleLevel: 4, // All staff levels
        testId: 'nav-loan-sheet'
      }
    ]
  },
  {
    name: 'Management',
    minRoleLevel: 3, // Manager and above can see this section
    items: [
      {
        name: 'Loan Products',
        href: '/loan-products',
        icon: Package,
        permission: 'loan_products:view',
        minRoleLevel: 3,
        testId: 'nav-loan-products'
      },
      {
        name: 'LIORA (AI Assistant)',
        href: '/liora',
        icon: Bot,
        permission: 'ai_assistant:access',
        minRoleLevel: 3,
        testId: 'nav-liora'
      },
      {
        name: 'Role Management',
        href: '/role-management',
        icon: Shield,
        permission: 'users:assign_roles',
        minRoleLevel: 2, // Admin and above
        testId: 'nav-role-management'
      },
      {
        name: 'Tenant Branding',
        href: '/tenant-branding',
        icon: Palette,
        permission: 'tenant:branding_manage',
        minRoleLevel: 2, // Admin and above
        testId: 'nav-tenant-branding'
      },
      {
        name: 'Customers',
        href: '/customers',
        icon: Users,
        permission: 'customers:view',
        minRoleLevel: 4, // All staff levels
        testId: 'nav-customers'
      },
      {
        name: 'Loan Book',
        href: '/loan-book',
        icon: BookOpen,
        permission: 'loans:view',
        minRoleLevel: 4,
        testId: 'nav-loan-book'
      },
      {
        name: 'Payment Schedule',
        href: '/payment-schedule',
        icon: Calendar,
        permission: 'payments:view',
        minRoleLevel: 4,
        testId: 'nav-payment-schedule'
      },
      {
        name: 'Receive Loan Payments (auto)',
        href: '/receive-payments',
        icon: Banknote,
        permission: 'payments:process',
        minRoleLevel: 3, // Manager and above
        testId: 'nav-receive-payments'
      },
      {
        name: 'Staff',
        href: '/staff',
        icon: UserCheck,
        permission: 'staff:view',
        minRoleLevel: 2, // Admin and above
        testId: 'nav-staff'
      },
      {
        name: 'Support Tickets',
        href: '/support-tickets',
        icon: MessageSquare,
        permission: 'support:view',
        minRoleLevel: 3,
        testId: 'nav-support-tickets'
      }
    ]
  },
  {
    name: 'Financial Management',
    minRoleLevel: 3, // Manager and above
    items: [
      {
        name: 'Income Management',
        href: '/income',
        icon: DollarSign,
        permission: 'finance:income_view',
        minRoleLevel: 3,
        testId: 'nav-income'
      },
      {
        name: 'Expense Management',
        href: '/expenses',
        icon: Receipt,
        permission: 'finance:expense_view',
        minRoleLevel: 3,
        testId: 'nav-expenses'
      },
      {
        name: 'Bank Management',
        href: '/bank-management',
        icon: CreditCard,
        permission: 'finance:bank_view',
        minRoleLevel: 2, // Admin and above
        testId: 'nav-bank-management'
      },
      {
        name: 'Petty Cash',
        href: '/petty-cash',
        icon: DollarSign,
        permission: 'finance:petty_cash_view',
        minRoleLevel: 3,
        testId: 'nav-petty-cash'
      }
    ]
  },
  {
    name: 'Asset Management',
    minRoleLevel: 3, // Manager and above
    items: [
      {
        name: 'Inventory',
        href: '/inventory',
        icon: Package,
        permission: 'assets:inventory_view',
        minRoleLevel: 3,
        testId: 'nav-inventory'
      },
      {
        name: 'Assets',
        href: '/assets',
        icon: BarChart,
        permission: 'assets:view',
        minRoleLevel: 3,
        testId: 'nav-assets'
      },
      {
        name: 'Liabilities',
        href: '/liabilities',
        icon: CreditCard,
        permission: 'liabilities:view',
        minRoleLevel: 2, // Admin and above
        testId: 'nav-liabilities'
      }
    ]
  },
  {
    name: 'Executive Functions and Reports',
    minRoleLevel: 2, // Admin and above
    items: [
      {
        name: 'Financial Reports',
        href: '/reports',
        icon: FileText,
        permission: 'reports:financial_view',
        minRoleLevel: 2,
        testId: 'nav-financial-reports'
      },
      {
        name: 'Equity Management',
        href: '/equity',
        icon: Scale,
        permission: 'finance:equity_view',
        minRoleLevel: 2,
        testId: 'nav-equity'
      }
    ]
  }
];

/**
 * Special navigation items that don't fit in the main sections
 */
export const specialNavigationItems: NavigationItem[] = [
  {
    name: 'Super Admin Dashboard',
    href: '/super-admin',
    icon: Shield,
    adminOnly: true,
    testId: 'nav-super-admin'
  }
];

/**
 * Customer portal navigation (separate from staff navigation)
 */
export const customerNavigationConfig: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/customer/dashboard',
    icon: Home,
    testId: 'nav-customer-dashboard'
  },
  {
    name: 'My Loans',
    href: '/customer/loans',
    icon: CreditCard,
    testId: 'nav-customer-loans'
  },
  {
    name: 'Payments',
    href: '/customer/payments',
    icon: DollarSign,
    testId: 'nav-customer-payments'
  },
  {
    name: 'Payment Schedule',
    href: '/customer/schedule',
    icon: Calendar,
    testId: 'nav-customer-schedule'
  },
  {
    name: 'Profile',
    href: '/customer/profile',
    icon: Users,
    testId: 'nav-customer-profile'
  },
  {
    name: 'Support',
    href: '/customer/support',
    icon: MessageSquare,
    testId: 'nav-customer-support'
  }
];