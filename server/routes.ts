import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import fs from "fs";
import { 
  insertUserSchema, 
  insertCustomerSchema, 
  insertLoanBookSchema, 
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
  insertUserAuditLogSchema
} from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

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

// Middleware to verify JWT token
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ message: "Invalid token" });
    }
    req.user = user;
    next();
  });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve static files from uploads directory
  app.use('/uploads', express.static(uploadsDir));
  
  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });
      
      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      res.json({ user: { id: user.id, username: user.username, email: user.email, role: user.role }, token });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);
      
      if (!user || !await bcrypt.compare(password, user.password)) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      // Update last login and log the login
      await storage.updateUserLastLogin(user.id);
      await storage.createUserAuditLog({
        userId: user.id,
        action: 'login',
        description: 'User logged in successfully',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });
      
      res.json({ user: { id: user.id, username: user.username, email: user.email, role: user.role }, token });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Login failed" });
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
      const customer = await storage.createCustomer(customerData);
      res.json(customer);
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

  // Payment Schedule routes
  app.get("/api/payment-schedules", authenticateToken, async (req, res) => {
    try {
      const schedules = await storage.getPaymentSchedules();
      res.json(schedules);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch payment schedules" });
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
      const data = await storage.getLoanPortfolioData();
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch loan portfolio data" });
    }
  });

  // Payment status data
  app.get("/api/dashboard/payment-status", authenticateToken, async (req, res) => {
    try {
      const data = await storage.getPaymentStatusData();
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch payment status data" });
    }
  });

  // Backfill interest payments to income table
  app.post("/api/backfill/interest-payments", authenticateToken, async (req, res) => {
    try {
      await storage.backfillInterestPayments();
      res.json({ message: "Interest payments backfilled successfully" });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to backfill interest payments" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
