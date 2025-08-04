// Setup environment variables for the client
export function setupClientEnv() {
  // Expose necessary environment variables to the client
  const clientEnv = {
    VITE_CLERK_PUBLISHABLE_KEY: process.env.CLERK_PUBLISHABLE_KEY,
  };

  // Make them available to Vite
  Object.entries(clientEnv).forEach(([key, value]) => {
    if (value) {
      process.env[key] = value;
    }
  });
}