import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function migrateToMultiTenant() {
  console.log("Starting multi-tenant migration...");
  
  try {
    // Add organizationId columns to all tables that need it
    const alterTableQueries = [
      // Users table
      sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS clerk_id TEXT UNIQUE`,
      sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS organization_id TEXT`,
      
      // Core business tables
      sql`ALTER TABLE customers ADD COLUMN IF NOT EXISTS organization_id TEXT`,
      sql`ALTER TABLE loan_products ADD COLUMN IF NOT EXISTS organization_id TEXT`,
      sql`ALTER TABLE loan_books ADD COLUMN IF NOT EXISTS organization_id TEXT`,
      sql`ALTER TABLE staff ADD COLUMN IF NOT EXISTS organization_id TEXT`,
      
      // Financial tables
      sql`ALTER TABLE income_management ADD COLUMN IF NOT EXISTS organization_id TEXT`,
      sql`ALTER TABLE expenses ADD COLUMN IF NOT EXISTS organization_id TEXT`,
      sql`ALTER TABLE bank_management ADD COLUMN IF NOT EXISTS organization_id TEXT`,
      sql`ALTER TABLE assets ADD COLUMN IF NOT EXISTS organization_id TEXT`,
      
      // MFI Registration - unique organizationId
      sql`ALTER TABLE mfi_registration ADD COLUMN IF NOT EXISTS organization_id TEXT UNIQUE`,
    ];
    
    // Create indexes for better query performance
    const indexQueries = [
      sql`CREATE INDEX IF NOT EXISTS idx_customers_org_email ON customers(organization_id, email)`,
      sql`CREATE INDEX IF NOT EXISTS idx_staff_org_email ON staff(organization_id, email)`,
      sql`CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_id)`,
      sql`CREATE INDEX IF NOT EXISTS idx_users_org_id ON users(organization_id)`,
    ];
    
    // Execute all ALTER TABLE queries
    for (const query of alterTableQueries) {
      await db.execute(query);
      console.log("✓ Executed ALTER TABLE query");
    }
    
    // Execute all CREATE INDEX queries
    for (const query of indexQueries) {
      await db.execute(query);
      console.log("✓ Created index");
    }
    
    console.log("✅ Multi-tenant migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

migrateToMultiTenant();