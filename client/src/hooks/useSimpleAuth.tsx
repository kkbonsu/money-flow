import { useState, useEffect } from 'react';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  organizationName: string | null;
  token: string | null;
}

export function useSimpleAuth(): AuthState {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    organizationName: null,
    token: null
  });

  useEffect(() => {
    // Check localStorage for auth token
    const token = localStorage.getItem('auth_token');
    const organizationName = localStorage.getItem('organization_name');
    
    setAuthState({
      isAuthenticated: !!token,
      isLoading: false,
      organizationName,
      token
    });
  }, []);

  return authState;
}

export function logout() {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('organization_name');
  window.location.href = '/auth';
}