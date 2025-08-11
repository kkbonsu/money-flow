import { SignIn } from '@clerk/clerk-react';

export default function ClerkSignIn() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <SignIn 
        path="/sign-in"
        routing="path"
        signUpUrl="/sign-up"
        afterSignInUrl="/"
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "bg-card shadow-xl",
          }
        }}
      />
    </div>
  );
}