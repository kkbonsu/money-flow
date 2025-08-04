import { useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function ClerkLogin() {
  const { isSignedIn, isLoaded } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      setLocation('/');
    }
  }, [isLoaded, isSignedIn, setLocation]);

  const handleSignIn = () => {
    // Open Clerk's hosted sign-in page in a new window
    window.location.href = `https://accounts.${window.location.hostname}/sign-in?redirect_url=${encodeURIComponent(window.location.origin)}`;
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center p-4">
      <Card className="w-full max-w-md backdrop-blur-lg bg-white/10 border-white/20">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-white">Money Flow</CardTitle>
          <CardDescription className="text-white/80">
            Financial Management System
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-white/80">
            Sign in to access your microfinance institution dashboard
          </p>
          <Button 
            onClick={handleSignIn}
            className="w-full bg-white text-purple-600 hover:bg-white/90"
            size="lg"
          >
            Sign In with Clerk
          </Button>
          <p className="text-xs text-center text-white/60">
            Secure authentication powered by Clerk
          </p>
        </CardContent>
      </Card>
    </div>
  );
}