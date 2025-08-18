import type { Express, Request, Response } from "express";
import { db } from "./db";
import { sql } from "drizzle-orm";
import { 
  getOptimizedDashboardMetrics, 
  getOptimizedRecentPayments,
  createPerformanceIndexes 
} from "./performanceOptimization";
import { extractTenantContext, authenticateToken } from "./tenantAuth";

interface AuthenticatedRequest extends Request {
  tenantId?: string;
}

/**
 * Optimized API routes for better performance
 * Implements caching, batching, and efficient queries
 */

export function registerOptimizedRoutes(app: Express) {
  
  // Initialize performance indexes on startup
  createPerformanceIndexes().catch(console.error);
  
  // Optimized dashboard metrics endpoint
  app.get("/api/dashboard/metrics", authenticateToken, extractTenantContext, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.tenantId as string;
      const metrics = await getOptimizedDashboardMetrics(tenantId);
      
      // Add cache headers for better client-side caching
      res.set({
        'Cache-Control': 'private, max-age=120', // 2 minutes
        'ETag': `"metrics-${Date.now()}"`,
      });
      
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
      res.status(500).json({ error: "Failed to fetch dashboard metrics" });
    }
  });
  
  // Optimized recent payments endpoint with pagination
  app.get("/api/payments/recent", authenticateToken, extractTenantContext, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.tenantId as string;
      const limit = parseInt(req.query.limit as string) || 10;
      const payments = await getOptimizedRecentPayments(tenantId, limit);
      
      res.set({
        'Cache-Control': 'private, max-age=60', // 1 minute
      });
      
      res.json(payments);
    } catch (error) {
      console.error("Error fetching recent payments:", error);
      res.status(500).json({ error: "Failed to fetch recent payments" });
    }
  });
  
  // Batch endpoint for multiple dashboard data
  app.get("/api/dashboard/batch", authenticateToken, extractTenantContext, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.tenantId as string;
      
      // Execute multiple queries in parallel
      const [metrics, recentPayments, portfolioData] = await Promise.all([
        getOptimizedDashboardMetrics(tenantId),
        getOptimizedRecentPayments(tenantId, 5),
        getPortfolioSummary(tenantId)
      ]);
      
      res.set({
        'Cache-Control': 'private, max-age=120',
      });
      
      res.json({
        metrics,
        recentPayments,
        portfolioData
      });
    } catch (error) {
      console.error("Error fetching batch dashboard data:", error);
      res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
  });
  
  // Optimized customers endpoint with search and pagination
  app.get("/api/customers/optimized", authenticateToken, extractTenantContext, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.tenantId as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string;
      const offset = (page - 1) * limit;
      
      let query = sql`
        SELECT 
          id, first_name, last_name, email, phone, created_at,
          (SELECT COUNT(*) FROM loan_books WHERE customer_id = customers.id) as loan_count,
          (SELECT COALESCE(SUM(CAST(loan_amount AS NUMERIC)), 0) FROM loan_books WHERE customer_id = customers.id AND status = 'disbursed') as total_borrowed
        FROM customers 
        WHERE tenant_id = ${tenantId}
      `;
      
      if (search) {
        query = sql`${query} AND (first_name ILIKE ${'%' + search + '%'} OR last_name ILIKE ${'%' + search + '%'} OR email ILIKE ${'%' + search + '%'})`;
      }
      
      query = sql`${query} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
      
      const customerResult = await db.execute(query);
      const customers = customerResult.rows || [];
      
      // Get total count for pagination
      const countQuery = search 
        ? sql`SELECT COUNT(*) as total FROM customers WHERE tenant_id = ${tenantId} AND (first_name ILIKE ${'%' + search + '%'} OR last_name ILIKE ${'%' + search + '%'} OR email ILIKE ${'%' + search + '%'})`
        : sql`SELECT COUNT(*) as total FROM customers WHERE tenant_id = ${tenantId}`;
      
      const countResult = await db.execute(countQuery);
      const totalCount = countResult.rows?.[0]?.total || 0;
      
      res.set({
        'Cache-Control': 'private, max-age=180', // 3 minutes
      });
      
      res.json({
        customers,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit)
        }
      });
    } catch (error) {
      console.error("Error fetching customers:", error);
      res.status(500).json({ error: "Failed to fetch customers" });
    }
  });
  
  // Performance monitoring endpoint
  app.get("/api/performance/stats", authenticateToken, async (req: Request, res: Response) => {
    try {
      const statsResult = await db.execute(sql`
        SELECT 
          schemaname,
          tablename,
          n_tup_ins as inserts,
          n_tup_upd as updates,
          n_tup_del as deletes,
          n_live_tup as live_tuples,
          n_dead_tup as dead_tuples
        FROM pg_stat_user_tables 
        WHERE schemaname = 'public'
        ORDER BY n_live_tup DESC
        LIMIT 10
      `);
      
      res.json(statsResult.rows || []);
    } catch (error) {
      console.error("Error fetching performance stats:", error);
      res.status(500).json({ error: "Failed to fetch performance stats" });
    }
  });
}

// Helper function for portfolio summary
async function getPortfolioSummary(tenantId: string) {
  const result = await db.execute(sql`
    SELECT 
      COUNT(*) as total_loans,
      SUM(CASE WHEN status = 'disbursed' THEN CAST(loan_amount AS NUMERIC) ELSE 0 END) as active_portfolio,
      AVG(CASE WHEN status = 'disbursed' THEN CAST(loan_amount AS NUMERIC) END) as avg_loan_size,
      (SELECT COUNT(*) FROM payment_schedules ps 
       INNER JOIN loan_books lb ON ps.loan_id = lb.id 
       WHERE lb.tenant_id = ${tenantId} AND ps.status = 'overdue') as overdue_payments
    FROM loan_books 
    WHERE tenant_id = ${tenantId}
  `);
  
  return result.rows?.[0] || null;
}