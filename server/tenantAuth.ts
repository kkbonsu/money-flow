import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
// import { multiTenantStorage } from "./multiTenantStorage"; // Disabled for single-tenant mode
import type { JwtPayload } from "@shared/schema";
import type { SimpleTenantContext } from "@shared/tenantSchema";
import { config } from "./config";

const JWT_SECRET = config.JWT_SECRET;

// Extend Express Request to include tenant context
declare global {
  namespace Express {
    interface Request {
      user?: any;
      customer?: any;
      tenantContext?: SimpleTenantContext;
    }
  }
}

// DISABLED: Extract tenant from subdomain or header (simplified for single-tenant mode)
// No-op function for backward compatibility with existing imports
export const extractTenantContext = async (req: Request, res: Response, next: NextFunction) => {
  // Single-tenant mode: no tenant context extraction needed
  next();
};

// Simplified JWT authentication middleware (single-tenant mode)
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error('Admin JWT verification error:', err.message);
      return res.status(403).json({ message: 'Invalid or expired token' });
    }

    const payload = decoded as JwtPayload;
    req.user = payload;
    next();
  });
};

// Simplified customer authentication middleware (single-tenant mode)
export const authenticateCustomerToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error('Customer JWT verification error:', err.message);
      return res.status(403).json({ message: 'Invalid or expired token' });
    }

    const payload = decoded as any; // Customer token payload
    req.customer = payload;
    next();
  });
};

// Role-based authorization middleware
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next();
  };
};

// Super admin authorization (cross-tenant access)
export const requireSuperAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (!req.user.isSuperAdmin) {
    return res.status(403).json({ message: 'Super admin access required' });
  }

  next();
};

// Simplified JWT token generation (single-tenant mode)
export const generateUserToken = (user: any): string => {
  const payload: JwtPayload = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    isSuperAdmin: user.isSuperAdmin || user.is_super_admin || false
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
};

export const generateCustomerToken = (customer: any): string => {
  const payload = {
    id: customer.id,
    email: customer.email,
    firstName: customer.firstName,
    lastName: customer.lastName,
    type: 'customer'
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
};

// Tenant management utilities (DISABLED for single-tenant mode)
export const createTenantWithAdmin = async (tenantData: {
  name: string;
  slug: string;
  adminUser: {
    username: string;
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  };
}) => {
  throw new Error('Tenant creation disabled in single-tenant mode');
};