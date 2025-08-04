import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { createClerkClient } from "@clerk/backend";
import { db } from "../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Initialize Clerk client if available
const clerk = process.env.CLERK_SECRET_KEY
  ? createClerkClient({
      secretKey: process.env.CLERK_SECRET_KEY,
    })
  : null;

export interface AuthenticatedRequest extends Request {
  user?: any;
  userId?: number | string;
  organizationId?: number;
}

// Unified authentication middleware that supports both JWT and Clerk
export async function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Access token required" });
    }

    // Try Clerk authentication first if available
    if (clerk) {
      try {
        const tokenPayload = await clerk.verifyToken(token);
        
        if (tokenPayload) {
          // Load user from database using Clerk user ID
          const [dbUser] = await db
            .select()
            .from(users)
            .where(eq(users.clerkUserId, tokenPayload.sub));

          if (dbUser) {
            req.user = dbUser;
            req.userId = dbUser.id;
            req.organizationId = dbUser.organizationId;
            return next();
          }
        }
      } catch (clerkError) {
        // If Clerk auth fails, try JWT
        console.log("Clerk auth failed, trying JWT:", clerkError);
      }
    }

    // Fall back to JWT authentication
    jwt.verify(token, JWT_SECRET, async (err: any, decoded: any) => {
      if (err) {
        return res.status(403).json({ message: "Invalid token" });
      }

      // For JWT, load user from database
      const user = await storage.getUser(decoded.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      req.user = user;
      req.userId = decoded.userId;
      req.organizationId = user.organizationId;
      next();
    });
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(401).json({ message: "Authentication failed" });
  }
}

// Import storage to avoid circular dependency
import { storage } from "../storage";