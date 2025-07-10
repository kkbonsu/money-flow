import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
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
  insertReportSchema
} from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

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
      
      res.json({ user: { id: user.id, username: user.username, email: user.email, role: user.role }, token });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Login failed" });
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

  // Dashboard metrics
  app.get("/api/dashboard/metrics", authenticateToken, async (req, res) => {
    try {
      const metrics = await storage.getDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch dashboard metrics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
