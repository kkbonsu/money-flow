import { SignIn as ClerkSignIn } from '@clerk/clerk-react';
import { Card } from '@/components/ui/card';

export default function SignIn() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center p-4">
      <Card className="w-full max-w-md backdrop-blur-lg bg-white/10 border-white/20 p-0 overflow-hidden">
        <ClerkSignIn 
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "bg-transparent shadow-none",
              headerTitle: "text-white text-2xl",
              headerSubtitle: "text-white/80",
              socialButtonsBlockButton: "bg-white/20 hover:bg-white/30 border-white/20 text-white",
              formFieldLabel: "text-white",
              formFieldInput: "bg-white/20 border-white/20 text-white placeholder-white/60",
              footerActionLink: "text-white hover:text-white/80",
              identityPreviewText: "text-white",
              identityPreviewEditButton: "text-white hover:text-white/80",
              formButtonPrimary: "bg-white text-purple-600 hover:bg-white/90",
              dividerLine: "bg-white/20",
              dividerText: "text-white/60",
            }
          }}
        />
      </Card>
    </div>
  );
}