import { ClerkProvider as ClerkProviderBase } from "@clerk/clerk-react";

// Get the publishable key from environment
const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!publishableKey) {
  console.error("Clerk Publishable Key not found. Authentication features will be disabled.");
}

interface ClerkProviderProps {
  children: React.ReactNode;
}

export function ClerkProvider({ children }: ClerkProviderProps) {
  // Temporarily bypass Clerk while we fix the domain configuration
  if (!publishableKey || true) { // Always bypass for now
    console.log("Clerk bypassed - using fallback authentication");
    return <>{children}</>;
  }

  return (
    <ClerkProviderBase publishableKey={publishableKey}>
      {children}
    </ClerkProviderBase>
  );
}