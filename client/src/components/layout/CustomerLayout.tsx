import { ReactNode } from 'react';
import { useLocation } from 'wouter';
import { useCustomerAuth } from '@/hooks/useCustomerAuth';
import CustomerHeader from './CustomerHeader';
import CustomerSidebar from './CustomerSidebar';

interface CustomerLayoutProps {
  children: ReactNode;
}

export default function CustomerLayout({ children }: CustomerLayoutProps) {
  const [location] = useLocation();
  const { isAuthenticated, isLoading } = useCustomerAuth();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your account...</p>
        </div>
      </div>
    );
  }

  // Customer login page
  if (location === '/customer/login' || location === '/customer') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {children}
      </div>
    );
  }

  // Protected customer routes
  if (!isAuthenticated) {
    window.location.href = '/customer/login';
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <CustomerSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <CustomerHeader />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}