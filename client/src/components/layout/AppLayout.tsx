import { ReactNode } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import Sidebar from './Sidebar';
import Header from './Header';

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [location] = useLocation();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated && location !== '/login') {
    return (
      <div className="min-h-screen bg-background text-foreground">
        {children}
      </div>
    );
  }

  if (location === '/login') {
    return (
      <div className="min-h-screen bg-background text-foreground">
        {children}
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
