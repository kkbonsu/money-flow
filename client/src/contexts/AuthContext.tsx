import { createContext } from 'react';

const AuthContext = createContext<null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Temporarily bypass Clerk auth context
  return <AuthContext.Provider value={null}>{children}</AuthContext.Provider>;
}