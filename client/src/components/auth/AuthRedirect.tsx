import { useAuth, useClerk } from "@clerk/clerk-react";
import { useEffect } from "react";
import { useLocation } from "wouter";

export function AuthRedirect({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const { redirectToSignIn } = useClerk();
  const [location, setLocation] = useLocation();
  
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      // Redirect to sign-in if not authenticated
      if (location !== "/sign-in" && location !== "/sign-up") {
        setLocation("/sign-in");
      }
    }
  }, [isLoaded, isSignedIn, location, setLocation]);
  
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!isSignedIn && location !== "/sign-in" && location !== "/sign-up") {
    return null;
  }
  
  return <>{children}</>;
}