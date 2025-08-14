import { Router } from "express";
import { db } from "./db";
import { roles, permissions, rolePermissions, userRoles, users } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";
import { requirePermission, requireMinimumRole, permissionService } from "./permissions";
import { authenticateToken } from "./tenantAuth";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

const router = Router();

// Schema for role assignment
const assignRoleSchema = z.object({
  userId: z.number(),
  roleId: z.number(),
});

const updateRolePermissionsSchema = z.object({
  permissionIds: z.array(z.number()),
});

// Get all roles for the tenant
router.get('/roles', authenticateToken, async (req: any, res) => {
  try {
    const tenantId = req.user?.tenantId || req.tenantContext?.tenantId;
    
    const tenantRoles = await db
      .select({
        id: roles.id,
        name: roles.name,
        description: roles.description,
        hierarchyLevel: roles.hierarchyLevel,
        isSystemRole: roles.isSystemRole,
        userCount: sql`COUNT(${userRoles.id})::int`.as('userCount')
      })
      .from(roles)
      .leftJoin(userRoles, and(
        eq(roles.id, userRoles.roleId),
        eq(userRoles.tenantId, tenantId),
        eq(userRoles.isActive, true)
      ))
      .where(
        and(
          eq(roles.isSystemRole, true),
          sql`(${roles.tenantId} IS NULL OR ${roles.tenantId} = ${tenantId})`
        )
      )
      .groupBy(roles.id, roles.name, roles.description, roles.hierarchyLevel, roles.isSystemRole)
      .orderBy(roles.hierarchyLevel);

    res.json(tenantRoles);
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ message: 'Failed to fetch roles' });
  }
});

// Get role details with permissions
router.get('/roles/:id', authenticateToken, async (req: any, res) => {
  try {
    const roleId = parseInt(req.params.id);
    
    // Get role details
    const [role] = await db.select().from(roles).where(eq(roles.id, roleId));
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    // Get role permissions
    const rolePermissionsList = await db
      .select({
        id: permissions.id,
        name: permissions.name,
        category: permissions.category,
        description: permissions.description,
        resource: permissions.resource,
        action: permissions.action,
      })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(rolePermissions.roleId, roleId))
      .orderBy(permissions.category, permissions.name);

    res.json({
      ...role,
      permissions: rolePermissionsList
    });
  } catch (error) {
    console.error('Error fetching role details:', error);
    res.status(500).json({ message: 'Failed to fetch role details' });
  }
});

// Get all permissions grouped by category
router.get('/permissions', authenticateToken, async (req: any, res) => {
  try {
    const allPermissions = await db
      .select()
      .from(permissions)
      .orderBy(permissions.category, permissions.name);

    // Group permissions by category
    const groupedPermissions = allPermissions.reduce((acc, permission) => {
      if (!acc[permission.category]) {
        acc[permission.category] = [];
      }
      acc[permission.category].push(permission);
      return acc;
    }, {} as Record<string, typeof allPermissions>);

    res.json(groupedPermissions);
  } catch (error) {
    console.error('Error fetching permissions:', error);
    res.status(500).json({ message: 'Failed to fetch permissions' });
  }
});

// Get users with their roles in the tenant
router.get('/users-roles', authenticateToken, async (req: any, res) => {
  try {
    const tenantId = req.user?.tenantId || req.tenantContext?.tenantId;
    
    const usersWithRoles = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        isActive: users.isActive,
        roleId: userRoles.roleId,
        roleName: roles.name,
        hierarchyLevel: roles.hierarchyLevel,
        assignedAt: userRoles.assignedAt,
      })
      .from(users)
      .leftJoin(userRoles, and(
        eq(users.id, userRoles.userId),
        eq(userRoles.tenantId, tenantId),
        eq(userRoles.isActive, true)
      ))
      .leftJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(users.tenantId, tenantId))
      .orderBy(users.username);

    res.json(usersWithRoles);
  } catch (error) {
    console.error('Error fetching users with roles:', error);
    res.status(500).json({ message: 'Failed to fetch users with roles' });
  }
});

// Assign role to user (Admin only)
router.post('/users/:userId/assign-role', authenticateToken, async (req: any, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const tenantId = req.user?.tenantId || req.tenantContext?.tenantId;
    const assignedBy = req.user?.id;
    
    const { roleId } = assignRoleSchema.parse(req.body);

    // Verify the role exists and is valid for this tenant
    const [role] = await db.select().from(roles).where(eq(roles.id, roleId));
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    // Verify the user exists in this tenant
    const [user] = await db.select().from(users).where(and(eq(users.id, userId), eq(users.tenantId, tenantId)));
    if (!user) {
      return res.status(404).json({ message: 'User not found in this tenant' });
    }

    // Check if user already has a role in this tenant
    const [existingRole] = await db
      .select()
      .from(userRoles)
      .where(and(eq(userRoles.userId, userId), eq(userRoles.tenantId, tenantId)));

    if (existingRole) {
      // Update existing role
      const [updatedUserRole] = await db
        .update(userRoles)
        .set({
          roleId,
          assignedBy,
          assignedAt: new Date(),
          isActive: true,
        })
        .where(and(eq(userRoles.userId, userId), eq(userRoles.tenantId, tenantId)))
        .returning();

      // Clear permission cache
      permissionService.clearUserCache(userId, tenantId);

      res.json({ 
        message: 'Role updated successfully',
        userRole: updatedUserRole
      });
    } else {
      // Create new role assignment
      const [newUserRole] = await db
        .insert(userRoles)
        .values({
          userId,
          roleId,
          tenantId,
          assignedBy,
          isActive: true,
        })
        .returning();

      // Clear permission cache
      permissionService.clearUserCache(userId, tenantId);

      res.json({ 
        message: 'Role assigned successfully',
        userRole: newUserRole
      });
    }
  } catch (error) {
    console.error('Error assigning role:', error);
    res.status(500).json({ message: 'Failed to assign role' });
  }
});

// Remove role from user (Admin only)
router.delete('/users/:userId/role', authenticateToken, async (req: any, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const tenantId = req.user?.tenantId || req.tenantContext?.tenantId;

    await db.delete(userRoles).where(and(eq(userRoles.userId, userId), eq(userRoles.tenantId, tenantId)));

    // Clear permission cache
    permissionService.clearUserCache(userId, tenantId);

    res.json({ message: 'Role removed successfully' });
  } catch (error) {
    console.error('Error removing role:', error);
    res.status(500).json({ message: 'Failed to remove role' });
  }
});

// Update role permissions (Admin only)
router.put('/roles/:roleId/permissions', authenticateToken, async (req: any, res) => {
  try {
    const roleId = parseInt(req.params.roleId);
    const { permissionIds } = updateRolePermissionsSchema.parse(req.body);

    // Verify the role exists
    const [role] = await db.select().from(roles).where(eq(roles.id, roleId));
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    // Remove all existing permissions for this role
    await db.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId));

    // Add new permissions
    if (permissionIds.length > 0) {
      const rolePermissionValues = permissionIds.map(permissionId => ({
        roleId,
        permissionId,
      }));
      
      await db.insert(rolePermissions).values(rolePermissionValues);
    }

    // Clear all permission caches (since role permissions changed)
    const usersWithThisRole = await db
      .select({ userId: userRoles.userId, tenantId: userRoles.tenantId })
      .from(userRoles)
      .where(eq(userRoles.roleId, roleId));

    usersWithThisRole.forEach(({ userId, tenantId }) => {
      permissionService.clearUserCache(userId, tenantId);
    });

    res.json({ message: 'Role permissions updated successfully' });
  } catch (error) {
    console.error('Error updating role permissions:', error);
    res.status(500).json({ message: 'Failed to update role permissions' });
  }
});

// Get current user's permissions
router.get('/my-permissions', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user?.id;
    const tenantId = req.user?.tenantId || req.tenantContext?.tenantId;

    if (!userId) {
      return res.status(400).json({ message: 'User ID not found in request' });
    }

    const userPermissions = await permissionService.getUserPermissions(userId, tenantId);
    
    if (!userPermissions) {
      // If no permissions found, return default structure for regular users
      return res.json({
        userId,
        tenantId,
        roleId: null,
        roleName: null,
        hierarchyLevel: 99,
        permissions: [],
        isSuperAdmin: false
      });
    }

    res.json(userPermissions);
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    res.status(500).json({ message: 'Failed to fetch user permissions' });
  }
});

export default router;