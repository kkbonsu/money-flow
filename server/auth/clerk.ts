import { createClerkClient } from "@clerk/backend";
import type { Request, Response, NextFunction } from "express";
import { db } from "../db";
import { organizations, users } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import jwt from "jsonwebtoken";

// Initialize Clerk client
const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY!,
});

// Extended Request type with auth properties
export interface AuthenticatedRequest extends Request {
  auth?: {
    userId: string;
    sessionId: string;
    orgId?: string;
  };
  user?: {
    id: number;
    organizationId: number;
    clerkUserId: string;
    role: string;
    permissions: any[];
  };
  organization?: {
    id: number;
    name: string;
    slug: string;
    subscriptionPlan: string;
    features: any;
  };
}

// Middleware to verify Clerk session
export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const sessionToken = req.headers.authorization?.replace("Bearer ", "");
    
    if (!sessionToken) {
      return res.status(401).json({ error: "No authorization token provided" });
    }

    // Verify the session token with Clerk
    const tokenPayload = await clerk.verifyToken(sessionToken);
    
    if (!tokenPayload) {
      return res.status(401).json({ error: "Invalid session token" });
    }

    // Extract user and organization info from token
    req.auth = {
      userId: tokenPayload.sub,
      sessionId: tokenPayload.sid || "",
      orgId: tokenPayload.org_id,
    };

    // Load user and organization from database
    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.clerkUserId, req.auth.userId));

    if (!dbUser) {
      return res.status(401).json({ error: "User not found in database" });
    }

    req.user = dbUser;

    // Load organization
    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, dbUser.organizationId));

    if (!org) {
      return res.status(401).json({ error: "Organization not found" });
    }

    req.organization = org;

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(401).json({ error: "Authentication failed" });
  }
}

// Middleware to check if user has specific role
export function requireRole(roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    next();
  };
}

// Middleware to check if user has specific permission
export function requirePermission(permission: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const userPermissions = req.user.permissions || [];
    if (!userPermissions.includes(permission)) {
      return res.status(403).json({ error: "Missing required permission" });
    }

    next();
  };
}

// Helper to sync Clerk user with database
export async function syncClerkUser(clerkUserId: string) {
  try {
    const clerkUser = await clerk.users.getUser(clerkUserId);
    
    if (!clerkUser) {
      throw new Error("Clerk user not found");
    }

    // Get organization ID from Clerk user
    const orgId = clerkUser.publicMetadata?.organizationId as number | undefined;
    
    if (!orgId) {
      throw new Error("User has no organization assigned");
    }

    // Check if user exists in database
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.clerkUserId, clerkUserId));

    if (existingUser) {
      // Update user
      await db
        .update(users)
        .set({
          email: clerkUser.emailAddresses[0]?.emailAddress || "",
          firstName: clerkUser.firstName,
          lastName: clerkUser.lastName,
          profilePicture: clerkUser.imageUrl,
          lastLogin: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(users.clerkUserId, clerkUserId));
    } else {
      // Create new user
      await db.insert(users).values({
        organizationId: orgId,
        clerkUserId: clerkUserId,
        username: clerkUser.username || clerkUser.emailAddresses[0]?.emailAddress || "",
        email: clerkUser.emailAddresses[0]?.emailAddress || "",
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        profilePicture: clerkUser.imageUrl,
        role: "user", // Default role
        permissions: [],
        isActive: true,
      });
    }

    return true;
  } catch (error) {
    console.error("Error syncing Clerk user:", error);
    return false;
  }
}

// Webhook handler for Clerk events
export async function handleClerkWebhook(req: Request, res: Response) {
  try {
    const { type, data } = req.body;

    switch (type) {
      case "user.created":
      case "user.updated":
        await syncClerkUser(data.id);
        break;
      
      case "user.deleted":
        await db
          .update(users)
          .set({ isActive: false })
          .where(eq(users.clerkUserId, data.id));
        break;
      
      case "organization.created":
        // Handle organization creation
        await db.insert(organizations).values({
          name: data.name,
          slug: data.slug,
          clerkOrganizationId: data.id,
          subscriptionPlan: "basic",
          settings: {},
          features: {},
          branding: {},
        });
        break;
      
      case "organization.updated":
        // Handle organization update
        await db
          .update(organizations)
          .set({
            name: data.name,
            slug: data.slug,
            updatedAt: new Date(),
          })
          .where(eq(organizations.clerkOrganizationId, data.id));
        break;
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
}