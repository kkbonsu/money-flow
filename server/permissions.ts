import { db } from "./db";
import { users, roles, permissions, rolePermissions, userRoles } from "@shared/schema";
import { eq, and, sql, inArray } from "drizzle-orm";
import { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "@shared/schema";

// Permission cache for performance
const permissionCache = new Map<string, string[]>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export interface UserPermissions {
  userId: number;
  tenantId: string;
  roleId: number;
  roleName: string;
  hierarchyLevel: number;
  permissions: string[];
  isSuperAdmin: boolean;
}

export class PermissionService {
  /**
   * Get user's role and permissions for a specific tenant
   */
  async getUserPermissions(userId: number, tenantId: string): Promise<UserPermissions | null> {
    const cacheKey = `${userId}:${tenantId}`;
    
    // Check cache first
    if (permissionCache.has(cacheKey)) {
      const cached = permissionCache.get(cacheKey);
      if (cached) {
        // Return cached permissions (assuming they're still valid)
        return JSON.parse(cached[0]);
      }
    }

    try {
      // Get user's role and permissions for the tenant
      const userPermissionData = await db
        .select({
          userId: userRoles.userId,
          tenantId: userRoles.tenantId,
          roleId: userRoles.roleId,
          roleName: roles.name,
          hierarchyLevel: roles.hierarchyLevel,
          permissionName: permissions.name,
          isSuperAdmin: users.isSuperAdmin,
        })
        .from(userRoles)
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .innerJoin(rolePermissions, eq(roles.id, rolePermissions.roleId))
        .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
        .innerJoin(users, eq(userRoles.userId, users.id))
        .where(
          and(
            eq(userRoles.userId, userId),
            eq(userRoles.tenantId, tenantId),
            eq(userRoles.isActive, true)
          )
        );

      if (userPermissionData.length === 0) {
        return null;
      }

      const firstRecord = userPermissionData[0];
      const userPermissions = userPermissionData.map(p => p.permissionName);

      const result: UserPermissions = {
        userId: firstRecord.userId,
        tenantId: firstRecord.tenantId,
        roleId: firstRecord.roleId,
        roleName: firstRecord.roleName,
        hierarchyLevel: firstRecord.hierarchyLevel,
        permissions: userPermissions,
        isSuperAdmin: firstRecord.isSuperAdmin || false,
      };

      // Cache the result
      permissionCache.set(cacheKey, [JSON.stringify(result), Date.now().toString()]);
      
      return result;
    } catch (error) {
      console.error("Error fetching user permissions:", error);
      return null;
    }
  }

  /**
   * Check if user has a specific permission
   */
  async hasPermission(userId: number, tenantId: string, permission: string): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId, tenantId);
    
    if (!userPermissions) {
      return false;
    }

    // Super admins have all permissions
    if (userPermissions.isSuperAdmin) {
      return true;
    }

    return userPermissions.permissions.includes(permission);
  }

  /**
   * Check if user has minimum role hierarchy level
   */
  async hasMinimumRole(userId: number, tenantId: string, requiredLevel: number): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId, tenantId);
    
    if (!userPermissions) {
      return false;
    }

    // Lower numbers = higher hierarchy (1 = Super Admin, 4 = Staff)
    return userPermissions.hierarchyLevel <= requiredLevel;
  }

  /**
   * Check if user has any of the specified roles
   */
  async hasAnyRole(userId: number, tenantId: string, roleNames: string[]): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId, tenantId);
    
    if (!userPermissions) {
      return false;
    }

    return roleNames.includes(userPermissions.roleName);
  }

  /**
   * Clear permission cache for a user
   */
  clearUserCache(userId: number, tenantId?: string): void {
    if (tenantId) {
      permissionCache.delete(`${userId}:${tenantId}`);
    } else {
      // Clear all cache entries for this user
      const keysToDelete: string[] = [];
      permissionCache.forEach((_, key) => {
        if (key.startsWith(`${userId}:`)) {
          keysToDelete.push(key);
        }
      });
      keysToDelete.forEach(key => permissionCache.delete(key));
    }
  }

  /**
   * Get all roles for a tenant
   */
  async getTenantRoles(tenantId: string): Promise<any[]> {
    return await db
      .select()
      .from(roles)
      .where(
        and(
          eq(roles.isSystemRole, true),
          sql`(${roles.tenantId} IS NULL OR ${roles.tenantId} = ${tenantId})`
        )
      )
      .orderBy(roles.hierarchyLevel);
  }

  /**
   * Assign role to user
   */
  async assignRole(userId: number, roleId: number, tenantId: string, assignedBy: number): Promise<boolean> {
    try {
      // Check if assignment already exists
      const existing = await db
        .select()
        .from(userRoles)
        .where(
          and(
            eq(userRoles.userId, userId),
            eq(userRoles.tenantId, tenantId)
          )
        );

      if (existing.length > 0) {
        // Update existing role
        await db
          .update(userRoles)
          .set({
            roleId,
            assignedBy,
            assignedAt: new Date(),
            isActive: true,
          })
          .where(
            and(
              eq(userRoles.userId, userId),
              eq(userRoles.tenantId, tenantId)
            )
          );
      } else {
        // Create new role assignment
        await db.insert(userRoles).values({
          userId,
          roleId,
          tenantId,
          assignedBy,
          isActive: true,
        });
      }

      // Clear cache for this user
      this.clearUserCache(userId, tenantId);
      
      return true;
    } catch (error) {
      console.error("Error assigning role:", error);
      return false;
    }
  }
}

export const permissionService = new PermissionService();

/**
 * Middleware to require specific permission
 */
export function requirePermission(permission: string): RequestHandler {
  return async (req: any, res, next) => {
    try {
      const user = req.user;
      if (!user || !user.id || !user.tenantId) {
        return res.status(401).json({ message: "Unauthorized: No user context" });
      }

      const hasPermission = await permissionService.hasPermission(
        user.id,
        user.tenantId,
        permission
      );

      if (!hasPermission) {
        return res.status(403).json({ 
          message: `Forbidden: Missing permission '${permission}'` 
        });
      }

      next();
    } catch (error) {
      console.error("Permission check error:", error);
      res.status(500).json({ message: "Permission check failed" });
    }
  };
}

/**
 * Middleware to require minimum role hierarchy level
 */
export function requireMinimumRole(level: number): RequestHandler {
  return async (req: any, res, next) => {
    try {
      const user = req.user;
      if (!user || !user.id || !user.tenantId) {
        return res.status(401).json({ message: "Unauthorized: No user context" });
      }

      const hasRole = await permissionService.hasMinimumRole(
        user.id,
        user.tenantId,
        level
      );

      if (!hasRole) {
        return res.status(403).json({ 
          message: `Forbidden: Insufficient role level (required: ${level})` 
        });
      }

      next();
    } catch (error) {
      console.error("Role check error:", error);
      res.status(500).json({ message: "Role check failed" });
    }
  };
}

/**
 * Middleware to require any of the specified roles
 */
export function requireAnyRole(...roleNames: string[]): RequestHandler {
  return async (req: any, res, next) => {
    try {
      const user = req.user;
      if (!user || !user.id || !user.tenantId) {
        return res.status(401).json({ message: "Unauthorized: No user context" });
      }

      const hasRole = await permissionService.hasAnyRole(
        user.id,
        user.tenantId,
        roleNames
      );

      if (!hasRole) {
        return res.status(403).json({ 
          message: `Forbidden: Missing required role (one of: ${roleNames.join(', ')})` 
        });
      }

      next();
    } catch (error) {
      console.error("Role check error:", error);
      res.status(500).json({ message: "Role check failed" });
    }
  };
}

/**
 * Clear stale cache entries
 */
setInterval(() => {
  const now = Date.now();
  const keysToDelete: string[] = [];
  permissionCache.forEach((value, key) => {
    const timestamp = parseInt(value[1]);
    if (now - timestamp > CACHE_TTL) {
      keysToDelete.push(key);
    }
  });
  keysToDelete.forEach(key => permissionCache.delete(key));
}, CACHE_TTL);