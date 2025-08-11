import { SignUp } from '@clerk/clerk-react';

export default function ClerkSignUp() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <SignUp 
        path="/sign-up"
        routing="path"
        signInUrl="/sign-in"
        afterSignUpUrl="/organization-setup"
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