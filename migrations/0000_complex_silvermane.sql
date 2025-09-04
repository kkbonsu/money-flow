-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE "assets" (
	"id" serial PRIMARY KEY NOT NULL,
	"asset_name" text NOT NULL,
	"category" text NOT NULL,
	"value" numeric(15, 2) NOT NULL,
	"depreciation_rate" numeric(5, 2),
	"purchase_date" timestamp NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"tenant_id" varchar
);
--> statement-breakpoint
ALTER TABLE "assets" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "bank_management" (
	"id" serial PRIMARY KEY NOT NULL,
	"bank_name" text NOT NULL,
	"account_number" text NOT NULL,
	"account_type" text NOT NULL,
	"balance" numeric(15, 2) NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"tenant_id" varchar
);
--> statement-breakpoint
ALTER TABLE "bank_management" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "payment_schedules" (
	"id" serial PRIMARY KEY NOT NULL,
	"loan_id" integer,
	"due_date" timestamp NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"principal_amount" numeric(15, 2) NOT NULL,
	"interest_amount" numeric(15, 2) NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"paid_date" timestamp,
	"paid_amount" numeric(15, 2),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"tenant_id" varchar
);
--> statement-breakpoint
ALTER TABLE "payment_schedules" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "liabilities" (
	"id" serial PRIMARY KEY NOT NULL,
	"liability_name" text NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"due_date" timestamp,
	"status" text DEFAULT 'pending' NOT NULL,
	"creditor" text,
	"interest_rate" numeric(5, 2),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"tenant_id" varchar
);
--> statement-breakpoint
ALTER TABLE "liabilities" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "equity" (
	"id" serial PRIMARY KEY NOT NULL,
	"equity_type" text NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"date" timestamp NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now(),
	"tenant_id" varchar
);
--> statement-breakpoint
ALTER TABLE "equity" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" serial PRIMARY KEY NOT NULL,
	"category" text NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"description" text,
	"date" timestamp NOT NULL,
	"payment_method" text,
	"created_at" timestamp DEFAULT now(),
	"vendor" text,
	"tenant_id" varchar
);
--> statement-breakpoint
ALTER TABLE "expenses" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "income_management" (
	"id" serial PRIMARY KEY NOT NULL,
	"source" text NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"description" text,
	"date" timestamp NOT NULL,
	"category" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"tenant_id" varchar
);
--> statement-breakpoint
ALTER TABLE "income_management" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "user_audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"action" text NOT NULL,
	"description" text,
	"ip_address" text,
	"user_agent" text,
	"timestamp" timestamp DEFAULT now(),
	"tenant_id" varchar
);
--> statement-breakpoint
ALTER TABLE "user_audit_logs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"report_type" text NOT NULL,
	"title" text NOT NULL,
	"content" text,
	"generated_by" integer,
	"created_at" timestamp DEFAULT now(),
	"tenant_id" varchar
);
--> statement-breakpoint
ALTER TABLE "reports" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "mfi_registration" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_name" varchar NOT NULL,
	"registration_number" varchar NOT NULL,
	"license_expiry_date" date,
	"registered_address" text NOT NULL,
	"contact_phone" varchar,
	"contact_email" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"certificate_of_incorporation" text,
	"tax_clearance_certificate" text,
	"physical_address" text,
	"paid_up_capital" numeric(15, 2),
	"minimum_capital_required" numeric(15, 2) DEFAULT '2000000.00',
	"bog_license_number" text,
	"is_active" boolean DEFAULT true,
	"tenant_id" varchar,
	CONSTRAINT "mfi_registration_registration_number_key" UNIQUE("registration_number")
);
--> statement-breakpoint
ALTER TABLE "mfi_registration" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "shareholders" (
	"id" serial PRIMARY KEY NOT NULL,
	"shareholder_type" varchar DEFAULT 'local' NOT NULL,
	"name" varchar NOT NULL,
	"nationality" varchar NOT NULL,
	"id_type" varchar DEFAULT 'ghana_card' NOT NULL,
	"id_number" varchar NOT NULL,
	"address" text NOT NULL,
	"contact_phone" varchar,
	"contact_email" varchar,
	"shares_owned" integer NOT NULL,
	"share_percentage" numeric(5, 2) NOT NULL,
	"investment_amount" numeric(15, 2) NOT NULL,
	"investment_currency" varchar DEFAULT 'GHS',
	"gipc_certificate" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"tenant_id" varchar
);
--> statement-breakpoint
ALTER TABLE "shareholders" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"slug" varchar NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "tenants_slug_key" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "user_tenant_access" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"tenant_id" varchar NOT NULL,
	"role" varchar DEFAULT 'user',
	"permissions" text[],
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "staff" (
	"id" serial PRIMARY KEY NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"position" text NOT NULL,
	"salary" numeric(15, 2),
	"hire_date" timestamp NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"tenant_id" varchar,
	CONSTRAINT "staff_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "staff" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"role_id" integer NOT NULL,
	"permission_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "role_permissions_role_id_permission_id_key" UNIQUE("role_id","permission_id")
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"description" text,
	"resource" text NOT NULL,
	"action" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "permissions_name_key" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" serial PRIMARY KEY NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"address" text NOT NULL,
	"national_id" text,
	"credit_score" integer,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"password" text,
	"is_portal_active" boolean DEFAULT false,
	"last_portal_login" timestamp,
	"tenant_id" varchar,
	CONSTRAINT "customers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "customers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "loan_books" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer,
	"loan_amount" numeric(15, 2) NOT NULL,
	"interest_rate" numeric(5, 2) NOT NULL,
	"term" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"approved_by" integer,
	"disbursed_amount" numeric(15, 2),
	"outstanding_balance" numeric(15, 2),
	"start_date" timestamp,
	"end_date" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"purpose" text,
	"date_applied" timestamp,
	"loan_product_id" integer,
	"assigned_officer" integer,
	"approval_date" timestamp,
	"rejection_reason" text,
	"disbursed_by" integer,
	"disbursement_date" timestamp,
	"notes" text,
	"tenant_id" varchar
);
--> statement-breakpoint
ALTER TABLE "loan_books" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "loan_products" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"fee" numeric(15, 2) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"tenant_id" varchar
);
--> statement-breakpoint
ALTER TABLE "loan_products" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "petty_cash" (
	"id" serial PRIMARY KEY NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"purpose" text NOT NULL,
	"date" timestamp NOT NULL,
	"handled_by" integer,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"tenant_id" varchar
);
--> statement-breakpoint
ALTER TABLE "petty_cash" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "rent_management" (
	"id" serial PRIMARY KEY NOT NULL,
	"property_name" text NOT NULL,
	"tenant_name" text NOT NULL,
	"monthly_rent" numeric(15, 2) NOT NULL,
	"due_date" timestamp NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"paid_date" timestamp,
	"created_at" timestamp DEFAULT now(),
	"tenant_id" varchar
);
--> statement-breakpoint
ALTER TABLE "rent_management" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "user_roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"role_id" integer NOT NULL,
	"tenant_id" varchar NOT NULL,
	"assigned_by" integer,
	"assigned_at" timestamp DEFAULT now(),
	"is_active" boolean DEFAULT true,
	CONSTRAINT "user_roles_user_id_tenant_id_key" UNIQUE("user_id","tenant_id")
);
--> statement-breakpoint
ALTER TABLE "user_roles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"hierarchy_level" integer NOT NULL,
	"is_system_role" boolean DEFAULT true,
	"tenant_id" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "roles_name_tenant_id_key" UNIQUE("name","tenant_id")
);
--> statement-breakpoint
ALTER TABLE "roles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"email" text NOT NULL,
	"role" text DEFAULT 'user' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"profile_picture" text,
	"first_name" text,
	"last_name" text,
	"phone" text,
	"last_login" timestamp,
	"is_active" boolean DEFAULT true,
	"tenant_id" varchar,
	"is_super_admin" boolean DEFAULT false,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "inventory" (
	"id" serial PRIMARY KEY NOT NULL,
	"item_name" text NOT NULL,
	"category" text NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" numeric(15, 2) NOT NULL,
	"total_value" numeric(15, 2) NOT NULL,
	"supplier" text,
	"last_updated" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"tenant_id" varchar,
	"status" text DEFAULT 'in_stock' NOT NULL,
	"description" text
);
--> statement-breakpoint
ALTER TABLE "inventory" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "backup_metadata" (
	"id" serial PRIMARY KEY NOT NULL,
	"backup_type" varchar(50) NOT NULL,
	"tenant_id" varchar,
	"backup_size_bytes" bigint,
	"backup_location" text NOT NULL,
	"backup_status" varchar(20) DEFAULT 'in_progress',
	"created_at" timestamp DEFAULT now(),
	"completed_at" timestamp,
	"checksum" varchar(64),
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "database_health_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"metric_name" varchar(100) NOT NULL,
	"metric_value" numeric,
	"tenant_id" varchar,
	"measurement_time" timestamp DEFAULT now(),
	"threshold_min" numeric,
	"threshold_max" numeric,
	"alert_level" varchar(20) DEFAULT 'info',
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "data_retention_policies" (
	"id" serial PRIMARY KEY NOT NULL,
	"table_name" varchar(100) NOT NULL,
	"retention_days" integer NOT NULL,
	"retention_condition" text,
	"archive_before_delete" boolean DEFAULT true,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"last_executed" timestamp,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "database_migrations" (
	"id" serial PRIMARY KEY NOT NULL,
	"migration_name" varchar(255) NOT NULL,
	"migration_version" varchar(50),
	"executed_at" timestamp DEFAULT now(),
	"execution_time_ms" integer,
	"rollback_sql" text,
	"notes" text,
	"executed_by" varchar(100) DEFAULT CURRENT_USER,
	CONSTRAINT "database_migrations_migration_name_key" UNIQUE("migration_name")
);
--> statement-breakpoint
CREATE TABLE "production_alerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"alert_type" varchar(50) NOT NULL,
	"severity" varchar(20) NOT NULL,
	"alert_message" text NOT NULL,
	"tenant_id" varchar,
	"table_affected" varchar(100),
	"metric_value" numeric,
	"threshold_breached" numeric,
	"is_resolved" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"resolved_at" timestamp,
	"resolved_by" varchar(100),
	"resolution_notes" text
);
--> statement-breakpoint
CREATE TABLE "support_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" varchar NOT NULL,
	"ticket_id" integer NOT NULL,
	"sender_type" varchar NOT NULL,
	"sender_id" integer,
	"message" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "support_tickets" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" varchar NOT NULL,
	"customer_id" integer,
	"title" varchar NOT NULL,
	"description" text,
	"status" varchar DEFAULT 'open' NOT NULL,
	"priority" varchar DEFAULT 'medium' NOT NULL,
	"category" varchar,
	"assigned_to" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"customer_email" varchar,
	"customer_phone" varchar,
	"resolution" text,
	"resolved_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "fk_assets_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_management" ADD CONSTRAINT "fk_bank_management_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_schedules" ADD CONSTRAINT "payment_schedules_loan_id_loan_books_id_fk" FOREIGN KEY ("loan_id") REFERENCES "public"."loan_books"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_schedules" ADD CONSTRAINT "fk_payment_schedules_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "liabilities" ADD CONSTRAINT "fk_liabilities_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equity" ADD CONSTRAINT "fk_equity_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "fk_expenses_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "income_management" ADD CONSTRAINT "fk_income_management_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_audit_logs" ADD CONSTRAINT "user_audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_audit_logs" ADD CONSTRAINT "fk_user_audit_logs_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_generated_by_users_id_fk" FOREIGN KEY ("generated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "fk_reports_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mfi_registration" ADD CONSTRAINT "fk_mfi_registration_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shareholders" ADD CONSTRAINT "fk_shareholders_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_tenant_access" ADD CONSTRAINT "user_tenant_access_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff" ADD CONSTRAINT "fk_staff_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "fk_customers_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loan_books" ADD CONSTRAINT "loan_books_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loan_books" ADD CONSTRAINT "loan_books_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loan_books" ADD CONSTRAINT "loan_books_loan_product_id_fkey" FOREIGN KEY ("loan_product_id") REFERENCES "public"."loan_products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loan_books" ADD CONSTRAINT "loan_books_assigned_officer_fkey" FOREIGN KEY ("assigned_officer") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loan_books" ADD CONSTRAINT "loan_books_disbursed_by_fkey" FOREIGN KEY ("disbursed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loan_books" ADD CONSTRAINT "fk_loan_books_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loan_products" ADD CONSTRAINT "fk_loan_products_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "petty_cash" ADD CONSTRAINT "petty_cash_handled_by_staff_id_fk" FOREIGN KEY ("handled_by") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "petty_cash" ADD CONSTRAINT "fk_petty_cash_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rent_management" ADD CONSTRAINT "fk_rent_management_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "fk_user_roles_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roles" ADD CONSTRAINT "fk_roles_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "fk_users_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory" ADD CONSTRAINT "fk_inventory_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "public"."support_tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_assets_tenant_id" ON "assets" USING btree ("tenant_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_assets_tenant_status" ON "assets" USING btree ("tenant_id" text_ops,"status" text_ops);--> statement-breakpoint
CREATE INDEX "idx_bank_management_tenant_id" ON "bank_management" USING btree ("tenant_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_bank_management_tenant_status" ON "bank_management" USING btree ("tenant_id" text_ops,"status" text_ops);--> statement-breakpoint
CREATE INDEX "idx_payment_schedules_due_date" ON "payment_schedules" USING btree ("due_date" timestamp_ops);--> statement-breakpoint
CREATE INDEX "idx_payment_schedules_loan_id" ON "payment_schedules" USING btree ("loan_id" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_payment_schedules_loan_id_status" ON "payment_schedules" USING btree ("loan_id" int4_ops,"status" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_payment_schedules_paid_date" ON "payment_schedules" USING btree ("paid_date" timestamp_ops);--> statement-breakpoint
CREATE INDEX "idx_payment_schedules_status" ON "payment_schedules" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "idx_payment_schedules_tenant_id" ON "payment_schedules" USING btree ("tenant_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_payment_schedules_tenant_status" ON "payment_schedules" USING btree ("tenant_id" text_ops,"status" text_ops);--> statement-breakpoint
CREATE INDEX "idx_liabilities_tenant_id" ON "liabilities" USING btree ("tenant_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_liabilities_tenant_status" ON "liabilities" USING btree ("tenant_id" text_ops,"status" text_ops);--> statement-breakpoint
CREATE INDEX "idx_equity_tenant_date" ON "equity" USING btree ("tenant_id" text_ops,"date" text_ops);--> statement-breakpoint
CREATE INDEX "idx_equity_tenant_id" ON "equity" USING btree ("tenant_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_expenses_date" ON "expenses" USING btree ("date" timestamp_ops);--> statement-breakpoint
CREATE INDEX "idx_expenses_tenant_id" ON "expenses" USING btree ("tenant_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_income_management_date" ON "income_management" USING btree ("date" timestamp_ops);--> statement-breakpoint
CREATE INDEX "idx_income_management_tenant_id" ON "income_management" USING btree ("tenant_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_user_audit_logs_tenant_id" ON "user_audit_logs" USING btree ("tenant_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_user_audit_logs_tenant_timestamp" ON "user_audit_logs" USING btree ("tenant_id" text_ops,"timestamp" text_ops);--> statement-breakpoint
CREATE INDEX "idx_reports_tenant_id" ON "reports" USING btree ("tenant_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_reports_tenant_type" ON "reports" USING btree ("tenant_id" text_ops,"report_type" text_ops);--> statement-breakpoint
CREATE INDEX "idx_mfi_registration_tenant_active" ON "mfi_registration" USING btree ("tenant_id" text_ops,"is_active" text_ops);--> statement-breakpoint
CREATE INDEX "idx_mfi_registration_tenant_id" ON "mfi_registration" USING btree ("tenant_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_shareholders_tenant_active" ON "shareholders" USING btree ("tenant_id" text_ops,"is_active" text_ops);--> statement-breakpoint
CREATE INDEX "idx_shareholders_tenant_id" ON "shareholders" USING btree ("tenant_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_staff_tenant_id" ON "staff" USING btree ("tenant_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_staff_tenant_status" ON "staff" USING btree ("tenant_id" text_ops,"status" text_ops);--> statement-breakpoint
CREATE INDEX "idx_customers_email" ON "customers" USING btree ("email" text_ops);--> statement-breakpoint
CREATE INDEX "idx_customers_tenant_id" ON "customers" USING btree ("tenant_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_loan_books_assigned_officer" ON "loan_books" USING btree ("assigned_officer" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_loan_books_created_at" ON "loan_books" USING btree ("created_at" timestamp_ops);--> statement-breakpoint
CREATE INDEX "idx_loan_books_customer_id" ON "loan_books" USING btree ("customer_id" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_loan_books_status" ON "loan_books" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "idx_loan_books_tenant_id" ON "loan_books" USING btree ("tenant_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_loan_books_tenant_status" ON "loan_books" USING btree ("tenant_id" text_ops,"status" text_ops);--> statement-breakpoint
CREATE INDEX "idx_loan_products_tenant_active" ON "loan_products" USING btree ("tenant_id" text_ops,"is_active" text_ops);--> statement-breakpoint
CREATE INDEX "idx_loan_products_tenant_id" ON "loan_products" USING btree ("tenant_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_petty_cash_tenant_id" ON "petty_cash" USING btree ("tenant_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_petty_cash_tenant_status" ON "petty_cash" USING btree ("tenant_id" text_ops,"status" text_ops);--> statement-breakpoint
CREATE INDEX "idx_rent_management_tenant_id" ON "rent_management" USING btree ("tenant_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_rent_management_tenant_status" ON "rent_management" USING btree ("tenant_id" text_ops,"status" text_ops);--> statement-breakpoint
CREATE INDEX "idx_user_roles_tenant_id" ON "user_roles" USING btree ("tenant_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_user_roles_tenant_user" ON "user_roles" USING btree ("tenant_id" text_ops,"user_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_users_email" ON "users" USING btree ("email" text_ops);--> statement-breakpoint
CREATE INDEX "idx_users_tenant_id" ON "users" USING btree ("tenant_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_inventory_tenant_id" ON "inventory" USING btree ("tenant_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_inventory_tenant_status" ON "inventory" USING btree ("tenant_id" text_ops,"status" text_ops);--> statement-breakpoint
CREATE INDEX "idx_health_metrics_tenant" ON "database_health_metrics" USING btree ("tenant_id" text_ops,"measurement_time" text_ops);--> statement-breakpoint
CREATE INDEX "idx_health_metrics_time" ON "database_health_metrics" USING btree ("measurement_time" timestamp_ops);--> statement-breakpoint
CREATE INDEX "idx_production_alerts_severity" ON "production_alerts" USING btree ("severity" text_ops,"created_at" text_ops);--> statement-breakpoint
CREATE INDEX "idx_production_alerts_unresolved" ON "production_alerts" USING btree ("created_at" timestamp_ops) WHERE (is_resolved = false);--> statement-breakpoint
CREATE VIEW "public"."connection_pool_status" AS (SELECT 'total_connections'::text AS metric, count(*)::text AS current_value, CASE WHEN count(*) > 100 THEN 'Verify connection pooling configuration'::text ELSE 'Connection count normal'::text END AS recommendation FROM pg_stat_activity WHERE pg_stat_activity.state IS NOT NULL UNION ALL SELECT 'idle_connections'::text AS metric, count(*)::text AS current_value, CASE WHEN count(*) > 50 THEN 'Consider reducing idle connection timeout'::text ELSE 'Idle connection count normal'::text END AS recommendation FROM pg_stat_activity WHERE pg_stat_activity.state = 'idle'::text UNION ALL SELECT 'active_connections'::text AS metric, count(*)::text AS current_value, CASE WHEN count(*) > 25 THEN 'High active connection count - monitor performance'::text ELSE 'Active connection count normal'::text END AS recommendation FROM pg_stat_activity WHERE pg_stat_activity.state = 'active'::text);--> statement-breakpoint
CREATE POLICY "tenant_isolation_assets" ON "assets" AS PERMISSIVE FOR ALL TO public USING (((tenant_id)::text = current_setting('app.current_tenant_id'::text, true)));--> statement-breakpoint
CREATE POLICY "tenant_isolation_bank_management" ON "bank_management" AS PERMISSIVE FOR ALL TO public USING (((tenant_id)::text = current_setting('app.current_tenant_id'::text, true)));--> statement-breakpoint
CREATE POLICY "tenant_isolation_payment_schedules" ON "payment_schedules" AS PERMISSIVE FOR ALL TO public USING (((tenant_id)::text = current_setting('app.current_tenant_id'::text, true)));--> statement-breakpoint
CREATE POLICY "tenant_isolation_liabilities" ON "liabilities" AS PERMISSIVE FOR ALL TO public USING (((tenant_id)::text = current_setting('app.current_tenant_id'::text, true)));--> statement-breakpoint
CREATE POLICY "tenant_isolation_equity" ON "equity" AS PERMISSIVE FOR ALL TO public USING (((tenant_id)::text = current_setting('app.current_tenant_id'::text, true)));--> statement-breakpoint
CREATE POLICY "tenant_isolation_expenses" ON "expenses" AS PERMISSIVE FOR ALL TO public USING (((tenant_id)::text = current_setting('app.current_tenant_id'::text, true)));--> statement-breakpoint
CREATE POLICY "tenant_isolation_income_management" ON "income_management" AS PERMISSIVE FOR ALL TO public USING (((tenant_id)::text = current_setting('app.current_tenant_id'::text, true)));--> statement-breakpoint
CREATE POLICY "tenant_isolation_user_audit_logs" ON "user_audit_logs" AS PERMISSIVE FOR ALL TO public USING (((tenant_id)::text = current_setting('app.current_tenant_id'::text, true)));--> statement-breakpoint
CREATE POLICY "tenant_isolation_reports" ON "reports" AS PERMISSIVE FOR ALL TO public USING (((tenant_id)::text = current_setting('app.current_tenant_id'::text, true)));--> statement-breakpoint
CREATE POLICY "tenant_isolation_mfi_registration" ON "mfi_registration" AS PERMISSIVE FOR ALL TO public USING (((tenant_id)::text = current_setting('app.current_tenant_id'::text, true)));--> statement-breakpoint
CREATE POLICY "tenant_isolation_shareholders" ON "shareholders" AS PERMISSIVE FOR ALL TO public USING (((tenant_id)::text = current_setting('app.current_tenant_id'::text, true)));--> statement-breakpoint
CREATE POLICY "tenant_isolation_staff" ON "staff" AS PERMISSIVE FOR ALL TO public USING (((tenant_id)::text = current_setting('app.current_tenant_id'::text, true)));--> statement-breakpoint
CREATE POLICY "tenant_isolation_customers" ON "customers" AS PERMISSIVE FOR ALL TO public USING (((tenant_id)::text = current_setting('app.current_tenant_id'::text, true)));--> statement-breakpoint
CREATE POLICY "tenant_isolation_loan_books" ON "loan_books" AS PERMISSIVE FOR ALL TO public USING (((tenant_id)::text = current_setting('app.current_tenant_id'::text, true)));--> statement-breakpoint
CREATE POLICY "tenant_isolation_loan_products" ON "loan_products" AS PERMISSIVE FOR ALL TO public USING (((tenant_id)::text = current_setting('app.current_tenant_id'::text, true)));--> statement-breakpoint
CREATE POLICY "tenant_isolation_petty_cash" ON "petty_cash" AS PERMISSIVE FOR ALL TO public USING (((tenant_id)::text = current_setting('app.current_tenant_id'::text, true)));--> statement-breakpoint
CREATE POLICY "tenant_isolation_rent_management" ON "rent_management" AS PERMISSIVE FOR ALL TO public USING (((tenant_id)::text = current_setting('app.current_tenant_id'::text, true)));--> statement-breakpoint
CREATE POLICY "tenant_isolation_user_roles" ON "user_roles" AS PERMISSIVE FOR ALL TO public USING (((tenant_id)::text = current_setting('app.current_tenant_id'::text, true)));--> statement-breakpoint
CREATE POLICY "tenant_isolation_roles" ON "roles" AS PERMISSIVE FOR ALL TO public USING (((tenant_id)::text = current_setting('app.current_tenant_id'::text, true)));--> statement-breakpoint
CREATE POLICY "tenant_isolation_users" ON "users" AS PERMISSIVE FOR ALL TO public USING (((tenant_id)::text = current_setting('app.current_tenant_id'::text, true)));--> statement-breakpoint
CREATE POLICY "tenant_isolation_inventory" ON "inventory" AS PERMISSIVE FOR ALL TO public USING (((tenant_id)::text = current_setting('app.current_tenant_id'::text, true)));
*/