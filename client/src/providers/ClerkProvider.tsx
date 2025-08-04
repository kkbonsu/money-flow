import { ClerkProvider as ClerkProviderBase } from "@clerk/clerk-react";

// Get the publishable key from environment
const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || 
  (typeof window !== 'undefined' && (window as any).CLERK_PUBLISHABLE_KEY) || '';

if (!publishableKey) {
  console.warn("Clerk Publishable Key not found. Authentication features will be disabled.");
}

interface ClerkProviderProps {
  children: React.ReactNode;
}

export function ClerkProvider({ children }: ClerkProviderProps) {
  if (!publishableKey) {
    // Return children without Clerk if no key is available
    return <>{children}</>;
  }

  return (
    <ClerkProviderBase 
      publishableKey={publishableKey}
      appearance={{
        baseTheme: undefined,
        variables: {
          colorPrimary: "hsl(var(--primary))",
          colorBackground: "hsl(var(--background))",
          colorText: "hsl(var(--foreground))",
          colorTextSecondary: "hsl(var(--muted-foreground))",
          colorInputBackground: "hsl(var(--input))",
          colorInputText: "hsl(var(--foreground))",
          borderRadius: "0.5rem",
        },
        elements: {
          rootBox: {
            fontFamily: "inherit",
          },
          card: {
            background: "rgba(255, 255, 255, 0.02)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.2)",
          },
          formButtonPrimary: {
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            "&:hover": {
              background: "linear-gradient(135deg, #764ba2 0%, #667eea 100%)",
            },
          },
        },
      }}
    >
      {children}
    </ClerkProviderBase>
  );
}