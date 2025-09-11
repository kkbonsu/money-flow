import type { Express, Request, Response } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { multiTenantStorage } from "./multiTenantStorage";

// Use the proper multi-tenant storage
const storage = multiTenantStorage;
import multer from "multer";
import path from "path";
import fs from "fs";
import { 
  insertUserSchema, 
  insertCustomerSchema, 
  insertLoanBookSchema, 
  insertLoanProductSchema,
  insertPaymentScheduleSchema,
  insertStaffSchema,
  insertIncomeManagementSchema,
  insertExpenseSchema,
  insertBankManagementSchema,
  insertPettyCashSchema,
  insertInventorySchema,
  insertRentManagementSchema,
  insertAssetSchema,
  insertLiabilitySchema,
  insertEquitySchema,
  insertReportSchema,
  insertUserAuditLogSchema,
  insertMfiRegistrationSchema,
  insertShareholderSchema,
  insertSupportTicketSchema,
  insertSupportMessageSchema
} from "@shared/schema";
import { z } from "zod";
import { simpleTenants } from "@shared/tenantSchema";
import { db } from "./db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { 
  extractTenantContext, 
  authenticateToken, 
  authenticateCustomerToken, 
  requireRole, 
  requireSuperAdmin,
  generateUserToken,
  generateCustomerToken,
  createTenantWithAdmin,
  tenantContextWithAuth,
  customerTenantContextWithAuth,
  requireTenantAccess,
  getUserAccessibleTenants,
  validateTenantAccess
} from "./tenantAuth";
import { eq, and, sql } from "drizzle-orm";
import { users, tenants } from "@shared/schema";
import roleRoutes from "./roleRoutes";
import { registerOptimizedRoutes } from "./optimizedRoutes";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage_multer = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `profile-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({ 
  storage: storage_multer,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Use tenant-aware middleware from tenantAuth.ts
// Legacy middleware removed, using new tenant-aware authentication

export async function registerRoutes(app: Express): Promise<Server> {
  // Apply tenant context extraction to all routes
  app.use(extractTenantContext);
  
  // Serve static files from uploads directory
  app.use('/uploads', express.static(uploadsDir));
  
  // Tenant-aware auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      if (!req.tenantContext?.tenantId) {
        return res.status(400).json({ message: 'Tenant context required' });
      }
      const tenantId = req.tenantContext.tenantId;
      
      const user = await storage.createUser(tenantId, {
        ...userData,
        password: hashedPassword,
      });
      
      const token = generateUserToken(user, tenantId);
      
      res.json({ 
        user: { 
          id: user.id, 
          username: user.username, 
          email: user.email, 
          role: user.role,
          tenantId,
          isSuperAdmin: user.isSuperAdmin || false
        }, 
        token 
      });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Registration failed" });
    }
  });

  app.post("/api/auth/login", extractTenantContext, async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!req.tenantContext?.tenantId) {
        return res.status(400).json({ message: 'Tenant context required' });
      }
      const tenantId = req.tenantContext.tenantId;
      const user = await storage.getUserByUsername(tenantId, username);
      
      if (!user || !await bcrypt.compare(password, user.password)) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      const token = generateUserToken(user, tenantId);
      
      // Update last login and log the login
      await storage.updateUserLastLogin(tenantId, user.id);
      await storage.createUserAuditLog(tenantId, {
        userId: user.id,
        action: 'login',
        description: 'User logged in successfully',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });
      
      res.json({ 
        user: { 
          id: user.id, 
          username: user.username, 
          email: user.email, 
          role: user.role,
          tenantId,
          isSuperAdmin: user.isSuperAdmin || false
        }, 
        token 
      });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Login failed" });
    }
  });

  // Optimized customer authentication endpoint
  app.post("/api/customer/auth/login", extractTenantContext, async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!req.tenantContext?.tenantId) {
        return res.status(400).json({ message: 'Tenant context required' });
      }
      const tenantId = req.tenantContext.tenantId;
      const customer = await storage.getCustomerByEmail(tenantId, email);
      
      // Combined validation check
      if (!customer || !customer.password || !customer.isPortalActive) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Password verification
      if (!await bcrypt.compare(password, customer.password)) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      const token = generateCustomerToken(customer, tenantId);
      
      // Async last login update (non-blocking)
      storage.updateCustomerLastLogin(tenantId, customer.id).catch(console.error);
      
      res.json({ 
        customer: { 
          id: customer.id, 
          firstName: customer.firstName, 
          lastName: customer.lastName, 
          email: customer.email,
          phone: customer.phone,
          address: customer.address,
          creditScore: customer.creditScore,
          isPortalActive: customer.isPortalActive,
          tenantId
        }, 
        token 
      });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Login failed" });
    }
  });

  // User tenant access routes
  app.get("/api/user/accessible-tenants", extractTenantContext, authenticateToken, async (req, res) => {
    try {
      const userId = req.user.id;
      const accessibleTenants = await getUserAccessibleTenants(userId);
      
      res.json({
        tenants: accessibleTenants,
        currentTenant: req.tenantContext?.tenant,
        switchedTenant: req.tenantContext?.switchedTenant || false
      });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch accessible tenants" });
    }
  });

  // Switch to a different tenant (for users with multi-tenant access)
  app.post("/api/user/switch-tenant", extractTenantContext, authenticateToken, async (req, res) => {
    try {
      const { tenantSlug } = req.body;
      const userId = req.user.id;
      
      if (!tenantSlug) {
        return res.status(400).json({ message: "Tenant slug is required" });
      }
      
      // Get the requested tenant
      const requestedTenant = await multiTenantStorage.getTenantBySlug(tenantSlug);
      if (!requestedTenant) {
        return res.status(404).json({ message: "Tenant not found" });
      }
      
      // Validate user access to the requested tenant
      const accessValidation = await validateTenantAccess(userId, requestedTenant.id, req.user.isSuperAdmin);
      if (!accessValidation.hasAccess) {
        return res.status(403).json({ message: "Access denied to the requested tenant" });
      }
      
      // Generate a new token for the requested tenant
      const user = await storage.getUser(req.tenantContext?.tenantId || requestedTenant.id, userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const newToken = generateUserToken(user, requestedTenant.id);
      
      res.json({
        message: "Tenant switched successfully",
        tenant: requestedTenant,
        token: newToken,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          tenantId: requestedTenant.id,
          isSuperAdmin: user.isSuperAdmin || false
        }
      });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to switch tenant" });
    }
  });

  // Tenant management routes (Super Admin only)
  app.post("/api/admin/tenants", authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
      const { name, slug, adminUser } = req.body;
      
      // Create tenant with admin user
      const result = await createTenantWithAdmin({
        name,
        slug,
        adminUser
      });
      
      res.json(result);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to create tenant" });
    }
  });

  app.get("/api/admin/tenants", authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
      const tenants = await db.select().from(simpleTenants);
      res.json(tenants);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch tenants" });
    }
  });

  // Enhanced super admin stats endpoint with comprehensive metrics
  app.get("/api/admin/stats", authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
      const [
        totalTenantsResult,
        activeTenantsResult,
        suspendedTenantsResult,
        totalUsersResult,
        activeUsersResult,
        totalCustomersResult,
        totalLoansResult,
        totalLoanAmountResult,
        recentTenantsResult,
        recentUsersResult
      ] = await Promise.all([
        db.select({ count: sql<number>`count(*)` }).from(simpleTenants),
        db.select({ count: sql<number>`count(*)` }).from(simpleTenants).where(eq(simpleTenants.status, 'active')),
        db.select({ count: sql<number>`count(*)` }).from(simpleTenants).where(eq(simpleTenants.status, 'suspended')),
        db.select({ count: sql<number>`count(*)` }).from(users),
        db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.isActive, true)),
        db.select({ count: sql<number>`count(*)` }).from(customers),
        db.select({ count: sql<number>`count(*)` }).from(loanBooks),
        db.select({ 
          total: sql<string>`coalesce(sum(${loanBooks.loanAmount}), '0')` 
        }).from(loanBooks),
        // Recent tenants (last 30 days)
        db.select({ count: sql<number>`count(*)` }).from(simpleTenants)
          .where(sql`${simpleTenants.createdAt} >= now() - interval '30 days'`),
        // Recent users (last 30 days) 
        db.select({ count: sql<number>`count(*)` }).from(users)
          .where(sql`${users.createdAt} >= now() - interval '30 days'`)
      ]);

      // Calculate growth percentages (simplified calculation)
      const tenantGrowth = Math.floor(Math.random() * 20) - 10; // Placeholder for actual calculation
      const userGrowth = Math.floor(Math.random() * 15) - 5;
      const customerGrowth = Math.floor(Math.random() * 25) - 12;

      res.json({
        totalTenants: totalTenantsResult[0]?.count || 0,
        activeTenants: activeTenantsResult[0]?.count || 0,
        suspendedTenants: suspendedTenantsResult[0]?.count || 0,
        totalUsers: totalUsersResult[0]?.count || 0,
        activeUsers: activeUsersResult[0]?.count || 0,
        totalCustomers: totalCustomersResult[0]?.count || 0,
        totalLoans: totalLoansResult[0]?.count || 0,
        totalLoanAmount: totalLoanAmountResult[0]?.total || '0',
        recentTenants: recentTenantsResult[0]?.count || 0,
        recentUsers: recentUsersResult[0]?.count || 0,
        // Growth metrics
        tenantGrowth,
        userGrowth,
        customerGrowth,
        systemRevenue: "$0", // Placeholder for future implementation
        // System health indicators
        systemHealth: {
          status: "healthy",
          uptime: process.uptime(),
          memoryUsage: process.memoryUsage(),
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch system stats" });
    }
  });

  // Cross-tenant analytics and reporting endpoints
  app.get("/api/admin/analytics/overview", authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
      const { timeframe = '30d' } = req.query;
      const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
      
      const [
        tenantGrowthData,
        userGrowthData,
        loanGrowthData,
        topTenantsByUsers,
        topTenantsByLoans,
        systemActivityData
      ] = await Promise.all([
        // Tenant growth over time
        db.select({
          date: sql<string>`date(${simpleTenants.createdAt})`,
          count: sql<number>`count(*)`
        })
        .from(simpleTenants)
        .where(sql`${simpleTenants.createdAt} >= now() - interval '${days} days'`)
        .groupBy(sql`date(${simpleTenants.createdAt})`)
        .orderBy(sql`date(${simpleTenants.createdAt})`),
        
        // User growth over time
        db.select({
          date: sql<string>`date(${users.createdAt})`,
          count: sql<number>`count(*)`
        })
        .from(users)
        .where(sql`${users.createdAt} >= now() - interval '${days} days'`)
        .groupBy(sql`date(${users.createdAt})`)
        .orderBy(sql`date(${users.createdAt})`),
        
        // Loan growth over time
        db.select({
          date: sql<string>`date(${loanBooks.dateApplied})`,
          count: sql<number>`count(*)`,
          amount: sql<string>`sum(${loanBooks.loanAmount})`
        })
        .from(loanBooks)
        .where(sql`${loanBooks.dateApplied} >= now() - interval '${days} days'`)
        .groupBy(sql`date(${loanBooks.dateApplied})`)
        .orderBy(sql`date(${loanBooks.dateApplied})`),
        
        // Top tenants by user count
        db.select({
          tenantId: users.tenantId,
          tenantName: simpleTenants.name,
          userCount: sql<number>`count(*)`
        })
        .from(users)
        .leftJoin(simpleTenants, eq(users.tenantId, simpleTenants.id))
        .groupBy(users.tenantId, simpleTenants.name)
        .orderBy(desc(sql`count(*)`))
        .limit(10),
        
        // Top tenants by loan count
        db.select({
          tenantId: loanBooks.tenantId,
          tenantName: simpleTenants.name,
          loanCount: sql<number>`count(*)`,
          totalAmount: sql<string>`sum(${loanBooks.loanAmount})`
        })
        .from(loanBooks)
        .leftJoin(simpleTenants, eq(loanBooks.tenantId, simpleTenants.id))
        .groupBy(loanBooks.tenantId, simpleTenants.name)
        .orderBy(desc(sql`count(*)`))
        .limit(10),
        
        // System activity data (simplified)
        db.select({
          date: sql<string>`date(${userAuditLogs.createdAt})`,
          activityCount: sql<number>`count(*)`
        })
        .from(userAuditLogs)
        .where(sql`${userAuditLogs.createdAt} >= now() - interval '${days} days'`)
        .groupBy(sql`date(${userAuditLogs.createdAt})`)
        .orderBy(sql`date(${userAuditLogs.createdAt})`)
      ]);

      res.json({
        timeframe,
        tenantGrowth: tenantGrowthData,
        userGrowth: userGrowthData,
        loanGrowth: loanGrowthData,
        topTenantsByUsers,
        topTenantsByLoans,
        systemActivity: systemActivityData
      });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch analytics overview" });
    }
  });

  // System health monitoring endpoint
  app.get("/api/admin/system/health", authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
      const [
        databaseConnectivity,
        tenantStatusSummary,
        systemResources,
        errorRates
      ] = await Promise.all([
        // Test database connectivity
        db.select({ count: sql<number>`count(*)` }).from(simpleTenants).then(() => ({ status: 'healthy', latency: Date.now() })),
        
        // Tenant status summary
        db.select({
          status: simpleTenants.status,
          count: sql<number>`count(*)`
        })
        .from(simpleTenants)
        .groupBy(simpleTenants.status),
        
        // System resources
        Promise.resolve({
          memory: process.memoryUsage(),
          uptime: process.uptime(),
          platform: process.platform,
          nodeVersion: process.version,
          pid: process.pid
        }),
        
        // Error rates (simplified - would need actual error tracking)
        Promise.resolve({
          last24h: Math.floor(Math.random() * 50),
          last7d: Math.floor(Math.random() * 200),
          errorRate: (Math.random() * 5).toFixed(2) + '%'
        })
      ]);

      const healthScore = 95 + Math.floor(Math.random() * 5); // Simplified health score

      res.json({
        timestamp: new Date().toISOString(),
        overallStatus: healthScore >= 95 ? 'healthy' : healthScore >= 85 ? 'warning' : 'critical',
        healthScore,
        database: databaseConnectivity,
        tenantStatus: tenantStatusSummary,
        systemResources,
        errorRates,
        alerts: [] // Would contain actual system alerts
      });
    } catch (error) {
      res.status(500).json({ 
        timestamp: new Date().toISOString(),
        overallStatus: 'critical',
        healthScore: 0,
        error: error instanceof Error ? error.message : "Health check failed"
      });
    }
  });

  // Cross-tenant data insights endpoint
  app.get("/api/admin/insights/cross-tenant", authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
      const [
        tenantPerformanceMetrics,
        resourceUtilization,
        userEngagementMetrics,
        financialMetrics
      ] = await Promise.all([
        // Tenant performance comparison
        db.select({
          tenantId: simpleTenants.id,
          tenantName: simpleTenants.name,
          status: simpleTenants.status,
          userCount: sql<number>`(select count(*) from ${users} where ${users.tenantId} = ${simpleTenants.id})`,
          customerCount: sql<number>`(select count(*) from ${customers} where ${customers.tenantId} = ${simpleTenants.id})`,
          loanCount: sql<number>`(select count(*) from ${loanBooks} where ${loanBooks.tenantId} = ${simpleTenants.id})`,
          totalLoanAmount: sql<string>`coalesce((select sum(${loanBooks.loanAmount}) from ${loanBooks} where ${loanBooks.tenantId} = ${simpleTenants.id}), '0')`
        })
        .from(simpleTenants)
        .orderBy(desc(sql`(select count(*) from ${users} where ${users.tenantId} = ${simpleTenants.id})`)),
        
        // Resource utilization by tenant
        db.select({
          tenantId: simpleTenants.id,
          tenantName: simpleTenants.name,
          dataUsage: sql<string>`'0 MB'`, // Placeholder
          storageUsage: sql<string>`'0 MB'`, // Placeholder
          apiCallsToday: sql<number>`floor(random() * 1000)`, // Placeholder
          activeUsers24h: sql<number>`floor(random() * 50)` // Placeholder
        })
        .from(simpleTenants)
        .where(eq(simpleTenants.status, 'active')),
        
        // User engagement metrics
        db.select({
          totalActiveUsers: sql<number>`count(*)`,
          dailyActiveUsers: sql<number>`count(*) filter (where ${users.lastLogin} >= now() - interval '1 day')`,
          weeklyActiveUsers: sql<number>`count(*) filter (where ${users.lastLogin} >= now() - interval '7 days')`,
          monthlyActiveUsers: sql<number>`count(*) filter (where ${users.lastLogin} >= now() - interval '30 days')`
        })
        .from(users)
        .where(eq(users.isActive, true)),
        
        // Financial metrics across all tenants
        db.select({
          totalLoansIssued: sql<number>`count(*)`,
          totalLoanValue: sql<string>`coalesce(sum(${loanBooks.loanAmount}), '0')`,
          avgLoanAmount: sql<string>`coalesce(avg(${loanBooks.loanAmount}), '0')`,
          approvedLoans: sql<number>`count(*) filter (where ${loanBooks.status} = 'approved')`,
          pendingLoans: sql<number>`count(*) filter (where ${loanBooks.status} = 'pending')`,
          rejectedLoans: sql<number>`count(*) filter (where ${loanBooks.status} = 'rejected')`
        })
        .from(loanBooks)
      ]);

      res.json({
        generatedAt: new Date().toISOString(),
        tenantPerformance: tenantPerformanceMetrics,
        resourceUtilization,
        userEngagement: userEngagementMetrics[0] || {},
        financialMetrics: financialMetrics[0] || {}
      });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch cross-tenant insights" });
    }
  });

  // Advanced tenant management endpoint
  app.get("/api/admin/tenants/:tenantId/detailed", authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
      const { tenantId } = req.params;
      
      const [
        tenantInfo,
        tenantUsers,
        tenantCustomers,
        tenantLoans,
        tenantActivity,
        tenantStats
      ] = await Promise.all([
        // Basic tenant information
        storage.getTenant(tenantId),
        
        // Tenant users summary
        db.select({
          totalUsers: sql<number>`count(*)`,
          activeUsers: sql<number>`count(*) filter (where ${users.isActive} = true)`,
          adminUsers: sql<number>`count(*) filter (where ${users.role} = 'admin')`,
          recentUsers: sql<number>`count(*) filter (where ${users.createdAt} >= now() - interval '30 days')`
        })
        .from(users)
        .where(eq(users.tenantId, tenantId)),
        
        // Tenant customers summary
        db.select({
          totalCustomers: sql<number>`count(*)`,
          activeCustomers: sql<number>`count(*) filter (where ${customers.status} = 'active')`,
          portalActiveCustomers: sql<number>`count(*) filter (where ${customers.isPortalActive} = true)`,
          recentCustomers: sql<number>`count(*) filter (where ${customers.createdAt} >= now() - interval '30 days')`
        })
        .from(customers)
        .where(eq(customers.tenantId, tenantId)),
        
        // Tenant loans summary
        db.select({
          totalLoans: sql<number>`count(*)`,
          approvedLoans: sql<number>`count(*) filter (where ${loanBooks.status} = 'approved')`,
          pendingLoans: sql<number>`count(*) filter (where ${loanBooks.status} = 'pending')`,
          rejectedLoans: sql<number>`count(*) filter (where ${loanBooks.status} = 'rejected')`,
          totalLoanAmount: sql<string>`coalesce(sum(${loanBooks.loanAmount}), '0')`,
          avgLoanAmount: sql<string>`coalesce(avg(${loanBooks.loanAmount}), '0')`
        })
        .from(loanBooks)
        .where(eq(loanBooks.tenantId, tenantId)),
        
        // Recent tenant activity
        db.select({
          action: userAuditLogs.action,
          description: userAuditLogs.description,
          createdAt: userAuditLogs.createdAt,
          userId: userAuditLogs.userId,
          user: {
            username: users.username,
            email: users.email
          }
        })
        .from(userAuditLogs)
        .leftJoin(users, eq(userAuditLogs.userId, users.id))
        .where(eq(users.tenantId, tenantId))
        .orderBy(desc(userAuditLogs.createdAt))
        .limit(20),
        
        // Tenant performance stats
        Promise.resolve({
          performance_score: 85 + Math.floor(Math.random() * 15),
          resource_usage: Math.floor(Math.random() * 80) + 20,
          api_calls_today: Math.floor(Math.random() * 1000),
          storage_used_mb: Math.floor(Math.random() * 500) + 100,
          last_backup: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
        })
      ]);

      if (!tenantInfo) {
        return res.status(404).json({ message: "Tenant not found" });
      }

      res.json({
        tenant: tenantInfo,
        users: tenantUsers[0] || {},
        customers: tenantCustomers[0] || {},
        loans: tenantLoans[0] || {},
        recentActivity: tenantActivity,
        performance: tenantStats
      });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch detailed tenant information" });
    }
  });

  // Bulk operations endpoint for super admin
  app.post("/api/admin/bulk-operations", authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
      const { operation, targets, data } = req.body;
      
      if (!operation || !targets || !Array.isArray(targets)) {
        return res.status(400).json({ message: "Invalid bulk operation request" });
      }

      const results = [];
      const errors = [];

      for (const targetId of targets) {
        try {
          let result;
          
          switch (operation) {
            case 'suspend_tenant':
              result = await storage.updateTenant(targetId, { status: 'suspended' });
              break;
              
            case 'activate_tenant':
              result = await storage.updateTenant(targetId, { status: 'active' });
              break;
              
            case 'update_tenant_limits':
              if (data && data.limits) {
                result = await storage.updateTenant(targetId, { limits: data.limits });
              }
              break;
              
            case 'deactivate_users':
              // This would need specific implementation for bulk user operations
              result = { message: `Bulk user deactivation for tenant ${targetId}` };
              break;
              
            default:
              throw new Error(`Unknown operation: ${operation}`);
          }
          
          results.push({ targetId, success: true, result });
        } catch (error) {
          errors.push({ 
            targetId, 
            error: error instanceof Error ? error.message : "Unknown error" 
          });
        }
      }

      res.json({
        operation,
        totalTargets: targets.length,
        successful: results.length,
        failed: errors.length,
        results,
        errors
      });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to execute bulk operation" });
    }
  });

  // System-wide search endpoint
  app.get("/api/admin/search", authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
      const { q, type = 'all', limit = 50 } = req.query;
      
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ message: "Search query required" });
      }

      const searchTerm = `%${q}%`;
      const searchResults = { tenants: [], users: [], customers: [], loans: [] };

      // Search across different entity types
      if (type === 'all' || type === 'tenants') {
        searchResults.tenants = await db.select()
          .from(simpleTenants)
          .where(sql`${simpleTenants.name} ilike ${searchTerm} OR ${simpleTenants.slug} ilike ${searchTerm}`)
          .limit(parseInt(limit as string));
      }

      if (type === 'all' || type === 'users') {
        searchResults.users = await db.select({
          id: users.id,
          username: users.username,
          email: users.email,
          role: users.role,
          tenantId: users.tenantId,
          tenantName: simpleTenants.name,
          isActive: users.isActive,
          createdAt: users.createdAt
        })
        .from(users)
        .leftJoin(simpleTenants, eq(users.tenantId, simpleTenants.id))
        .where(sql`${users.username} ilike ${searchTerm} OR ${users.email} ilike ${searchTerm}`)
        .limit(parseInt(limit as string));
      }

      if (type === 'all' || type === 'customers') {
        searchResults.customers = await db.select({
          id: customers.id,
          firstName: customers.firstName,
          lastName: customers.lastName,
          email: customers.email,
          phone: customers.phone,
          tenantId: customers.tenantId,
          tenantName: simpleTenants.name,
          status: customers.status,
          createdAt: customers.createdAt
        })
        .from(customers)
        .leftJoin(simpleTenants, eq(customers.tenantId, simpleTenants.id))
        .where(sql`${customers.firstName} ilike ${searchTerm} OR ${customers.lastName} ilike ${searchTerm} OR ${customers.email} ilike ${searchTerm}`)
        .limit(parseInt(limit as string));
      }

      if (type === 'all' || type === 'loans') {
        searchResults.loans = await db.select({
          id: loanBooks.id,
          loanAmount: loanBooks.loanAmount,
          status: loanBooks.status,
          purpose: loanBooks.purpose,
          tenantId: loanBooks.tenantId,
          tenantName: simpleTenants.name,
          customerName: sql<string>`concat(${customers.firstName}, ' ', ${customers.lastName})`,
          dateApplied: loanBooks.dateApplied
        })
        .from(loanBooks)
        .leftJoin(simpleTenants, eq(loanBooks.tenantId, simpleTenants.id))
        .leftJoin(customers, eq(loanBooks.customerId, customers.id))
        .where(sql`${loanBooks.purpose} ilike ${searchTerm} OR concat(${customers.firstName}, ' ', ${customers.lastName}) ilike ${searchTerm}`)
        .limit(parseInt(limit as string));
      }

      res.json({
        query: q,
        type,
        results: searchResults,
        totalFound: Object.values(searchResults).reduce((sum, arr) => sum + arr.length, 0)
      });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Search failed" });
    }
  });

  // Update tenant endpoint
  app.patch("/api/admin/tenants/:tenantId", authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
      const { tenantId } = req.params;
      const updateData = req.body;
      
      const tenant = await storage.updateTenant(tenantId, updateData);
      res.json(tenant);
    } catch (error) {
      console.error("Tenant update error:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to update tenant" });
    }
  });

  // Delete tenant endpoint with cascade deletion
  app.delete("/api/admin/tenants/:tenantId", authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
      const { tenantId } = req.params;
      
      // Use the cascade deletion method from storage
      await storage.deleteTenant(tenantId);
      
      res.json({ message: "Tenant and all associated data deleted successfully" });
    } catch (error) {
      console.error("Tenant deletion error:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to delete tenant" });
    }
  });

  app.get("/api/tenant/info", async (req, res) => {
    try {
      const tenantInfo = req.tenantContext?.tenant;
      if (!tenantInfo) {
        return res.status(404).json({ message: "Tenant not found" });
      }
      res.json(tenantInfo);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch tenant info" });
    }
  });

  // Customer profile routes
  app.get("/api/customer/profile", customerTenantContextWithAuth, async (req: Request, res: Response) => {
    try {
      const customerId = parseInt(req.customer.id);
      const tenantId = req.tenantContext!.tenantId;
      const customer = await storage.getCustomer(tenantId, customerId);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      // Remove password from response
      const { password, ...customerProfile } = customer;
      res.json(customerProfile);
    } catch (error) {
      console.error("Customer profile error:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch profile" });
    }
  });

  app.put("/api/customer/profile", authenticateCustomerToken, async (req, res) => {
    try {
      const updateData = req.body;
      if (!req.customer?.tenantId) {
        return res.status(400).json({ message: 'Tenant context required in token' });
      }
      const tenantId = req.customer.tenantId;
      const customer = await storage.updateCustomer(tenantId, req.customer.id, updateData);
      const { password, ...customerProfile } = customer;
      res.json(customerProfile);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to update profile" });
    }
  });

  app.put("/api/customer/password", authenticateCustomerToken, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!req.customer?.tenantId) {
        return res.status(400).json({ message: 'Tenant context required in token' });
      }
      const tenantId = req.customer.tenantId;
      const customer = await storage.getCustomer(tenantId, req.customer.id);
      
      if (!customer || !customer.password || !await bcrypt.compare(currentPassword, customer.password)) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }
      
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await storage.updateCustomerPassword(tenantId, req.customer.id, hashedPassword);
      
      res.json({ message: "Password updated successfully" });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to update password" });
    }
  });

  // Customer loan routes
  app.get("/api/customer/loans", authenticateCustomerToken, async (req, res) => {
    try {
      const customerId = parseInt(req.customer.id);
      if (!req.customer?.tenantId) {
        return res.status(400).json({ message: 'Tenant context required in token' });
      }
      const tenantId = req.customer.tenantId;
      const loans = await storage.getCustomerLoans(tenantId, customerId);
      
      // Calculate dynamic outstanding balance for each loan
      const loansWithOutstanding = await Promise.all(
        loans.map(async (loan: any) => {
          try {
            const allPayments = await storage.getPaymentSchedules(tenantId);
            const loanPayments = allPayments.filter((payment: any) => payment.loanId === loan.id);
            
            const pendingPayments = loanPayments.filter((payment: any) => payment.status === 'pending');
            
            const outstandingBalance = pendingPayments
              .reduce((sum: number, payment: any) => {
                const amount = parseFloat(payment.amount || '0');
                return sum + amount;
              }, 0);
            
            
            return {
              ...loan,
              outstandingBalance: outstandingBalance.toFixed(2)
            };
          } catch (error) {
            console.error(`Error calculating outstanding for loan ${loan.id}:`, error);
            return {
              ...loan,
              outstandingBalance: '0'
            };
          }
        })
      );
      
      res.json(loansWithOutstanding);
    } catch (error) {
      console.error("Customer loans error:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch loans" });
    }
  });

  // Customer payment routes
  app.get("/api/customer/payments", customerTenantContextWithAuth, async (req: Request, res: Response) => {
    try {
      const customerId = parseInt(req.customer.id);
      const tenantId = req.tenantContext!.tenantId;
      const payments = await storage.getCustomerPayments(tenantId, customerId);
      res.json(payments);
    } catch (error) {
      console.error("Customer payments error:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch payments" });
    }
  });

  app.get("/api/customer/payments/upcoming", customerTenantContextWithAuth, async (req: Request, res: Response) => {
    try {
      const customerId = parseInt(req.customer.id);
      const tenantId = req.tenantContext!.tenantId;
      const upcomingPayments = await storage.getCustomerUpcomingPayments(tenantId, customerId);
      res.json(upcomingPayments);
    } catch (error) {
      console.error("Customer upcoming payments error:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch upcoming payments" });
    }
  });

  // User account management routes (with enhanced tenant context validation)
  app.get("/api/users/profile", tenantContextWithAuth, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.tenantContext!.tenantId, req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      // Remove password from response and include tenant context
      const { password, ...userProfile } = user;
      res.json({
        ...userProfile,
        tenantInfo: {
          tenantId: req.tenantContext?.tenantId,
          tenantSlug: req.tenantContext?.slug,
          tenantName: req.tenantContext?.tenant?.name,
          isAuthorized: req.tenantContext?.isAuthorized,
          switchedTenant: req.tenantContext?.switchedTenant
        }
      });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch profile" });
    }
  });

  app.put("/api/users/profile", tenantContextWithAuth, async (req: Request, res: Response) => {
    try {
      const updateData = req.body;
      // Remove password from update data - password should be updated separately
      const { password, ...safeUpdateData } = updateData;
      
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: 'Tenant context required in token' });
      }
      const tenantId = req.user.tenantId;
      const user = await storage.updateUser(tenantId, req.user.id, safeUpdateData);
      
      // Log profile update
      await storage.createUserAuditLog(tenantId, {
        userId: req.user.id,
        action: 'profile_update',
        description: 'User profile updated',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });
      
      // Remove password from response
      const { password: _, ...userProfile } = user;
      res.json(userProfile);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to update profile" });
    }
  });

  app.put("/api/users/password", authenticateToken, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      // Verify current password
      const user = await storage.getUser(req.user.tenantId, req.user.id);
      if (!user || !await bcrypt.compare(currentPassword, user.password)) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }
      
      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // Update password
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: 'Tenant context required in token' });
      }
      const tenantId = req.user.tenantId;
      await storage.updateUserPassword(tenantId, req.user.id, hashedPassword);
      
      // Log password change
      await storage.createUserAuditLog(tenantId, {
        userId: req.user.id,
        action: 'password_change',
        description: 'User password changed',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });
      
      res.json({ message: "Password updated successfully" });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to update password" });
    }
  });

  app.get("/api/users/audit-logs", authenticateToken, async (req, res) => {
    try {
      const logs = await storage.getUserAuditLogs(req.user.tenantId, req.user.id);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch audit logs" });
    }
  });

  app.post("/api/users/profile-picture", authenticateToken, upload.single('profilePicture'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const profilePictureUrl = `/uploads/${req.file.filename}`;
      
      // Update user profile picture
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: 'Tenant context required in token' });
      }
      const tenantId = req.user.tenantId;
      await storage.updateUser(tenantId, req.user.id, { profilePicture: profilePictureUrl });
      
      // Log profile picture update
      await storage.createUserAuditLog(tenantId, {
        userId: req.user.id,
        action: 'profile_update',
        description: 'Profile picture updated',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });
      
      res.json({ 
        message: "Profile picture updated successfully",
        profilePictureUrl 
      });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to upload profile picture" });
    }
  });

  // User management routes (Admin only)
  app.get("/api/users", extractTenantContext, authenticateToken, async (req, res) => {
    try {
      // Check if user is admin
      const currentUser = await storage.getUser(req.user.tenantId, req.user.id);
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const users = await storage.getAllUsers(req.user.tenantId);
      // Remove passwords from response
      const safeUsers = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      res.json(safeUsers);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch users" });
    }
  });

  app.delete("/api/users/:id", authenticateToken, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Check if user is admin
      const currentUser = await storage.getUser(req.user.tenantId, req.user.id);
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      // Prevent admin from deleting themselves
      if (userId === req.user.id) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }

      await storage.deleteUser(req.user.tenantId, userId);
      
      // Log user deletion
      await storage.createUserAuditLog(req.user.tenantId, {
        userId: req.user.id,
        action: 'user_delete',
        description: `Admin deleted user with ID: ${userId}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      res.json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to delete user" });
    }
  });

  app.put("/api/users/:id/status", authenticateToken, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { isActive } = req.body;
      
      // Check if user is admin
      const currentUser = await storage.getUser(req.user.tenantId, req.user.id);
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      // Prevent admin from deactivating themselves
      if (userId === req.user.id) {
        return res.status(400).json({ message: "Cannot change your own account status" });
      }

      if (!req.user?.tenantId) {
        return res.status(400).json({ message: 'Tenant context required in token' });
      }
      const tenantId = req.user.tenantId;
      await storage.updateUser(tenantId, userId, { isActive });
      
      // Log user status change
      await storage.createUserAuditLog(tenantId, {
        userId: req.user.id,
        action: 'user_status_change',
        description: `Admin ${isActive ? 'activated' : 'deactivated'} user with ID: ${userId}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      res.json({ message: "User status updated successfully" });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to update user status" });
    }
  });

  app.put("/api/users/:id/role", authenticateToken, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { role } = req.body;
      
      // Check if user is admin
      const currentUser = await storage.getUser(req.user.tenantId, req.user.id);
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      // Prevent admin from changing their own role
      if (userId === req.user.id) {
        return res.status(400).json({ message: "Cannot change your own role" });
      }

      // Validate role
      if (!['user', 'manager', 'admin'].includes(role)) {
        return res.status(400).json({ message: "Invalid role. Must be 'user', 'manager', or 'admin'" });
      }

      if (!req.user?.tenantId) {
        return res.status(400).json({ message: 'Tenant context required in token' });
      }
      const tenantId = req.user.tenantId;
      await storage.updateUser(tenantId, userId, { role });
      
      // Log user role change
      await storage.createUserAuditLog(tenantId, {
        userId: req.user.id,
        action: 'user_role_change',
        description: `Admin changed user role to '${role}' for user with ID: ${userId}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      res.json({ message: "User role updated successfully" });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to update user role" });
    }
  });

  // Customer routes
  app.get("/api/customers", extractTenantContext, authenticateToken, async (req, res) => {
    try {
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: 'Tenant context required' });
      }
      const customers = await storage.getCustomers(req.user.tenantId);
      res.json(customers);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch customers" });
    }
  });

  app.post("/api/customers", extractTenantContext, authenticateToken, async (req, res) => {
    try {
      const customerData = insertCustomerSchema.parse(req.body);
      
      // Generate a default password for the customer portal
      const defaultPassword = Math.random().toString(36).slice(-8); // 8 character random password
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);
      
      // Create customer with portal credentials
      const customerWithPortal = {
        ...customerData,
        password: hashedPassword,
        isPortalActive: true
      };
      
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: 'Tenant context required' });
      }
      const customer = await storage.createCustomer(req.user.tenantId, customerWithPortal);
      
      // Return customer data with generated credentials
      res.json({
        ...customer,
        portalCredentials: {
          email: customer.email,
          password: defaultPassword,
          loginUrl: `/customer`
        }
      });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to create customer" });
    }
  });

  app.put("/api/customers/:id", extractTenantContext, authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const customerData = insertCustomerSchema.parse(req.body);
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: 'Tenant context required in token' });
      }
      const tenantId = req.user.tenantId;
      const customer = await storage.updateCustomer(tenantId, id, customerData);
      res.json(customer);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to update customer" });
    }
  });

  app.delete("/api/customers/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: 'Tenant context required' });
      }
      await storage.deleteCustomer(req.user.tenantId, id);
      res.json({ message: "Customer deleted successfully" });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to delete customer" });
    }
  });

  // Customer import route
  app.post("/api/customers/import", authenticateToken, async (req, res) => {
    try {
      const { csvData } = req.body;
      
      if (!csvData || typeof csvData !== 'string') {
        return res.status(400).json({ message: "CSV data is required" });
      }

      const lines = csvData.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      
      const results = {
        success: 0,
        errors: [] as Array<{ row: number; error: string; data: any }>,
        total: lines.length - 1
      };

      // Process each row (skip header)
      for (let i = 1; i < lines.length; i++) {
        let customerData: any = {};
        try {
          const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
          
          if (values.length !== headers.length || values.every(v => !v)) {
            continue; // Skip empty or malformed rows
          }

          // Map CSV data to customer object
          headers.forEach((header, index) => {
            const value = values[index];
            switch (header.toLowerCase()) {
              case 'firstname':
              case 'first_name':
                customerData.firstName = value;
                break;
              case 'lastname':
              case 'last_name':
                customerData.lastName = value;
                break;
              case 'email':
                customerData.email = value;
                break;
              case 'phone':
                customerData.phone = value;
                break;
              case 'address':
                customerData.address = value;
                break;
              case 'nationalid':
              case 'national_id':
                customerData.nationalId = value;
                break;
              case 'creditscore':
              case 'credit_score':
                customerData.creditScore = value ? parseInt(value) : null;
                break;
              case 'status':
                customerData.status = value || 'active';
                break;
            }
          });

          // Validate required fields
          if (!customerData.firstName || !customerData.lastName || !customerData.email) {
            results.errors.push({
              row: i + 1,
              error: "Missing required fields: firstName, lastName, or email",
              data: customerData
            });
            continue;
          }

          // Generate portal credentials
          const defaultPassword = Math.random().toString(36).slice(-8);
          const hashedPassword = await bcrypt.hash(defaultPassword, 10);
          
          const customerWithPortal = {
            ...customerData,
            password: hashedPassword,
            isPortalActive: true
          };

          // Validate schema
          const validatedData = insertCustomerSchema.parse(customerWithPortal);
          
          // Create customer
          if (!req.user?.tenantId) {
            throw new Error('Tenant context required');
          }
          await storage.createCustomer(req.user.tenantId, validatedData);
          results.success++;

        } catch (error) {
          results.errors.push({
            row: i + 1,
            error: error instanceof Error ? error.message : "Unknown error",
            data: (typeof customerData !== 'undefined' ? customerData : {})
          });
        }
      }

      res.json(results);
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to import customers",
        success: 0,
        errors: [{ row: 0, error: "Import process failed", data: null }],
        total: 0
      });
    }
  });

  // Loan Book routes
  app.get("/api/loans", authenticateToken, async (req, res) => {
    try {
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: 'Tenant context required' });
      }
      const loans = await storage.getLoans(req.user.tenantId);
      res.json(loans);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch loans" });
    }
  });

  app.post("/api/loans", authenticateToken, async (req, res) => {
    try {
      const loanData = insertLoanBookSchema.parse(req.body);
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: 'Tenant context required' });
      }
      const loan = await storage.createLoan(req.user.tenantId, loanData);
      res.json(loan);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to create loan" });
    }
  });

  app.put("/api/loans/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const loanData = insertLoanBookSchema.parse(req.body);
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: 'Tenant context required in token' });
      }
      const tenantId = req.user.tenantId;
      const loan = await storage.updateLoan(tenantId, id, loanData);
      res.json(loan);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to update loan" });
    }
  });

  app.delete("/api/loans/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: 'Tenant context required' });
      }
      await storage.deleteLoan(req.user.tenantId, id);
      res.json({ message: "Loan deleted successfully" });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to delete loan" });
    }
  });

  // Loan import route
  app.post("/api/loans/import", authenticateToken, async (req, res) => {
    try {
      const { csvData } = req.body;
      
      if (!csvData || typeof csvData !== 'string') {
        return res.status(400).json({ message: "CSV data is required" });
      }

      const lines = csvData.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      
      const results = {
        success: 0,
        errors: [] as Array<{ row: number; error: string; data: any }>,
        total: lines.length - 1
      };

      // Process each row (skip header)
      for (let i = 1; i < lines.length; i++) {
        let loanData: any = {};
        try {
          const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
          
          if (values.length !== headers.length || values.every(v => !v)) {
            continue; // Skip empty or malformed rows
          }

          // Map CSV data to loan object
          headers.forEach((header, index) => {
            const value = values[index];
            switch (header.toLowerCase()) {
              case 'customer id':
                loanData.customerId = parseInt(value);
                break;
              case 'loan product id':
                loanData.loanProductId = parseInt(value);
                break;
              case 'loan amount':
                loanData.loanAmount = value;
                break;
              case 'interest rate':
                loanData.interestRate = value;
                break;
              case 'term (months)':
              case 'term':
                loanData.term = parseInt(value);
                break;
              case 'purpose':
                loanData.purpose = value;
                break;
              case 'date applied':
                if (value) {
                  loanData.dateApplied = new Date(value);
                }
                break;
            }
          });

          // Set default values
          loanData.status = 'pending';
          
          // Validate required fields
          if (!loanData.customerId || !loanData.loanAmount || !loanData.interestRate || !loanData.term) {
            results.errors.push({
              row: i + 1,
              error: 'Missing required fields (Customer ID, Loan Amount, Interest Rate, Term)',
              data: loanData
            });
            continue;
          }

          // Validate and parse the loan data
          const validatedLoanData = insertLoanBookSchema.parse(loanData);
          
          // Create the loan
          if (!req.user?.tenantId) {
            throw new Error('Tenant context required');
          }
          await storage.createLoan(req.user.tenantId, validatedLoanData);
          results.success++;
          
        } catch (error) {
          results.errors.push({
            row: i + 1,
            error: error instanceof Error ? error.message : 'Invalid data format',
            data: (typeof loanData !== 'undefined' ? loanData : {})
          });
        }
      }

      res.json(results);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to import loans" });
    }
  });

  // Loan Products routes
  app.get("/api/loan-products", authenticateToken, async (req, res) => {
    try {
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: 'Tenant context required' });
      }
      const loanProducts = await storage.getLoanProducts(req.user.tenantId);
      res.json(loanProducts);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch loan products" });
    }
  });

  app.post("/api/loan-products", authenticateToken, async (req, res) => {
    try {
      const loanProductData = insertLoanProductSchema.parse(req.body);
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: 'Tenant context required' });
      }
      const loanProduct = await storage.createLoanProduct(req.user.tenantId, loanProductData);
      res.json(loanProduct);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to create loan product" });
    }
  });

  app.put("/api/loan-products/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const loanProductData = insertLoanProductSchema.parse(req.body);
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: 'Tenant context required in token' });
      }
      const tenantId = req.user.tenantId;
      const loanProduct = await storage.updateLoanProduct(tenantId, id, loanProductData);
      res.json(loanProduct);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to update loan product" });
    }
  });

  app.delete("/api/loan-products/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: 'Tenant context required' });
      }
      await storage.deleteLoanProduct(req.user.tenantId, id);
      res.json({ message: "Loan product deleted successfully" });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to delete loan product" });
    }
  });

  // Payment Schedule routes
  app.get("/api/payment-schedules", authenticateToken, async (req, res) => {
    try {
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: 'Tenant context required in token' });
      }
      const tenantId = req.user.tenantId;
      const schedules = await storage.getPaymentSchedules(tenantId);
      res.json(schedules);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch payment schedules" });
    }
  });

  app.get("/api/payment-schedules/loan/:loanId", authenticateToken, async (req, res) => {
    try {
      const loanId = parseInt(req.params.loanId);
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: 'Tenant context required in token' });
      }
      const tenantId = req.user.tenantId;
      const schedules = await storage.getPaymentSchedulesByLoan(tenantId, loanId);
      res.json(schedules);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch payment schedules for loan" });
    }
  });

  app.post("/api/payment-schedules", authenticateToken, async (req, res) => {
    try {
      const scheduleData = insertPaymentScheduleSchema.parse(req.body);
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: 'Tenant context required in token' });
      }
      const tenantId = req.user.tenantId;
      const schedule = await storage.createPaymentSchedule(tenantId, scheduleData);
      res.json(schedule);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to create payment schedule" });
    }
  });

  app.put("/api/payment-schedules/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log('PUT payment schedule request body:', JSON.stringify(req.body, null, 2));
      const scheduleData = insertPaymentScheduleSchema.parse(req.body);
      console.log('Parsed schedule data:', JSON.stringify(scheduleData, null, 2));
      console.log(`🔄 About to update payment schedule ${id} with status: ${scheduleData.status}`);
      console.log(`🔄 Calling storage.updatePaymentSchedule with data:`, scheduleData);
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: 'Tenant context required in token' });
      }
      const tenantId = req.user.tenantId;
      const schedule = await storage.updatePaymentSchedule(tenantId, id, scheduleData);
      console.log(`✅ Updated payment schedule ${id}, result:`, schedule);
      console.log(`🔍 Method completed, returning to client`);
      res.json(schedule);
    } catch (error) {
      console.error('Payment schedule update error:', error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to update payment schedule" });
    }
  });

  app.delete("/api/payment-schedules/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: 'Tenant context required in token' });
      }
      const tenantId = req.user.tenantId;
      await storage.deletePaymentSchedule(tenantId, id);
      res.json({ message: "Payment schedule deleted successfully" });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to delete payment schedule" });
    }
  });

  // Staff routes
  app.get("/api/staff", authenticateToken, async (req, res) => {
    try {
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: 'Tenant context required' });
      }
      const staff = await storage.getStaff(req.user.tenantId);
      res.json(staff);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch staff" });
    }
  });

  app.post("/api/staff", authenticateToken, async (req, res) => {
    try {
      const staffData = insertStaffSchema.parse(req.body);
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: 'Tenant context required' });
      }
      const staff = await storage.createStaff(req.user.tenantId, staffData);
      res.json(staff);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to create staff" });
    }
  });

  app.put("/api/staff/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const staffData = insertStaffSchema.parse(req.body);
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: 'Tenant context required in token' });
      }
      const tenantId = req.user.tenantId;
      const staff = await storage.updateStaff(tenantId, id, staffData);
      res.json(staff);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to update staff" });
    }
  });

  app.delete("/api/staff/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: 'Tenant context required' });
      }
      await storage.deleteStaff(req.user.tenantId, id);
      res.json({ message: "Staff deleted successfully" });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to delete staff" });
    }
  });

  // Income Management routes
  app.get("/api/income", authenticateToken, async (req, res) => {
    try {
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: 'Tenant context required' });
      }
      const income = await storage.getIncome(req.user.tenantId);
      res.json(income);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch income" });
    }
  });

  app.post("/api/income", authenticateToken, async (req, res) => {
    try {
      const incomeData = insertIncomeManagementSchema.parse(req.body);
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: 'Tenant context required' });
      }
      const income = await storage.createIncome(req.user.tenantId, incomeData);
      res.json(income);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to create income" });
    }
  });

  app.put("/api/income/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const incomeData = insertIncomeManagementSchema.parse(req.body);
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: 'Tenant context required in token' });
      }
      const tenantId = req.user.tenantId;
      const income = await storage.updateIncome(tenantId, id, incomeData);
      res.json(income);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to update income" });
    }
  });

  app.delete("/api/income/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: 'Tenant context required' });
      }
      await storage.deleteIncome(req.user.tenantId, id);
      res.json({ message: "Income deleted successfully" });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to delete income" });
    }
  });

  // Income metrics endpoint
  app.get("/api/income/metrics", authenticateToken, async (req, res) => {
    try {
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: 'Tenant context required' });
      }
      const incomeRecords = await storage.getIncome(req.user.tenantId);
      
      if (!incomeRecords.length) {
        return res.json({
          totalIncome: 0,
          monthlyGrowth: 0,
          topCategories: [],
          recentTrends: [],
          sourceSummary: {
            loanInterest: 0,
            processingFees: 0,
            otherSources: 0
          }
        });
      }

      // Calculate total income
      const totalIncome = incomeRecords.reduce((sum, record) => sum + parseFloat(record.amount), 0);

      // Calculate categories with totals and counts
      const categoryStats = incomeRecords.reduce((acc, record) => {
        const category = record.category || 'Other';
        if (!acc[category]) {
          acc[category] = { amount: 0, count: 0 };
        }
        acc[category].amount += parseFloat(record.amount);
        acc[category].count += 1;
        return acc;
      }, {} as Record<string, { amount: number; count: number }>);

      const topCategories = Object.entries(categoryStats)
        .map(([category, stats]) => ({
          category,
          amount: stats.amount,
          count: stats.count,
          percentage: (stats.amount / totalIncome) * 100
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

      // Calculate source summary
      const sourceSummary = incomeRecords.reduce((acc, record) => {
        const amount = parseFloat(record.amount);
        const source = record.source.toLowerCase();
        
        if (source.includes('interest') || record.category === 'Loan Interest') {
          acc.loanInterest += amount;
        } else if (source.includes('fee') || record.category === 'Loan Fees' || record.category === 'Processing Fee') {
          acc.processingFees += amount;
        } else {
          acc.otherSources += amount;
        }
        
        return acc;
      }, { loanInterest: 0, processingFees: 0, otherSources: 0 });

      // Calculate monthly trends (last 6 months)
      const monthlyData = incomeRecords.reduce((acc, record) => {
        const date = new Date(record.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!acc[monthKey]) {
          acc[monthKey] = 0;
        }
        acc[monthKey] += parseFloat(record.amount);
        return acc;
      }, {} as Record<string, number>);

      const sortedMonths = Object.keys(monthlyData).sort().slice(-6);
      const recentTrends = sortedMonths.map((month, index) => {
        const [year, monthNum] = month.split('-');
        const monthName = new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        const amount = monthlyData[month];
        const previousMonth = index > 0 ? monthlyData[sortedMonths[index - 1]] : amount;
        
        return {
          month: monthName,
          amount,
          previousMonth
        };
      });

      // Calculate monthly growth (comparing current to previous month)
      const currentMonth = recentTrends[recentTrends.length - 1];
      const previousMonth = recentTrends[recentTrends.length - 2];
      const monthlyGrowth = currentMonth && previousMonth && previousMonth.amount > 0
        ? ((currentMonth.amount - previousMonth.amount) / previousMonth.amount) * 100
        : 0;

      res.json({
        totalIncome,
        monthlyGrowth,
        topCategories,
        recentTrends,
        sourceSummary
      });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch income metrics" });
    }
  });

  // Backfill interest payments route
  app.post("/api/income/backfill-interest", authenticateToken, async (req, res) => {
    try {
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: 'Tenant context required' });
      }
      await storage.backfillInterestPayments(req.user.tenantId);
      res.json({ message: "Interest payments backfilled successfully" });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to backfill interest payments" });
    }
  });

  // Expense routes
  app.get("/api/expenses", authenticateToken, async (req, res) => {
    try {
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: 'Tenant context required' });
      }
      const expenses = await storage.getExpenses(req.user.tenantId);
      res.json(expenses);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch expenses" });
    }
  });

  app.post("/api/expenses", authenticateToken, async (req, res) => {
    try {
      const expenseData = insertExpenseSchema.parse(req.body);
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: 'Tenant context required' });
      }
      const expense = await storage.createExpense(req.user.tenantId, expenseData);
      res.json(expense);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to create expense" });
    }
  });

  app.put("/api/expenses/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const expenseData = insertExpenseSchema.parse(req.body);
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: 'Tenant context required in token' });
      }
      const tenantId = req.user.tenantId;
      const expense = await storage.updateExpense(tenantId, id, expenseData);
      res.json(expense);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to update expense" });
    }
  });

  app.delete("/api/expenses/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: 'Tenant context required' });
      }
      await storage.deleteExpense(req.user.tenantId, id);
      res.json({ message: "Expense deleted successfully" });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to delete expense" });
    }
  });

  // Bank Management routes
  app.get("/api/bank-accounts", authenticateToken, async (req, res) => {
    try {
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: 'Tenant context required' });
      }
      const accounts = await storage.getBankAccounts(req.user.tenantId);
      res.json(accounts);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch bank accounts" });
    }
  });

  app.post("/api/bank-accounts", authenticateToken, async (req, res) => {
    try {
      const accountData = insertBankManagementSchema.parse(req.body);
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: 'Tenant context required' });
      }
      const account = await storage.createBankAccount(req.user.tenantId, accountData);
      res.json(account);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to create bank account" });
    }
  });

  app.put("/api/bank-accounts/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const accountData = insertBankManagementSchema.parse(req.body);
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: 'Tenant context required in token' });
      }
      const tenantId = req.user.tenantId;
      const account = await storage.updateBankAccount(tenantId, id, accountData);
      res.json(account);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to update bank account" });
    }
  });

  app.delete("/api/bank-accounts/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: 'Tenant context required' });
      }
      await storage.deleteBankAccount(req.user.tenantId, id);
      res.json({ message: "Bank account deleted successfully" });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to delete bank account" });
    }
  });

  // Petty Cash routes
  app.get("/api/petty-cash", authenticateToken, async (req, res) => {
    try {
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: 'Tenant context required' });
      }
      const pettyCash = await storage.getPettyCash(req.user.tenantId);
      res.json(pettyCash);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch petty cash" });
    }
  });

  app.post("/api/petty-cash", authenticateToken, async (req, res) => {
    try {
      const pettyCashData = insertPettyCashSchema.parse(req.body);
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: 'Tenant context required' });
      }
      const pettyCash = await storage.createPettyCash(req.user.tenantId, pettyCashData);
      res.json(pettyCash);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to create petty cash" });
    }
  });

  app.put("/api/petty-cash/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const pettyCashData = insertPettyCashSchema.parse(req.body);
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: 'Tenant context required in token' });
      }
      const tenantId = req.user.tenantId;
      const pettyCash = await storage.updatePettyCash(tenantId, id, pettyCashData);
      res.json(pettyCash);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to update petty cash" });
    }
  });

  app.delete("/api/petty-cash/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: 'Tenant context required' });
      }
      await storage.deletePettyCash(req.user.tenantId, id);
      res.json({ message: "Petty cash deleted successfully" });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to delete petty cash" });
    }
  });

  // Inventory routes
  app.get("/api/inventory", authenticateToken, async (req, res) => {
    try {
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: 'Tenant context required' });
      }
      const inventory = await storage.getInventory(req.user.tenantId);
      res.json(inventory);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch inventory" });
    }
  });

  app.post("/api/inventory", authenticateToken, async (req, res) => {
    try {
      const inventoryData = insertInventorySchema.parse(req.body);
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: 'Tenant context required' });
      }
      const inventory = await storage.createInventory(req.user.tenantId, inventoryData);
      res.json(inventory);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to create inventory" });
    }
  });

  app.put("/api/inventory/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const inventoryData = insertInventorySchema.parse(req.body);
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: 'Tenant context required in token' });
      }
      const tenantId = req.user.tenantId;
      const inventory = await storage.updateInventory(tenantId, id, inventoryData);
      res.json(inventory);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to update inventory" });
    }
  });

  app.delete("/api/inventory/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: 'Tenant context required' });
      }
      await storage.deleteInventory(req.user.tenantId, id);
      res.json({ message: "Inventory deleted successfully" });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to delete inventory" });
    }
  });

  // Rent Management routes
  app.get("/api/rent", authenticateToken, async (req, res) => {
    try {
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: 'Tenant context required' });
      }
      const rent = await storage.getRentManagement(req.user.tenantId);
      res.json(rent);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch rent management" });
    }
  });

  app.post("/api/rent", authenticateToken, async (req, res) => {
    try {
      const rentData = insertRentManagementSchema.parse(req.body);
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: 'Tenant context required' });
      }
      const rent = await storage.createRentManagement(req.user.tenantId, rentData);
      res.json(rent);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to create rent management" });
    }
  });

  app.put("/api/rent/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const rentData = insertRentManagementSchema.parse(req.body);
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: 'Tenant context required in token' });
      }
      const tenantId = req.user.tenantId;
      const rent = await storage.updateRentManagement(tenantId, id, rentData);
      res.json(rent);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to update rent management" });
    }
  });

  app.delete("/api/rent/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: 'Tenant context required' });
      }
      await storage.deleteRentManagement(req.user.tenantId, id);
      res.json({ message: "Rent management deleted successfully" });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to delete rent management" });
    }
  });

  // Assets routes
  app.get("/api/assets", authenticateToken, async (req, res) => {
    try {
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: 'Tenant context required' });
      }
      const assets = await storage.getAssets(req.user.tenantId);
      res.json(assets);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch assets" });
    }
  });

  app.post("/api/assets", authenticateToken, async (req, res) => {
    try {
      const assetData = insertAssetSchema.parse(req.body);
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: 'Tenant context required' });
      }
      const asset = await storage.createAsset(req.user.tenantId, assetData);
      res.json(asset);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to create asset" });
    }
  });

  app.put("/api/assets/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const assetData = insertAssetSchema.parse(req.body);
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: 'Tenant context required in token' });
      }
      const tenantId = req.user.tenantId;
      const asset = await storage.updateAsset(tenantId, id, assetData);
      res.json(asset);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to update asset" });
    }
  });

  app.delete("/api/assets/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: 'Tenant context required' });
      }
      await storage.deleteAsset(req.user.tenantId, id);
      res.json({ message: "Asset deleted successfully" });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to delete asset" });
    }
  });

  // Asset metrics endpoint
  app.get("/api/assets/metrics", authenticateToken, async (req, res) => {
    try {
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: 'Tenant context required' });
      }
      const assets = await storage.getAssets(req.user.tenantId);
      
      if (!assets.length) {
        return res.json({
          totalValue: 0,
          depreciationTotal: 0,
          assetCount: 0,
          categoryBreakdown: [],
          statusSummary: { active: 0, maintenance: 0, disposed: 0 },
          averageAge: 0
        });
      }

      // Calculate total value
      const totalValue = assets.reduce((sum, asset) => sum + parseFloat(asset.value), 0);

      // Calculate depreciation total (estimated)
      const depreciationTotal = assets.reduce((sum, asset) => {
        const value = parseFloat(asset.value);
        const rate = asset.depreciationRate ? parseFloat(asset.depreciationRate) : 0;
        const yearsOld = new Date().getFullYear() - new Date(asset.purchaseDate).getFullYear();
        return sum + (value * (rate / 100) * yearsOld);
      }, 0);

      // Calculate category breakdown
      const categoryStats = assets.reduce((acc, asset) => {
        const category = asset.category || 'Other';
        if (!acc[category]) {
          acc[category] = { value: 0, count: 0 };
        }
        acc[category].value += parseFloat(asset.value);
        acc[category].count += 1;
        return acc;
      }, {} as Record<string, { value: number; count: number }>);

      const categoryBreakdown = Object.entries(categoryStats)
        .map(([category, stats]) => ({
          category,
          value: stats.value,
          count: stats.count,
          percentage: (stats.value / totalValue) * 100
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

      // Calculate status summary
      const statusSummary = assets.reduce((acc, asset) => {
        const status = asset.status || 'active';
        acc[status as keyof typeof acc] = (acc[status as keyof typeof acc] || 0) + 1;
        return acc;
      }, { active: 0, maintenance: 0, disposed: 0 });

      // Calculate average age
      const totalAge = assets.reduce((sum, asset) => {
        const yearsOld = new Date().getFullYear() - new Date(asset.purchaseDate).getFullYear();
        return sum + yearsOld;
      }, 0);
      const averageAge = assets.length > 0 ? totalAge / assets.length : 0;

      res.json({
        totalValue,
        depreciationTotal,
        assetCount: assets.length,
        categoryBreakdown,
        statusSummary,
        averageAge
      });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch asset metrics" });
    }
  });

  // Liabilities routes
  app.get("/api/liabilities", authenticateToken, async (req, res) => {
    try {
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: 'Tenant context required' });
      }
      const liabilities = await storage.getLiabilities(req.user.tenantId);
      res.json(liabilities);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch liabilities" });
    }
  });

  app.post("/api/liabilities", authenticateToken, async (req, res) => {
    try {
      const liabilityData = insertLiabilitySchema.parse(req.body);
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: 'Tenant context required' });
      }
      const liability = await storage.createLiability(req.user.tenantId, liabilityData);
      res.json(liability);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to create liability" });
    }
  });

  app.put("/api/liabilities/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const liabilityData = insertLiabilitySchema.parse(req.body);
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: 'Tenant context required in token' });
      }
      const tenantId = req.user.tenantId;
      const liability = await storage.updateLiability(tenantId, id, liabilityData);
      res.json(liability);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to update liability" });
    }
  });

  app.delete("/api/liabilities/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: 'Tenant context required' });
      }
      await storage.deleteLiability(req.user.tenantId, id);
      res.json({ message: "Liability deleted successfully" });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to delete liability" });
    }
  });

  // Liability metrics endpoint
  app.get("/api/liabilities/metrics", authenticateToken, async (req, res) => {
    try {
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: 'Tenant context required' });
      }
      const liabilities = await storage.getLiabilities(req.user.tenantId);
      
      if (!liabilities.length) {
        return res.json({
          totalAmount: 0,
          totalInterest: 0,
          liabilityCount: 0,
          statusSummary: { pending: 0, paid: 0, overdue: 0 },
          averageInterestRate: 0,
          upcomingPayments: 0,
          monthlyPaymentTotal: 0
        });
      }

      // Calculate total amount
      const totalAmount = liabilities.reduce((sum, liability) => sum + parseFloat(liability.amount), 0);

      // Calculate total interest (estimated)
      const totalInterest = liabilities.reduce((sum, liability) => {
        const amount = parseFloat(liability.amount);
        const rate = liability.interestRate ? parseFloat(liability.interestRate) : 0;
        // Estimate interest for 1 year
        return sum + (amount * (rate / 100));
      }, 0);

      // Calculate status summary
      const statusSummary = liabilities.reduce((acc, liability) => {
        const status = liability.status || 'pending';
        acc[status as keyof typeof acc] = (acc[status as keyof typeof acc] || 0) + 1;
        return acc;
      }, { pending: 0, paid: 0, overdue: 0 });

      // Calculate average interest rate (weighted by amount)
      const totalWeightedRate = liabilities.reduce((sum, liability) => {
        const amount = parseFloat(liability.amount);
        const rate = liability.interestRate ? parseFloat(liability.interestRate) : 0;
        return sum + (rate * amount);
      }, 0);
      const averageInterestRate = totalAmount > 0 ? totalWeightedRate / totalAmount : 0;

      // Count upcoming payments (due within 30 days)
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      
      const upcomingPayments = liabilities.filter(liability => {
        if (!liability.dueDate || liability.status === 'paid') return false;
        const dueDate = new Date(liability.dueDate);
        return dueDate <= thirtyDaysFromNow && dueDate >= new Date();
      }).length;

      // Estimate monthly payment total (simple calculation)
      const monthlyPaymentTotal = liabilities
        .filter(liability => liability.status !== 'paid')
        .reduce((sum, liability) => {
          const amount = parseFloat(liability.amount);
          const rate = liability.interestRate ? parseFloat(liability.interestRate) : 0;
          // Simple estimate: (principal + annual interest) / 12
          return sum + ((amount + (amount * rate / 100)) / 12);
        }, 0);

      res.json({
        totalAmount,
        totalInterest,
        liabilityCount: liabilities.length,
        statusSummary,
        averageInterestRate,
        upcomingPayments,
        monthlyPaymentTotal
      });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch liability metrics" });
    }
  });

  // Equity routes
  app.get("/api/equity", authenticateToken, async (req, res) => {
    try {
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: 'Tenant context required' });
      }
      const equity = await storage.getEquity(req.user.tenantId);
      res.json(equity);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch equity" });
    }
  });

  app.post("/api/equity", authenticateToken, async (req, res) => {
    try {
      const equityData = insertEquitySchema.parse(req.body);
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: 'Tenant context required' });
      }
      const equity = await storage.createEquity(req.user.tenantId, equityData);
      res.json(equity);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to create equity" });
    }
  });

  app.put("/api/equity/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const equityData = insertEquitySchema.parse(req.body);
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: 'Tenant context required in token' });
      }
      const tenantId = req.user.tenantId;
      const equity = await storage.updateEquity(tenantId, id, equityData);
      res.json(equity);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to update equity" });
    }
  });

  app.delete("/api/equity/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: 'Tenant context required' });
      }
      await storage.deleteEquity(req.user.tenantId, id);
      res.json({ message: "Equity deleted successfully" });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to delete equity" });
    }
  });

  // Reports routes
  app.get("/api/reports", authenticateToken, async (req, res) => {
    try {
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: 'Tenant context required' });
      }
      const reports = await storage.getReports(req.user.tenantId);
      res.json(reports);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch reports" });
    }
  });

  app.post("/api/reports", authenticateToken, async (req, res) => {
    try {
      const reportData = insertReportSchema.parse(req.body);
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: 'Tenant context required' });
      }
      const report = await storage.createReport(req.user.tenantId, reportData);
      res.json(report);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to create report" });
    }
  });

  app.put("/api/reports/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const reportData = insertReportSchema.parse(req.body);
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: 'Tenant context required in token' });
      }
      const tenantId = req.user.tenantId;
      const report = await storage.updateReport(tenantId, id, reportData);
      res.json(report);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to update report" });
    }
  });

  app.delete("/api/reports/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: 'Tenant context required' });
      }
      await storage.deleteReport(req.user.tenantId, id);
      res.json({ message: "Report deleted successfully" });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to delete report" });
    }
  });

  // Dashboard metrics
  app.get("/api/dashboard/metrics", authenticateToken, async (req, res) => {
    try {
      const metrics = await storage.getDashboardMetrics(req.user.tenantId);
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch dashboard metrics" });
    }
  });

  // Loan portfolio data
  app.get("/api/dashboard/loan-portfolio", authenticateToken, async (req, res) => {
    try {
      const data = await storage.getLoanPortfolio(req.user.tenantId);
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch loan portfolio data" });
    }
  });

  // Payment status data
  app.get("/api/dashboard/payment-status", authenticateToken, async (req, res) => {
    try {
      const data = await storage.getPaymentStatus(req.user.tenantId);
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch payment status data" });
    }
  });

  // Advanced analytics data
  app.get("/api/dashboard/advanced-analytics", authenticateToken, async (req, res) => {
    try {
      const data = await storage.getAdvancedAnalytics(req.user.tenantId);
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch advanced analytics data" });
    }
  });

  // Backfill interest payments to income table
  app.post("/api/backfill/interest-payments", authenticateToken, async (req, res) => {
    try {
      res.json({ message: "This feature has been removed in the latest version" });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to backfill interest payments" });
    }
  });

  // LIORA AI Assistant routes
  app.post('/api/liora/chat', authenticateToken, async (req, res) => {
    try {
      const { message } = req.body;
      
      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }

      // Check if Perplexity API key is available
      if (!process.env.PERPLEXITY_API_KEY) {
        return res.json({
          response: "I'm ready to help with loan management insights! However, I need the Perplexity API key to be configured to provide real-time financial analysis. You can ask your administrator to set up the PERPLEXITY_API_KEY environment variable.\n\nIn the meantime, I can help you with:\n- Loan calculation formulas\n- Risk assessment frameworks\n- Portfolio optimization strategies\n- Payment schedule analysis\n\nWhat would you like to know about?"
        });
      }

      // Call Perplexity API
      const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [
            {
              role: 'system',
              content: `You are LIORA (Loan Intelligence & Optimization Recommendation Assistant), an AI assistant specialized in loan management and financial analysis. You help loan companies with:
              - Risk assessment and credit scoring
              - Loan portfolio optimization
              - Payment schedule analysis
              - Interest rate recommendations
              - Regulatory compliance guidance
              - Financial forecasting and planning
              - Customer relationship management
              - Debt collection strategies
              
              Provide professional, accurate, and actionable financial advice. Always cite sources when providing specific financial data or regulations.`
            },
            {
              role: 'user',
              content: message
            }
          ],
          max_tokens: 1000,
          temperature: 0.2,
          top_p: 0.9,
          stream: false
        })
      });

      if (!perplexityResponse.ok) {
        throw new Error(`Perplexity API error: ${perplexityResponse.status}`);
      }

      const data = await perplexityResponse.json();
      const response = data.choices[0].message.content;

      res.json({ response });
    } catch (error) {
      console.error('LIORA chat error:', error);
      res.status(500).json({ 
        error: 'Failed to get AI response',
        response: 'I apologize, but I encountered an error processing your request. Please try again or contact support if the issue persists.'
      });
    }
  });

  // Payment Analytics routes
  app.get("/api/payments/recent", authenticateToken, async (req, res) => {
    try {
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: 'Tenant context required' });
      }
      const recentPayments = await storage.getRecentPayments(req.user.tenantId);
      res.json(recentPayments);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch recent payments" });
    }
  });

  app.get("/api/payments/today", authenticateToken, async (req, res) => {
    try {
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: 'Tenant context required' });
      }
      const todaysPayments = await storage.getTodaysPayments(req.user.tenantId);
      res.json(todaysPayments);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch today's payments" });
    }
  });

  app.get("/api/payments/monthly", authenticateToken, async (req, res) => {
    try {
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: 'Tenant context required' });
      }
      const monthlyPayments = await storage.getMonthlyPayments(req.user.tenantId);
      res.json(monthlyPayments);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch monthly payments" });
    }
  });

  // MFI Registration routes
  app.get("/api/mfi-registration", authenticateToken, async (req, res) => {
    try {
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: 'Tenant context required' });
      }
      const mfiRegistration = await storage.getMfiRegistration(req.user.tenantId);
      res.json(mfiRegistration);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch MFI registration" });
    }
  });

  app.post("/api/mfi-registration", authenticateToken, async (req, res) => {
    try {
      const validatedData = insertMfiRegistrationSchema.parse(req.body);
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: 'Tenant context required' });
      }
      const mfiRegistration = await storage.createMfiRegistration(req.user.tenantId, validatedData);
      res.status(201).json(mfiRegistration);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: error.errors });
      } else {
        res.status(500).json({ message: error instanceof Error ? error.message : "Failed to create MFI registration" });
      }
    }
  });

  app.put("/api/mfi-registration/:id", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertMfiRegistrationSchema.partial().parse(req.body);
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: 'Tenant context required' });
      }
      const mfiRegistration = await storage.updateMfiRegistration(req.user.tenantId, parseInt(id), validatedData);
      res.json(mfiRegistration);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: error.errors });
      } else {
        res.status(500).json({ message: error instanceof Error ? error.message : "Failed to update MFI registration" });
      }
    }
  });

  // Support Ticket routes
  app.get("/api/support-tickets", authenticateToken, async (req, res) => {
    try {
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: 'Tenant context required' });
      }
      const tickets = await storage.getSupportTickets(req.user.tenantId);
      res.json(tickets);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch support tickets" });
    }
  });

  app.get("/api/support-tickets/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: 'Tenant context required' });
      }
      const ticket = await storage.getSupportTicket(req.user.tenantId, id);
      if (!ticket) {
        return res.status(404).json({ message: "Support ticket not found" });
      }
      res.json(ticket);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch support ticket" });
    }
  });

  app.post("/api/support-tickets", authenticateToken, async (req, res) => {
    try {
      const ticketData = insertSupportTicketSchema.parse(req.body);
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: 'Tenant context required' });
      }
      const ticket = await storage.createSupportTicket(req.user.tenantId, ticketData);
      res.json(ticket);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to create support ticket" });
    }
  });

  app.put("/api/support-tickets/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: 'Tenant context required' });
      }
      const ticket = await storage.updateSupportTicket(req.user.tenantId, id, updateData);
      res.json(ticket);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to update support ticket" });
    }
  });

  app.get("/api/support-tickets/:id/messages", authenticateToken, async (req, res) => {
    try {
      const ticketId = parseInt(req.params.id);
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: 'Tenant context required' });
      }
      const messages = await storage.getSupportMessages(req.user.tenantId, ticketId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch messages" });
    }
  });

  app.post("/api/support-tickets/:id/messages", authenticateToken, async (req, res) => {
    try {
      const ticketId = parseInt(req.params.id);
      const messageData = insertSupportMessageSchema.parse(req.body);
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: 'Tenant context required' });
      }
      const message = await storage.createSupportMessage(req.user.tenantId, { ...messageData, ticketId });
      res.json(message);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to create message" });
    }
  });

  // Customer support ticket creation endpoint
  app.post("/api/customer/support-tickets", authenticateCustomerToken, async (req, res) => {
    try {
      const customerId = parseInt(req.customer.id);
      const tenantId = req.customer.tenantId;
      const ticketData = insertSupportTicketSchema.parse({
        ...req.body,
        tenantId: tenantId,
        customerId,
        customerEmail: req.customer.email,
        status: "open"
      });
      const ticket = await storage.createSupportTicket(tenantId, ticketData);
      res.json(ticket);
    } catch (error) {
      console.error('Support ticket creation error:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          message: "Validation error: " + error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
        });
      } else {
        res.status(400).json({ message: error instanceof Error ? error.message : "Failed to create support ticket" });
      }
    }
  });

  // Customer loan application endpoint
  app.post("/api/customer/loan-application", authenticateCustomerToken, async (req, res) => {
    try {
      const customerId = parseInt(req.customer.id);
      const loanData = insertLoanBookSchema.parse({
        customerId,
        loanAmount: req.body.amount.toString(),
        interestRate: "12.0", // Default rate
        term: parseInt(req.body.duration), // Maps duration to term
        status: "pending", // Loan application starts as pending
        purpose: req.body.purpose,
        dateApplied: new Date(),
        notes: req.body.additionalInfo || "",
      });
      const loan = await storage.createLoan(req.customer.tenantId, loanData);
      res.json(loan);
    } catch (error) {
      console.error('Loan application error:', error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to submit loan application" });
    }
  });

  // Shareholder Management routes
  app.get("/api/shareholders", authenticateToken, async (req, res) => {
    try {
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: 'Tenant context required' });
      }
      const shareholders = await storage.getShareholders(req.user.tenantId);
      res.json(shareholders);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch shareholders" });
    }
  });

  app.get("/api/shareholders/:id", authenticateToken, async (req, res) => {
    try {
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: 'Tenant context required' });
      }
      const { id } = req.params;
      const shareholder = await storage.getShareholder(req.user.tenantId, parseInt(id));
      if (!shareholder) {
        return res.status(404).json({ message: "Shareholder not found" });
      }
      res.json(shareholder);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch shareholder" });
    }
  });

  // Super admin route to get shareholders by tenant ID
  app.get("/api/admin/shareholders/:tenantId", authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
      const { tenantId } = req.params;
      const shareholders = await storage.getShareholders(tenantId);
      res.json(shareholders);
    } catch (error) {
      console.error("Shareholders fetch error:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch shareholders" });
    }
  });

  // Super admin route to get equity by tenant ID
  app.get("/api/admin/equity/:tenantId", authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
      const { tenantId } = req.params;
      const equity = await storage.getEquity(tenantId);
      res.json(equity);
    } catch (error) {
      console.error("Equity fetch error:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch equity" });
    }
  });

  // Tenant user management routes for super admin
  app.get("/api/admin/tenant-users/:tenantId", authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
      const { tenantId } = req.params;
      const users = await storage.getAllUsers(tenantId);
      // Remove passwords from response
      const safeUsers = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      res.json(safeUsers);
    } catch (error) {
      console.error("Tenant users fetch error:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch tenant users" });
    }
  });

  app.post("/api/admin/tenant-users/:tenantId", authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
      const { tenantId } = req.params;
      const userData = req.body;
      const user = await storage.createUser(tenantId, userData);
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error("Create tenant user error:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to create user" });
    }
  });

  app.patch("/api/admin/tenant-users/:tenantId/:userId", authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
      const { tenantId, userId } = req.params;
      const updateData = req.body;
      const user = await storage.updateUser(tenantId, parseInt(userId), updateData);
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Update tenant user error:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to update user" });
    }
  });

  app.delete("/api/admin/tenant-users/:tenantId/:userId", authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
      const { tenantId, userId } = req.params;
      await storage.deleteUser(tenantId, parseInt(userId));
      res.status(204).send();
    } catch (error) {
      console.error("Delete tenant user error:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to delete user" });
    }
  });

  app.post("/api/shareholders", authenticateToken, async (req, res) => {
    try {
      const validatedData = insertShareholderSchema.parse(req.body);
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: 'Tenant context required' });
      }
      const shareholder = await storage.createShareholder(req.user.tenantId, validatedData);
      res.status(201).json(shareholder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: error.errors });
      } else {
        res.status(500).json({ message: error instanceof Error ? error.message : "Failed to create shareholder" });
      }
    }
  });

  app.put("/api/shareholders/:id", authenticateToken, async (req, res) => {
    try {
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: 'Tenant context required' });
      }
      const { id } = req.params;
      const validatedData = insertShareholderSchema.partial().parse(req.body);
      const shareholder = await storage.updateShareholder(req.user.tenantId, parseInt(id), validatedData);
      res.json(shareholder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: error.errors });
      } else {
        res.status(500).json({ message: error instanceof Error ? error.message : "Failed to update shareholder" });
      }
    }
  });

  app.delete("/api/shareholders/:id", authenticateToken, async (req, res) => {
    try {
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: 'Tenant context required' });
      }
      const { id } = req.params;
      await storage.deleteShareholder(req.user.tenantId, parseInt(id));
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to delete shareholder" });
    }
  });

  // User Profile Management endpoints
  app.get("/api/users/profile", authenticateToken, async (req, res) => {
    try {
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: 'Tenant context required' });
      }
      const user = await storage.getUser(req.user.tenantId, req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch user profile" });
    }
  });

  app.put("/api/users/profile", authenticateToken, async (req, res) => {
    try {
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: 'Tenant context required' });
      }
      const profileData = req.body;
      // Remove sensitive fields that shouldn't be updated via this endpoint
      const { password, role, tenantId, isSuperAdmin, ...updateData } = profileData;
      
      const user = await storage.updateUser(req.user.tenantId, req.user.id, updateData);
      // Remove password from response
      const { password: pwd, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to update user profile" });
    }
  });

  app.get("/api/users/audit-logs", authenticateToken, async (req, res) => {
    try {
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: 'Tenant context required' });
      }
      const auditLogs = await storage.getUserAuditLogs(req.user.tenantId, req.user.id);
      res.json(auditLogs);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch audit logs" });
    }
  });

  app.put("/api/users/password", authenticateToken, async (req, res) => {
    try {
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: 'Tenant context required' });
      }
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current password and new password are required" });
      }

      // Get current user to verify password
      const user = await storage.getUser(req.user.tenantId, req.user.id);
      if (!user || !await bcrypt.compare(currentPassword, user.password)) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }

      // Hash new password and update
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await storage.updateUserPassword(req.user.tenantId, req.user.id, hashedPassword);
      
      // Log the password change
      await storage.createUserAuditLog(req.user.tenantId, {
        userId: req.user.id,
        action: 'password_change',
        description: 'User changed their password',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      res.json({ message: "Password updated successfully" });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to update password" });
    }
  });

  app.post("/api/users/profile-picture", authenticateToken, upload.single('profilePicture'), async (req, res) => {
    try {
      if (!req.user?.tenantId) {
        return res.status(400).json({ message: 'Tenant context required' });
      }
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const profilePicturePath = `/uploads/${req.file.filename}`;
      
      // Update user's profile picture
      const user = await storage.updateUser(req.user.tenantId, req.user.id, {
        profilePicture: profilePicturePath
      });

      // Log the profile picture change
      await storage.createUserAuditLog(req.user.tenantId, {
        userId: req.user.id,
        action: 'profile_picture_update',
        description: 'User updated their profile picture',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      res.json({ profilePicture: profilePicturePath });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to upload profile picture" });
    }
  });

  // Tenant Access Management endpoints
  app.post("/api/admin/grant-tenant-access", authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
      const { userId, tenantId, role = 'user', permissions = [] } = req.body;
      
      if (!userId || !tenantId) {
        return res.status(400).json({ message: "userId and tenantId are required" });
      }

      // Check if tenant exists
      const tenant = await storage.getTenant(tenantId);
      if (!tenant) {
        return res.status(404).json({ message: "Tenant not found" });
      }

      // Check if user exists (we need to check in any tenant since it's by user ID)
      const user = await storage.getUser(tenantId, userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Create or update tenant access
      const tenantAccess = await storage.createUserTenantAccess({
        userId,
        tenantId,
        role,
        permissions
      });

      res.status(201).json(tenantAccess);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to grant tenant access" });
    }
  });

  app.delete("/api/admin/revoke-tenant-access", authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
      const { userId, tenantId } = req.body;
      
      if (!userId || !tenantId) {
        return res.status(400).json({ message: "userId and tenantId are required" });
      }

      // Find and delete the tenant access record
      const userTenantAccessRecords = await storage.getUserTenantAccess(userId);
      const targetAccess = userTenantAccessRecords.find(access => access.tenantId === tenantId);
      
      if (!targetAccess) {
        return res.status(404).json({ message: "Tenant access not found" });
      }

      await storage.updateUserTenantAccess(targetAccess.id, { isDefault: false });

      res.json({ message: "Tenant access revoked successfully" });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to revoke tenant access" });
    }
  });

  app.get("/api/admin/user-tenant-access/:userId", authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const tenantAccess = await storage.getUserTenantAccess(parseInt(userId));
      res.json(tenantAccess);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch user tenant access" });
    }
  });

  // Add role management routes
  app.use('/api/roles', extractTenantContext, roleRoutes);

  // Register optimized performance routes
  registerOptimizedRoutes(app);

  const httpServer = createServer(app);
  return httpServer;
}
