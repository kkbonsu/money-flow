// Clerk configuration
export const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || 
  (typeof process !== 'undefined' ? process.env.CLERK_PUBLISHABLE_KEY : '') || '';

export const isClerkConfigured = () => {
  return !!CLERK_PUBLISHABLE_KEY;
};