import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { multiTenantStorage } from "./multiTenantStorage";
import type { JwtPayload } from "@shared/schema";
import type { SimpleTenantContext } from "@shared/tenantSchema";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

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

// Extract tenant from subdomain or header
export const extractTenantContext = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let tenantSlug = 'default'; // Default tenant slug
    
    // Try to extract tenant from subdomain (tenant.domain.com)
    const host = req.get('host');
    if (host && host.includes('.')) {
      const subdomain = host.split('.')[0];
      if (subdomain && subdomain !== 'www' && subdomain !== 'api') {
        tenantSlug = subdomain;
      }
    }
    
    // Try to extract tenant from custom header
    const tenantHeader = req.get('X-Tenant-Slug');
    if (tenantHeader) {
      tenantSlug = tenantHeader;
    }
    
    // Get tenant from database
    const tenant = await multiTenantStorage.getTenantBySlug(tenantSlug);
    if (!tenant) {
      // If tenant doesn't exist, use default tenant
      const defaultTenant = await multiTenantStorage.getTenantBySlug('default');
      if (!defaultTenant) {
        return res.status(404).json({ message: "Tenant not found" });
      }
      req.tenantContext = {
        tenant: defaultTenant,
        tenantId: defaultTenant.id,
        slug: defaultTenant.slug
      };
    } else {
      req.tenantContext = {
        tenant,
        tenantId: tenant.id,
        slug: tenant.slug
      };
    }
    
    next();
  } catch (error) {
    console.error("Error extracting tenant context:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Tenant-aware JWT authentication middleware
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }

    const payload = decoded as JwtPayload;
    
    // Verify tenant context matches token
    if (req.tenantContext && payload.tenantId !== req.tenantContext.tenantId) {
      return res.status(403).json({ message: 'Token tenant mismatch' });
    }

    req.user = payload;
    next();
  });
};

// Tenant-aware customer authentication middleware
export const authenticateCustomerToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }

    const payload = decoded as any; // Customer token payload
    
    // Verify tenant context matches token
    if (req.tenantContext && payload.tenantId !== req.tenantContext.tenantId) {
      return res.status(403).json({ message: 'Token tenant mismatch' });
    }

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

// Generate tenant-aware JWT tokens
export const generateUserToken = (user: any, tenantId: string): string => {
  const payload: JwtPayload = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    tenantId: tenantId,
    isSuperAdmin: user.isSuperAdmin || false
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
};

export const generateCustomerToken = (customer: any, tenantId: string): string => {
  const payload = {
    id: customer.id,
    email: customer.email,
    firstName: customer.firstName,
    lastName: customer.lastName,
    tenantId: tenantId,
    type: 'customer'
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
};

// Tenant management utilities
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
  try {
    // Create tenant
    const tenant = await multiTenantStorage.createTenant({
      name: tenantData.name,
      slug: tenantData.slug,
      settings: {
        theme: 'light',
        features: ['loans', 'payments', 'analytics'],
        branding: {
          primaryColor: '#3B82F6',
          logoUrl: null
        }
      }
    });

    // Create admin user for the tenant
    const hashedPassword = await import('bcryptjs').then(bcrypt => 
      bcrypt.hash(tenantData.adminUser.password, 10)
    );

    const adminUser = await multiTenantStorage.createUser(tenant.id, {
      username: tenantData.adminUser.username,
      email: tenantData.adminUser.email,
      password: hashedPassword,
      firstName: tenantData.adminUser.firstName,
      lastName: tenantData.adminUser.lastName,
      role: 'admin',
      isActive: true,
      isSuperAdmin: false
    });

    // Create user tenant access record
    await multiTenantStorage.createUserTenantAccess({
      userId: adminUser.id,
      tenantId: tenant.id,
      role: 'admin',
      permissions: ['all']
    });

    return { tenant, adminUser };
  } catch (error) {
    console.error("Error creating tenant with admin:", error);
    throw error;
  }
};