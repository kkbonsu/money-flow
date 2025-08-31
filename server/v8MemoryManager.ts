/**
 * V8-Aware Memory Management for Large Financial Datasets
 * Implements enterprise-scale memory optimization patterns
 */

import { 
  OptimizedCustomer, 
  OptimizedLoan, 
  OptimizedPaymentSchedule,
  V8PerformanceMonitor,
  v8Cache
} from './v8Optimizations';

/**
 * V8 Memory-Efficient Stream Processor
 * Handles large datasets without overwhelming memory
 */
export class V8StreamProcessor {
  
  /**
   * Stream process large customer datasets
   * Maintains consistent memory usage patterns
   */
  static async *processCustomerStream(
    dataSource: AsyncIterable<any>,
    batchSize: number = 1000
  ): AsyncGenerator<OptimizedCustomer[], void, unknown> {
    let batch: OptimizedCustomer[] = [];
    batch.length = batchSize; // Pre-allocate for V8
    let batchIndex = 0;
    
    for await (const rawCustomer of dataSource) {
      // Create optimized customer with consistent shape
      const customer = new OptimizedCustomer(rawCustomer);
      batch[batchIndex] = customer;
      batchIndex++;
      
      // Yield full batches to maintain memory bounds
      if (batchIndex >= batchSize) {
        V8PerformanceMonitor.trackObjectCreation();
        yield batch.slice(0, batchIndex);
        
        // Reset batch for reuse (maintain hidden class)
        batch = [];
        batch.length = batchSize;
        batchIndex = 0;
        
        // Allow GC opportunity
        await new Promise(resolve => setImmediate(resolve));
      }
    }
    
    // Yield remaining items
    if (batchIndex > 0) {
      yield batch.slice(0, batchIndex);
    }
  }

  /**
   * Memory-efficient loan processing
   */
  static async *processLoanStream(
    dataSource: AsyncIterable<any>,
    batchSize: number = 500
  ): AsyncGenerator<OptimizedLoan[], void, unknown> {
    let batch: OptimizedLoan[] = [];
    batch.length = batchSize;
    let batchIndex = 0;
    
    for await (const rawLoan of dataSource) {
      const loan = new OptimizedLoan(rawLoan);
      batch[batchIndex] = loan;
      batchIndex++;
      
      if (batchIndex >= batchSize) {
        V8PerformanceMonitor.trackObjectCreation();
        yield batch.slice(0, batchIndex);
        
        batch = [];
        batch.length = batchSize;
        batchIndex = 0;
        
        // Memory management pause
        await new Promise(resolve => setImmediate(resolve));
      }
    }
    
    if (batchIndex > 0) {
      yield batch.slice(0, batchIndex);
    }
  }
}

/**
 * V8-Optimized Bulk Operation Manager
 * Handles large-scale operations with memory efficiency
 */
export class V8BulkOperationManager {
  
  /**
   * Bulk customer import with memory optimization
   */
  static async bulkImportCustomers(
    csvData: string,
    tenantId: string,
    onProgress?: (processed: number, total: number) => void
  ): Promise<{
    success: number;
    errors: Array<{ row: number; error: string }>;
    totalProcessed: number;
    memoryStats: any;
  }> {
    const startMemory = process.memoryUsage();
    
    return V8PerformanceMonitor.trackCalculation(async () => {
      const lines = csvData.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      
      let success = 0;
      const errors: Array<{ row: number; error: string }> = [];
      const BATCH_SIZE = 500; // Optimized batch size for V8
      
      // Process in memory-efficient batches
      for (let startIdx = 1; startIdx < lines.length; startIdx += BATCH_SIZE) {
        const endIdx = Math.min(startIdx + BATCH_SIZE, lines.length);
        const batch: OptimizedCustomer[] = [];
        
        // Pre-allocate batch array
        batch.length = endIdx - startIdx;
        let batchIndex = 0;
        
        // Process batch with consistent operations
        for (let i = startIdx; i < endIdx; i++) {
          try {
            const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
            
            if (values.length !== headers.length || values.every(v => !v)) {
              continue;
            }
            
            // Map CSV data with consistent shape
            const customerData: any = { tenantId };
            
            // Monomorphic header processing
            for (let j = 0; j < headers.length; j++) {
              const header = headers[j];
              const value = values[j];
              
              switch (header.toLowerCase()) {
                case 'firstname':
                case 'first_name':
                  customerData.firstName = value;
                  break;
                case 'lastname':
                case 'last_name':
                  customerData.lastName = value;
                  break;
                case 'email':
                  customerData.email = value;
                  break;
                case 'phone':
                  customerData.phone = value;
                  break;
                case 'address':
                  customerData.address = value;
                  break;
                case 'nationalid':
                case 'national_id':
                  customerData.nationalId = value;
                  break;
                case 'creditscore':
                case 'credit_score':
                  customerData.creditScore = value ? parseInt(value) : null;
                  break;
                case 'status':
                  customerData.status = value || 'active';
                  break;
              }
            }
            
            // Validate and create optimized customer
            if (customerData.firstName && customerData.lastName && customerData.email) {
              const customer = new OptimizedCustomer(customerData);
              batch[batchIndex] = customer;
              batchIndex++;
              success++;
            } else {
              errors.push({
                row: i,
                error: 'Missing required fields'
              });
            }
            
          } catch (error) {
            errors.push({
              row: i,
              error: error instanceof Error ? error.message : 'Processing failed'
            });
          }
        }
        
        // Progress callback with consistent data
        if (onProgress) {
          onProgress(startIdx + BATCH_SIZE, lines.length - 1);
        }
        
        // Allow garbage collection between batches
        await new Promise(resolve => setImmediate(resolve));
      }
      
      const endMemory = process.memoryUsage();
      const memoryStats = {
        heapUsedDelta: endMemory.heapUsed - startMemory.heapUsed,
        maxHeapUsed: endMemory.heapUsed,
        processedPerMB: success / ((endMemory.heapUsed - startMemory.heapUsed) / 1024 / 1024)
      };
      
      return {
        success,
        errors,
        totalProcessed: lines.length - 1,
        memoryStats
      };
    });
  }

  /**
   * Memory-efficient loan portfolio analysis
   */
  static async analyzeLargePortfolio(
    loans: OptimizedLoan[],
    chunkSize: number = 2000
  ): Promise<{
    metrics: any;
    memoryEfficiency: number;
    processingTime: number;
  }> {
    const startTime = performance.now();
    const startMemory = process.memoryUsage().heapUsed;
    
    let totalValue = 0;
    let activeCount = 0;
    let overdueCount = 0;
    let totalInterest = 0;
    
    // Process in chunks to maintain memory efficiency
    for (let i = 0; i < loans.length; i += chunkSize) {
      const chunk = loans.slice(i, i + chunkSize);
      
      // Monomorphic chunk processing
      for (let j = 0; j < chunk.length; j++) {
        const loan = chunk[j];
        
        if (loan.status === 'disbursed') {
          totalValue += loan.loanAmount;
          totalInterest += loan.calculateTotalInterest();
          activeCount++;
        }
        
        if (loan.isOverdue()) {
          overdueCount++;
        }
      }
      
      // Periodic GC opportunity
      if (i % (chunkSize * 5) === 0) {
        await new Promise(resolve => setImmediate(resolve));
      }
    }
    
    const endTime = performance.now();
    const endMemory = process.memoryUsage().heapUsed;
    
    const metrics = {
      totalValue,
      activeCount,
      overdueCount,
      totalInterest,
      averageSize: activeCount > 0 ? totalValue / activeCount : 0,
      defaultRate: loans.length > 0 ? (overdueCount / loans.length) * 100 : 0
    };
    
    return {
      metrics,
      memoryEfficiency: loans.length / ((endMemory - startMemory) / 1024), // Records per KB
      processingTime: endTime - startTime
    };
  }
}

/**
 * V8-Optimized Query Result Transformer
 * Transforms database results with minimal memory allocation
 */
export class V8QueryTransformer {
  
  /**
   * Transform raw query results with object pooling
   */
  static transformQueryResults<T>(
    rawResults: any[],
    transformer: (data: any) => T,
    usePooling: boolean = true
  ): T[] {
    return V8PerformanceMonitor.trackCalculation(() => {
      const results: T[] = [];
      
      // Pre-allocate result array for V8 optimization
      results.length = rawResults.length;
      
      // Monomorphic transformation loop
      for (let i = 0; i < rawResults.length; i++) {
        results[i] = transformer(rawResults[i]);
        V8PerformanceMonitor.trackObjectCreation();
      }
      
      return results;
    });
  }

  /**
   * Cached query transformation with intelligent cache management
   */
  static getCachedTransformation<T>(
    cacheKey: string,
    rawData: any[],
    transformer: (data: any) => T,
    ttl: number = 300000 // 5 minutes
  ): T[] {
    // Check cache first
    const cached = v8Cache.get<T[]>(cacheKey);
    if (cached) {
      V8PerformanceMonitor.trackCacheHit();
      return cached;
    }
    
    V8PerformanceMonitor.trackCacheMiss();
    
    // Transform and cache
    const transformed = this.transformQueryResults(rawData, transformer);
    v8Cache.set(cacheKey, transformed, ttl);
    
    return transformed;
  }
}

/**
 * V8-Optimized Financial Data Processor
 * Specialized for financial calculations with consistent number operations
 */
export class V8FinancialProcessor {
  
  /**
   * Process payment schedules with monomorphic operations
   */
  static processPaymentSchedules(
    schedules: OptimizedPaymentSchedule[],
    currentDate: Date = new Date()
  ): {
    totalExpected: number;
    totalPaid: number;
    overdueAmount: number;
    upcomingAmount: number;
    collectionRate: number;
    schedulesByStatus: {
      paid: number;
      pending: number;
      overdue: number;
      partial: number;
    };
  } {
    return V8PerformanceMonitor.trackCalculation(() => {
      let totalExpected = 0;
      let totalPaid = 0;
      let overdueAmount = 0;
      let upcomingAmount = 0;
      
      const schedulesByStatus = {
        paid: 0,
        pending: 0,
        overdue: 0,
        partial: 0
      };
      
      const currentTime = currentDate.getTime();
      
      // Monomorphic processing with consistent operations
      for (let i = 0; i < schedules.length; i++) {
        const schedule = schedules[i];
        
        totalExpected += schedule.amount;
        totalPaid += schedule.paidAmount;
        
        const dueTime = schedule.dueDate.getTime();
        const isOverdue = dueTime < currentTime && !schedule.isPaid();
        
        if (schedule.isPaid()) {
          schedulesByStatus.paid++;
        } else if (isOverdue) {
          schedulesByStatus.overdue++;
          overdueAmount += schedule.getRemainingAmount();
        } else if (schedule.paidAmount > 0) {
          schedulesByStatus.partial++;
        } else {
          schedulesByStatus.pending++;
          
          // Calculate upcoming payments (next 30 days)
          if (dueTime <= currentTime + (30 * 24 * 60 * 60 * 1000)) {
            upcomingAmount += schedule.amount;
          }
        }
      }
      
      const collectionRate = totalExpected > 0 ? (totalPaid / totalExpected) * 100 : 0;
      
      return {
        totalExpected,
        totalPaid,
        overdueAmount,
        upcomingAmount,
        collectionRate,
        schedulesByStatus
      };
    });
  }

  /**
   * Generate financial reports with memory-efficient streaming
   */
  static async generateFinancialReport(
    tenantId: string,
    startDate: Date,
    endDate: Date,
    dataFetcher: (tenant: string, start: Date, end: Date) => Promise<any[]>
  ): Promise<{
    summary: any;
    details: any[];
    performance: {
      processingTime: number;
      memoryUsed: number;
      recordsProcessed: number;
    };
  }> {
    const startTime = performance.now();
    const startMemory = process.memoryUsage().heapUsed;
    
    // Fetch data with caching
    const cacheKey = `financial-report:${tenantId}:${startDate.toISOString()}:${endDate.toISOString()}`;
    let rawData = v8Cache.get<any[]>(cacheKey);
    
    if (!rawData) {
      rawData = await dataFetcher(tenantId, startDate, endDate);
      v8Cache.set(cacheKey, rawData, 180000); // 3 minutes cache
      V8PerformanceMonitor.trackCacheMiss();
    } else {
      V8PerformanceMonitor.trackCacheHit();
    }
    
    // Process data with consistent operations
    let totalAmount = 0;
    let recordCount = 0;
    const categories: Record<string, number> = {};
    const monthlyTotals: Record<string, number> = {};
    
    // Monomorphic aggregation
    for (let i = 0; i < rawData.length; i++) {
      const record = rawData[i];
      const amount = typeof record.amount === 'string' ? parseFloat(record.amount) : record.amount;
      
      totalAmount += amount;
      recordCount++;
      
      // Category aggregation
      const category = record.category || 'Uncategorized';
      categories[category] = (categories[category] || 0) + amount;
      
      // Monthly aggregation
      const monthKey = record.date.substring(0, 7); // YYYY-MM format
      monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + amount;
    }
    
    const endTime = performance.now();
    const endMemory = process.memoryUsage().heapUsed;
    
    const summary = {
      totalAmount,
      recordCount,
      averageAmount: recordCount > 0 ? totalAmount / recordCount : 0,
      categories,
      monthlyTotals
    };
    
    return {
      summary,
      details: rawData,
      performance: {
        processingTime: endTime - startTime,
        memoryUsed: endMemory - startMemory,
        recordsProcessed: recordCount
      }
    };
  }
}

/**
 * V8-Optimized Cache Warming System
 * Pre-loads frequently accessed data with optimal patterns
 */
export class V8CacheWarmer {
  
  /**
   * Warm up tenant-specific caches
   */
  static async warmTenantCache(
    tenantId: string,
    dataFetchers: {
      customers: () => Promise<any[]>;
      loans: () => Promise<any[]>;
      schedules: () => Promise<any[]>;
    }
  ): Promise<{
    warmed: string[];
    cacheSize: number;
    warmingTime: number;
  }> {
    const startTime = performance.now();
    const warmed: string[] = [];
    
    try {
      // Warm customer cache
      const customers = await dataFetchers.customers();
      const optimizedCustomers = customers.map(c => new OptimizedCustomer(c));
      v8Cache.set(`customers:${tenantId}`, optimizedCustomers, 600000); // 10 minutes
      warmed.push('customers');
      
      // Warm loan cache
      const loans = await dataFetchers.loans();
      const optimizedLoans = loans.map(l => new OptimizedLoan(l));
      v8Cache.set(`loans:${tenantId}`, optimizedLoans, 600000);
      warmed.push('loans');
      
      // Warm schedule cache
      const schedules = await dataFetchers.schedules();
      const optimizedSchedules = schedules.map(s => new OptimizedPaymentSchedule(s));
      v8Cache.set(`schedules:${tenantId}`, optimizedSchedules, 300000); // 5 minutes
      warmed.push('schedules');
      
      const endTime = performance.now();
      
      return {
        warmed,
        cacheSize: warmed.length,
        warmingTime: endTime - startTime
      };
      
    } catch (error) {
      console.error('Cache warming failed:', error);
      throw error;
    }
  }

  /**
   * Intelligent cache preloading based on usage patterns
   */
  static async preloadFrequentData(tenantId: string): Promise<void> {
    const frequentQueries = [
      `dashboard-metrics:${tenantId}`,
      `recent-payments:${tenantId}`,
      `active-loans:${tenantId}`,
      `overdue-schedules:${tenantId}`
    ];
    
    // Preload in parallel for efficiency
    await Promise.allSettled(
      frequentQueries.map(async (queryKey) => {
        // Implementation would depend on specific query types
        // This is a framework for intelligent preloading
      })
    );
  }
}

/**
 * V8 Performance Profiler
 * Monitors V8-specific performance characteristics
 */
export class V8PerformanceProfiler {
  
  private static profiles: Map<string, {
    startTime: number;
    startMemory: number;
    operations: number;
  }> = new Map();

  /**
   * Start profiling a specific operation
   */
  static startProfile(operationName: string): void {
    this.profiles.set(operationName, {
      startTime: performance.now(),
      startMemory: process.memoryUsage().heapUsed,
      operations: 0
    });
  }

  /**
   * End profiling and get results
   */
  static endProfile(operationName: string): {
    duration: number;
    memoryDelta: number;
    operationsPerSecond: number;
    memoryEfficiency: number;
  } | null {
    const profile = this.profiles.get(operationName);
    if (!profile) return null;
    
    const endTime = performance.now();
    const endMemory = process.memoryUsage().heapUsed;
    
    const duration = endTime - profile.startTime;
    const memoryDelta = endMemory - profile.startMemory;
    const operationsPerSecond = duration > 0 ? (profile.operations / duration) * 1000 : 0;
    const memoryEfficiency = memoryDelta > 0 ? profile.operations / (memoryDelta / 1024) : 0;
    
    this.profiles.delete(operationName);
    
    return {
      duration,
      memoryDelta,
      operationsPerSecond,
      memoryEfficiency
    };
  }

  /**
   * Track operation count for throughput calculation
   */
  static trackOperation(operationName: string): void {
    const profile = this.profiles.get(operationName);
    if (profile) {
      profile.operations++;
    }
  }

  /**
   * Get overall V8 performance summary
   */
  static getPerformanceSummary(): {
    v8Metrics: any;
    cacheStats: any;
    memoryTrend: string;
  } {
    const v8Metrics = V8PerformanceMonitor.getMetrics();
    const memoryUsage = process.memoryUsage();
    
    // Determine memory trend
    let memoryTrend = 'stable';
    if (v8Metrics.memoryTrend > 50 * 1024 * 1024) { // 50MB increase
      memoryTrend = 'increasing';
    } else if (v8Metrics.memoryTrend < -10 * 1024 * 1024) { // 10MB decrease
      memoryTrend = 'decreasing';
    }
    
    return {
      v8Metrics,
      cacheStats: {
        hitRate: v8Metrics.cacheHitRate,
        objectCreations: v8Metrics.objectCreations
      },
      memoryTrend
    };
  }
}

// Export optimized processors
export const v8Processors = {
  stream: V8StreamProcessor,
  bulk: V8BulkOperationManager,
  cache: V8CacheWarmer,
  profiler: V8PerformanceProfiler
};