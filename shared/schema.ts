import { pgTable, text, serial, integer, boolean, timestamp, decimal, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull().default("user"),
  profilePicture: text("profile_picture"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  phone: text("phone"),
  lastLogin: timestamp("last_login"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  nationalId: text("national_id"),
  creditScore: integer("credit_score"),
  status: text("status").notNull().default("active"),
  password: text("password"), // For customer portal login
  isPortalActive: boolean("is_portal_active").default(false),
  lastPortalLogin: timestamp("last_portal_login"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const loanBooks = pgTable("loan_books", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customers.id),
  loanAmount: decimal("loan_amount", { precision: 15, scale: 2 }).notNull(),
  interestRate: decimal("interest_rate", { precision: 5, scale: 2 }).notNull(),
  term: integer("term").notNull(), // in months
  status: text("status").notNull().default("pending"),
  purpose: text("purpose"),
  dateApplied: timestamp("date_applied"),
  approvedBy: integer("approved_by").references(() => users.id),
  disbursedAmount: decimal("disbursed_amount", { precision: 15, scale: 2 }),
  outstandingBalance: decimal("outstanding_balance", { precision: 15, scale: 2 }),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const paymentSchedules = pgTable("payment_schedules", {
  id: serial("id").primaryKey(),
  loanId: integer("loan_id").references(() => loanBooks.id),
  dueDate: timestamp("due_date").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  principalAmount: decimal("principal_amount", { precision: 15, scale: 2 }).notNull(),
  interestAmount: decimal("interest_amount", { precision: 15, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"),
  paidDate: timestamp("paid_date"),
  paidAmount: decimal("paid_amount", { precision: 15, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const staff = pgTable("staff", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  position: text("position").notNull(),
  salary: decimal("salary", { precision: 15, scale: 2 }),
  hireDate: timestamp("hire_date").notNull(),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const incomeManagement = pgTable("income_management", {
  id: serial("id").primaryKey(),
  source: text("source").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  category: text("category").notNull(),
  date: text("date").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  category: text("category").notNull(),
  vendor: text("vendor"),
  date: text("date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const bankManagement = pgTable("bank_management", {
  id: serial("id").primaryKey(),
  accountName: text("account_name").notNull(),
  bankName: text("bank_name").notNull(),
  accountNumber: text("account_number").notNull(),
  balance: decimal("balance", { precision: 15, scale: 2 }).notNull(),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const pettyCash = pgTable("petty_cash", {
  id: serial("id").primaryKey(),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  type: text("type").notNull(),
  date: text("date").notNull(),
  purpose: text("purpose"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const inventory = pgTable("inventory", {
  id: serial("id").primaryKey(),
  itemName: text("item_name").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 15, scale: 2 }).notNull(),
  totalValue: decimal("total_value", { precision: 15, scale: 2 }).notNull(),
  category: text("category"),
  status: text("status").notNull().default("in_stock"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const rentManagement = pgTable("rent_management", {
  id: serial("id").primaryKey(),
  propertyName: text("property_name").notNull(),
  tenantName: text("tenant_name").notNull(),
  monthlyRent: decimal("monthly_rent", { precision: 15, scale: 2 }).notNull(),
  dueDate: timestamp("due_date").notNull(),
  status: text("status").notNull().default("pending"),
  paidDate: timestamp("paid_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const assets = pgTable("assets", {
  id: serial("id").primaryKey(),
  assetName: text("asset_name").notNull(),
  category: text("category").notNull(),
  value: decimal("value", { precision: 15, scale: 2 }).notNull(),
  depreciationRate: decimal("depreciation_rate", { precision: 5, scale: 2 }),
  purchaseDate: timestamp("purchase_date").notNull(),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const liabilities = pgTable("liabilities", {
  id: serial("id").primaryKey(),
  liabilityName: text("liability_name").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  dueDate: timestamp("due_date"),
  status: text("status").notNull().default("pending"),
  creditor: text("creditor"),
  interestRate: decimal("interest_rate", { precision: 5, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const equity = pgTable("equity", {
  id: serial("id").primaryKey(),
  equityType: text("equity_type").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  date: timestamp("date").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  reportType: text("report_type").notNull(),
  title: text("title").notNull(),
  content: text("content"),
  generatedBy: integer("generated_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userAuditLogs = pgTable("user_audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  action: text("action").notNull(), // login, logout, password_change, profile_update, etc.
  description: text("description"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  timestamp: timestamp("timestamp").defaultNow(),
});

// MFI Registration table for BoG compliance
export const mfiRegistration = pgTable("mfi_registration", {
  id: serial("id").primaryKey(),
  companyName: text("company_name").notNull(),
  registrationNumber: text("registration_number").notNull().unique(),
  certificateOfIncorporation: text("certificate_of_incorporation"), // File path/URL
  taxClearanceCertificate: text("tax_clearance_certificate"), // File path/URL
  registeredAddress: text("registered_address").notNull(),
  physicalAddress: text("physical_address").notNull(),
  paidUpCapital: decimal("paid_up_capital", { precision: 15, scale: 2 }).notNull(),
  minimumCapitalRequired: decimal("minimum_capital_required", { precision: 15, scale: 2 }).default("2000000.00"), // GHS 2M
  contactPhone: text("contact_phone"),
  contactEmail: text("contact_email"),
  boGLicenseNumber: text("bog_license_number"),
  licenseExpiryDate: date("license_expiry_date"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Shareholder Management table for GIPC compliance
export const shareholders = pgTable("shareholders", {
  id: serial("id").primaryKey(),
  shareholderType: text("shareholder_type").notNull(), // 'local', 'foreign'
  name: text("name").notNull(),
  nationality: text("nationality").notNull(),
  idType: text("id_type").notNull(), // 'ghana_card', 'passport', 'other'
  idNumber: text("id_number").notNull(),
  address: text("address").notNull(),
  contactPhone: text("contact_phone"),
  contactEmail: text("contact_email"),
  sharesOwned: integer("shares_owned").notNull(),
  sharePercentage: decimal("share_percentage", { precision: 5, scale: 2 }).notNull(),
  investmentAmount: decimal("investment_amount", { precision: 15, scale: 2 }).notNull(),
  investmentCurrency: text("investment_currency").default("GHS"),
  gipCertificate: text("gipc_certificate"), // File path/URL for foreign investors
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const customersRelations = relations(customers, ({ many }) => ({
  loans: many(loanBooks),
}));

export const loanBooksRelations = relations(loanBooks, ({ one, many }) => ({
  customer: one(customers, {
    fields: [loanBooks.customerId],
    references: [customers.id],
  }),
  approver: one(users, {
    fields: [loanBooks.approvedBy],
    references: [users.id],
  }),
  paymentSchedules: many(paymentSchedules),
}));

export const paymentSchedulesRelations = relations(paymentSchedules, ({ one }) => ({
  loan: one(loanBooks, {
    fields: [paymentSchedules.loanId],
    references: [loanBooks.id],
  }),
}));

export const staffRelations = relations(staff, ({ many }) => ({
  
}));

export const usersRelations = relations(users, ({ many }) => ({
  approvedLoans: many(loanBooks),
  reports: many(reports),
  auditLogs: many(userAuditLogs),
}));

export const userAuditLogsRelations = relations(userAuditLogs, ({ one }) => ({
  user: one(users, {
    fields: [userAuditLogs.userId],
    references: [users.id],
  }),
}));

export const reportsRelations = relations(reports, ({ one }) => ({
  generator: one(users, {
    fields: [reports.generatedBy],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLoanBookSchema = createInsertSchema(loanBooks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  loanAmount: z.union([z.string(), z.number()]).transform((val) => val.toString()),
  interestRate: z.union([z.string(), z.number()]).transform((val) => val.toString()),
  disbursedAmount: z.union([z.string(), z.number()]).optional().transform((val) => 
    val !== undefined && val !== null ? val.toString() : undefined
  ),
  outstandingBalance: z.union([z.string(), z.number()]).optional().transform((val) => 
    val !== undefined && val !== null ? val.toString() : undefined
  ),
  dateApplied: z.union([z.string(), z.date()]).optional().transform((val) => 
    val instanceof Date ? val : val ? new Date(val) : undefined
  ),
  startDate: z.union([z.string(), z.date()]).optional().transform((val) => 
    val instanceof Date ? val : val ? new Date(val) : undefined
  ),
  endDate: z.union([z.string(), z.date()]).optional().transform((val) => 
    val instanceof Date ? val : val ? new Date(val) : undefined
  ),
});

export const insertPaymentScheduleSchema = createInsertSchema(paymentSchedules).omit({
  id: true,
  createdAt: true,
}).extend({
  amount: z.union([z.string(), z.number()]).transform((val) => val.toString()),
  principalAmount: z.union([z.string(), z.number()]).transform((val) => val.toString()),
  interestAmount: z.union([z.string(), z.number()]).transform((val) => val.toString()),
  paidAmount: z.union([z.string(), z.number(), z.null()]).optional().transform((val) => 
    val !== undefined && val !== null ? val.toString() : undefined
  ),
  dueDate: z.union([z.string(), z.date()]).transform((val) => 
    val instanceof Date ? val : new Date(val)
  ),
  paidDate: z.union([z.string(), z.date(), z.null()]).optional().transform((val) => 
    val instanceof Date ? val : val ? new Date(val) : undefined
  ),
});

export const insertStaffSchema = createInsertSchema(staff).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  salary: z.union([z.string(), z.number()]).optional().transform((val) => 
    val !== undefined && val !== null ? val.toString() : undefined
  ),
  hireDate: z.union([z.string(), z.date()]).transform((val) => 
    val instanceof Date ? val : new Date(val)
  ),
});

export const insertIncomeManagementSchema = createInsertSchema(incomeManagement).omit({
  id: true,
  createdAt: true,
}).extend({
  amount: z.union([z.string(), z.number()]).transform((val) => val.toString()),
});

export const insertExpenseSchema = createInsertSchema(expenses).omit({
  id: true,
  createdAt: true,
}).extend({
  amount: z.union([z.string(), z.number()]).transform((val) => val.toString()),
});

export const insertBankManagementSchema = createInsertSchema(bankManagement).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  balance: z.union([z.string(), z.number()]).transform((val) => val.toString()),
});

export const insertPettyCashSchema = createInsertSchema(pettyCash).omit({
  id: true,
  createdAt: true,
}).extend({
  amount: z.union([z.string(), z.number()]).transform((val) => val.toString()),
});

export const insertInventorySchema = createInsertSchema(inventory).omit({
  id: true,
  createdAt: true,
}).extend({
  unitPrice: z.union([z.string(), z.number()]).transform((val) => val.toString()),
  totalValue: z.union([z.string(), z.number()]).transform((val) => val.toString()),
});

export const insertRentManagementSchema = createInsertSchema(rentManagement).omit({
  id: true,
  createdAt: true,
});

export const insertAssetSchema = createInsertSchema(assets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLiabilitySchema = createInsertSchema(liabilities).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEquitySchema = createInsertSchema(equity).omit({
  id: true,
  createdAt: true,
});

export const insertReportSchema = createInsertSchema(reports).omit({
  id: true,
  createdAt: true,
});

export const insertUserAuditLogSchema = createInsertSchema(userAuditLogs).omit({
  id: true,
  timestamp: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;

export type LoanBook = typeof loanBooks.$inferSelect;
export type InsertLoanBook = z.infer<typeof insertLoanBookSchema>;

export type PaymentSchedule = typeof paymentSchedules.$inferSelect;
export type InsertPaymentSchedule = z.infer<typeof insertPaymentScheduleSchema>;

export type Staff = typeof staff.$inferSelect;
export type InsertStaff = z.infer<typeof insertStaffSchema>;

export type IncomeManagement = typeof incomeManagement.$inferSelect;
export type InsertIncomeManagement = z.infer<typeof insertIncomeManagementSchema>;

export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;

export type BankManagement = typeof bankManagement.$inferSelect;
export type InsertBankManagement = z.infer<typeof insertBankManagementSchema>;

export type PettyCash = typeof pettyCash.$inferSelect;
export type InsertPettyCash = z.infer<typeof insertPettyCashSchema>;

export type Inventory = typeof inventory.$inferSelect;
export type InsertInventory = z.infer<typeof insertInventorySchema>;

export type RentManagement = typeof rentManagement.$inferSelect;
export type InsertRentManagement = z.infer<typeof insertRentManagementSchema>;

export type Asset = typeof assets.$inferSelect;
export type InsertAsset = z.infer<typeof insertAssetSchema>;

export type Liability = typeof liabilities.$inferSelect;
export type InsertLiability = z.infer<typeof insertLiabilitySchema>;

export type Equity = typeof equity.$inferSelect;
export type InsertEquity = z.infer<typeof insertEquitySchema>;

export type Report = typeof reports.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;

export type UserAuditLog = typeof userAuditLogs.$inferSelect;
export type InsertUserAuditLog = z.infer<typeof insertUserAuditLogSchema>;
