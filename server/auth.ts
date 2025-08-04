import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';
import type { Request, Response, NextFunction } from 'express';

// Extend Express Request type to include Clerk auth
declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        sessionId: string;
        orgId?: string | null;
      };
    }
  }
}

// Export Clerk's auth middleware
export const requireAuth = ClerkExpressRequireAuth({
  onError: (error: any) => {
    console.error('Clerk auth error:', error);
  }
});

// Helper middleware to sync Clerk user with database
export const syncUser = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.auth?.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Store the Clerk user ID for use in routes
  (req as any).userId = req.auth.userId;
  (req as any).organizationId = req.auth.orgId;

  next();
};