/**
 * V8-Optimized Storage Integration Layer
 * Integrates V8 optimizations with existing storage operations
 */

import { 
  OptimizedCustomer, 
  OptimizedLoan, 
  OptimizedPaymentSchedule,
  V8DataTransformer,
  v8Cache,
  V8FinancialCalculations,
  V8PerformanceMonitor
} from './v8Optimizations';

import { MonomorphicLoanEngine, MonomorphicPaymentEngine, MonomorphicAnalyticsEngine } from './v8MonomorphicEngines';
import { V8StreamProcessor, V8BulkOperationManager } from './v8MemoryManager';
import { db } from './db';
import { sql } from 'drizzle-orm';

/**
 * V8-Optimized Storage Wrapper
 * Provides optimized implementations of core storage operations
 */
export class V8OptimizedStorage {
  
  /**
   * Get customers with V8 optimization and caching
   */
  static async getOptimizedCustomers(
    tenantId: string,
    options: {
      limit?: number;
      offset?: number;
      search?: string;
      useCache?: boolean;
    } = {}
  ): Promise<{
    customers: OptimizedCustomer[];
    total: number;
    performance: {
      fromCache: boolean;
      processingTime: number;
      memoryEfficient: boolean;
    };
  }> {
    const startTime = performance.now();
    const cacheKey = `customers:${tenantId}:${JSON.stringify(options)}`;
    
    // Check cache first
    if (options.useCache !== false) {
      const cached = v8Cache.get<{customers: OptimizedCustomer[], total: number}>(cacheKey);
      if (cached) {
        V8PerformanceMonitor.trackCacheHit();
        return {
          ...cached,
          performance: {
            fromCache: true,
            processingTime: performance.now() - startTime,
            memoryEfficient: true
          }
        };
      }
    }
    
    V8PerformanceMonitor.trackCacheMiss();
    
    // Build optimized query
    let baseQuery = sql`
      SELECT * FROM customers 
      WHERE tenant_id = ${tenantId}
    `;
    
    if (options.search) {
      baseQuery = sql`${baseQuery} 
        AND (first_name ILIKE ${'%' + options.search + '%'} 
          OR last_name ILIKE ${'%' + options.search + '%'} 
          OR email ILIKE ${'%' + options.search + '%'})`;
    }
    
    baseQuery = sql`${baseQuery} ORDER BY created_at DESC`;
    
    if (options.limit) {
      baseQuery = sql`${baseQuery} LIMIT ${options.limit}`;
    }
    
    if (options.offset) {
      baseQuery = sql`${baseQuery} OFFSET ${options.offset}`;
    }
    
    // Execute query and transform with V8 optimization
    const result = await db.execute(baseQuery);
    const customers = V8DataTransformer.transformCustomers(result.rows || []);
    
    // Get total count
    const countQuery = options.search 
      ? sql`SELECT COUNT(*) as total FROM customers WHERE tenant_id = ${tenantId} 
             AND (first_name ILIKE ${'%' + options.search + '%'} 
               OR last_name ILIKE ${'%' + options.search + '%'} 
               OR email ILIKE ${'%' + options.search + '%'})`
      : sql`SELECT COUNT(*) as total FROM customers WHERE tenant_id = ${tenantId}`;
    
    const countResult = await db.execute(countQuery);
    const total = Number(countResult.rows?.[0]?.total || 0);
    
    const response = {
      customers,
      total,
      performance: {
        fromCache: false,
        processingTime: performance.now() - startTime,
        memoryEfficient: true
      }
    };
    
    // Cache the result
    if (options.useCache !== false) {
      v8Cache.set(cacheKey, { customers, total }, 300000); // 5 minutes
    }
    
    return response;
  }

  /**
   * Get optimized loan portfolio with advanced calculations
   */
  static async getOptimizedLoanPortfolio(
    tenantId: string,
    options: {
      includeSchedules?: boolean;
      calculateRisk?: boolean;
      useStreaming?: boolean;
    } = {}
  ): Promise<{
    loans: OptimizedLoan[];
    portfolioMetrics: any;
    riskAnalysis?: any;
    performance: any;
  }> {
    const startTime = performance.now();
    const cacheKey = `loan-portfolio:${tenantId}:${JSON.stringify(options)}`;
    
    // Check cache
    const cached = v8Cache.get(cacheKey);
    if (cached) {
      V8PerformanceMonitor.trackCacheHit();
      return cached;
    }
    
    V8PerformanceMonitor.trackCacheMiss();
    
    // Fetch loans with optimized query
    const loanQuery = sql`
      SELECT 
        lb.*,
        c.first_name || ' ' || c.last_name as customer_name,
        lp.name as product_name
      FROM loan_books lb
      LEFT JOIN customers c ON lb.customer_id = c.id
      LEFT JOIN loan_products lp ON lb.loan_product_id = lp.id
      WHERE lb.tenant_id = ${tenantId}
      ORDER BY lb.created_at DESC
    `;
    
    const loanResult = await db.execute(loanQuery);
    const loans = V8DataTransformer.transformLoans(loanResult.rows || []);
    
    // Calculate portfolio metrics with monomorphic engine
    const portfolioMetrics = MonomorphicLoanEngine.processBulkLoans(loans);
    
    let riskAnalysis;
    if (options.calculateRisk) {
      riskAnalysis = V8FinancialCalculations.calculatePortfolioRisk(loans);
    }
    
    const response = {
      loans,
      portfolioMetrics,
      riskAnalysis,
      performance: {
        processingTime: performance.now() - startTime,
        recordsProcessed: loans.length,
        optimizationLevel: 'v8-enhanced'
      }
    };
    
    // Cache the result
    v8Cache.set(cacheKey, response, 600000); // 10 minutes
    
    return response;
  }

  /**
   * Process bulk payments with V8 optimization
   */
  static async processBulkPayments(
    tenantId: string,
    payments: Array<{ scheduleId: number; amount: number; date?: Date }>
  ): Promise<{
    processed: number;
    totalAmount: number;
    errors: Array<{ scheduleId: number; error: string }>;
    performance: any;
  }> {
    const startTime = performance.now();
    v8Processors.profiler.startProfile('bulk-payments');
    
    // Fetch relevant schedules
    const scheduleIds = payments.map(p => p.scheduleId);
    const scheduleQuery = sql`
      SELECT * FROM payment_schedules 
      WHERE tenant_id = ${tenantId} 
      AND id = ANY(${scheduleIds})
    `;
    
    const scheduleResult = await db.execute(scheduleQuery);
    const schedules = V8DataTransformer.transformPaymentSchedules(scheduleResult.rows || []);
    
    // Process with monomorphic engine
    const processingResult = MonomorphicPaymentEngine.processBulkPayments(schedules, payments);
    
    const profileResult = v8Processors.profiler.endProfile('bulk-payments');
    
    return {
      processed: processingResult.processed,
      totalAmount: processingResult.totalProcessed,
      errors: processingResult.errors,
      performance: {
        ...profileResult,
        processingTime: performance.now() - startTime,
        schedulesLoaded: schedules.length,
        v8Optimized: true
      }
    };
  }
}

/**
 * V8-Optimized Dashboard Service
 * High-performance dashboard data with intelligent caching
 */
export class V8DashboardService {
  
  /**
   * Get comprehensive dashboard data with V8 optimization
   */
  static async getComprehensiveDashboard(
    tenantId: string,
    useCache: boolean = true
  ): Promise<{
    overview: any;
    recentActivity: any;
    analytics: any;
    performance: any;
  }> {
    const startTime = performance.now();
    const cacheKey = `dashboard-comprehensive:${tenantId}:${Math.floor(Date.now() / 120000)}`;
    
    if (useCache) {
      const cached = v8Cache.get(cacheKey);
      if (cached) {
        V8PerformanceMonitor.trackCacheHit();
        return cached;
      }
    }
    
    V8PerformanceMonitor.trackCacheMiss();
    
    // Parallel data fetching with V8 optimization
    const [
      customerData,
      loanData,
      paymentData
    ] = await Promise.all([
      this.getOptimizedCustomerOverview(tenantId),
      this.getOptimizedLoanOverview(tenantId),
      this.getOptimizedPaymentOverview(tenantId)
    ]);
    
    // Combine with monomorphic analytics engine
    const analytics = MonomorphicAnalyticsEngine.calculateDashboardMetrics(
      loanData.loans,
      paymentData.schedules
    );
    
    const response = {
      overview: {
        customers: customerData.summary,
        loans: loanData.summary,
        payments: paymentData.summary
      },
      recentActivity: {
        recentCustomers: customerData.recent,
        recentLoans: loanData.recent,
        recentPayments: paymentData.recent
      },
      analytics,
      performance: {
        generationTime: performance.now() - startTime,
        fromCache: false,
        v8Optimized: true
      }
    };
    
    // Cache the comprehensive result
    if (useCache) {
      v8Cache.set(cacheKey, response, 300000); // 5 minutes
    }
    
    return response;
  }

  private static async getOptimizedCustomerOverview(tenantId: string) {
    const query = sql`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as recent_count,
        AVG(credit_score) as avg_credit_score
      FROM customers 
      WHERE tenant_id = ${tenantId}
    `;
    
    const result = await db.execute(query);
    const summary = result.rows?.[0] || {};
    
    // Get recent customers
    const recentQuery = sql`
      SELECT * FROM customers 
      WHERE tenant_id = ${tenantId}
      ORDER BY created_at DESC 
      LIMIT 5
    `;
    
    const recentResult = await db.execute(recentQuery);
    const recent = V8DataTransformer.transformCustomers(recentResult.rows || []);
    
    return { summary, recent };
  }

  private static async getOptimizedLoanOverview(tenantId: string) {
    const query = sql`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'disbursed' THEN CAST(loan_amount AS NUMERIC) ELSE 0 END) as portfolio_value,
        COUNT(*) FILTER (WHERE status = 'disbursed') as active_loans,
        AVG(CASE WHEN status = 'disbursed' THEN CAST(loan_amount AS NUMERIC) END) as avg_loan_size
      FROM loan_books 
      WHERE tenant_id = ${tenantId}
    `;
    
    const result = await db.execute(query);
    const summary = result.rows?.[0] || {};
    
    // Get recent loans
    const recentQuery = sql`
      SELECT * FROM loan_books 
      WHERE tenant_id = ${tenantId}
      ORDER BY created_at DESC 
      LIMIT 5
    `;
    
    const recentResult = await db.execute(recentQuery);
    const recentLoans = V8DataTransformer.transformLoans(recentResult.rows || []);
    const loans = recentLoans; // For analytics calculation
    
    return { summary, recent: recentLoans, loans };
  }

  private static async getOptimizedPaymentOverview(tenantId: string) {
    const query = sql`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'paid' THEN CAST(paid_amount AS NUMERIC) ELSE 0 END) as total_collected,
        COUNT(*) FILTER (WHERE status = 'overdue') as overdue_count,
        COUNT(*) FILTER (WHERE status = 'paid') as paid_count
      FROM payment_schedules 
      WHERE tenant_id = ${tenantId}
    `;
    
    const result = await db.execute(query);
    const summary = result.rows?.[0] || {};
    
    // Get recent payments
    const recentQuery = sql`
      SELECT * FROM payment_schedules 
      WHERE tenant_id = ${tenantId}
      AND status = 'paid'
      ORDER BY paid_date DESC 
      LIMIT 10
    `;
    
    const recentResult = await db.execute(recentQuery);
    const recent = V8DataTransformer.transformPaymentSchedules(recentResult.rows || []);
    const schedules = recent; // For analytics calculation
    
    return { summary, recent, schedules };
  }
}

/**
 * Export the integrated V8 storage
 */
export const v8Storage = {
  optimized: V8OptimizedStorage,
  dashboard: V8DashboardService
};