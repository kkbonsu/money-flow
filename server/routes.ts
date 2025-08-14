import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { BackwardCompatibilityStorage } from "./multiTenantStorage";

// Use backward compatibility storage for existing routes
const storage = new BackwardCompatibilityStorage();
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
  insertShareholderSchema
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
  createTenantWithAdmin
} from "./tenantAuth";
import { eq, and, sql } from "drizzle-orm";
import { users, tenants } from "@shared/schema";
import roleRoutes from "./roleRoutes";

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
      const tenantId = req.tenantContext?.tenantId || 'default-tenant-001';
      
      const user = await storage.createUser({
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
          tenantId 
        }, 
        token 
      });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const tenantId = req.tenantContext?.tenantId || 'default-tenant-001';
      const user = await storage.getUserByUsername(username);
      
      if (!user || !await bcrypt.compare(password, user.password)) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      const token = generateUserToken(user, tenantId);
      
      // Update last login and log the login
      await storage.updateUserLastLogin(user.id);
      await storage.createUserAuditLog({
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
          tenantId 
        }, 
        token 
      });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Login failed" });
    }
  });

  // Tenant-aware customer authentication routes
  app.post("/api/customer/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const tenantId = req.tenantContext?.tenantId || 'default-tenant-001';
      const customer = await storage.getCustomerByEmail(email);
      
      if (!customer || !customer.password || !await bcrypt.compare(password, customer.password)) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      if (!customer.isPortalActive) {
        return res.status(401).json({ message: "Portal access is not active for this account" });
      }
      
      const token = generateCustomerToken(customer, tenantId);
      
      // Update last portal login
      await storage.updateCustomerLastLogin(customer.id);
      
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

  // Super admin stats endpoint
  app.get("/api/admin/stats", authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
      const [
        totalTenantsResult,
        activeTenantsResult,
        totalUsersResult
      ] = await Promise.all([
        db.select({ count: sql<number>`count(*)` }).from(simpleTenants),
        db.select({ count: sql<number>`count(*)` }).from(simpleTenants),
        db.select({ count: sql<number>`count(*)` }).from(users)
      ]);

      res.json({
        totalTenants: totalTenantsResult[0]?.count || 0,
        activeTenants: activeTenantsResult[0]?.count || 0,
        totalUsers: totalUsersResult[0]?.count || 0,
        systemRevenue: "$0" // Placeholder for future implementation
      });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch system stats" });
    }
  });

  // Delete tenant endpoint
  app.delete("/api/admin/tenants/:tenantId", authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
      const { tenantId } = req.params;
      
      // Note: In production, you might want to soft-delete or archive instead
      await db.delete(simpleTenants).where(eq(simpleTenants.id, tenantId));
      
      res.json({ message: "Tenant deleted successfully" });
    } catch (error) {
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
  app.get("/api/customer/profile", authenticateCustomerToken, async (req, res) => {
    try {
      const customerId = parseInt(req.customer.id);
      const customer = await storage.getCustomer(customerId);
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
      const customer = await storage.updateCustomer(req.customer.id, updateData);
      const { password, ...customerProfile } = customer;
      res.json(customerProfile);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to update profile" });
    }
  });

  app.put("/api/customer/password", authenticateCustomerToken, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const customer = await storage.getCustomer(req.customer.id);
      
      if (!customer || !customer.password || !await bcrypt.compare(currentPassword, customer.password)) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }
      
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await storage.updateCustomerPassword(req.customer.id, hashedPassword);
      
      res.json({ message: "Password updated successfully" });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to update password" });
    }
  });

  // Customer loan routes
  app.get("/api/customer/loans", authenticateCustomerToken, async (req, res) => {
    try {
      const customerId = parseInt(req.customer.id);
      const loans = await storage.getCustomerLoans(customerId);
      res.json(loans);
    } catch (error) {
      console.error("Customer loans error:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch loans" });
    }
  });

  // Customer payment routes
  app.get("/api/customer/payments", authenticateCustomerToken, async (req, res) => {
    try {
      const customerId = parseInt(req.customer.id);
      const payments = await storage.getCustomerPayments(customerId);
      res.json(payments);
    } catch (error) {
      console.error("Customer payments error:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch payments" });
    }
  });

  app.get("/api/customer/payments/upcoming", authenticateCustomerToken, async (req, res) => {
    try {
      const customerId = parseInt(req.customer.id);
      const upcomingPayments = await storage.getCustomerUpcomingPayments(customerId);
      res.json(upcomingPayments);
    } catch (error) {
      console.error("Customer upcoming payments error:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch upcoming payments" });
    }
  });

  // User account management routes
  app.get("/api/users/profile", authenticateToken, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      // Remove password from response
      const { password, ...userProfile } = user;
      res.json(userProfile);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch profile" });
    }
  });

  app.put("/api/users/profile", authenticateToken, async (req, res) => {
    try {
      const updateData = req.body;
      // Remove password from update data - password should be updated separately
      const { password, ...safeUpdateData } = updateData;
      
      const user = await storage.updateUser(req.user.id, safeUpdateData);
      
      // Log profile update
      await storage.createUserAuditLog({
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
      const user = await storage.getUser(req.user.id);
      if (!user || !await bcrypt.compare(currentPassword, user.password)) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }
      
      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // Update password
      await storage.updateUserPassword(req.user.id, hashedPassword);
      
      // Log password change
      await storage.createUserAuditLog({
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
      const logs = await storage.getUserAuditLogs(req.user.id);
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
      await storage.updateUser(req.user.id, { profilePicture: profilePictureUrl });
      
      // Log profile picture update
      await storage.createUserAuditLog({
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
  app.get("/api/users", authenticateToken, async (req, res) => {
    try {
      // Check if user is admin
      const currentUser = await storage.getUser(req.user.id);
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const users = await storage.getAllUsers();
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
      const currentUser = await storage.getUser(req.user.id);
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      // Prevent admin from deleting themselves
      if (userId === req.user.id) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }

      await storage.deleteUser(userId);
      
      // Log user deletion
      await storage.createUserAuditLog({
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
      const currentUser = await storage.getUser(req.user.id);
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      // Prevent admin from deactivating themselves
      if (userId === req.user.id) {
        return res.status(400).json({ message: "Cannot change your own account status" });
      }

      await storage.updateUser(userId, { isActive });
      
      // Log user status change
      await storage.createUserAuditLog({
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
      const currentUser = await storage.getUser(req.user.id);
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

      await storage.updateUser(userId, { role });
      
      // Log user role change
      await storage.createUserAuditLog({
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
  app.get("/api/customers", authenticateToken, async (req, res) => {
    try {
      const customers = await storage.getCustomers();
      res.json(customers);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch customers" });
    }
  });

  app.post("/api/customers", authenticateToken, async (req, res) => {
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
      
      const customer = await storage.createCustomer(customerWithPortal);
      
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

  app.put("/api/customers/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const customerData = insertCustomerSchema.parse(req.body);
      const customer = await storage.updateCustomer(id, customerData);
      res.json(customer);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to update customer" });
    }
  });

  app.delete("/api/customers/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCustomer(id);
      res.json({ message: "Customer deleted successfully" });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to delete customer" });
    }
  });

  // Loan Book routes
  app.get("/api/loans", authenticateToken, async (req, res) => {
    try {
      const loans = await storage.getLoans();
      res.json(loans);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch loans" });
    }
  });

  app.post("/api/loans", authenticateToken, async (req, res) => {
    try {
      const loanData = insertLoanBookSchema.parse(req.body);
      const loan = await storage.createLoan(loanData);
      res.json(loan);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to create loan" });
    }
  });

  app.put("/api/loans/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const loanData = insertLoanBookSchema.parse(req.body);
      const loan = await storage.updateLoan(id, loanData);
      res.json(loan);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to update loan" });
    }
  });

  app.delete("/api/loans/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteLoan(id);
      res.json({ message: "Loan deleted successfully" });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to delete loan" });
    }
  });

  // Loan Products routes
  app.get("/api/loan-products", authenticateToken, async (req, res) => {
    try {
      const loanProducts = await storage.getLoanProducts();
      res.json(loanProducts);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch loan products" });
    }
  });

  app.post("/api/loan-products", authenticateToken, async (req, res) => {
    try {
      const loanProductData = insertLoanProductSchema.parse(req.body);
      const loanProduct = await storage.createLoanProduct(loanProductData);
      res.json(loanProduct);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to create loan product" });
    }
  });

  app.put("/api/loan-products/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const loanProductData = insertLoanProductSchema.parse(req.body);
      const loanProduct = await storage.updateLoanProduct(id, loanProductData);
      res.json(loanProduct);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to update loan product" });
    }
  });

  app.delete("/api/loan-products/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteLoanProduct(id);
      res.json({ message: "Loan product deleted successfully" });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to delete loan product" });
    }
  });

  // Payment Schedule routes
  app.get("/api/payment-schedules", authenticateToken, async (req, res) => {
    try {
      const schedules = await storage.getPaymentSchedules();
      res.json(schedules);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch payment schedules" });
    }
  });

  app.get("/api/payment-schedules/loan/:loanId", authenticateToken, async (req, res) => {
    try {
      const loanId = parseInt(req.params.loanId);
      const schedules = await storage.getPaymentSchedulesByLoan(loanId);
      res.json(schedules);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch payment schedules for loan" });
    }
  });

  app.post("/api/payment-schedules", authenticateToken, async (req, res) => {
    try {
      const scheduleData = insertPaymentScheduleSchema.parse(req.body);
      const schedule = await storage.createPaymentSchedule(scheduleData);
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
      const schedule = await storage.updatePaymentSchedule(id, scheduleData);
      res.json(schedule);
    } catch (error) {
      console.error('Payment schedule update error:', error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to update payment schedule" });
    }
  });

  app.delete("/api/payment-schedules/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deletePaymentSchedule(id);
      res.json({ message: "Payment schedule deleted successfully" });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to delete payment schedule" });
    }
  });

  // Staff routes
  app.get("/api/staff", authenticateToken, async (req, res) => {
    try {
      const staff = await storage.getStaff();
      res.json(staff);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch staff" });
    }
  });

  app.post("/api/staff", authenticateToken, async (req, res) => {
    try {
      const staffData = insertStaffSchema.parse(req.body);
      const staff = await storage.createStaff(staffData);
      res.json(staff);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to create staff" });
    }
  });

  app.put("/api/staff/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const staffData = insertStaffSchema.parse(req.body);
      const staff = await storage.updateStaff(id, staffData);
      res.json(staff);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to update staff" });
    }
  });

  app.delete("/api/staff/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteStaff(id);
      res.json({ message: "Staff deleted successfully" });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to delete staff" });
    }
  });

  // Income Management routes
  app.get("/api/income", authenticateToken, async (req, res) => {
    try {
      const income = await storage.getIncome();
      res.json(income);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch income" });
    }
  });

  app.post("/api/income", authenticateToken, async (req, res) => {
    try {
      const incomeData = insertIncomeManagementSchema.parse(req.body);
      const income = await storage.createIncome(incomeData);
      res.json(income);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to create income" });
    }
  });

  app.put("/api/income/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const incomeData = insertIncomeManagementSchema.parse(req.body);
      const income = await storage.updateIncome(id, incomeData);
      res.json(income);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to update income" });
    }
  });

  app.delete("/api/income/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteIncome(id);
      res.json({ message: "Income deleted successfully" });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to delete income" });
    }
  });

  // Expense routes
  app.get("/api/expenses", authenticateToken, async (req, res) => {
    try {
      const expenses = await storage.getExpenses();
      res.json(expenses);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch expenses" });
    }
  });

  app.post("/api/expenses", authenticateToken, async (req, res) => {
    try {
      const expenseData = insertExpenseSchema.parse(req.body);
      const expense = await storage.createExpense(expenseData);
      res.json(expense);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to create expense" });
    }
  });

  app.put("/api/expenses/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const expenseData = insertExpenseSchema.parse(req.body);
      const expense = await storage.updateExpense(id, expenseData);
      res.json(expense);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to update expense" });
    }
  });

  app.delete("/api/expenses/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteExpense(id);
      res.json({ message: "Expense deleted successfully" });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to delete expense" });
    }
  });

  // Bank Management routes
  app.get("/api/bank-accounts", authenticateToken, async (req, res) => {
    try {
      const accounts = await storage.getBankAccounts();
      res.json(accounts);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch bank accounts" });
    }
  });

  app.post("/api/bank-accounts", authenticateToken, async (req, res) => {
    try {
      const accountData = insertBankManagementSchema.parse(req.body);
      const account = await storage.createBankAccount(accountData);
      res.json(account);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to create bank account" });
    }
  });

  app.put("/api/bank-accounts/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const accountData = insertBankManagementSchema.parse(req.body);
      const account = await storage.updateBankAccount(id, accountData);
      res.json(account);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to update bank account" });
    }
  });

  app.delete("/api/bank-accounts/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteBankAccount(id);
      res.json({ message: "Bank account deleted successfully" });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to delete bank account" });
    }
  });

  // Petty Cash routes
  app.get("/api/petty-cash", authenticateToken, async (req, res) => {
    try {
      const pettyCash = await storage.getPettyCash();
      res.json(pettyCash);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch petty cash" });
    }
  });

  app.post("/api/petty-cash", authenticateToken, async (req, res) => {
    try {
      const pettyCashData = insertPettyCashSchema.parse(req.body);
      const pettyCash = await storage.createPettyCash(pettyCashData);
      res.json(pettyCash);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to create petty cash" });
    }
  });

  app.put("/api/petty-cash/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const pettyCashData = insertPettyCashSchema.parse(req.body);
      const pettyCash = await storage.updatePettyCash(id, pettyCashData);
      res.json(pettyCash);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to update petty cash" });
    }
  });

  app.delete("/api/petty-cash/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deletePettyCash(id);
      res.json({ message: "Petty cash deleted successfully" });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to delete petty cash" });
    }
  });

  // Inventory routes
  app.get("/api/inventory", authenticateToken, async (req, res) => {
    try {
      const inventory = await storage.getInventory();
      res.json(inventory);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch inventory" });
    }
  });

  app.post("/api/inventory", authenticateToken, async (req, res) => {
    try {
      const inventoryData = insertInventorySchema.parse(req.body);
      const inventory = await storage.createInventory(inventoryData);
      res.json(inventory);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to create inventory" });
    }
  });

  app.put("/api/inventory/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const inventoryData = insertInventorySchema.parse(req.body);
      const inventory = await storage.updateInventory(id, inventoryData);
      res.json(inventory);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to update inventory" });
    }
  });

  app.delete("/api/inventory/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteInventory(id);
      res.json({ message: "Inventory deleted successfully" });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to delete inventory" });
    }
  });

  // Rent Management routes
  app.get("/api/rent", authenticateToken, async (req, res) => {
    try {
      const rent = await storage.getRentManagement();
      res.json(rent);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch rent management" });
    }
  });

  app.post("/api/rent", authenticateToken, async (req, res) => {
    try {
      const rentData = insertRentManagementSchema.parse(req.body);
      const rent = await storage.createRentManagement(rentData);
      res.json(rent);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to create rent management" });
    }
  });

  app.put("/api/rent/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const rentData = insertRentManagementSchema.parse(req.body);
      const rent = await storage.updateRentManagement(id, rentData);
      res.json(rent);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to update rent management" });
    }
  });

  app.delete("/api/rent/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteRentManagement(id);
      res.json({ message: "Rent management deleted successfully" });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to delete rent management" });
    }
  });

  // Assets routes
  app.get("/api/assets", authenticateToken, async (req, res) => {
    try {
      const assets = await storage.getAssets();
      res.json(assets);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch assets" });
    }
  });

  app.post("/api/assets", authenticateToken, async (req, res) => {
    try {
      const assetData = insertAssetSchema.parse(req.body);
      const asset = await storage.createAsset(assetData);
      res.json(asset);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to create asset" });
    }
  });

  app.put("/api/assets/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const assetData = insertAssetSchema.parse(req.body);
      const asset = await storage.updateAsset(id, assetData);
      res.json(asset);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to update asset" });
    }
  });

  app.delete("/api/assets/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteAsset(id);
      res.json({ message: "Asset deleted successfully" });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to delete asset" });
    }
  });

  // Liabilities routes
  app.get("/api/liabilities", authenticateToken, async (req, res) => {
    try {
      const liabilities = await storage.getLiabilities();
      res.json(liabilities);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch liabilities" });
    }
  });

  app.post("/api/liabilities", authenticateToken, async (req, res) => {
    try {
      const liabilityData = insertLiabilitySchema.parse(req.body);
      const liability = await storage.createLiability(liabilityData);
      res.json(liability);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to create liability" });
    }
  });

  app.put("/api/liabilities/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const liabilityData = insertLiabilitySchema.parse(req.body);
      const liability = await storage.updateLiability(id, liabilityData);
      res.json(liability);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to update liability" });
    }
  });

  app.delete("/api/liabilities/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteLiability(id);
      res.json({ message: "Liability deleted successfully" });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to delete liability" });
    }
  });

  // Equity routes
  app.get("/api/equity", authenticateToken, async (req, res) => {
    try {
      const equity = await storage.getEquity();
      res.json(equity);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch equity" });
    }
  });

  app.post("/api/equity", authenticateToken, async (req, res) => {
    try {
      const equityData = insertEquitySchema.parse(req.body);
      const equity = await storage.createEquity(equityData);
      res.json(equity);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to create equity" });
    }
  });

  app.put("/api/equity/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const equityData = insertEquitySchema.parse(req.body);
      const equity = await storage.updateEquity(id, equityData);
      res.json(equity);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to update equity" });
    }
  });

  app.delete("/api/equity/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteEquity(id);
      res.json({ message: "Equity deleted successfully" });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to delete equity" });
    }
  });

  // Reports routes
  app.get("/api/reports", authenticateToken, async (req, res) => {
    try {
      const reports = await storage.getReports();
      res.json(reports);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch reports" });
    }
  });

  app.post("/api/reports", authenticateToken, async (req, res) => {
    try {
      const reportData = insertReportSchema.parse(req.body);
      const report = await storage.createReport(reportData);
      res.json(report);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to create report" });
    }
  });

  app.put("/api/reports/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const reportData = insertReportSchema.parse(req.body);
      const report = await storage.updateReport(id, reportData);
      res.json(report);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to update report" });
    }
  });

  app.delete("/api/reports/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteReport(id);
      res.json({ message: "Report deleted successfully" });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to delete report" });
    }
  });

  // Dashboard metrics
  app.get("/api/dashboard/metrics", authenticateToken, async (req, res) => {
    try {
      const metrics = await storage.getDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch dashboard metrics" });
    }
  });

  // Loan portfolio data
  app.get("/api/dashboard/loan-portfolio", authenticateToken, async (req, res) => {
    try {
      const data = await storage.getLoanPortfolio();
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch loan portfolio data" });
    }
  });

  // Payment status data
  app.get("/api/dashboard/payment-status", authenticateToken, async (req, res) => {
    try {
      const data = await storage.getPaymentStatus();
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch payment status data" });
    }
  });

  // Advanced analytics data
  app.get("/api/dashboard/advanced-analytics", authenticateToken, async (req, res) => {
    try {
      const data = await storage.getAdvancedAnalytics();
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
      const recentPayments = await storage.getRecentPayments();
      res.json(recentPayments);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch recent payments" });
    }
  });

  app.get("/api/payments/today", authenticateToken, async (req, res) => {
    try {
      const todaysPayments = await storage.getTodaysPayments();
      res.json(todaysPayments);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch today's payments" });
    }
  });

  app.get("/api/payments/monthly", authenticateToken, async (req, res) => {
    try {
      const monthlyPayments = await storage.getMonthlyPayments();
      res.json(monthlyPayments);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch monthly payments" });
    }
  });

  // MFI Registration routes
  app.get("/api/mfi-registration", authenticateToken, async (req, res) => {
    try {
      const mfiRegistration = await storage.getMfiRegistration();
      res.json(mfiRegistration);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch MFI registration" });
    }
  });

  app.post("/api/mfi-registration", authenticateToken, async (req, res) => {
    try {
      const validatedData = insertMfiRegistrationSchema.parse(req.body);
      const mfiRegistration = await storage.createMfiRegistration(validatedData);
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
      const mfiRegistration = await storage.updateMfiRegistration(parseInt(id), validatedData);
      res.json(mfiRegistration);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Validation error", errors: error.errors });
      } else {
        res.status(500).json({ message: error instanceof Error ? error.message : "Failed to update MFI registration" });
      }
    }
  });

  // Shareholder Management routes
  app.get("/api/shareholders", authenticateToken, async (req, res) => {
    try {
      const shareholders = await storage.getShareholders();
      res.json(shareholders);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch shareholders" });
    }
  });

  app.get("/api/shareholders/:id", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const shareholder = await storage.getShareholder(parseInt(id));
      if (!shareholder) {
        return res.status(404).json({ message: "Shareholder not found" });
      }
      res.json(shareholder);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch shareholder" });
    }
  });

  app.post("/api/shareholders", authenticateToken, async (req, res) => {
    try {
      const validatedData = insertShareholderSchema.parse(req.body);
      const shareholder = await storage.createShareholder(validatedData);
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
      const { id } = req.params;
      const validatedData = insertShareholderSchema.partial().parse(req.body);
      const shareholder = await storage.updateShareholder(parseInt(id), validatedData);
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
      const { id } = req.params;
      await storage.deleteShareholder(parseInt(id));
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to delete shareholder" });
    }
  });

  // Add role management routes
  app.use('/api/roles', extractTenantContext, roleRoutes);

  const httpServer = createServer(app);
  return httpServer;
}
