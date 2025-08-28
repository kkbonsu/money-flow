import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useToast } from './use-toast';

interface CustomerAuthContextType {
  customer: any | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => void;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined);

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('customer_auth_token');
        const customerData = localStorage.getItem('customer_auth_user');
        
        if (token && customerData) {
          setCustomer(JSON.parse(customerData));
        }
      } catch (error) {
        console.error('Customer auth initialization error:', error);
        localStorage.removeItem('customer_auth_token');
        localStorage.removeItem('customer_auth_user');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
    try {
      setIsLoading(true);
      
      // Clear any existing session data first
      localStorage.removeItem('customer_auth_token');
      localStorage.removeItem('customer_auth_user');
      setCustomer(null);
      
      const response = await fetch('/api/customer/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }

      const authData = await response.json();
      localStorage.setItem('customer_auth_token', authData.token);
      localStorage.setItem('customer_auth_user', JSON.stringify(authData.customer));
      setCustomer(authData.customer);
      
      toast({
        title: "Welcome back!",
        description: "You've successfully logged in.",
      });
    } catch (error) {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Please check your credentials",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    // Complete session cleanup
    localStorage.removeItem('customer_auth_token');
    localStorage.removeItem('customer_auth_user');
    setCustomer(null);
    
    // Clear any cached queries
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  return (
    <CustomerAuthContext.Provider
      value={{
        customer,
        isAuthenticated: !!customer,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth() {
  const context = useContext(CustomerAuthContext);
  if (context === undefined) {
    throw new Error('useCustomerAuth must be used within a CustomerAuthProvider');
  }
  return context;
}