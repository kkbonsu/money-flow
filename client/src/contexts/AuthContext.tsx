import { createContext, useContext, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { setGetClerkToken } from '@/lib/queryClient';

const AuthContext = createContext<null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { getToken } = useAuth();

  useEffect(() => {
    // Set the token getter function for the query client
    setGetClerkToken(getToken);
  }, [getToken]);

  return <AuthContext.Provider value={null}>{children}</AuthContext.Provider>;
}