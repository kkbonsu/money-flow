import { ReactNode, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import Sidebar from './Sidebar';
import Header from './Header';

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [location, setLocation] = useLocation();
  const { isAuthenticated, isLoading } = useAuth();

  // Handle redirects in useEffect to avoid setState during render
  useEffect(() => {
    if (isLoading) return;
    
    // Public routes that don't require authentication
    const publicRoutes = ['/login', '/onboard'];
    const isPublicRoute = publicRoutes.includes(location);
    
    // If not authenticated and not on a public route, redirect to login
    if (!isAuthenticated && !isPublicRoute) {
      setLocation('/login');
      return;
    }

    // If authenticated and on login page, redirect to dashboard
    if (isAuthenticated && location === '/login') {
      setLocation('/');
      return;
    }
  }, [isAuthenticated, isLoading, location, setLocation]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/onboard'];
  const isPublicRoute = publicRoutes.includes(location);
  
  // Don't render anything while redirecting
  if ((!isAuthenticated && !isPublicRoute) || (isAuthenticated && location === '/login')) {
    return null;
  }

  if (isPublicRoute) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        {children}
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden text-foreground">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 slide-in-right">
          {children}
        </main>
      </div>
    </div>
  );
}
