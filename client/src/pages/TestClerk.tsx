export default function TestClerk() {
  const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Clerk Configuration Test</h1>
        
        <div className="bg-card rounded-lg shadow-lg p-6 space-y-4">
          <div>
            <h2 className="text-xl font-semibold mb-2">Environment Check</h2>
            <div className="space-y-2">
              <p className="text-sm">
                <span className="font-medium">Clerk Publishable Key Present:</span>{' '}
                <span className={clerkKey ? 'text-green-600' : 'text-red-600'}>
                  {clerkKey ? '✓ Yes' : '✗ No'}
                </span>
              </p>
              {clerkKey && (
                <p className="text-sm">
                  <span className="font-medium">Key starts with:</span>{' '}
                  <code className="bg-muted px-2 py-1 rounded">{clerkKey.substring(0, 15)}...</code>
                </p>
              )}
            </div>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-2">Navigation Links</h2>
            <div className="space-x-4">
              <a href="/sign-in" className="text-primary hover:underline">Go to Sign In</a>
              <a href="/sign-up" className="text-primary hover:underline">Go to Sign Up</a>
              <a href="/" className="text-primary hover:underline">Go to Home</a>
            </div>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-2">Current Location</h2>
            <p className="text-sm">
              <span className="font-medium">Path:</span>{' '}
              <code className="bg-muted px-2 py-1 rounded">{window.location.pathname}</code>
            </p>
            <p className="text-sm">
              <span className="font-medium">Host:</span>{' '}
              <code className="bg-muted px-2 py-1 rounded">{window.location.host}</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}