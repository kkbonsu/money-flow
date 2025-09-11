import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { multiTenantStorage } from "./multiTenantStorage";
import type { JwtPayload, UserTenantAccess } from "@shared/schema";
import type { SimpleTenantContext } from "@shared/tenantSchema";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Enhanced tenant context interface
interface EnhancedTenantContext extends SimpleTenantContext {
  userAccess?: UserTenantAccess;
  isAuthorized: boolean;
  switchedTenant?: boolean; // Indicates if user switched to a different tenant
}

// Extend Express Request to include enhanced tenant context
declare global {
  namespace Express {
    interface Request {
      user?: any;
      customer?: any;
      tenantContext?: EnhancedTenantContext;
    }
  }
}

// Enhanced tenant context extraction with access validation
export const extractTenantContext = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let requestedTenantSlug = 'default';
    
    // Multiple sources for tenant identification (in order of priority):
    
    // 1. Route parameter (highest priority for explicit tenant switching)
    if (req.params.tenantSlug) {
      requestedTenantSlug = req.params.tenantSlug;
    }
    // 2. Custom header (for API requests and tenant switching)
    else if (req.get('X-Tenant-Slug')) {
      requestedTenantSlug = req.get('X-Tenant-Slug')!;
    }
    // 3. Subdomain extraction (tenant.domain.com)
    else {
      const host = req.get('host');
      if (host && host.includes('.')) {
        const subdomain = host.split('.')[0];
        if (subdomain && subdomain !== 'www' && subdomain !== 'api') {
          requestedTenantSlug = subdomain;
        }
      }
    }
    
    // Get requested tenant from database
    const requestedTenant = await multiTenantStorage.getTenantBySlug(requestedTenantSlug);
    if (!requestedTenant) {
      // If requested tenant doesn't exist, try default tenant
      const defaultTenant = await multiTenantStorage.getTenantBySlug('default');
      if (!defaultTenant) {
        return res.status(404).json({ message: "Tenant not found" });
      }
      
      // Set basic tenant context (authorization will be checked later)
      req.tenantContext = {
        tenant: defaultTenant,
        tenantId: defaultTenant.id,
        slug: defaultTenant.slug,
        isAuthorized: false // Will be validated during authentication
      };
    } else {
      req.tenantContext = {
        tenant: requestedTenant,
        tenantId: requestedTenant.id,
        slug: requestedTenant.slug,
        isAuthorized: false // Will be validated during authentication
      };
    }
    
    next();
  } catch (error) {
    console.error("Error extracting tenant context:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Validate user access to the current tenant context
export const validateTenantAccess = async (userId: number, tenantId: string, isSuperAdmin = false): Promise<{
  hasAccess: boolean;
  userAccess?: UserTenantAccess;
  switchedTenant?: boolean;
}> => {
  try {
    // Super admins have access to all tenants
    if (isSuperAdmin) {
      return { hasAccess: true, switchedTenant: false };
    }
    
    // Get user's tenant access rights
    const userTenantAccess = await multiTenantStorage.getUserTenantAccess(userId);
    
    // Find access to the requested tenant
    const tenantAccess = userTenantAccess.find(access => access.tenantId === tenantId);
    
    if (!tenantAccess) {
      return { hasAccess: false };
    }
    
    // Check if user switched from their default tenant
    const defaultAccess = userTenantAccess.find(access => access.isDefault);
    const switchedTenant = defaultAccess && defaultAccess.tenantId !== tenantId;
    
    return {
      hasAccess: true,
      userAccess: tenantAccess,
      switchedTenant
    };
  } catch (error) {
    console.error("Error validating tenant access:", error);
    return { hasAccess: false };
  }
};

// Enhanced JWT authentication middleware with tenant access validation
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err) {
      console.error('JWT verification error:', err.message, 'Token:', token?.substring(0, 20) + '...');
      return res.status(403).json({ message: 'Invalid or expired token' });
    }

    const payload = decoded as JwtPayload;
    
    if (!req.tenantContext) {
      return res.status(500).json({ message: 'Tenant context not initialized' });
    }

    try {
      // Validate user access to the requested tenant
      const accessValidation = await validateTenantAccess(
        payload.id,
        req.tenantContext.tenantId,
        payload.isSuperAdmin
      );

      if (!accessValidation.hasAccess) {
        return res.status(403).json({ 
          message: 'Access denied: You do not have permission to access this tenant',
          tenantSlug: req.tenantContext.slug
        });
      }

      // Update tenant context with validated access information
      req.tenantContext.isAuthorized = true;
      req.tenantContext.userAccess = accessValidation.userAccess;
      req.tenantContext.switchedTenant = accessValidation.switchedTenant;

      // Update payload with current tenant context (for consistent token data)
      payload.tenantId = req.tenantContext.tenantId;
      req.user = payload;

      // Log tenant switching for audit purposes
      if (accessValidation.switchedTenant) {
        console.log(`User ${payload.username} (${payload.id}) switched to tenant ${req.tenantContext.slug} (${req.tenantContext.tenantId})`);
      }

      next();
    } catch (error) {
      console.error('Error during tenant access validation:', error);
      return res.status(500).json({ message: 'Internal server error during tenant validation' });
    }
  });
};

// Enhanced customer authentication middleware with tenant validation
export const authenticateCustomerToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err) {
      console.error('Customer JWT verification error:', err.message, 'Token:', token?.substring(0, 20) + '...');
      return res.status(403).json({ message: 'Invalid or expired token' });
    }

    const payload = decoded as any; // Customer token payload
    
    if (!req.tenantContext) {
      return res.status(500).json({ message: 'Tenant context not initialized' });
    }

    try {
      // For customers, validate that token tenant matches the current tenant context
      // Customers typically don't have multi-tenant access like admin users
      if (payload.tenantId && payload.tenantId !== req.tenantContext.tenantId) {
        return res.status(403).json({ 
          message: 'Access denied: Customer account does not belong to this tenant',
          tenantSlug: req.tenantContext.slug
        });
      }

      // For tokens without tenantId, inject the current tenant context
      if (!payload.tenantId && req.tenantContext) {
        payload.tenantId = req.tenantContext.tenantId;
      }

      // Additional validation: ensure customer exists in the current tenant
      if (req.tenantContext.tenantId) {
        const customer = await multiTenantStorage.getCustomer(req.tenantContext.tenantId, payload.id);
        if (!customer || !customer.isPortalActive) {
          return res.status(403).json({ message: 'Customer account not found or inactive in this tenant' });
        }
      }

      // Mark tenant context as authorized for customer
      req.tenantContext.isAuthorized = true;
      req.customer = payload;

      next();
    } catch (error) {
      console.error('Error during customer tenant validation:', error);
      return res.status(500).json({ message: 'Internal server error during customer validation' });
    }
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
    isSuperAdmin: user.isSuperAdmin || user.is_super_admin || false
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

// Get user's accessible tenants
export const getUserAccessibleTenants = async (userId: number): Promise<Array<{
  tenant: any;
  access: UserTenantAccess;
}>> => {
  try {
    const userAccess = await multiTenantStorage.getUserTenantAccess(userId);
    const accessibleTenants = [];
    
    for (const access of userAccess) {
      const tenant = await multiTenantStorage.getTenant(access.tenantId);
      if (tenant) {
        accessibleTenants.push({ tenant, access });
      }
    }
    
    return accessibleTenants;
  } catch (error) {
    console.error("Error getting user accessible tenants:", error);
    return [];
  }
};

// Get user's default tenant
export const getUserDefaultTenant = async (userId: number): Promise<{
  tenant?: any;
  access?: UserTenantAccess;
}> => {
  try {
    const userAccess = await multiTenantStorage.getUserTenantAccess(userId);
    const defaultAccess = userAccess.find(access => access.isDefault);
    
    if (!defaultAccess) {
      return {};
    }
    
    const tenant = await multiTenantStorage.getTenant(defaultAccess.tenantId);
    return { tenant, access: defaultAccess };
  } catch (error) {
    console.error("Error getting user default tenant:", error);
    return {};
  }
};

// Middleware to require tenant context authorization
export const requireTenantAccess = (req: Request, res: Response, next: NextFunction) => {
  if (!req.tenantContext?.isAuthorized) {
    return res.status(403).json({ 
      message: 'Tenant access not authorized',
      tenantSlug: req.tenantContext?.slug 
    });
  }
  next();
};

// Combined middleware that extracts tenant context and validates access
export const tenantContextWithAuth = [extractTenantContext, authenticateToken, requireTenantAccess];
export const customerTenantContextWithAuth = [extractTenantContext, authenticateCustomerToken, requireTenantAccess];

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
      branding: {
        logo: null,
        primaryColor: '#3B82F6',
        secondaryColor: '#64748b',
        companyName: tenantData.name
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