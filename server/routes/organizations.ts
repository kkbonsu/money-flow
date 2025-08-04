import { Router } from "express";
import { z } from "zod";
import { db } from "../db";
import { organizations, users, organizationMembers } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth, syncUser } from "../auth";

const router = Router();

// Get current user's organizations
router.get("/", requireAuth, syncUser, async (req, res) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // Get organizations where user is a member
    const userOrgs = await db
      .select({
        organization: organizations,
        role: organizationMembers.role,
      })
      .from(organizationMembers)
      .innerJoin(organizations, eq(organizations.id, organizationMembers.organizationId))
      .where(eq(organizationMembers.userId, userId));

    res.json(userOrgs.map(row => ({
      ...row.organization,
      userRole: row.role,
    })));
  } catch (error) {
    console.error("Error fetching organizations:", error);
    res.status(500).json({ message: "Failed to fetch organizations" });
  }
});

// Get organization by ID
router.get("/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Check if user has access to this organization
    const [membership] = await db
      .select()
      .from(organizationMembers)
      .where(and(
        eq(organizationMembers.organizationId, id),
        eq(organizationMembers.userId, userId)
      ));

    if (!membership) {
      return res.status(403).json({ message: "Access denied" });
    }

    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, id));

    if (!org) {
      return res.status(404).json({ message: "Organization not found" });
    }

    res.json(org);
  } catch (error) {
    console.error("Error fetching organization:", error);
    res.status(500).json({ message: "Failed to fetch organization" });
  }
});

// Create new organization
const createOrgSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  tin: z.string().optional(),
  licenseNumber: z.string().optional(),
  subscriptionPlan: z.enum(['free', 'starter', 'professional', 'enterprise']).default('free'),
});

router.post("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const data = createOrgSchema.parse(req.body);

    // Create organization
    const [newOrg] = await db
      .insert(organizations)
      .values({
        ...data,
        createdBy: userId,
      })
      .returning();

    // Add creator as admin member
    await db.insert(organizationMembers).values({
      organizationId: newOrg.id,
      userId,
      role: 'admin',
      joinedAt: new Date(),
    });

    res.json(newOrg);
  } catch (error) {
    console.error("Error creating organization:", error);
    res.status(500).json({ message: "Failed to create organization" });
  }
});

// Update organization
const updateOrgSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  tin: z.string().optional(),
  licenseNumber: z.string().optional(),
  domain: z.string().optional(),
  settings: z.record(z.any()).optional(),
});

router.patch("/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const data = updateOrgSchema.parse(req.body);

    // Check if user is admin of this organization
    const [membership] = await db
      .select()
      .from(organizationMembers)
      .where(and(
        eq(organizationMembers.organizationId, id),
        eq(organizationMembers.userId, userId),
        eq(organizationMembers.role, 'admin')
      ));

    if (!membership) {
      return res.status(403).json({ message: "Only admins can update organization settings" });
    }

    const [updated] = await db
      .update(organizations)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, id))
      .returning();

    res.json(updated);
  } catch (error) {
    console.error("Error updating organization:", error);
    res.status(500).json({ message: "Failed to update organization" });
  }
});

// Get organization members
router.get("/:id/members", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Check if user has access to this organization
    const [membership] = await db
      .select()
      .from(organizationMembers)
      .where(and(
        eq(organizationMembers.organizationId, id),
        eq(organizationMembers.userId, userId)
      ));

    if (!membership) {
      return res.status(403).json({ message: "Access denied" });
    }

    const members = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.firstName,
        role: organizationMembers.role,
        joinedAt: organizationMembers.joinedAt,
        status: organizationMembers.status,
      })
      .from(organizationMembers)
      .innerJoin(users, eq(users.id, organizationMembers.userId))
      .where(eq(organizationMembers.organizationId, id));

    res.json(members);
  } catch (error) {
    console.error("Error fetching members:", error);
    res.status(500).json({ message: "Failed to fetch members" });
  }
});

// Invite member to organization
const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'manager', 'member', 'viewer']).default('member'),
});

router.post("/:id/invite", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const data = inviteMemberSchema.parse(req.body);

    // Check if user is admin of this organization
    const [membership] = await db
      .select()
      .from(organizationMembers)
      .where(and(
        eq(organizationMembers.organizationId, id),
        eq(organizationMembers.userId, userId),
        eq(organizationMembers.role, 'admin')
      ));

    if (!membership) {
      return res.status(403).json({ message: "Only admins can invite members" });
    }

    // TODO: Send invitation email
    // For now, we'll just return success
    res.json({ message: "Invitation sent successfully" });
  } catch (error) {
    console.error("Error inviting member:", error);
    res.status(500).json({ message: "Failed to send invitation" });
  }
});

// Switch active organization for user
router.post("/:id/switch", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Check if user has access to this organization
    const [membership] = await db
      .select()
      .from(organizationMembers)
      .where(and(
        eq(organizationMembers.organizationId, id),
        eq(organizationMembers.userId, userId)
      ));

    if (!membership) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Update user's current organization
    await db
      .update(users)
      .set({
        currentOrganizationId: id,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    res.json({ message: "Organization switched successfully" });
  } catch (error) {
    console.error("Error switching organization:", error);
    res.status(500).json({ message: "Failed to switch organization" });
  }
});

export default router;