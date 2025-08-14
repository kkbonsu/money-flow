import { pgTable, text, serial, integer, boolean, timestamp, decimal, varchar, date, uuid, jsonb, unique } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Tenants collection - Core multi-tenant management
export const tenants = pgTable("tenants", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(), // "ABC Microfinance Ltd"
  slug: text("slug").notNull().unique(), // "abc-microfinance"
  domain: text("domain"), // "abc.moneyflow.app"
  
  // Subscription & Limits
  plan: text("plan").notNull().default("basic"), // 'basic', 'professional', 'enterprise'
  limits: jsonb("limits").notNull().default({
    maxLoans: 100,
    maxUsers: 5,
    maxStorage: 1024 // MB
  }),
  
  // Branding & Customization
  branding: jsonb("branding").notNull().default({
    logo: null,
    primaryColor: "#2563eb",
    secondaryColor: "#64748b",
    companyName: ""
  }),
  
  // Regional Settings
  currency: text("currency").notNull().default("GHS"), // "GHS", "USD"
  locale: text("locale").notNull().default("en-GH"), // "en-GH"
  timezone: text("timezone").notNull().default("Africa/Accra"), // "Africa/Accra"
  
  // Status & Metadata
  status: text("status").notNull().default("active"), // 'active', 'suspended', 'trial'
  subscriptionEnds: timestamp("subscription_ends"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Roles table for hierarchical permission system
export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  hierarchyLevel: integer("hierarchy_level").notNull(), // 1=Super Admin, 2=Admin, 3=Manager, 4=Staff
  isSystemRole: boolean("is_system_role").default(true), // Predefined roles
  tenantId: uuid("tenant_id").references(() => tenants.id), // null for system-wide roles like Super Admin
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueRoleName: unique().on(table.name, table.tenantId),
}));

// Permissions table for granular access control
export const permissions = pgTable("permissions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(), // e.g., "loans:create"
  category: text("category").notNull(), // data_access, financial_operations, etc.
  description: text("description"),
  resource: text("resource").notNull(), // loans, customers, reports, etc.
  action: text("action").notNull(), // create, read, update, delete, approve, etc.
  createdAt: timestamp("created_at").defaultNow(),
});

// Role-Permission mapping (many-to-many)
export const rolePermissions = pgTable("role_permissions", {
  id: serial("id").primaryKey(),
  roleId: integer("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
  permissionId: integer("permission_id").notNull().references(() => permissions.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueRolePermission: unique().on(table.roleId, table.permissionId),
}));

// User-Role assignments (one primary role per user per tenant)
export const userRoles = pgTable("user_roles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  roleId: integer("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  assignedBy: integer("assigned_by").references(() => users.id),
  assignedAt: timestamp("assigned_at").defaultNow(),
  isActive: boolean("is_active").default(true),
}, (table) => ({
  uniqueUserTenantRole: unique().on(table.userId, table.tenantId), // One role per user per tenant
}));

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  username: text("username").notNull(),
  password: text("password").notNull(),
  email: text("email").notNull(),
  role: text("role").notNull().default("user"),
  profilePicture: text("profile_picture"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  phone: text("phone"),
  lastLogin: timestamp("last_login"),
  isActive: boolean("is_active").default(true),
  isSuperAdmin: boolean("is_super_admin").default(false), // Can access all tenants
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User-Tenant access relationship (for multi-tenant users)
export const userTenantAccess = pgTable("user_tenant_access", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  role: text("role").notNull().default("user"), // 'admin', 'manager', 'user', 'viewer'
  permissions: jsonb("permissions").default([]), // granular permissions array
  isDefault: boolean("is_default").default(false), // default tenant for this user
  createdAt: timestamp("created_at").defaultNow(),
});

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
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

export const loanProducts = pgTable("loan_products", {
  id: serial("id").primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  name: text("name").notNull(),
  fee: decimal("fee", { precision: 15, scale: 2 }).notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const loanBooks = pgTable("loan_books", {
  id: serial("id").primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  customerId: integer("customer_id").references(() => customers.id),
  loanProductId: integer("loan_product_id").references(() => loanProducts.id),
  loanAmount: decimal("loan_amount", { precision: 15, scale: 2 }).notNull(),
  interestRate: decimal("interest_rate", { precision: 5, scale: 2 }).notNull(),
  term: integer("term").notNull(), // in months
  status: text("status").notNull().default("pending"),
  purpose: text("purpose"),
  dateApplied: timestamp("date_applied"),
  assignedOfficer: integer("assigned_officer").references(() => users.id),
  approvedBy: integer("approved_by").references(() => users.id),
  approvalDate: timestamp("approval_date"),
  rejectionReason: text("rejection_reason"),
  disbursedAmount: decimal("disbursed_amount", { precision: 15, scale: 2 }),
  disbursedBy: integer("disbursed_by").references(() => users.id),
  disbursementDate: timestamp("disbursement_date"),
  outstandingBalance: decimal("outstanding_balance", { precision: 15, scale: 2 }),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const paymentSchedules = pgTable("payment_schedules", {
  id: serial("id").primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
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
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
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
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  source: text("source").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  category: text("category").notNull(),
  date: text("date").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  category: text("category").notNull(),
  vendor: text("vendor"),
  date: text("date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const bankManagement = pgTable("bank_management", {
  id: serial("id").primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
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
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  type: text("type").notNull(),
  date: text("date").notNull(),
  purpose: text("purpose"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const inventory = pgTable("inventory", {
  id: serial("id").primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
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
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
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
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
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
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
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
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  equityType: text("equity_type").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  date: timestamp("date").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  reportType: text("report_type").notNull(),
  title: text("title").notNull(),
  content: text("content"),
  generatedBy: integer("generated_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userAuditLogs = pgTable("user_audit_logs", {
  id: serial("id").primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  userId: integer("user_id").references(() => users.id),
  action: text("action").notNull(), // login, logout, password_change, profile_update, etc.
  description: text("description"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  timestamp: timestamp("timestamp").defaultNow(),
});

// MFI Registration table for BoG compliance (Global-like collection - one per tenant)
export const mfiRegistration = pgTable("mfi_registration", {
  id: serial("id").primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull().unique(), // One per tenant
  companyName: text("company_name").notNull(),
  registrationNumber: text("registration_number").notNull(),
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
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
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

// Collateral Management table for Security Interest Registration
export const collateral = pgTable("collateral", {
  id: serial("id").primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  loanId: integer("loan_id").references(() => loanBooks.id),
  collateralType: text("collateral_type").notNull(), // 'real_estate', 'vehicle', 'equipment', 'inventory', 'other'
  description: text("description").notNull(),
  estimatedValue: decimal("estimated_value", { precision: 15, scale: 2 }).notNull(),
  valuationDate: date("valuation_date"),
  valuationMethod: text("valuation_method"), // 'professional_appraisal', 'market_comparison', 'book_value'
  registrationNumber: text("registration_number"), // For vehicles, equipment, etc.
  location: text("location"),
  condition: text("condition"), // 'excellent', 'good', 'fair', 'poor'
  ownershipDocument: text("ownership_document"), // File path/URL
  registryReference: text("registry_reference"), // External registry reference
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Borrower Education Content table
export const educationContent = pgTable("education_content", {
  id: serial("id").primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  contentType: text("content_type").notNull(), // 'article', 'video', 'infographic', 'quiz'
  category: text("category").notNull(), // 'loan_terms', 'financial_literacy', 'responsible_borrowing', 'rights_responsibilities'
  language: text("language").notNull().default("en"), // 'en', 'tw', 'ee' (English, Twi, Ewe)
  difficulty: text("difficulty").notNull().default("beginner"), // 'beginner', 'intermediate', 'advanced'
  estimatedReadTime: integer("estimated_read_time"), // in minutes
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Borrower Feedback table
export const borrowerFeedback = pgTable("borrower_feedback", {
  id: serial("id").primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  customerId: integer("customer_id").references(() => customers.id),
  loanId: integer("loan_id").references(() => loanBooks.id),
  feedbackType: text("feedback_type").notNull(), // 'complaint', 'suggestion', 'clarification', 'compliment'
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  status: text("status").notNull().default("pending"), // 'pending', 'in_progress', 'resolved', 'closed'
  assignedTo: integer("assigned_to").references(() => users.id),
  response: text("response"),
  responseDate: timestamp("response_date"),
  priority: text("priority").notNull().default("medium"), // 'low', 'medium', 'high', 'urgent'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Debt Collection Activities table
export const debtCollectionActivities = pgTable("debt_collection_activities", {
  id: serial("id").primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  loanId: integer("loan_id").references(() => loanBooks.id),
  customerId: integer("customer_id").references(() => customers.id),
  activityType: text("activity_type").notNull(), // 'reminder_call', 'email_reminder', 'sms_reminder', 'field_visit', 'payment_plan', 'legal_notice'
  description: text("description").notNull(),
  outcome: text("outcome"), // 'payment_made', 'payment_promised', 'no_contact', 'dispute_raised', 'payment_plan_agreed'
  amountCollected: decimal("amount_collected", { precision: 15, scale: 2 }),
  nextActionDate: date("next_action_date"),
  performedBy: integer("performed_by").references(() => users.id),
  isEthical: boolean("is_ethical").default(true), // Compliance with ethical collection practices
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Multi-tenant Relations
export const tenantsRelations = relations(tenants, ({ many }) => ({
  users: many(users),
  customers: many(customers),
  loanProducts: many(loanProducts),
  loanBooks: many(loanBooks),
  paymentSchedules: many(paymentSchedules),
  staff: many(staff),
  incomeManagement: many(incomeManagement),
  expenses: many(expenses),
  bankManagement: many(bankManagement),
  pettyCash: many(pettyCash),
  inventory: many(inventory),
  rentManagement: many(rentManagement),
  assets: many(assets),
  liabilities: many(liabilities),
  equity: many(equity),
  reports: many(reports),
  userAuditLogs: many(userAuditLogs),
  mfiRegistration: many(mfiRegistration),
  shareholders: many(shareholders),
  userTenantAccess: many(userTenantAccess),
  roles: many(roles),
  userRoles: many(userRoles),
}));

export const roleRelations = relations(roles, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [roles.tenantId],
    references: [tenants.id],
  }),
  rolePermissions: many(rolePermissions),
  userRoles: many(userRoles),
}));

export const permissionRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions),
}));

export const rolePermissionRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, {
    fields: [rolePermissions.roleId],
    references: [roles.id],
  }),
  permission: one(permissions, {
    fields: [rolePermissions.permissionId],
    references: [permissions.id],
  }),
}));

export const userRoleRelations = relations(userRoles, ({ one }) => ({
  user: one(users, {
    fields: [userRoles.userId],
    references: [users.id],
  }),
  role: one(roles, {
    fields: [userRoles.roleId],
    references: [roles.id],
  }),
  tenant: one(tenants, {
    fields: [userRoles.tenantId],
    references: [tenants.id],
  }),
  assignedByUser: one(users, {
    fields: [userRoles.assignedBy],
    references: [users.id],
  }),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [users.tenantId],
    references: [tenants.id],
  }),
  tenantAccess: many(userTenantAccess),
  assignedLoans: many(loanBooks, { relationName: "assignedOfficer" }),
  approvedLoans: many(loanBooks, { relationName: "approver" }),
  disbursedLoans: many(loanBooks, { relationName: "disburser" }),
  auditLogs: many(userAuditLogs),
}));

export const userTenantAccessRelations = relations(userTenantAccess, ({ one }) => ({
  user: one(users, {
    fields: [userTenantAccess.userId],
    references: [users.id],
  }),
  tenant: one(tenants, {
    fields: [userTenantAccess.tenantId],
    references: [tenants.id],
  }),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [customers.tenantId],
    references: [tenants.id],
  }),
  loans: many(loanBooks),
}));

export const loanProductsRelations = relations(loanProducts, ({ many }) => ({
  loans: many(loanBooks),
}));

export const loanBooksRelations = relations(loanBooks, ({ one, many }) => ({
  customer: one(customers, {
    fields: [loanBooks.customerId],
    references: [customers.id],
  }),
  loanProduct: one(loanProducts, {
    fields: [loanBooks.loanProductId],
    references: [loanProducts.id],
  }),
  assignedOfficer: one(users, {
    fields: [loanBooks.assignedOfficer],
    references: [users.id],
  }),
  approver: one(users, {
    fields: [loanBooks.approvedBy],
    references: [users.id],
  }),
  disburser: one(users, {
    fields: [loanBooks.disbursedBy],
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

// Insert schemas for multi-tenant support
export const insertTenantSchema = createInsertSchema(tenants).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserTenantAccessSchema = createInsertSchema(userTenantAccess).omit({
  id: true,
  createdAt: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  tenantId: true, // Injected by middleware
  createdAt: true,
  updatedAt: true,
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  tenantId: true, // Injected by middleware
  createdAt: true,
  updatedAt: true,
});

export const insertLoanBookSchema = createInsertSchema(loanBooks).omit({
  id: true,
  tenantId: true, // Injected by middleware
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
  approvalDate: z.union([z.string(), z.date()]).optional().transform((val) => 
    val instanceof Date ? val : val ? new Date(val) : undefined
  ),
  disbursementDate: z.union([z.string(), z.date()]).optional().transform((val) => 
    val instanceof Date ? val : val ? new Date(val) : undefined
  ),
});

export const insertPaymentScheduleSchema = createInsertSchema(paymentSchedules).omit({
  id: true,
  tenantId: true, // Injected by middleware
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
  tenantId: true, // Injected by middleware
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
  tenantId: true, // Injected by middleware
  createdAt: true,
}).extend({
  amount: z.union([z.string(), z.number()]).transform((val) => val.toString()),
});

export const insertExpenseSchema = createInsertSchema(expenses).omit({
  id: true,
  tenantId: true, // Injected by middleware
  createdAt: true,
}).extend({
  amount: z.union([z.string(), z.number()]).transform((val) => val.toString()),
});

export const insertBankManagementSchema = createInsertSchema(bankManagement).omit({
  id: true,
  tenantId: true, // Injected by middleware
  createdAt: true,
  updatedAt: true,
}).extend({
  balance: z.union([z.string(), z.number()]).transform((val) => val.toString()),
});

export const insertPettyCashSchema = createInsertSchema(pettyCash).omit({
  id: true,
  tenantId: true, // Injected by middleware
  createdAt: true,
}).extend({
  amount: z.union([z.string(), z.number()]).transform((val) => val.toString()),
});

export const insertInventorySchema = createInsertSchema(inventory).omit({
  id: true,
  tenantId: true, // Injected by middleware
  createdAt: true,
}).extend({
  unitPrice: z.union([z.string(), z.number()]).transform((val) => val.toString()),
  totalValue: z.union([z.string(), z.number()]).transform((val) => val.toString()),
});

export const insertRentManagementSchema = createInsertSchema(rentManagement).omit({
  id: true,
  tenantId: true, // Injected by middleware
  createdAt: true,
});

export const insertAssetSchema = createInsertSchema(assets).omit({
  id: true,
  tenantId: true, // Injected by middleware
  createdAt: true,
  updatedAt: true,
});

export const insertLiabilitySchema = createInsertSchema(liabilities).omit({
  id: true,
  tenantId: true, // Injected by middleware
  createdAt: true,
  updatedAt: true,
});

export const insertEquitySchema = createInsertSchema(equity).omit({
  id: true,
  tenantId: true, // Injected by middleware
  createdAt: true,
});

export const insertReportSchema = createInsertSchema(reports).omit({
  id: true,
  tenantId: true, // Injected by middleware
  createdAt: true,
});

export const insertUserAuditLogSchema = createInsertSchema(userAuditLogs).omit({
  id: true,
  tenantId: true, // Injected by middleware
  timestamp: true,
});

export const insertMfiRegistrationSchema = createInsertSchema(mfiRegistration).omit({
  id: true,
  tenantId: true, // Injected by middleware
  createdAt: true,
  updatedAt: true,
}).extend({
  paidUpCapital: z.union([z.string(), z.number()]).transform((val) => val.toString()),
  minimumCapitalRequired: z.union([z.string(), z.number()]).optional().transform((val) => 
    val !== undefined && val !== null ? val.toString() : "2000000.00"
  ),
  licenseExpiryDate: z.union([z.string(), z.date()]).optional().transform((val) => 
    val instanceof Date ? val : val ? new Date(val) : undefined
  ),
});

export const insertShareholderSchema = createInsertSchema(shareholders, {
  sharesOwned: z.union([z.string(), z.number()]).transform((val) => {
    const num = typeof val === 'string' ? parseInt(val) : val;
    return isNaN(num) ? 0 : num;
  }),
  sharePercentage: z.union([z.string(), z.number()]).transform((val) => val.toString()),
  investmentAmount: z.union([z.string(), z.number()]).transform((val) => val.toString()),
}).omit({
  id: true,
  tenantId: true, // Injected by middleware
  createdAt: true,
  updatedAt: true,
});

export const insertLoanProductSchema = createInsertSchema(loanProducts).omit({
  id: true,
  tenantId: true, // Injected by middleware
  createdAt: true,
  updatedAt: true,
}).extend({
  fee: z.union([z.string(), z.number()]).transform((val) => val.toString()),
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

export type MfiRegistration = typeof mfiRegistration.$inferSelect;
export type InsertMfiRegistration = z.infer<typeof insertMfiRegistrationSchema>;

export type Shareholder = typeof shareholders.$inferSelect;
export type InsertShareholder = z.infer<typeof insertShareholderSchema>;

// Multi-tenant Types
export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = z.infer<typeof insertTenantSchema>;

export type UserTenantAccess = typeof userTenantAccess.$inferSelect;
export type InsertUserTenantAccess = z.infer<typeof insertUserTenantAccessSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;

export type LoanProduct = typeof loanProducts.$inferSelect;
export type InsertLoanProduct = z.infer<typeof insertLoanProductSchema>;

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

export type MfiRegistration = typeof mfiRegistration.$inferSelect;
export type InsertMfiRegistration = z.infer<typeof insertMfiRegistrationSchema>;

export type Shareholder = typeof shareholders.$inferSelect;
export type InsertShareholder = z.infer<typeof insertShareholderSchema>;

// Permission System Types
export type Role = typeof roles.$inferSelect;
export type InsertRole = typeof roles.$inferInsert;

export type Permission = typeof permissions.$inferSelect;
export type InsertPermission = typeof permissions.$inferInsert;

export type RolePermission = typeof rolePermissions.$inferSelect;
export type InsertRolePermission = typeof rolePermissions.$inferInsert;

export type UserRole = typeof userRoles.$inferSelect;
export type InsertUserRole = typeof userRoles.$inferInsert;

// Tenant Context Types for Multi-tenant Operations
export type TenantContext = {
  tenant: Tenant;
  tenantId: string;
  slug: string;
};

// Extended JWT payload for multi-tenant authentication
export type JwtPayload = {
  id: number;
  username: string;
  email: string;
  role: string;
  tenantId: string;
  isSuperAdmin?: boolean;
  roleId?: number;
  hierarchyLevel?: number;
  permissions?: string[];
};
