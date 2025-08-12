import { useState, useEffect } from 'react';
import { useSimpleAuth } from './useSimpleAuth';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  hasOrganization: boolean;
  authSystem: 'clerk' | 'simple' | 'loading';
  organizationName?: string;
}

export function useAuthWithFallback(): AuthState {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    hasOrganization: false,
    authSystem: 'loading'
  });
  
  const simpleAuth = useSimpleAuth();
  
  useEffect(() => {
    // Try to check if Clerk is available
    const checkClerk = async () => {
      try {
        // Check if Clerk is loaded and available
        const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
        if (!publishableKey) {
          throw new Error('No Clerk key available');
        }
        
        // Try to access Clerk from window
        if (typeof window !== 'undefined' && (window as any).Clerk) {
          const clerk = (window as any).Clerk;
          if (clerk.loaded && clerk.user) {
            setAuthState({
              isAuthenticated: true,
              isLoading: false,
              hasOrganization: !!clerk.organization,
              authSystem: 'clerk',
              organizationName: clerk.organization?.name
            });
            return;
          }
        }
        
        throw new Error('Clerk not ready');
      } catch (error) {
        // Fall back to simple auth
        setAuthState({
          isAuthenticated: simpleAuth.isAuthenticated,
          isLoading: simpleAuth.isLoading,
          hasOrganization: !!simpleAuth.organizationName,
          authSystem: 'simple',
          organizationName: simpleAuth.organizationName || undefined
        });
      }
    };
    
    // Check immediately and after a delay to allow Clerk to load
    checkClerk();
    const timeoutId = setTimeout(checkClerk, 2000);
    
    return () => clearTimeout(timeoutId);
  }, [simpleAuth]);
  
  return authState;
}