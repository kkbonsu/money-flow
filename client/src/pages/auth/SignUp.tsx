import { SignUp as ClerkSignUp } from "@clerk/clerk-react";
import { Link } from "wouter";

export default function SignUp() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-background/95 p-4">
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
      
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Money Flow
          </h1>
          <p className="text-muted-foreground mt-2">
            Create your organization account
          </p>
        </div>

        <ClerkSignUp 
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "glassmorphism-card",
            }
          }}
          redirectUrl="/"
          signInUrl="/sign-in"
        />

        <div className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/sign-in" className="text-primary hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}