import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { db, pool } from "./db";
import { organizations, branches, users, userBranchAccess } from "@shared/schema";
import { eq, and } from "drizzle-orm";

const JWT_SECRET = process.env.JWT_SECRET || "moneyflow-development-secret-2025";

// Organization context type
export interface OrganizationContext {
  organizationId: string;
  organizationName: string;
  organizationCode: string;
  currentBranchId: string;
  currentBranchName: string;
  currentBranchCode: string;
}

// JWT Payload for organization/branch context
export interface OrgJwtPayload {
  userId: number;
  username: string;
  email: string;
  
  // Organization (single)
  organizationId: string;
  organizationName: string;
  organizationCode: string;
  
  // Current Working Branch
  currentBranchId: string;
  currentBranchName: string;
  currentBranchCode: string;
  
  // Role & Permissions
  organizationRole: 'admin' | 'manager' | 'user' | 'viewer';
  branchRole?: string;
  permissions: string[];
  
  // Available Branches
  branches: Array<{
    branchId: string;
    branchCode: string;
    branchName: string;
    role: string;
    permissions: string[];
  }>;
  
  isSystemAdmin: boolean;
  iat?: number;
  exp?: number;
}

// Extend Express Request to include organization context
declare global {
  namespace Express {
    interface Request {
      organizationContext?: OrganizationContext;
    }
  }
}

// Generate JWT token with organization context
export const generateOrganizationToken = async (userId: number): Promise<string> => {
  // Get user with organization using raw SQL to bypass schema issues
  const userQuery = `SELECT id, username, email, role, organization_id, primary_branch_id, is_super_admin, tenant_id FROM users WHERE id = $1 LIMIT 1`;
  const userResult = await pool.query(userQuery, [userId]);
  if (!userResult.rows.length) {
    throw new Error("User not found");
  }
  const user = userResult.rows[0];

  // Get organization details from user's organization ID or fallback to tenant ID
  const orgId = user.organization_id || user.tenant_id;
  const orgQuery = `SELECT id, name, code FROM organizations WHERE id = $1 LIMIT 1`;
  const orgResult = await pool.query(orgQuery, [orgId]);
  if (!orgResult.rows.length) {
    throw new Error("Organization not found");
  }
  const org = orgResult.rows[0];

  // Get user's accessible branches using raw SQL
  const branchAccessQuery = `
    SELECT b.id, b.name, b.code, uba.branch_role, uba.can_view, uba.can_create, uba.can_edit, uba.can_delete, uba.can_approve
    FROM user_branch_access uba
    INNER JOIN branches b ON b.id = uba.branch_id
    WHERE uba.user_id = $1 AND uba.is_active = true
  `;
  const branchAccessResult = await pool.query(branchAccessQuery, [userId]);
  
  // If no specific branch access, get all org branches for admin
  let userBranches = branchAccessResult.rows.map(row => ({
    branch: { id: row.id, name: row.name, code: row.code },
    access: {
      branchRole: row.branch_role,
      canView: row.can_view,
      canCreate: row.can_create,
      canEdit: row.can_edit,
      canDelete: row.can_delete,
      canApprove: row.can_approve
    }
  }));
  
  if (!userBranches.length && user.role === 'admin') {
    const allBranchesQuery = `SELECT id, name, code FROM branches WHERE organization_id = $1`;
    const allBranchesResult = await pool.query(allBranchesQuery, [org.id]);
    
    userBranches = allBranchesResult.rows.map(b => ({
      branch: { id: b.id, name: b.name, code: b.code },
      access: {
        branchRole: 'admin',
        canView: true,
        canCreate: true,
        canEdit: true,
        canDelete: true,
        canApprove: true
      }
    }));
  }

  // Use primary branch or first available branch
  const primaryBranchId = user.primary_branch_id;
  const primaryBranch = primaryBranchId 
    ? userBranches.find((b: any) => b.branch.id === primaryBranchId)?.branch
    : userBranches[0]?.branch;

  if (!primaryBranch) {
    // Create access to main branch if no branches assigned using raw SQL
    const mainBranchQuery = `SELECT id, name, code FROM branches WHERE organization_id = $1 AND (code = 'MAIN' OR code LIKE '%HO%' OR code LIKE '%HEAD%') LIMIT 1`;
    const mainBranchResult = await pool.query(mainBranchQuery, [org.id]);
    
    if (!mainBranchResult.rows.length) {
      // Fallback to any branch in the organization
      const anyBranchQuery = `SELECT id, name, code FROM branches WHERE organization_id = $1 LIMIT 1`;
      const anyBranchResult = await pool.query(anyBranchQuery, [org.id]);
      
      if (!anyBranchResult.rows.length) {
        throw new Error("No branches available for user");
      }
      
      const branch = anyBranchResult.rows[0];
      userBranches = [{
        branch: { id: branch.id, name: branch.name, code: branch.code },
        access: {
          branchRole: user.role,
          canView: true,
          canCreate: user.role !== 'viewer',
          canEdit: user.role !== 'viewer',
          canDelete: user.role === 'admin',
          canApprove: user.role === 'admin' || user.role === 'manager'
        }
      }];
    } else {
      const branch = mainBranchResult.rows[0];
      userBranches = [{
        branch: { id: branch.id, name: branch.name, code: branch.code },
        access: {
          branchRole: user.role,
          canView: true,
          canCreate: user.role !== 'viewer',
          canEdit: user.role !== 'viewer',
          canDelete: user.role === 'admin',
          canApprove: user.role === 'admin' || user.role === 'manager'
        }
      }];
    }
  }

  const currentBranch = primaryBranch || userBranches[0]?.branch;

  const payload: OrgJwtPayload = {
    userId: user.id,
    username: user.username,
    email: user.email,
    
    // Organization
    organizationId: org.id,
    organizationName: org.name,
    organizationCode: org.code,
    
    // Current Branch
    currentBranchId: currentBranch.id,
    currentBranchName: currentBranch.name,
    currentBranchCode: currentBranch.code,
    
    // Roles & Permissions
    organizationRole: (user.role as 'admin' | 'manager' | 'user' | 'viewer') || 'user',
    branchRole: userBranches.find(b => b.branch.id === currentBranch.id)?.access?.branchRole || undefined,
    permissions: [],
    
    // Available Branches
    branches: userBranches.map(b => ({
      branchId: b.branch.id,
      branchCode: b.branch.code,
      branchName: b.branch.name,
      role: b.access?.branchRole || user.role,
      permissions: (b.access?.permissions as string[]) || []
    })),
    
    isSystemAdmin: user.is_super_admin || false
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
};

// Organization-aware authentication middleware
export const authenticateWithOrganization = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error('JWT verification error:', err.message);
      return res.status(403).json({ message: 'Invalid or expired token' });
    }

    const payload = decoded as OrgJwtPayload;
    
    // Set organization context
    req.organizationContext = {
      organizationId: payload.organizationId,
      organizationName: payload.organizationName,
      organizationCode: payload.organizationCode,
      currentBranchId: payload.currentBranchId,
      currentBranchName: payload.currentBranchName,
      currentBranchCode: payload.currentBranchCode
    };
    
    req.user = payload;
    next();
  });
};

// Role-based access control
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const userRole = req.user.branchRole || req.user.organizationRole;
    
    if (!roles.includes(userRole)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next();
  };
};

// Branch access control
export const requireBranchAccess = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const requestedBranchId = req.params.branchId || req.body.branchId || req.user.currentBranchId;
  
  // System admins have access to all branches
  if (req.user.isSystemAdmin) {
    return next();
  }

  // Check if user has access to the requested branch
  const hasAccess = req.user.branches.some((b: any) => b.branchId === requestedBranchId);
  
  if (!hasAccess) {
    return res.status(403).json({ message: 'No access to this branch' });
  }

  next();
};

// Switch current branch
export const switchBranch = async (req: Request, res: Response) => {
  try {
    const { branchId } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Verify user has access to this branch
    const hasAccess = req.user?.branches.some((b: any) => b.branchId === branchId);
    
    if (!hasAccess && !req.user?.isSystemAdmin) {
      return res.status(403).json({ message: 'No access to this branch' });
    }

    // Update user's primary branch (handle both column names during migration)
    await db.update(users)
      .set({ primaryBranchId: branchId } as any)
      .where(eq(users.id, userId));

    // Generate new token with updated branch context
    const newToken = await generateOrganizationToken(userId);

    res.json({ 
      message: 'Branch switched successfully',
      token: newToken
    });
  } catch (error) {
    console.error('Error switching branch:', error);
    res.status(500).json({ message: 'Failed to switch branch' });
  }
};