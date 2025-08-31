/**
 * V8 Monomorphic Calculation Engines
 * Implements single-type code paths to enable V8 inline caching and optimization
 */

import { OptimizedLoan, OptimizedPaymentSchedule, V8PerformanceMonitor } from './v8Optimizations';

/**
 * Monomorphic Loan Calculation Engine
 * All methods operate on consistent data types to enable V8 optimization
 */
export class MonomorphicLoanEngine {
  
  /**
   * Calculate amortization with consistent number operations
   * Optimized for V8 inline caching - single code path for all calculations
   */
  static calculateAmortization(
    principal: number,
    annualRate: number,
    termMonths: number
  ): {
    monthlyPayment: number;
    totalInterest: number;
    totalPayment: number;
    schedule: Array<{
      month: number;
      payment: number;
      principal: number;
      interest: number;
      balance: number;
    }>;
  } {
    return V8PerformanceMonitor.trackCalculation(() => {
      const monthlyRate = annualRate / 100 / 12;
      let monthlyPayment: number;
      
      // Handle zero interest case with consistent number operations
      if (monthlyRate === 0) {
        monthlyPayment = principal / termMonths;
      } else {
        monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
                         (Math.pow(1 + monthlyRate, termMonths) - 1);
      }
      
      let remainingBalance = principal;
      const schedule: Array<{
        month: number;
        payment: number;
        principal: number;
        interest: number;
        balance: number;
      }> = [];
      
      // Pre-allocate array for V8 optimization
      schedule.length = termMonths;
      
      // Monomorphic loop with consistent operations
      for (let month = 1; month <= termMonths; month++) {
        const interestPayment = remainingBalance * monthlyRate;
        const principalPayment = monthlyPayment - interestPayment;
        remainingBalance = Math.max(0, remainingBalance - principalPayment);
        
        // Consistent object shape assignment
        schedule[month - 1] = {
          month,
          payment: monthlyPayment,
          principal: principalPayment,
          interest: interestPayment,
          balance: remainingBalance
        };
      }
      
      const totalPayment = monthlyPayment * termMonths;
      const totalInterest = totalPayment - principal;
      
      return {
        monthlyPayment,
        totalInterest,
        totalPayment,
        schedule
      };
    });
  }

  /**
   * Bulk loan processing with consistent object operations
   * Optimized for processing large datasets efficiently
   */
  static processLoanBatch(loans: OptimizedLoan[]): {
    processed: number;
    totalValue: number;
    averageRate: number;
    riskMetrics: {
      highRisk: number;
      mediumRisk: number;
      lowRisk: number;
    };
  } {
    return V8PerformanceMonitor.trackCalculation(() => {
      let processed = 0;
      let totalValue = 0;
      let totalRate = 0;
      let highRisk = 0;
      let mediumRisk = 0;
      let lowRisk = 0;
      
      // Monomorphic processing with consistent operations
      for (let i = 0; i < loans.length; i++) {
        const loan = loans[i];
        
        // Consistent number operations
        totalValue += loan.loanAmount;
        totalRate += loan.interestRate;
        processed++;
        
        // Risk categorization with consistent number comparisons
        if (loan.interestRate >= 15) {
          highRisk++;
        } else if (loan.interestRate >= 10) {
          mediumRisk++;
        } else {
          lowRisk++;
        }
      }
      
      const averageRate = processed > 0 ? totalRate / processed : 0;
      
      return {
        processed,
        totalValue,
        averageRate,
        riskMetrics: {
          highRisk,
          mediumRisk,
          lowRisk
        }
      };
    });
  }
}

/**
 * Monomorphic Payment Processing Engine
 * Optimized for high-frequency payment operations
 */
export class MonomorphicPaymentEngine {
  
  /**
   * Process payment with consistent number operations
   * Single code path for all payment scenarios
   */
  static processPayment(
    scheduleAmount: number,
    paidAmount: number,
    currentPaid: number = 0
  ): {
    status: 'paid' | 'partial' | 'overpaid';
    remainingAmount: number;
    overpayment: number;
    newPaidAmount: number;
  } {
    return V8PerformanceMonitor.trackCalculation(() => {
      const totalPaid = currentPaid + paidAmount;
      const remainingAmount = Math.max(0, scheduleAmount - totalPaid);
      const overpayment = Math.max(0, totalPaid - scheduleAmount);
      
      let status: 'paid' | 'partial' | 'overpaid';
      
      // Consistent number comparisons for status determination
      if (totalPaid >= scheduleAmount) {
        status = overpayment > 0 ? 'overpaid' : 'paid';
      } else {
        status = 'partial';
      }
      
      return {
        status,
        remainingAmount,
        overpayment,
        newPaidAmount: totalPaid
      };
    });
  }

  /**
   * Bulk payment processing with consistent operations
   */
  static processBulkPayments(
    schedules: OptimizedPaymentSchedule[],
    payments: Array<{ scheduleId: number; amount: number }>
  ): {
    processed: number;
    totalProcessed: number;
    errors: Array<{ scheduleId: number; error: string }>;
  } {
    return V8PerformanceMonitor.trackCalculation(() => {
      let processed = 0;
      let totalProcessed = 0;
      const errors: Array<{ scheduleId: number; error: string }> = [];
      
      // Create lookup map for fast access
      const scheduleMap = new Map<number, OptimizedPaymentSchedule>();
      for (let i = 0; i < schedules.length; i++) {
        scheduleMap.set(schedules[i].id, schedules[i]);
      }
      
      // Monomorphic processing loop
      for (let i = 0; i < payments.length; i++) {
        const payment = payments[i];
        const schedule = scheduleMap.get(payment.scheduleId);
        
        if (!schedule) {
          errors.push({
            scheduleId: payment.scheduleId,
            error: 'Schedule not found'
          });
          continue;
        }
        
        try {
          const result = this.processPayment(
            schedule.amount,
            payment.amount,
            schedule.paidAmount
          );
          
          processed++;
          totalProcessed += payment.amount;
        } catch (error) {
          errors.push({
            scheduleId: payment.scheduleId,
            error: error instanceof Error ? error.message : 'Processing failed'
          });
        }
      }
      
      return {
        processed,
        totalProcessed,
        errors
      };
    });
  }
}

/**
 * Monomorphic Analytics Engine
 * Consistent data processing for dashboard metrics and reports
 */
export class MonomorphicAnalyticsEngine {
  
  /**
   * Calculate dashboard metrics with monomorphic operations
   */
  static calculateDashboardMetrics(
    loans: OptimizedLoan[],
    schedules: OptimizedPaymentSchedule[],
    currentDate: Date = new Date()
  ): {
    portfolio: {
      totalValue: number;
      activeLoans: number;
      averageSize: number;
      growthRate: number;
    };
    payments: {
      totalCollected: number;
      overdueAmount: number;
      collectionRate: number;
      upcomingPayments: number;
    };
    risk: {
      defaultRate: number;
      portfolioRisk: number;
      concentrationRisk: number;
    };
  } {
    return V8PerformanceMonitor.trackCalculation(() => {
      // Portfolio calculations with consistent number operations
      let totalPortfolioValue = 0;
      let activeLoans = 0;
      let disbursedLoans = 0;
      
      for (let i = 0; i < loans.length; i++) {
        const loan = loans[i];
        
        if (loan.status === 'disbursed') {
          totalPortfolioValue += loan.loanAmount;
          activeLoans++;
          disbursedLoans++;
        } else if (loan.status === 'approved') {
          activeLoans++;
        }
      }
      
      // Payment calculations with consistent operations
      let totalCollected = 0;
      let overdueAmount = 0;
      let totalExpected = 0;
      let upcomingPayments = 0;
      let overdueCount = 0;
      
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();
      
      for (let i = 0; i < schedules.length; i++) {
        const schedule = schedules[i];
        
        totalExpected += schedule.amount;
        
        if (schedule.isPaid()) {
          totalCollected += schedule.paidAmount;
        } else {
          const dueMonth = schedule.dueDate.getMonth();
          const dueYear = schedule.dueDate.getFullYear();
          
          if (dueYear < currentYear || (dueYear === currentYear && dueMonth < currentMonth)) {
            overdueAmount += schedule.getRemainingAmount();
            overdueCount++;
          } else if (dueYear === currentYear && dueMonth === currentMonth) {
            upcomingPayments++;
          }
        }
      }
      
      // Risk calculations with consistent number operations
      const collectionRate = totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 100;
      const defaultRate = schedules.length > 0 ? (overdueCount / schedules.length) * 100 : 0;
      const averageSize = activeLoans > 0 ? totalPortfolioValue / activeLoans : 0;
      
      // Portfolio risk assessment
      const maxLoanAmount = loans.length > 0 ? Math.max(...loans.map(l => l.loanAmount)) : 0;
      const concentrationRisk = totalPortfolioValue > 0 ? (maxLoanAmount / totalPortfolioValue) * 100 : 0;
      const portfolioRisk = Math.min(100, defaultRate * 1.5 + (concentrationRisk > 25 ? 15 : 0));
      
      // Consistent return object shape
      return {
        portfolio: {
          totalValue: totalPortfolioValue,
          activeLoans,
          averageSize,
          growthRate: 0 // Would need historical data for actual calculation
        },
        payments: {
          totalCollected,
          overdueAmount,
          collectionRate,
          upcomingPayments
        },
        risk: {
          defaultRate,
          portfolioRisk,
          concentrationRisk
        }
      };
    });
  }
  
  /**
   * Time-series analysis with monomorphic date operations
   */
  static analyzeTimeSeries(
    data: Array<{ date: Date; value: number }>,
    windowDays: number = 30
  ): {
    trend: number;
    average: number;
    volatility: number;
    growth: number;
  } {
    return V8PerformanceMonitor.trackCalculation(() => {
      if (data.length === 0) {
        return { trend: 0, average: 0, volatility: 0, growth: 0 };
      }
      
      // Sort data by date for consistent processing
      const sortedData = data.slice().sort((a, b) => a.date.getTime() - b.date.getTime());
      
      let sum = 0;
      let count = 0;
      const values: number[] = [];
      
      // Monomorphic aggregation
      for (let i = 0; i < sortedData.length; i++) {
        sum += sortedData[i].value;
        count++;
        values.push(sortedData[i].value);
      }
      
      const average = count > 0 ? sum / count : 0;
      
      // Calculate volatility with consistent operations
      let varianceSum = 0;
      for (let i = 0; i < values.length; i++) {
        const diff = values[i] - average;
        varianceSum += diff * diff;
      }
      
      const volatility = count > 1 ? Math.sqrt(varianceSum / (count - 1)) : 0;
      
      // Calculate trend (simple linear regression slope)
      let trend = 0;
      if (values.length >= 2) {
        const firstValue = values[0];
        const lastValue = values[values.length - 1];
        trend = ((lastValue - firstValue) / firstValue) * 100;
      }
      
      // Growth rate calculation
      const growth = values.length >= 2 ? 
        ((values[values.length - 1] - values[0]) / values[0]) * 100 : 0;
      
      return {
        trend,
        average,
        volatility,
        growth
      };
    });
  }
}

/**
 * Monomorphic Database Query Optimizer
 * Optimizes query execution with consistent parameter types
 */
export class MonomorphicQueryOptimizer {
  
  /**
   * Optimize tenant-scoped queries with consistent parameter binding
   */
  static optimizeTenantQuery(
    baseQuery: string,
    tenantId: string,
    filters: Record<string, any> = {}
  ): {
    query: string;
    params: any[];
    estimatedRows: number;
  } {
    let optimizedQuery = baseQuery;
    const params: any[] = [tenantId];
    let estimatedRows = 1000; // Default estimate
    
    // Add tenant filter consistently
    if (!optimizedQuery.includes('WHERE')) {
      optimizedQuery += ' WHERE tenant_id = $1';
    } else if (!optimizedQuery.includes('tenant_id')) {
      optimizedQuery += ' AND tenant_id = $1';
    }
    
    // Apply additional filters with consistent parameter binding
    let paramIndex = 2;
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null) {
        optimizedQuery += ` AND ${key} = $${paramIndex}`;
        params.push(value);
        paramIndex++;
        
        // Adjust row estimates based on filter selectivity
        if (key === 'id') {
          estimatedRows = 1;
        } else if (key === 'status') {
          estimatedRows = Math.floor(estimatedRows * 0.3);
        } else {
          estimatedRows = Math.floor(estimatedRows * 0.7);
        }
      }
    }
    
    return {
      query: optimizedQuery,
      params,
      estimatedRows
    };
  }

  /**
   * Optimize date-range queries with consistent date operations
   */
  static optimizeDateRangeQuery(
    baseQuery: string,
    dateColumn: string,
    startDate: Date,
    endDate: Date,
    tenantId: string
  ): {
    query: string;
    params: any[];
  } {
    // Ensure consistent date formatting for V8 optimization
    const formattedStart = startDate.toISOString().split('T')[0];
    const formattedEnd = endDate.toISOString().split('T')[0];
    
    const dateFilter = ` AND ${dateColumn} >= $2 AND ${dateColumn} <= $3`;
    const optimizedQuery = baseQuery + dateFilter;
    
    return {
      query: optimizedQuery,
      params: [tenantId, formattedStart, formattedEnd]
    };
  }
}

/**
 * Monomorphic Data Aggregation Engine
 * Consistent aggregation operations for reports and analytics
 */
export class MonomorphicAggregationEngine {
  
  /**
   * Aggregate financial data with consistent number operations
   */
  static aggregateFinancialData(
    items: Array<{ amount: number; date: Date; category: string }>
  ): {
    total: number;
    byCategory: Record<string, number>;
    byMonth: Record<string, number>;
    average: number;
    count: number;
  } {
    return V8PerformanceMonitor.trackCalculation(() => {
      let total = 0;
      let count = 0;
      const byCategory: Record<string, number> = {};
      const byMonth: Record<string, number> = {};
      
      // Monomorphic aggregation loop
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const amount = item.amount;
        const category = item.category;
        const monthKey = `${item.date.getFullYear()}-${(item.date.getMonth() + 1).toString().padStart(2, '0')}`;
        
        // Consistent number operations
        total += amount;
        count++;
        
        // Category aggregation with consistent operations
        if (byCategory[category]) {
          byCategory[category] += amount;
        } else {
          byCategory[category] = amount;
        }
        
        // Monthly aggregation with consistent operations
        if (byMonth[monthKey]) {
          byMonth[monthKey] += amount;
        } else {
          byMonth[monthKey] = amount;
        }
      }
      
      const average = count > 0 ? total / count : 0;
      
      return {
        total,
        byCategory,
        byMonth,
        average,
        count
      };
    });
  }

  /**
   * Calculate moving averages with consistent operations
   */
  static calculateMovingAverage(
    values: number[],
    windowSize: number = 7
  ): number[] {
    return V8PerformanceMonitor.trackCalculation(() => {
      if (values.length === 0 || windowSize <= 0) {
        return [];
      }
      
      const result: number[] = [];
      // Pre-allocate for V8 optimization
      result.length = values.length - windowSize + 1;
      
      // Monomorphic sliding window calculation
      for (let i = 0; i <= values.length - windowSize; i++) {
        let sum = 0;
        
        // Inner loop with consistent number operations
        for (let j = i; j < i + windowSize; j++) {
          sum += values[j];
        }
        
        result[i] = sum / windowSize;
      }
      
      return result;
    });
  }
}

/**
 * V8-Optimized Memory Management for Large Datasets
 * Implements streaming and chunked processing for enterprise-scale data
 */
export class V8MemoryOptimizer {
  
  /**
   * Process large datasets in chunks to avoid memory pressure
   */
  static async processLargeDataset<T, R>(
    data: T[],
    processor: (chunk: T[]) => R[],
    chunkSize: number = 1000
  ): Promise<R[]> {
    const results: R[] = [];
    
    // Process in chunks to maintain consistent memory usage
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      const chunkResults = processor(chunk);
      
      // Consistent array operations
      for (let j = 0; j < chunkResults.length; j++) {
        results.push(chunkResults[j]);
      }
      
      // Allow garbage collection between chunks
      if (i % (chunkSize * 10) === 0) {
        await new Promise(resolve => setImmediate(resolve));
      }
    }
    
    return results;
  }

  /**
   * Streaming aggregation for memory efficiency
   */
  static streamingSum(
    getData: () => AsyncGenerator<number>,
    onProgress?: (processed: number, sum: number) => void
  ): Promise<{ sum: number; count: number; average: number }> {
    return new Promise(async (resolve) => {
      let sum = 0;
      let count = 0;
      
      // Monomorphic streaming processing
      for await (const value of getData()) {
        sum += value;
        count++;
        
        // Progress reporting with consistent operations
        if (onProgress && count % 1000 === 0) {
          onProgress(count, sum);
        }
      }
      
      const average = count > 0 ? sum / count : 0;
      
      resolve({
        sum,
        count,
        average
      });
    });
  }
}

/**
 * Export optimized engines for use throughout the application
 */
export const optimizedEngines = {
  loan: MonomorphicLoanEngine,
  payment: MonomorphicPaymentEngine,
  analytics: MonomorphicAnalyticsEngine,
  memory: V8MemoryOptimizer
};