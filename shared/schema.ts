import { pgTable, text, serial, integer, boolean, timestamp, decimal, varchar, date, uuid, jsonb, unique } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Organizations - Replacing tenants for cleaner architecture
export const organizations = pgTable("organizations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  code: varchar("code").notNull().unique(), // "ABC-MFI-001"
  type: varchar("type").default("multi_branch"), // single_branch, multi_branch
  settings: jsonb("settings").default({
    branding: { logo: null, primaryColor: "#2563eb", secondaryColor: "#64748b" },
    features: ["loans", "savings", "payments", "analytics"],
    defaults: { currency: "GHS", locale: "en-GH", timezone: "Africa/Accra" }
  }),
  subscription: jsonb("subscription").default({
    plan: "professional",
    limits: { branches: 10, users: 100, loans: 10000, storage: 1024 }
  }),
  status: varchar("status").default("active"), // active, suspended, trial
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Branches within organizations
export const branches = pgTable("branches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(), // "Main Branch", "Kumasi Branch"
  code: varchar("code").notNull(), // "MAIN", "KUM01"
  type: varchar("type").default("branch"), // headquarters, branch, sub_branch, outlet
  parentBranchId: varchar("parent_branch_id").references(() => branches.id), // For hierarchical branches
  
  // Location & Contact
  address: jsonb("address").default({
    street: "", city: "", region: "", country: "Ghana", postalCode: ""
  }),
  contact: jsonb("contact").default({
    phone: "", email: "", fax: "", operatingHours: {}
  }),
  
  // Management
  managerUserId: integer("manager_user_id").references(() => users.id),
  settings: jsonb("settings").default({}),
  
  // Status
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueOrgBranch: unique().on(table.organizationId, table.code),
}));

// User-Branch Access (many-to-many) - Users can work at multiple branches
export const userBranchAccess = pgTable("user_branch_access", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  branchId: varchar("branch_id").notNull().references(() => branches.id, { onDelete: "cascade" }),
  
  // Branch-specific role (can override organization role)
  branchRole: varchar("branch_role"), // null = use org role, or specific: manager, user, viewer
  
  // Branch-specific permissions
  permissions: jsonb("permissions").default([]),
  
  // Access control flags
  canView: boolean("can_view").default(true),
  canCreate: boolean("can_create").default(true),
  canEdit: boolean("can_edit").default(true),
  canDelete: boolean("can_delete").default(false),
  canApprove: boolean("can_approve").default(false),
  
  // Metadata
  assignedBy: integer("assigned_by").references(() => users.id),
  assignedAt: timestamp("assigned_at").defaultNow(),
  isActive: boolean("is_active").default(true),
}, (table) => ({
  uniqueUserBranch: unique().on(table.userId, table.branchId),
}));

// Tenants collection - LEGACY (will be migrated to organizations)
export const tenants = pgTable("tenants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  slug: varchar("slug").notNull().unique(),
  settings: jsonb("settings").default({}),
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
  tenantId: uuid("tenant_id").references(() => tenants.id), // null for system-wide roles
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
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  assignedBy: integer("assigned_by").references(() => users.id),
  assignedAt: timestamp("assigned_at").defaultNow(),
  isActive: boolean("is_active").default(true),
}, (table) => ({
  uniqueUserTenantRole: unique().on(table.userId, table.tenantId), // One role per user per tenant
}));

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(), // Legacy field - will be removed
  
  // Organization assignment (single organization per user)
  organizationId: varchar("organization_id").references(() => organizations.id),
  primaryBranchId: varchar("primary_branch_id").references(() => branches.id),
  
  username: text("username").notNull(),
  password: text("password").notNull(),
  email: text("email").notNull(),
  role: text("role").notNull().default("user"), // Organization-wide role
  profilePicture: text("profile_picture"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  phone: text("phone"),
  lastLogin: timestamp("last_login"),
  isActive: boolean("is_active").default(true),
  isSystemAdmin: boolean("is_super_admin").default(false), // System-wide admin
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
  organizationId: varchar("organization_id").references(() => organizations.id),
  branchId: varchar("branch_id").references(() => branches.id),
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
  organizationId: varchar("organization_id").references(() => organizations.id),
  branchId: varchar("branch_id").references(() => branches.id),
  originatingBranchId: varchar("originating_branch_id").references(() => branches.id),
  servicingBranchId: varchar("servicing_branch_id").references(() => branches.id),
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
  organizationId: varchar("organization_id").references(() => organizations.id),
  branchId: varchar("branch_id").references(() => branches.id),
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
  organizationId: varchar("organization_id").references(() => organizations.id),
  branchId: varchar("branch_id").references(() => branches.id),
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
  organizationId: varchar("organization_id").references(() => organizations.id),
  branchId: varchar("branch_id").references(() => branches.id),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  category: text("category").notNull(),
  vendor: text("vendor"),
  date: text("date").notNull(),
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
  collateral: many(collateral),
  educationContent: many(educationContent),
  borrowerFeedback: many(borrowerFeedback),
  debtCollectionActivities: many(debtCollectionActivities),
  supportTickets: many(supportTickets),
  supportMessages: many(supportMessages),
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
    relationName: "userRoles"
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
    relationName: "assignedByUser"
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
  userRoles: many(userRoles, { relationName: "userRoles" }),
  assignedUserRoles: many(userRoles, { relationName: "assignedByUser" }),
  generatedReports: many(reports, { relationName: "generatedBy" }),
  assignedFeedback: many(borrowerFeedback, { relationName: "assignedTo" }),
  performedDebtCollection: many(debtCollectionActivities, { relationName: "performedBy" }),
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
  loans: many(loanBooks, { relationName: "customerLoans" }),
  borrowerFeedback: many(borrowerFeedback, { relationName: "customerFeedback" }),
  debtCollectionActivities: many(debtCollectionActivities, { relationName: "customerDebtCollection" }),
}));

export const loanProductsRelations = relations(loanProducts, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [loanProducts.tenantId],
    references: [tenants.id],
  }),
  loans: many(loanBooks, { relationName: "productLoans" }),
}));

export const loanBooksRelations = relations(loanBooks, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [loanBooks.tenantId],
    references: [tenants.id],
  }),
  customer: one(customers, {
    fields: [loanBooks.customerId],
    references: [customers.id],
    relationName: "customerLoans"
  }),
  loanProduct: one(loanProducts, {
    fields: [loanBooks.loanProductId],
    references: [loanProducts.id],
    relationName: "productLoans"
  }),
  assignedOfficer: one(users, {
    fields: [loanBooks.assignedOfficer],
    references: [users.id],
    relationName: "assignedOfficer"
  }),
  approver: one(users, {
    fields: [loanBooks.approvedBy],
    references: [users.id],
    relationName: "approver"
  }),
  disburser: one(users, {
    fields: [loanBooks.disbursedBy],
    references: [users.id],
    relationName: "disburser"
  }),
  paymentSchedules: many(paymentSchedules),
  collateral: many(collateral),
  borrowerFeedback: many(borrowerFeedback, { relationName: "loanFeedback" }),
  debtCollectionActivities: many(debtCollectionActivities, { relationName: "loanDebtCollection" }),
}));

export const paymentSchedulesRelations = relations(paymentSchedules, ({ one }) => ({
  tenant: one(tenants, {
    fields: [paymentSchedules.tenantId],
    references: [tenants.id],
  }),
  loan: one(loanBooks, {
    fields: [paymentSchedules.loanId],
    references: [loanBooks.id],
  }),
}));

export const staffRelations = relations(staff, ({ one }) => ({
  tenant: one(tenants, {
    fields: [staff.tenantId],
    references: [tenants.id],
  }),
}));



export const incomeManagementRelations = relations(incomeManagement, ({ one }) => ({
  tenant: one(tenants, {
    fields: [incomeManagement.tenantId],
    references: [tenants.id],
  }),
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
  tenant: one(tenants, {
    fields: [expenses.tenantId],
    references: [tenants.id],
  }),
}));


export const inventoryRelations = relations(inventory, ({ one }) => ({
  tenant: one(tenants, {
    fields: [inventory.tenantId],
    references: [tenants.id],
  }),
}));


export const assetsRelations = relations(assets, ({ one }) => ({
  tenant: one(tenants, {
    fields: [assets.tenantId],
    references: [tenants.id],
  }),
}));

export const liabilitiesRelations = relations(liabilities, ({ one }) => ({
  tenant: one(tenants, {
    fields: [liabilities.tenantId],
    references: [tenants.id],
  }),
}));

export const equityRelations = relations(equity, ({ one }) => ({
  tenant: one(tenants, {
    fields: [equity.tenantId],
    references: [tenants.id],
  }),
}));

export const userAuditLogsRelations = relations(userAuditLogs, ({ one }) => ({
  tenant: one(tenants, {
    fields: [userAuditLogs.tenantId],
    references: [tenants.id],
  }),
  user: one(users, {
    fields: [userAuditLogs.userId],
    references: [users.id],
  }),
}));

export const reportsRelations = relations(reports, ({ one }) => ({
  tenant: one(tenants, {
    fields: [reports.tenantId],
    references: [tenants.id],
  }),
  generatedBy: one(users, {
    fields: [reports.generatedBy],
    references: [users.id],
    relationName: "generatedBy"
  }),
}));

export const mfiRegistrationRelations = relations(mfiRegistration, ({ one }) => ({
  tenant: one(tenants, {
    fields: [mfiRegistration.tenantId],
    references: [tenants.id],
  }),
}));

export const shareholdersRelations = relations(shareholders, ({ one }) => ({
  tenant: one(tenants, {
    fields: [shareholders.tenantId],
    references: [tenants.id],
  }),
}));

// Add relations for remaining tables that have foreign keys
export const collateralRelations = relations(collateral, ({ one }) => ({
  tenant: one(tenants, {
    fields: [collateral.tenantId],
    references: [tenants.id],
  }),
  loan: one(loanBooks, {
    fields: [collateral.loanId],
    references: [loanBooks.id],
  }),
}));

export const educationContentRelations = relations(educationContent, ({ one }) => ({
  tenant: one(tenants, {
    fields: [educationContent.tenantId],
    references: [tenants.id],
  }),
}));

export const borrowerFeedbackRelations = relations(borrowerFeedback, ({ one }) => ({
  tenant: one(tenants, {
    fields: [borrowerFeedback.tenantId],
    references: [tenants.id],
  }),
  customer: one(customers, {
    fields: [borrowerFeedback.customerId],
    references: [customers.id],
    relationName: "customerFeedback"
  }),
  loan: one(loanBooks, {
    fields: [borrowerFeedback.loanId],
    references: [loanBooks.id],
    relationName: "loanFeedback"
  }),
  assignedTo: one(users, {
    fields: [borrowerFeedback.assignedTo],
    references: [users.id],
    relationName: "assignedTo"
  }),
}));

export const debtCollectionActivitiesRelations = relations(debtCollectionActivities, ({ one }) => ({
  tenant: one(tenants, {
    fields: [debtCollectionActivities.tenantId],
    references: [tenants.id],
  }),
  loan: one(loanBooks, {
    fields: [debtCollectionActivities.loanId],
    references: [loanBooks.id],
    relationName: "loanDebtCollection"
  }),
  customer: one(customers, {
    fields: [debtCollectionActivities.customerId],
    references: [customers.id],
    relationName: "customerDebtCollection"
  }),
  performedBy: one(users, {
    fields: [debtCollectionActivities.performedBy],
    references: [users.id],
    relationName: "performedBy"
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


export const insertInventorySchema = createInsertSchema(inventory).omit({
  id: true,
  tenantId: true, // Injected by middleware
  createdAt: true,
}).extend({
  unitPrice: z.union([z.string(), z.number()]).transform((val) => val.toString()),
  totalValue: z.union([z.string(), z.number()]).transform((val) => val.toString()),
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

// Permission System Insert Schemas
export const insertRoleSchema = createInsertSchema(roles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPermissionSchema = createInsertSchema(permissions).omit({
  id: true,
  createdAt: true,
});

export const insertRolePermissionSchema = createInsertSchema(rolePermissions).omit({
  id: true,
  createdAt: true,
});

export const insertUserRoleSchema = createInsertSchema(userRoles).omit({
  id: true,
  assignedAt: true,
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


export type Inventory = typeof inventory.$inferSelect;
export type InsertInventory = z.infer<typeof insertInventorySchema>;


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

export type LoanProduct = typeof loanProducts.$inferSelect;
export type InsertLoanProduct = z.infer<typeof insertLoanProductSchema>;

// Multi-tenant Types  
export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = z.infer<typeof insertTenantSchema>;

export type UserTenantAccess = typeof userTenantAccess.$inferSelect;
export type InsertUserTenantAccess = z.infer<typeof insertUserTenantAccessSchema>;

// Removed duplicate type definitions - already defined above

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

// Support Ticket system for customer support
export const supportTickets = pgTable("support_tickets", {
  id: serial("id").primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  customerId: integer("customer_id").references(() => customers.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull().default("open"), // open, in_progress, resolved, closed
  priority: text("priority").notNull().default("medium"), // low, medium, high, urgent
  category: text("category").notNull().default("general"), // general, loan, payment, technical
  assignedTo: integer("assigned_to").references(() => users.id),
  customerEmail: text("customer_email"),
  customerPhone: text("customer_phone"),
  resolution: text("resolution"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const supportMessages = pgTable("support_messages", {
  id: serial("id").primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  ticketId: integer("ticket_id").notNull().references(() => supportTickets.id, { onDelete: "cascade" }),
  senderId: integer("sender_id"), // Could be customer or staff user
  senderType: text("sender_type").notNull(), // "customer" or "staff"
  message: text("message").notNull(),
  attachments: text("attachments").array(), // Array of file URLs
  isInternal: boolean("is_internal").default(false), // Internal staff notes
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSupportTicketSchema = createInsertSchema(supportTickets);
export const insertSupportMessageSchema = createInsertSchema(supportMessages);

export type SupportTicket = typeof supportTickets.$inferSelect;
export type InsertSupportTicket = z.infer<typeof insertSupportTicketSchema>;
export type SupportMessage = typeof supportMessages.$inferSelect;
export type InsertSupportMessage = z.infer<typeof insertSupportMessageSchema>;
