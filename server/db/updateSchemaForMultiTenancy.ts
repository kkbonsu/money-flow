// This file contains the updated schema definitions for multi-tenancy
// It will be used to update all tables with organizationId field

export const schemaUpdates = `
-- Add organizationId to all tables that need it

-- Loan Products
ALTER TABLE loan_products ADD COLUMN organization_id INTEGER REFERENCES organizations(id) NOT NULL;

-- Loan Books
ALTER TABLE loan_books ADD COLUMN organization_id INTEGER REFERENCES organizations(id) NOT NULL;

-- Payment Schedules
ALTER TABLE payment_schedules ADD COLUMN organization_id INTEGER REFERENCES organizations(id) NOT NULL;

-- Staff
ALTER TABLE staff ADD COLUMN organization_id INTEGER REFERENCES organizations(id) NOT NULL;

-- Income Management
ALTER TABLE income_management ADD COLUMN organization_id INTEGER REFERENCES organizations(id) NOT NULL;

-- Expenses
ALTER TABLE expenses ADD COLUMN organization_id INTEGER REFERENCES organizations(id) NOT NULL;

-- Bank Management
ALTER TABLE bank_management ADD COLUMN organization_id INTEGER REFERENCES organizations(id) NOT NULL;

-- Petty Cash
ALTER TABLE petty_cash ADD COLUMN organization_id INTEGER REFERENCES organizations(id) NOT NULL;

-- Inventory
ALTER TABLE inventory ADD COLUMN organization_id INTEGER REFERENCES organizations(id) NOT NULL;

-- Rent Management
ALTER TABLE rent_management ADD COLUMN organization_id INTEGER REFERENCES organizations(id) NOT NULL;

-- Assets
ALTER TABLE assets ADD COLUMN organization_id INTEGER REFERENCES organizations(id) NOT NULL;

-- Liabilities
ALTER TABLE liabilities ADD COLUMN organization_id INTEGER REFERENCES organizations(id) NOT NULL;

-- Equity
ALTER TABLE equity ADD COLUMN organization_id INTEGER REFERENCES organizations(id) NOT NULL;

-- Reports
ALTER TABLE reports ADD COLUMN organization_id INTEGER REFERENCES organizations(id) NOT NULL;

-- User Audit Logs
ALTER TABLE user_audit_logs ADD COLUMN organization_id INTEGER REFERENCES organizations(id) NOT NULL;

-- MFI Registration
ALTER TABLE mfi_registration ADD COLUMN organization_id INTEGER REFERENCES organizations(id) NOT NULL;

-- Shareholders
ALTER TABLE shareholders ADD COLUMN organization_id INTEGER REFERENCES organizations(id) NOT NULL;

-- Collateral
ALTER TABLE collateral ADD COLUMN organization_id INTEGER REFERENCES organizations(id) NOT NULL;

-- Education Content
ALTER TABLE education_content ADD COLUMN organization_id INTEGER REFERENCES organizations(id) NOT NULL;

-- Borrower Feedback
ALTER TABLE borrower_feedback ADD COLUMN organization_id INTEGER REFERENCES organizations(id) NOT NULL;

-- Debt Collection Activities
ALTER TABLE debt_collection_activities ADD COLUMN organization_id INTEGER REFERENCES organizations(id) NOT NULL;

-- Create indexes for better performance
CREATE INDEX idx_customers_org ON customers(organization_id);
CREATE INDEX idx_loan_books_org ON loan_books(organization_id);
CREATE INDEX idx_payment_schedules_org ON payment_schedules(organization_id);
CREATE INDEX idx_staff_org ON staff(organization_id);
CREATE INDEX idx_income_management_org ON income_management(organization_id);
CREATE INDEX idx_expenses_org ON expenses(organization_id);
CREATE INDEX idx_bank_management_org ON bank_management(organization_id);
CREATE INDEX idx_users_org ON users(organization_id);

-- Add unique constraints where needed (email should be unique per organization)
ALTER TABLE customers DROP CONSTRAINT customers_email_key;
ALTER TABLE customers ADD CONSTRAINT customers_email_org_unique UNIQUE (email, organization_id);

ALTER TABLE staff DROP CONSTRAINT staff_email_key;
ALTER TABLE staff ADD CONSTRAINT staff_email_org_unique UNIQUE (email, organization_id);

ALTER TABLE users DROP CONSTRAINT users_username_key;
ALTER TABLE users ADD CONSTRAINT users_username_org_unique UNIQUE (username, organization_id);

ALTER TABLE users DROP CONSTRAINT users_email_key;
ALTER TABLE users ADD CONSTRAINT users_email_org_unique UNIQUE (email, organization_id);
`;