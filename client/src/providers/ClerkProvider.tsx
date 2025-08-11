import { ClerkProvider as BaseClerkProvider, SignIn, SignUp, SignedIn, SignedOut, UserButton, useOrganization, useUser } from '@clerk/clerk-react';
import { dark } from '@clerk/themes';
import { useTheme } from '@/hooks/useTheme';

// Use environment variable or a test key for development
const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || 'pk_test_ZGVsaWdodGZ1bC1kb2UtODAuY2xlcmsuYWNjb3VudHMuZGV2JA';

interface ClerkProviderProps {
  children: React.ReactNode;
}

export function ClerkProvider({ children }: ClerkProviderProps) {
  const { theme } = useTheme();
  
  return (
    <BaseClerkProvider 
      publishableKey={CLERK_PUBLISHABLE_KEY}
      appearance={{
        baseTheme: theme === 'dark' ? dark : undefined,
        elements: {
          formButtonPrimary: 'bg-primary text-primary-foreground hover:bg-primary/90',
          card: 'bg-card',
          headerTitle: 'text-foreground',
          headerSubtitle: 'text-muted-foreground',
          socialButtonsBlockButton: 'bg-background border border-input hover:bg-accent',
          formFieldLabel: 'text-foreground',
          formFieldInput: 'bg-background border-input',
          footerActionLink: 'text-primary hover:text-primary/90',
        }
      }}
    >
      {children}
    </BaseClerkProvider>
  );
}

export { SignIn, SignUp, SignedIn, SignedOut, UserButton, useOrganization, useUser };