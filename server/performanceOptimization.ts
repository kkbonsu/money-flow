import { sql } from "drizzle-orm";
import { db } from "./db";

/**
 * Performance Optimization: Database Indexes
 * Critical indexes for Money Flow application performance
 */

export async function createPerformanceIndexes() {
  console.log("🚀 Creating performance indexes...");
  
  try {
    // Tenant-based indexes (most critical for multi-tenant performance)
    await db.execute(sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_tenant_id ON users(tenant_id)`);
    await db.execute(sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_tenant_id ON customers(tenant_id)`);
    await db.execute(sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_loan_books_tenant_id ON loan_books(tenant_id)`);
    await db.execute(sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payment_schedules_tenant_id ON payment_schedules(tenant_id)`);
    await db.execute(sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_income_management_tenant_id ON income_management(tenant_id)`);
    await db.execute(sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_expenses_tenant_id ON expenses(tenant_id)`);
    
    // Date-based indexes for financial analytics
    await db.execute(sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_loan_books_created_at ON loan_books(created_at DESC)`);
    await db.execute(sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payment_schedules_due_date ON payment_schedules(due_date)`);
    await db.execute(sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payment_schedules_paid_date ON payment_schedules(paid_date DESC)`);
    await db.execute(sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_income_management_date ON income_management(date DESC)`);
    await db.execute(sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_expenses_date ON expenses(date DESC)`);
    
    // Status-based indexes for quick filtering
    await db.execute(sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_loan_books_status ON loan_books(status)`);
    await db.execute(sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payment_schedules_status ON payment_schedules(status)`);
    
    // Composite indexes for complex queries
    await db.execute(sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_loan_books_tenant_status ON loan_books(tenant_id, status)`);
    await db.execute(sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payment_schedules_tenant_status ON payment_schedules(tenant_id, status)`);
    await db.execute(sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payment_schedules_loan_id_status ON payment_schedules(loan_id, status)`);
    
    // Foreign key indexes for joins
    await db.execute(sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_loan_books_customer_id ON loan_books(customer_id)`);
    await db.execute(sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_loan_books_assigned_officer ON loan_books(assigned_officer)`);
    await db.execute(sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payment_schedules_loan_id ON payment_schedules(loan_id)`);
    
    // Email indexes for user lookup
    await db.execute(sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users(email)`);
    await db.execute(sql`CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_email ON customers(email)`);
    
    console.log("✅ Performance indexes created successfully");
  } catch (error) {
    console.error("❌ Error creating indexes:", error);
    // Non-blocking - indexes might already exist
  }
}

/**
 * Optimized Dashboard Query
 * Combines multiple metrics into a single query to reduce round trips
 */
export async function getOptimizedDashboardMetrics(tenantId: string) {
  const result = await db.execute(sql`
    WITH loan_metrics AS (
      SELECT 
        COUNT(*) as total_loans,
        SUM(CASE WHEN status IN ('approved', 'disbursed') THEN CAST(loan_amount AS NUMERIC) ELSE 0 END) as portfolio_value,
        SUM(CASE WHEN status = 'disbursed' THEN 1 ELSE 0 END) as active_loans,
        AVG(CASE WHEN status IN ('approved', 'disbursed') THEN CAST(loan_amount AS NUMERIC) END) as avg_loan_size
      FROM loan_books 
      WHERE tenant_id = ${tenantId}
    ),
    payment_metrics AS (
      SELECT 
        COUNT(*) as total_payments,
        SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid_payments,
        SUM(CASE WHEN status = 'overdue' THEN 1 ELSE 0 END) as overdue_payments,
        SUM(CASE WHEN status = 'paid' THEN CAST(amount AS NUMERIC) ELSE 0 END) as total_collected
      FROM payment_schedules 
      WHERE tenant_id = ${tenantId}
    ),
    customer_metrics AS (
      SELECT COUNT(*) as total_customers
      FROM customers 
      WHERE tenant_id = ${tenantId}
    ),
    monthly_income AS (
      SELECT COALESCE(SUM(CAST(amount AS NUMERIC)), 0) as monthly_income
      FROM income_management 
      WHERE tenant_id = ${tenantId}
      AND date >= DATE_TRUNC('month', CURRENT_DATE)
    )
    SELECT 
      lm.total_loans,
      lm.portfolio_value,
      lm.active_loans,
      lm.avg_loan_size,
      pm.total_payments,
      pm.paid_payments,
      pm.overdue_payments,
      pm.total_collected,
      cm.total_customers,
      mi.monthly_income,
      CASE 
        WHEN pm.total_payments > 0 
        THEN ROUND((pm.overdue_payments * 100.0 / pm.total_payments), 2)
        ELSE 0 
      END as default_rate
    FROM loan_metrics lm
    CROSS JOIN payment_metrics pm
    CROSS JOIN customer_metrics cm
    CROSS JOIN monthly_income mi
  `);
  
  return result.rows?.[0] || null;
}

/**
 * Optimized Recent Payments Query
 * Uses proper indexing and limits data transfer
 */
export async function getOptimizedRecentPayments(tenantId: string, limit: number = 10) {
  return await db.execute(sql`
    SELECT 
      ps.id,
      ps.amount,
      ps.paid_date,
      ps.status,
      c.first_name || ' ' || c.last_name as customer_name,
      lb.loan_amount
    FROM payment_schedules ps
    INNER JOIN loan_books lb ON ps.loan_id = lb.id
    INNER JOIN customers c ON lb.customer_id = c.id
    WHERE ps.tenant_id = ${tenantId}
    AND ps.status = 'paid'
    ORDER BY ps.paid_date DESC
    LIMIT ${limit}
  `);
}

/**
 * Batch Operations for Performance
 * Reduces database round trips for bulk operations
 */
export class BatchOperations {
  private operations: Array<{ query: string; params: any[] }> = [];
  
  addOperation(query: string, params: any[] = []) {
    this.operations.push({ query, params });
  }
  
  async executeBatch() {
    if (this.operations.length === 0) return [];
    
    const results = [];
    for (const op of this.operations) {
      try {
        const result = await db.execute(sql.raw(op.query));
        results.push(result);
      } catch (error) {
        console.error("Batch operation failed:", error);
        results.push({ error });
      }
    }
    
    this.operations = []; // Clear operations after execution
    return transaction;
  }
}