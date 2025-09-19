// Centralized configuration module
// DO NOT hardcode secrets in production

const isDevelopment = process.env.NODE_ENV === 'development';

// JWT Secret configuration with proper security warnings
function getJWTSecret(): string {
  const secret = process.env.JWT_SECRET;
  
  if (secret) {
    return secret;
  }
  
  // Only allow fallback in development mode
  if (isDevelopment) {
    console.warn('⚠️  WARNING: Using development fallback JWT_SECRET');
    console.warn('⚠️  Set JWT_SECRET environment variable for production');
    return 'development-only-fallback-secret-not-for-production';
  }
  
  // In production, fail fast if no secret is provided
  console.error('CRITICAL SECURITY ERROR: JWT_SECRET environment variable is required!');
  console.error('Please set JWT_SECRET to a strong, randomly generated secret.');
  console.error('Example: JWT_SECRET="your-secure-random-secret-here" npm run dev');
  process.exit(1);
}

export const config = {
  JWT_SECRET: getJWTSecret(),
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT ? parseInt(process.env.PORT) : 5000,
  isDevelopment
};