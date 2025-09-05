import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { db } from "./db";
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
  // Get user with organization
  const userResult = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!userResult.length) {
    throw new Error("User not found");
  }
  const user = userResult[0];

  // Get organization details from user's organization ID or fallback to tenant ID
  const orgId = (user as any).organizationId || (user as any).organization_id || user.tenantId;
  const orgResult = await db.select().from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);
  if (!orgResult.length) {
    throw new Error("Organization not found");
  }
  const org = orgResult[0];

  // Get user's accessible branches
  const branchAccessList = await db.select({
    branch: branches,
    access: userBranchAccess
  })
  .from(userBranchAccess)
  .innerJoin(branches, eq(branches.id, userBranchAccess.branchId))
  .where(and(
    eq(userBranchAccess.userId, userId),
    eq(userBranchAccess.isActive, true)
  ));

  // If no specific branch access, get all org branches for admin
  let userBranches = branchAccessList;
  if (!branchAccessList.length && user.role === 'admin') {
    const allBranches = await db.select({
      branch: branches,
      access: null as any
    })
    .from(branches)
    .where(eq(branches.organizationId, org.id));
    
    userBranches = allBranches.map(b => ({
      branch: b.branch,
      access: {
        id: 0,
        userId: userId,
        branchId: b.branch.id,
        branchRole: 'admin',
        permissions: [] as any,
        canView: true,
        canCreate: true,
        canEdit: true,
        canDelete: true,
        canApprove: true,
        assignedBy: null,
        assignedAt: new Date(),
        isActive: true
      }
    }));
  }

  // Use primary branch or first available branch
  const primaryBranchId = (user as any).primaryBranchId || (user as any).primary_branch_id;
  const primaryBranch = primaryBranchId 
    ? userBranches.find((b: any) => b.branch.id === primaryBranchId)?.branch
    : userBranches[0]?.branch;

  if (!primaryBranch) {
    // Create access to main branch if no branches assigned
    const mainBranch = await db.select().from(branches)
      .where(and(
        eq(branches.organizationId, org.id),
        eq(branches.code, 'MAIN')
      ))
      .limit(1);
    
    if (!mainBranch.length) {
      throw new Error("No branches available for user");
    }
    
    userBranches = [{
      branch: mainBranch[0],
      access: {
        id: 0,
        userId: userId,
        branchId: mainBranch[0].id,
        branchRole: user.role,
        permissions: [] as any,
        canView: true,
        canCreate: user.role !== 'viewer',
        canEdit: user.role !== 'viewer',
        canDelete: user.role === 'admin',
        canApprove: user.role === 'admin' || user.role === 'manager',
        assignedBy: null,
        assignedAt: new Date(),
        isActive: true
      }
    }];
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
    
    isSystemAdmin: (user as any).isSystemAdmin || (user as any).isSuperAdmin || false
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