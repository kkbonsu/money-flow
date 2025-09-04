import { pgTable, index, foreignKey, pgPolicy, serial, text, numeric, timestamp, varchar, integer, unique, date, boolean, jsonb, bigint, pgView } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const assets = pgTable("assets", {
	id: serial().primaryKey().notNull(),
	assetName: text("asset_name").notNull(),
	category: text().notNull(),
	value: numeric({ precision: 15, scale:  2 }).notNull(),
	depreciationRate: numeric("depreciation_rate", { precision: 5, scale:  2 }),
	purchaseDate: timestamp("purchase_date", { mode: 'string' }).notNull(),
	status: text().default('active').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	tenantId: varchar("tenant_id"),
}, (table) => [
	index("idx_assets_tenant_id").using("btree", table.tenantId.asc().nullsLast().op("text_ops")),
	index("idx_assets_tenant_status").using("btree", table.tenantId.asc().nullsLast().op("text_ops"), table.status.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "fk_assets_tenant_id"
		}).onDelete("cascade"),
	pgPolicy("tenant_isolation_assets", { as: "permissive", for: "all", to: ["public"], using: sql`((tenant_id)::text = current_setting('app.current_tenant_id'::text, true))` }),
]);

export const bankManagement = pgTable("bank_management", {
	id: serial().primaryKey().notNull(),
	bankName: text("bank_name").notNull(),
	accountNumber: text("account_number").notNull(),
	accountType: text("account_type").notNull(),
	balance: numeric({ precision: 15, scale:  2 }).notNull(),
	status: text().default('active').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	tenantId: varchar("tenant_id"),
}, (table) => [
	index("idx_bank_management_tenant_id").using("btree", table.tenantId.asc().nullsLast().op("text_ops")),
	index("idx_bank_management_tenant_status").using("btree", table.tenantId.asc().nullsLast().op("text_ops"), table.status.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "fk_bank_management_tenant_id"
		}).onDelete("cascade"),
	pgPolicy("tenant_isolation_bank_management", { as: "permissive", for: "all", to: ["public"], using: sql`((tenant_id)::text = current_setting('app.current_tenant_id'::text, true))` }),
]);

export const paymentSchedules = pgTable("payment_schedules", {
	id: serial().primaryKey().notNull(),
	loanId: integer("loan_id"),
	dueDate: timestamp("due_date", { mode: 'string' }).notNull(),
	amount: numeric({ precision: 15, scale:  2 }).notNull(),
	principalAmount: numeric("principal_amount", { precision: 15, scale:  2 }).notNull(),
	interestAmount: numeric("interest_amount", { precision: 15, scale:  2 }).notNull(),
	status: text().default('pending').notNull(),
	paidDate: timestamp("paid_date", { mode: 'string' }),
	paidAmount: numeric("paid_amount", { precision: 15, scale:  2 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	tenantId: varchar("tenant_id"),
}, (table) => [
	index("idx_payment_schedules_due_date").using("btree", table.dueDate.asc().nullsLast().op("timestamp_ops")),
	index("idx_payment_schedules_loan_id").using("btree", table.loanId.asc().nullsLast().op("int4_ops")),
	index("idx_payment_schedules_loan_id_status").using("btree", table.loanId.asc().nullsLast().op("int4_ops"), table.status.asc().nullsLast().op("int4_ops")),
	index("idx_payment_schedules_paid_date").using("btree", table.paidDate.desc().nullsFirst().op("timestamp_ops")),
	index("idx_payment_schedules_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("idx_payment_schedules_tenant_id").using("btree", table.tenantId.asc().nullsLast().op("text_ops")),
	index("idx_payment_schedules_tenant_status").using("btree", table.tenantId.asc().nullsLast().op("text_ops"), table.status.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.loanId],
			foreignColumns: [loanBooks.id],
			name: "payment_schedules_loan_id_loan_books_id_fk"
		}),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "fk_payment_schedules_tenant_id"
		}).onDelete("cascade"),
	pgPolicy("tenant_isolation_payment_schedules", { as: "permissive", for: "all", to: ["public"], using: sql`((tenant_id)::text = current_setting('app.current_tenant_id'::text, true))` }),
]);

export const liabilities = pgTable("liabilities", {
	id: serial().primaryKey().notNull(),
	liabilityName: text("liability_name").notNull(),
	amount: numeric({ precision: 15, scale:  2 }).notNull(),
	dueDate: timestamp("due_date", { mode: 'string' }),
	status: text().default('pending').notNull(),
	creditor: text(),
	interestRate: numeric("interest_rate", { precision: 5, scale:  2 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	tenantId: varchar("tenant_id"),
}, (table) => [
	index("idx_liabilities_tenant_id").using("btree", table.tenantId.asc().nullsLast().op("text_ops")),
	index("idx_liabilities_tenant_status").using("btree", table.tenantId.asc().nullsLast().op("text_ops"), table.status.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "fk_liabilities_tenant_id"
		}).onDelete("cascade"),
	pgPolicy("tenant_isolation_liabilities", { as: "permissive", for: "all", to: ["public"], using: sql`((tenant_id)::text = current_setting('app.current_tenant_id'::text, true))` }),
]);

export const equity = pgTable("equity", {
	id: serial().primaryKey().notNull(),
	equityType: text("equity_type").notNull(),
	amount: numeric({ precision: 15, scale:  2 }).notNull(),
	date: timestamp({ mode: 'string' }).notNull(),
	description: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	tenantId: varchar("tenant_id"),
}, (table) => [
	index("idx_equity_tenant_date").using("btree", table.tenantId.asc().nullsLast().op("text_ops"), table.date.asc().nullsLast().op("text_ops")),
	index("idx_equity_tenant_id").using("btree", table.tenantId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "fk_equity_tenant_id"
		}).onDelete("cascade"),
	pgPolicy("tenant_isolation_equity", { as: "permissive", for: "all", to: ["public"], using: sql`((tenant_id)::text = current_setting('app.current_tenant_id'::text, true))` }),
]);

export const expenses = pgTable("expenses", {
	id: serial().primaryKey().notNull(),
	category: text().notNull(),
	amount: numeric({ precision: 15, scale:  2 }).notNull(),
	description: text(),
	date: timestamp({ mode: 'string' }).notNull(),
	paymentMethod: text("payment_method"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	vendor: text(),
	tenantId: varchar("tenant_id"),
}, (table) => [
	index("idx_expenses_date").using("btree", table.date.desc().nullsFirst().op("timestamp_ops")),
	index("idx_expenses_tenant_id").using("btree", table.tenantId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "fk_expenses_tenant_id"
		}).onDelete("cascade"),
	pgPolicy("tenant_isolation_expenses", { as: "permissive", for: "all", to: ["public"], using: sql`((tenant_id)::text = current_setting('app.current_tenant_id'::text, true))` }),
]);

export const incomeManagement = pgTable("income_management", {
	id: serial().primaryKey().notNull(),
	source: text().notNull(),
	amount: numeric({ precision: 15, scale:  2 }).notNull(),
	description: text(),
	date: timestamp({ mode: 'string' }).notNull(),
	category: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	tenantId: varchar("tenant_id"),
}, (table) => [
	index("idx_income_management_date").using("btree", table.date.desc().nullsFirst().op("timestamp_ops")),
	index("idx_income_management_tenant_id").using("btree", table.tenantId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "fk_income_management_tenant_id"
		}).onDelete("cascade"),
	pgPolicy("tenant_isolation_income_management", { as: "permissive", for: "all", to: ["public"], using: sql`((tenant_id)::text = current_setting('app.current_tenant_id'::text, true))` }),
]);

export const userAuditLogs = pgTable("user_audit_logs", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id"),
	action: text().notNull(),
	description: text(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	timestamp: timestamp({ mode: 'string' }).defaultNow(),
	tenantId: varchar("tenant_id"),
}, (table) => [
	index("idx_user_audit_logs_tenant_id").using("btree", table.tenantId.asc().nullsLast().op("text_ops")),
	index("idx_user_audit_logs_tenant_timestamp").using("btree", table.tenantId.asc().nullsLast().op("text_ops"), table.timestamp.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_audit_logs_user_id_fkey"
		}),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "fk_user_audit_logs_tenant_id"
		}).onDelete("cascade"),
	pgPolicy("tenant_isolation_user_audit_logs", { as: "permissive", for: "all", to: ["public"], using: sql`((tenant_id)::text = current_setting('app.current_tenant_id'::text, true))` }),
]);

export const reports = pgTable("reports", {
	id: serial().primaryKey().notNull(),
	reportType: text("report_type").notNull(),
	title: text().notNull(),
	content: text(),
	generatedBy: integer("generated_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	tenantId: varchar("tenant_id"),
}, (table) => [
	index("idx_reports_tenant_id").using("btree", table.tenantId.asc().nullsLast().op("text_ops")),
	index("idx_reports_tenant_type").using("btree", table.tenantId.asc().nullsLast().op("text_ops"), table.reportType.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.generatedBy],
			foreignColumns: [users.id],
			name: "reports_generated_by_users_id_fk"
		}),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "fk_reports_tenant_id"
		}).onDelete("cascade"),
	pgPolicy("tenant_isolation_reports", { as: "permissive", for: "all", to: ["public"], using: sql`((tenant_id)::text = current_setting('app.current_tenant_id'::text, true))` }),
]);

export const mfiRegistration = pgTable("mfi_registration", {
	id: serial().primaryKey().notNull(),
	companyName: varchar("company_name").notNull(),
	registrationNumber: varchar("registration_number").notNull(),
	licenseExpiryDate: date("license_expiry_date"),
	registeredAddress: text("registered_address").notNull(),
	contactPhone: varchar("contact_phone"),
	contactEmail: varchar("contact_email"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	certificateOfIncorporation: text("certificate_of_incorporation"),
	taxClearanceCertificate: text("tax_clearance_certificate"),
	physicalAddress: text("physical_address"),
	paidUpCapital: numeric("paid_up_capital", { precision: 15, scale:  2 }),
	minimumCapitalRequired: numeric("minimum_capital_required", { precision: 15, scale:  2 }).default('2000000.00'),
	bogLicenseNumber: text("bog_license_number"),
	isActive: boolean("is_active").default(true),
	tenantId: varchar("tenant_id"),
}, (table) => [
	index("idx_mfi_registration_tenant_active").using("btree", table.tenantId.asc().nullsLast().op("text_ops"), table.isActive.asc().nullsLast().op("text_ops")),
	index("idx_mfi_registration_tenant_id").using("btree", table.tenantId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "fk_mfi_registration_tenant_id"
		}).onDelete("cascade"),
	unique("mfi_registration_registration_number_key").on(table.registrationNumber),
	pgPolicy("tenant_isolation_mfi_registration", { as: "permissive", for: "all", to: ["public"], using: sql`((tenant_id)::text = current_setting('app.current_tenant_id'::text, true))` }),
]);

export const shareholders = pgTable("shareholders", {
	id: serial().primaryKey().notNull(),
	shareholderType: varchar("shareholder_type").default('local').notNull(),
	name: varchar().notNull(),
	nationality: varchar().notNull(),
	idType: varchar("id_type").default('ghana_card').notNull(),
	idNumber: varchar("id_number").notNull(),
	address: text().notNull(),
	contactPhone: varchar("contact_phone"),
	contactEmail: varchar("contact_email"),
	sharesOwned: integer("shares_owned").notNull(),
	sharePercentage: numeric("share_percentage", { precision: 5, scale:  2 }).notNull(),
	investmentAmount: numeric("investment_amount", { precision: 15, scale:  2 }).notNull(),
	investmentCurrency: varchar("investment_currency").default('GHS'),
	gipcCertificate: text("gipc_certificate"),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	tenantId: varchar("tenant_id"),
}, (table) => [
	index("idx_shareholders_tenant_active").using("btree", table.tenantId.asc().nullsLast().op("text_ops"), table.isActive.asc().nullsLast().op("text_ops")),
	index("idx_shareholders_tenant_id").using("btree", table.tenantId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "fk_shareholders_tenant_id"
		}).onDelete("cascade"),
	pgPolicy("tenant_isolation_shareholders", { as: "permissive", for: "all", to: ["public"], using: sql`((tenant_id)::text = current_setting('app.current_tenant_id'::text, true))` }),
]);

export const tenants = pgTable("tenants", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	name: varchar().notNull(),
	slug: varchar().notNull(),
	settings: jsonb().default({}),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("tenants_slug_key").on(table.slug),
]);

export const userTenantAccess = pgTable("user_tenant_access", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	tenantId: varchar("tenant_id").notNull(),
	role: varchar().default('user'),
	permissions: text().array(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "user_tenant_access_tenant_id_fkey"
		}).onDelete("cascade"),
]);

export const staff = pgTable("staff", {
	id: serial().primaryKey().notNull(),
	firstName: text("first_name").notNull(),
	lastName: text("last_name").notNull(),
	email: text().notNull(),
	phone: text().notNull(),
	position: text().notNull(),
	salary: numeric({ precision: 15, scale:  2 }),
	hireDate: timestamp("hire_date", { mode: 'string' }).notNull(),
	status: text().default('active').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	tenantId: varchar("tenant_id"),
}, (table) => [
	index("idx_staff_tenant_id").using("btree", table.tenantId.asc().nullsLast().op("text_ops")),
	index("idx_staff_tenant_status").using("btree", table.tenantId.asc().nullsLast().op("text_ops"), table.status.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "fk_staff_tenant_id"
		}).onDelete("cascade"),
	unique("staff_email_unique").on(table.email),
	pgPolicy("tenant_isolation_staff", { as: "permissive", for: "all", to: ["public"], using: sql`((tenant_id)::text = current_setting('app.current_tenant_id'::text, true))` }),
]);

export const rolePermissions = pgTable("role_permissions", {
	id: serial().primaryKey().notNull(),
	roleId: integer("role_id").notNull(),
	permissionId: integer("permission_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.roleId],
			foreignColumns: [roles.id],
			name: "role_permissions_role_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.permissionId],
			foreignColumns: [permissions.id],
			name: "role_permissions_permission_id_fkey"
		}).onDelete("cascade"),
	unique("role_permissions_role_id_permission_id_key").on(table.roleId, table.permissionId),
]);

export const permissions = pgTable("permissions", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	category: text().notNull(),
	description: text(),
	resource: text().notNull(),
	action: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("permissions_name_key").on(table.name),
]);

export const customers = pgTable("customers", {
	id: serial().primaryKey().notNull(),
	firstName: text("first_name").notNull(),
	lastName: text("last_name").notNull(),
	email: text().notNull(),
	phone: text().notNull(),
	address: text().notNull(),
	nationalId: text("national_id"),
	creditScore: integer("credit_score"),
	status: text().default('active').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	password: text(),
	isPortalActive: boolean("is_portal_active").default(false),
	lastPortalLogin: timestamp("last_portal_login", { mode: 'string' }),
	tenantId: varchar("tenant_id"),
}, (table) => [
	index("idx_customers_email").using("btree", table.email.asc().nullsLast().op("text_ops")),
	index("idx_customers_tenant_id").using("btree", table.tenantId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "fk_customers_tenant_id"
		}).onDelete("cascade"),
	unique("customers_email_unique").on(table.email),
	pgPolicy("tenant_isolation_customers", { as: "permissive", for: "all", to: ["public"], using: sql`((tenant_id)::text = current_setting('app.current_tenant_id'::text, true))` }),
]);

export const loanBooks = pgTable("loan_books", {
	id: serial().primaryKey().notNull(),
	customerId: integer("customer_id"),
	loanAmount: numeric("loan_amount", { precision: 15, scale:  2 }).notNull(),
	interestRate: numeric("interest_rate", { precision: 5, scale:  2 }).notNull(),
	term: integer().notNull(),
	status: text().default('pending').notNull(),
	approvedBy: integer("approved_by"),
	disbursedAmount: numeric("disbursed_amount", { precision: 15, scale:  2 }),
	outstandingBalance: numeric("outstanding_balance", { precision: 15, scale:  2 }),
	startDate: timestamp("start_date", { mode: 'string' }),
	endDate: timestamp("end_date", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	purpose: text(),
	dateApplied: timestamp("date_applied", { mode: 'string' }),
	loanProductId: integer("loan_product_id"),
	assignedOfficer: integer("assigned_officer"),
	approvalDate: timestamp("approval_date", { mode: 'string' }),
	rejectionReason: text("rejection_reason"),
	disbursedBy: integer("disbursed_by"),
	disbursementDate: timestamp("disbursement_date", { mode: 'string' }),
	notes: text(),
	tenantId: varchar("tenant_id"),
}, (table) => [
	index("idx_loan_books_assigned_officer").using("btree", table.assignedOfficer.asc().nullsLast().op("int4_ops")),
	index("idx_loan_books_created_at").using("btree", table.createdAt.desc().nullsFirst().op("timestamp_ops")),
	index("idx_loan_books_customer_id").using("btree", table.customerId.asc().nullsLast().op("int4_ops")),
	index("idx_loan_books_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("idx_loan_books_tenant_id").using("btree", table.tenantId.asc().nullsLast().op("text_ops")),
	index("idx_loan_books_tenant_status").using("btree", table.tenantId.asc().nullsLast().op("text_ops"), table.status.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.customerId],
			foreignColumns: [customers.id],
			name: "loan_books_customer_id_customers_id_fk"
		}),
	foreignKey({
			columns: [table.approvedBy],
			foreignColumns: [users.id],
			name: "loan_books_approved_by_users_id_fk"
		}),
	foreignKey({
			columns: [table.loanProductId],
			foreignColumns: [loanProducts.id],
			name: "loan_books_loan_product_id_fkey"
		}),
	foreignKey({
			columns: [table.assignedOfficer],
			foreignColumns: [users.id],
			name: "loan_books_assigned_officer_fkey"
		}),
	foreignKey({
			columns: [table.disbursedBy],
			foreignColumns: [users.id],
			name: "loan_books_disbursed_by_fkey"
		}),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "fk_loan_books_tenant_id"
		}).onDelete("cascade"),
	pgPolicy("tenant_isolation_loan_books", { as: "permissive", for: "all", to: ["public"], using: sql`((tenant_id)::text = current_setting('app.current_tenant_id'::text, true))` }),
]);

export const loanProducts = pgTable("loan_products", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	fee: numeric({ precision: 15, scale:  2 }).notNull(),
	description: text(),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	tenantId: varchar("tenant_id"),
}, (table) => [
	index("idx_loan_products_tenant_active").using("btree", table.tenantId.asc().nullsLast().op("text_ops"), table.isActive.asc().nullsLast().op("text_ops")),
	index("idx_loan_products_tenant_id").using("btree", table.tenantId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "fk_loan_products_tenant_id"
		}).onDelete("cascade"),
	pgPolicy("tenant_isolation_loan_products", { as: "permissive", for: "all", to: ["public"], using: sql`((tenant_id)::text = current_setting('app.current_tenant_id'::text, true))` }),
]);

export const pettyCash = pgTable("petty_cash", {
	id: serial().primaryKey().notNull(),
	amount: numeric({ precision: 15, scale:  2 }).notNull(),
	purpose: text().notNull(),
	date: timestamp({ mode: 'string' }).notNull(),
	handledBy: integer("handled_by"),
	status: text().default('pending').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	tenantId: varchar("tenant_id"),
}, (table) => [
	index("idx_petty_cash_tenant_id").using("btree", table.tenantId.asc().nullsLast().op("text_ops")),
	index("idx_petty_cash_tenant_status").using("btree", table.tenantId.asc().nullsLast().op("text_ops"), table.status.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.handledBy],
			foreignColumns: [staff.id],
			name: "petty_cash_handled_by_staff_id_fk"
		}),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "fk_petty_cash_tenant_id"
		}).onDelete("cascade"),
	pgPolicy("tenant_isolation_petty_cash", { as: "permissive", for: "all", to: ["public"], using: sql`((tenant_id)::text = current_setting('app.current_tenant_id'::text, true))` }),
]);

export const rentManagement = pgTable("rent_management", {
	id: serial().primaryKey().notNull(),
	propertyName: text("property_name").notNull(),
	tenantName: text("tenant_name").notNull(),
	monthlyRent: numeric("monthly_rent", { precision: 15, scale:  2 }).notNull(),
	dueDate: timestamp("due_date", { mode: 'string' }).notNull(),
	status: text().default('pending').notNull(),
	paidDate: timestamp("paid_date", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	tenantId: varchar("tenant_id"),
}, (table) => [
	index("idx_rent_management_tenant_id").using("btree", table.tenantId.asc().nullsLast().op("text_ops")),
	index("idx_rent_management_tenant_status").using("btree", table.tenantId.asc().nullsLast().op("text_ops"), table.status.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "fk_rent_management_tenant_id"
		}).onDelete("cascade"),
	pgPolicy("tenant_isolation_rent_management", { as: "permissive", for: "all", to: ["public"], using: sql`((tenant_id)::text = current_setting('app.current_tenant_id'::text, true))` }),
]);

export const userRoles = pgTable("user_roles", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	roleId: integer("role_id").notNull(),
	tenantId: varchar("tenant_id").notNull(),
	assignedBy: integer("assigned_by"),
	assignedAt: timestamp("assigned_at", { mode: 'string' }).defaultNow(),
	isActive: boolean("is_active").default(true),
}, (table) => [
	index("idx_user_roles_tenant_id").using("btree", table.tenantId.asc().nullsLast().op("text_ops")),
	index("idx_user_roles_tenant_user").using("btree", table.tenantId.asc().nullsLast().op("text_ops"), table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_roles_user_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.roleId],
			foreignColumns: [roles.id],
			name: "user_roles_role_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.assignedBy],
			foreignColumns: [users.id],
			name: "user_roles_assigned_by_fkey"
		}),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "fk_user_roles_tenant_id"
		}).onDelete("cascade"),
	unique("user_roles_user_id_tenant_id_key").on(table.userId, table.tenantId),
	pgPolicy("tenant_isolation_user_roles", { as: "permissive", for: "all", to: ["public"], using: sql`((tenant_id)::text = current_setting('app.current_tenant_id'::text, true))` }),
]);

export const roles = pgTable("roles", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	hierarchyLevel: integer("hierarchy_level").notNull(),
	isSystemRole: boolean("is_system_role").default(true),
	tenantId: varchar("tenant_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "fk_roles_tenant_id"
		}).onDelete("cascade"),
	unique("roles_name_tenant_id_key").on(table.name, table.tenantId),
	pgPolicy("tenant_isolation_roles", { as: "permissive", for: "all", to: ["public"], using: sql`((tenant_id)::text = current_setting('app.current_tenant_id'::text, true))` }),
]);

export const users = pgTable("users", {
	id: serial().primaryKey().notNull(),
	username: text().notNull(),
	password: text().notNull(),
	email: text().notNull(),
	role: text().default('user').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	profilePicture: text("profile_picture"),
	firstName: text("first_name"),
	lastName: text("last_name"),
	phone: text(),
	lastLogin: timestamp("last_login", { mode: 'string' }),
	isActive: boolean("is_active").default(true),
	tenantId: varchar("tenant_id"),
	isSuperAdmin: boolean("is_super_admin").default(false),
}, (table) => [
	index("idx_users_email").using("btree", table.email.asc().nullsLast().op("text_ops")),
	index("idx_users_tenant_id").using("btree", table.tenantId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "fk_users_tenant_id"
		}).onDelete("cascade"),
	unique("users_username_unique").on(table.username),
	unique("users_email_unique").on(table.email),
	pgPolicy("tenant_isolation_users", { as: "permissive", for: "all", to: ["public"], using: sql`((tenant_id)::text = current_setting('app.current_tenant_id'::text, true))` }),
]);

export const inventory = pgTable("inventory", {
	id: serial().primaryKey().notNull(),
	itemName: text("item_name").notNull(),
	category: text().notNull(),
	quantity: integer().notNull(),
	unitPrice: numeric("unit_price", { precision: 15, scale:  2 }).notNull(),
	totalValue: numeric("total_value", { precision: 15, scale:  2 }).notNull(),
	supplier: text(),
	lastUpdated: timestamp("last_updated", { mode: 'string' }).defaultNow(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	tenantId: varchar("tenant_id"),
	status: text().default('in_stock').notNull(),
	description: text(),
}, (table) => [
	index("idx_inventory_tenant_id").using("btree", table.tenantId.asc().nullsLast().op("text_ops")),
	index("idx_inventory_tenant_status").using("btree", table.tenantId.asc().nullsLast().op("text_ops"), table.status.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.tenantId],
			foreignColumns: [tenants.id],
			name: "fk_inventory_tenant_id"
		}).onDelete("cascade"),
	pgPolicy("tenant_isolation_inventory", { as: "permissive", for: "all", to: ["public"], using: sql`((tenant_id)::text = current_setting('app.current_tenant_id'::text, true))` }),
]);

export const backupMetadata = pgTable("backup_metadata", {
	id: serial().primaryKey().notNull(),
	backupType: varchar("backup_type", { length: 50 }).notNull(),
	tenantId: varchar("tenant_id"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	backupSizeBytes: bigint("backup_size_bytes", { mode: "number" }),
	backupLocation: text("backup_location").notNull(),
	backupStatus: varchar("backup_status", { length: 20 }).default('in_progress'),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	checksum: varchar({ length: 64 }),
	notes: text(),
});

export const databaseHealthMetrics = pgTable("database_health_metrics", {
	id: serial().primaryKey().notNull(),
	metricName: varchar("metric_name", { length: 100 }).notNull(),
	metricValue: numeric("metric_value"),
	tenantId: varchar("tenant_id"),
	measurementTime: timestamp("measurement_time", { mode: 'string' }).defaultNow(),
	thresholdMin: numeric("threshold_min"),
	thresholdMax: numeric("threshold_max"),
	alertLevel: varchar("alert_level", { length: 20 }).default('info'),
	notes: text(),
}, (table) => [
	index("idx_health_metrics_tenant").using("btree", table.tenantId.asc().nullsLast().op("text_ops"), table.measurementTime.desc().nullsFirst().op("text_ops")),
	index("idx_health_metrics_time").using("btree", table.measurementTime.desc().nullsFirst().op("timestamp_ops")),
]);

export const dataRetentionPolicies = pgTable("data_retention_policies", {
	id: serial().primaryKey().notNull(),
	tableName: varchar("table_name", { length: 100 }).notNull(),
	retentionDays: integer("retention_days").notNull(),
	retentionCondition: text("retention_condition"),
	archiveBeforeDelete: boolean("archive_before_delete").default(true),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	lastExecuted: timestamp("last_executed", { mode: 'string' }),
	notes: text(),
});

export const databaseMigrations = pgTable("database_migrations", {
	id: serial().primaryKey().notNull(),
	migrationName: varchar("migration_name", { length: 255 }).notNull(),
	migrationVersion: varchar("migration_version", { length: 50 }),
	executedAt: timestamp("executed_at", { mode: 'string' }).defaultNow(),
	executionTimeMs: integer("execution_time_ms"),
	rollbackSql: text("rollback_sql"),
	notes: text(),
	executedBy: varchar("executed_by", { length: 100 }).default(CURRENT_USER),
}, (table) => [
	unique("database_migrations_migration_name_key").on(table.migrationName),
]);

export const productionAlerts = pgTable("production_alerts", {
	id: serial().primaryKey().notNull(),
	alertType: varchar("alert_type", { length: 50 }).notNull(),
	severity: varchar({ length: 20 }).notNull(),
	alertMessage: text("alert_message").notNull(),
	tenantId: varchar("tenant_id"),
	tableAffected: varchar("table_affected", { length: 100 }),
	metricValue: numeric("metric_value"),
	thresholdBreached: numeric("threshold_breached"),
	isResolved: boolean("is_resolved").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	resolvedAt: timestamp("resolved_at", { mode: 'string' }),
	resolvedBy: varchar("resolved_by", { length: 100 }),
	resolutionNotes: text("resolution_notes"),
}, (table) => [
	index("idx_production_alerts_severity").using("btree", table.severity.asc().nullsLast().op("text_ops"), table.createdAt.desc().nullsFirst().op("text_ops")),
	index("idx_production_alerts_unresolved").using("btree", table.createdAt.desc().nullsFirst().op("timestamp_ops")).where(sql`(is_resolved = false)`),
]);

export const supportMessages = pgTable("support_messages", {
	id: serial().primaryKey().notNull(),
	tenantId: varchar("tenant_id").notNull(),
	ticketId: integer("ticket_id").notNull(),
	senderType: varchar("sender_type").notNull(),
	senderId: integer("sender_id"),
	message: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.ticketId],
			foreignColumns: [supportTickets.id],
			name: "support_messages_ticket_id_fkey"
		}).onDelete("cascade"),
]);

export const supportTickets = pgTable("support_tickets", {
	id: serial().primaryKey().notNull(),
	tenantId: varchar("tenant_id").notNull(),
	customerId: integer("customer_id"),
	title: varchar().notNull(),
	description: text(),
	status: varchar().default('open').notNull(),
	priority: varchar().default('medium').notNull(),
	category: varchar(),
	assignedTo: integer("assigned_to"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	customerEmail: varchar("customer_email"),
	customerPhone: varchar("customer_phone"),
	resolution: text(),
	resolvedAt: timestamp("resolved_at", { mode: 'string' }),
});
export const connectionPoolStatus = pgView("connection_pool_status", {	metric: text(),
	currentValue: text("current_value"),
	recommendation: text(),
}).as(sql`SELECT 'total_connections'::text AS metric, count(*)::text AS current_value, CASE WHEN count(*) > 100 THEN 'Verify connection pooling configuration'::text ELSE 'Connection count normal'::text END AS recommendation FROM pg_stat_activity WHERE pg_stat_activity.state IS NOT NULL UNION ALL SELECT 'idle_connections'::text AS metric, count(*)::text AS current_value, CASE WHEN count(*) > 50 THEN 'Consider reducing idle connection timeout'::text ELSE 'Idle connection count normal'::text END AS recommendation FROM pg_stat_activity WHERE pg_stat_activity.state = 'idle'::text UNION ALL SELECT 'active_connections'::text AS metric, count(*)::text AS current_value, CASE WHEN count(*) > 25 THEN 'High active connection count - monitor performance'::text ELSE 'Active connection count normal'::text END AS recommendation FROM pg_stat_activity WHERE pg_stat_activity.state = 'active'::text`);