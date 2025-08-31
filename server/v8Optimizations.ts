/**
 * V8 Performance Optimizations for Money Flow
 * Implements hidden class optimization patterns, monomorphic functions,
 * and memory-efficient data structures for enterprise-scale performance
 */

// V8 Hidden Class Optimization: Consistent Object Shapes
// These classes ensure V8 creates optimal hidden classes with consistent property layouts

/**
 * Optimized Customer Data Structure
 * Maintains consistent object shape for V8 hidden class optimization
 */
export class OptimizedCustomer {
  readonly id: number;
  readonly tenantId: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly phone: string;
  readonly address: string;
  readonly nationalId: string | null;
  readonly creditScore: number | null;
  readonly status: string;
  readonly isPortalActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(data: any) {
    // Initialize ALL properties in consistent order for V8 hidden class optimization
    this.id = data.id || 0;
    this.tenantId = data.tenantId || '';
    this.firstName = data.firstName || '';
    this.lastName = data.lastName || '';
    this.email = data.email || '';
    this.phone = data.phone || '';
    this.address = data.address || '';
    this.nationalId = data.nationalId || null;
    this.creditScore = data.creditScore || null;
    this.status = data.status || 'active';
    this.isPortalActive = data.isPortalActive || false;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  // Monomorphic method for full name calculation (single object shape)
  getFullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  // Monomorphic method for display format
  getDisplayFormat(): string {
    return `${this.getFullName()} (${this.email})`;
  }
}

/**
 * Optimized Loan Data Structure
 * Consistent shape for high-frequency loan operations
 */
export class OptimizedLoan {
  readonly id: number;
  readonly tenantId: string;
  readonly customerId: number;
  readonly loanProductId: number | null;
  readonly loanAmount: number;
  readonly interestRate: number;
  readonly term: number;
  readonly status: string;
  readonly purpose: string | null;
  readonly dateApplied: Date | null;
  readonly approvalDate: Date | null;
  readonly disbursementDate: Date | null;
  readonly outstandingBalance: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(data: any) {
    // Consistent property initialization order for V8 optimization
    this.id = data.id || 0;
    this.tenantId = data.tenantId || '';
    this.customerId = data.customerId || 0;
    this.loanProductId = data.loanProductId || null;
    this.loanAmount = typeof data.loanAmount === 'string' ? parseFloat(data.loanAmount) : (data.loanAmount || 0);
    this.interestRate = typeof data.interestRate === 'string' ? parseFloat(data.interestRate) : (data.interestRate || 0);
    this.term = data.term || 0;
    this.status = data.status || 'pending';
    this.purpose = data.purpose || null;
    this.dateApplied = data.dateApplied || null;
    this.approvalDate = data.approvalDate || null;
    this.disbursementDate = data.disbursementDate || null;
    this.outstandingBalance = typeof data.outstandingBalance === 'string' ? parseFloat(data.outstandingBalance) : (data.outstandingBalance || 0);
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  // Monomorphic calculation methods (consistent number operations)
  calculateMonthlyPayment(): number {
    const principal = this.loanAmount;
    const monthlyRate = this.interestRate / 100 / 12;
    const numPayments = this.term;
    
    if (monthlyRate === 0) return principal / numPayments;
    
    return principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
           (Math.pow(1 + monthlyRate, numPayments) - 1);
  }

  calculateTotalInterest(): number {
    return (this.calculateMonthlyPayment() * this.term) - this.loanAmount;
  }

  isOverdue(): boolean {
    return this.status === 'overdue';
  }
}

/**
 * Optimized Payment Schedule Structure
 * Consistent shape for payment operations
 */
export class OptimizedPaymentSchedule {
  readonly id: number;
  readonly tenantId: string;
  readonly loanId: number;
  readonly dueDate: Date;
  readonly amount: number;
  readonly principalAmount: number;
  readonly interestAmount: number;
  readonly status: string;
  readonly paidDate: Date | null;
  readonly paidAmount: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(data: any) {
    // Consistent initialization for V8 hidden class optimization
    this.id = data.id || 0;
    this.tenantId = data.tenantId || '';
    this.loanId = data.loanId || 0;
    this.dueDate = data.dueDate || new Date();
    this.amount = typeof data.amount === 'string' ? parseFloat(data.amount) : (data.amount || 0);
    this.principalAmount = typeof data.principalAmount === 'string' ? parseFloat(data.principalAmount) : (data.principalAmount || 0);
    this.interestAmount = typeof data.interestAmount === 'string' ? parseFloat(data.interestAmount) : (data.interestAmount || 0);
    this.status = data.status || 'pending';
    this.paidDate = data.paidDate || null;
    this.paidAmount = typeof data.paidAmount === 'string' ? parseFloat(data.paidAmount) : (data.paidAmount || 0);
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  // Monomorphic status checks
  isPaid(): boolean {
    return this.status === 'paid';
  }

  isOverdue(): boolean {
    return this.status === 'overdue' || (this.status === 'pending' && this.dueDate < new Date());
  }

  // Monomorphic amount calculations
  getRemainingAmount(): number {
    return this.amount - this.paidAmount;
  }
}

/**
 * V8-Optimized Calculation Engine
 * Monomorphic functions for financial calculations to enable inline caching
 */
export class V8OptimizedCalculations {
  
  // Monomorphic amortization calculation (single number type path)
  static calculateAmortizationSchedule(
    principal: number,
    annualRate: number,
    termMonths: number
  ): Array<{
    paymentNumber: number;
    payment: number;
    principal: number;
    interest: number;
    balance: number;
  }> {
    const monthlyRate = annualRate / 100 / 12;
    const monthlyPayment = monthlyRate === 0 
      ? principal / termMonths
      : principal * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
        (Math.pow(1 + monthlyRate, termMonths) - 1);
    
    let remainingBalance = principal;
    const schedule: Array<{
      paymentNumber: number;
      payment: number;
      principal: number;
      interest: number;
      balance: number;
    }> = [];

    for (let i = 1; i <= termMonths; i++) {
      const interestPayment = remainingBalance * monthlyRate;
      const principalPayment = monthlyPayment - interestPayment;
      remainingBalance = Math.max(0, remainingBalance - principalPayment);
      
      // Consistent object shape for V8 optimization
      schedule.push({
        paymentNumber: i,
        payment: monthlyPayment,
        principal: principalPayment,
        interest: interestPayment,
        balance: remainingBalance
      });
    }

    return schedule;
  }

  // Monomorphic portfolio analysis (consistent data types)
  static analyzePortfolio(loans: OptimizedLoan[]): {
    totalPortfolio: number;
    averageLoanSize: number;
    totalInterest: number;
    activeLoans: number;
    overdueLoans: number;
    portfolioHealthScore: number;
  } {
    let totalPortfolio = 0;
    let totalInterest = 0;
    let activeLoans = 0;
    let overdueLoans = 0;

    // Monomorphic loop with consistent operations
    for (let i = 0; i < loans.length; i++) {
      const loan = loans[i];
      
      if (loan.status === 'disbursed' || loan.status === 'approved') {
        totalPortfolio += loan.loanAmount;
        totalInterest += loan.calculateTotalInterest();
        activeLoans++;
      }
      
      if (loan.isOverdue()) {
        overdueLoans++;
      }
    }

    const averageLoanSize = activeLoans > 0 ? totalPortfolio / activeLoans : 0;
    const portfolioHealthScore = activeLoans > 0 ? 
      Math.max(0, 100 - ((overdueLoans / activeLoans) * 100)) : 100;

    // Consistent return object shape
    return {
      totalPortfolio,
      averageLoanSize,
      totalInterest,
      activeLoans,
      overdueLoans,
      portfolioHealthScore
    };
  }

  // Monomorphic payment processing (single code path)
  static processPayment(schedule: OptimizedPaymentSchedule, amount: number): {
    success: boolean;
    remainingAmount: number;
    overpayment: number;
    status: string;
  } {
    const remaining = schedule.getRemainingAmount();
    const overpayment = Math.max(0, amount - remaining);
    const success = amount >= remaining;
    const status = success ? 'paid' : 'partial';

    // Consistent return shape for V8 optimization
    return {
      success,
      remainingAmount: success ? 0 : remaining - amount,
      overpayment,
      status
    };
  }
}

/**
 * V8-Optimized Data Transformation Layer
 * Converts raw database results to optimized objects with consistent shapes
 */
export class V8DataTransformer {
  
  // Transform raw customer data to optimized objects
  static transformCustomers(rawData: any[]): OptimizedCustomer[] {
    const customers: OptimizedCustomer[] = [];
    
    // Pre-allocate array with known size for V8 optimization
    customers.length = rawData.length;
    
    for (let i = 0; i < rawData.length; i++) {
      customers[i] = new OptimizedCustomer(rawData[i]);
    }
    
    return customers;
  }

  // Transform raw loan data to optimized objects
  static transformLoans(rawData: any[]): OptimizedLoan[] {
    const loans: OptimizedLoan[] = [];
    
    // Pre-allocate for V8 optimization
    loans.length = rawData.length;
    
    for (let i = 0; i < rawData.length; i++) {
      loans[i] = new OptimizedLoan(rawData[i]);
    }
    
    return loans;
  }

  // Transform raw payment schedule data
  static transformPaymentSchedules(rawData: any[]): OptimizedPaymentSchedule[] {
    const schedules: OptimizedPaymentSchedule[] = [];
    
    // Pre-allocate for V8 optimization
    schedules.length = rawData.length;
    
    for (let i = 0; i < rawData.length; i++) {
      schedules[i] = new OptimizedPaymentSchedule(rawData[i]);
    }
    
    return schedules;
  }
}

/**
 * V8-Optimized Memory Pool for Large Dataset Operations
 * Implements object pooling to reduce garbage collection pressure
 */
export class V8MemoryPool {
  private customerPool: OptimizedCustomer[] = [];
  private loanPool: OptimizedLoan[] = [];
  private schedulePool: OptimizedPaymentSchedule[] = [];
  
  private readonly MAX_POOL_SIZE = 1000; // Prevent memory leaks

  // Reuse customer objects to reduce GC pressure
  getCustomer(data: any): OptimizedCustomer {
    let customer = this.customerPool.pop();
    if (!customer) {
      customer = new OptimizedCustomer(data);
    } else {
      // Reuse existing object, maintaining hidden class
      Object.assign(customer, new OptimizedCustomer(data));
    }
    return customer;
  }

  // Return customer to pool for reuse
  releaseCustomer(customer: OptimizedCustomer): void {
    if (this.customerPool.length < this.MAX_POOL_SIZE) {
      this.customerPool.push(customer);
    }
  }

  // Similar pattern for loans
  getLoan(data: any): OptimizedLoan {
    let loan = this.loanPool.pop();
    if (!loan) {
      loan = new OptimizedLoan(data);
    } else {
      Object.assign(loan, new OptimizedLoan(data));
    }
    return loan;
  }

  releaseLoan(loan: OptimizedLoan): void {
    if (this.loanPool.length < this.MAX_POOL_SIZE) {
      this.loanPool.push(loan);
    }
  }

  // Clean up pools periodically to prevent memory leaks
  cleanup(): void {
    this.customerPool.length = Math.min(this.customerPool.length, this.MAX_POOL_SIZE / 2);
    this.loanPool.length = Math.min(this.loanPool.length, this.MAX_POOL_SIZE / 2);
    this.schedulePool.length = Math.min(this.schedulePool.length, this.MAX_POOL_SIZE / 2);
  }
}

// Singleton instance for application-wide use
export const memoryPool = new V8MemoryPool();

/**
 * V8-Optimized Query Result Cache
 * Implements intelligent caching with object shape consistency
 */
export class V8OptimizedCache {
  private cache = new Map<string, {
    data: any;
    timestamp: number;
    ttl: number;
  }>();

  private readonly DEFAULT_TTL = 300000; // 5 minutes
  private readonly MAX_CACHE_SIZE = 10000;

  set(key: string, data: any, ttl: number = this.DEFAULT_TTL): void {
    // Prevent cache from growing too large
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      this.cleanup();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    // Check if item has expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  // Monomorphic cache key generation
  static generateTenantKey(tenantId: string, resource: string, params?: string): string {
    return params ? `${tenantId}:${resource}:${params}` : `${tenantId}:${resource}`;
  }

  // Clear expired entries
  private cleanup(): void {
    const now = Date.now();
    const toDelete: string[] = [];

    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        toDelete.push(key);
      }
    }

    for (const key of toDelete) {
      this.cache.delete(key);
    }

    // If still too large, remove oldest entries
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const entries = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toRemove = entries.slice(0, this.MAX_CACHE_SIZE / 4);
      for (const [key] of toRemove) {
        this.cache.delete(key);
      }
    }
  }

  // Clear all cached data for a tenant
  clearTenantCache(tenantId: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${tenantId}:`)) {
        this.cache.delete(key);
      }
    }
  }
}

// Singleton cache instance
export const v8Cache = new V8OptimizedCache();

/**
 * V8-Optimized Financial Calculations
 * Implements monomorphic calculation patterns for maximum performance
 */
export class V8FinancialCalculations {
  
  // Monomorphic interest calculation (single number path)
  static calculateCompoundInterest(
    principal: number,
    rate: number,
    time: number,
    compoundingFrequency: number = 12
  ): number {
    return principal * Math.pow(1 + (rate / 100 / compoundingFrequency), compoundingFrequency * time);
  }

  // Monomorphic EMI calculation
  static calculateEMI(principal: number, rate: number, tenure: number): number {
    const monthlyRate = rate / 100 / 12;
    if (monthlyRate === 0) return principal / tenure;
    
    return principal * monthlyRate * Math.pow(1 + monthlyRate, tenure) / 
           (Math.pow(1 + monthlyRate, tenure) - 1);
  }

  // Monomorphic portfolio risk assessment
  static calculatePortfolioRisk(loans: OptimizedLoan[]): {
    riskScore: number;
    concentration: number;
    averageAge: number;
    defaultRate: number;
  } {
    if (loans.length === 0) {
      return { riskScore: 0, concentration: 0, averageAge: 0, defaultRate: 0 };
    }

    let totalValue = 0;
    let overdueValue = 0;
    let totalAge = 0;
    let overdueCount = 0;

    // Monomorphic processing loop
    for (let i = 0; i < loans.length; i++) {
      const loan = loans[i];
      totalValue += loan.loanAmount;
      
      if (loan.isOverdue()) {
        overdueValue += loan.loanAmount;
        overdueCount++;
      }

      if (loan.createdAt) {
        totalAge += (Date.now() - loan.createdAt.getTime());
      }
    }

    const defaultRate = (overdueCount / loans.length) * 100;
    const concentration = Math.max(...loans.map(l => l.loanAmount)) / totalValue * 100;
    const averageAge = totalAge / loans.length / (1000 * 60 * 60 * 24); // Days
    const riskScore = Math.min(100, defaultRate * 2 + (concentration > 20 ? 20 : 0));

    return {
      riskScore,
      concentration,
      averageAge,
      defaultRate
    };
  }
}

/**
 * V8 Performance Monitoring
 * Tracks V8 optimization effectiveness
 */
export class V8PerformanceMonitor {
  private static metrics = {
    objectCreations: 0,
    cacheHits: 0,
    cacheMisses: 0,
    calculationTimes: [] as number[],
    memoryUsage: [] as number[]
  };

  static trackObjectCreation(): void {
    this.metrics.objectCreations++;
  }

  static trackCacheHit(): void {
    this.metrics.cacheHits++;
  }

  static trackCacheMiss(): void {
    this.metrics.cacheMisses++;
  }

  static trackCalculation<T>(operation: () => T): T {
    const start = performance.now();
    const result = operation();
    const duration = performance.now() - start;
    
    this.metrics.calculationTimes.push(duration);
    
    // Keep only recent measurements
    if (this.metrics.calculationTimes.length > 1000) {
      this.metrics.calculationTimes = this.metrics.calculationTimes.slice(-500);
    }
    
    return result;
  }

  static getMetrics(): {
    objectCreations: number;
    cacheHitRate: number;
    averageCalculationTime: number;
    memoryTrend: number;
  } {
    const totalCacheAccess = this.metrics.cacheHits + this.metrics.cacheMisses;
    const cacheHitRate = totalCacheAccess > 0 ? (this.metrics.cacheHits / totalCacheAccess) * 100 : 0;
    
    const avgCalcTime = this.metrics.calculationTimes.length > 0 
      ? this.metrics.calculationTimes.reduce((a, b) => a + b, 0) / this.metrics.calculationTimes.length
      : 0;

    const memoryTrend = this.metrics.memoryUsage.length > 1
      ? this.metrics.memoryUsage[this.metrics.memoryUsage.length - 1] - this.metrics.memoryUsage[0]
      : 0;

    return {
      objectCreations: this.metrics.objectCreations,
      cacheHitRate,
      averageCalculationTime: avgCalcTime,
      memoryTrend
    };
  }

  static reset(): void {
    this.metrics = {
      objectCreations: 0,
      cacheHits: 0,
      cacheMisses: 0,
      calculationTimes: [],
      memoryUsage: []
    };
  }
}

// Periodic memory monitoring
setInterval(() => {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    const usage = process.memoryUsage();
    V8PerformanceMonitor['metrics'].memoryUsage.push(usage.heapUsed);
    
    // Keep only recent measurements
    if (V8PerformanceMonitor['metrics'].memoryUsage.length > 100) {
      V8PerformanceMonitor['metrics'].memoryUsage = 
        V8PerformanceMonitor['metrics'].memoryUsage.slice(-50);
    }
  }
  
  // Periodic memory pool cleanup
  memoryPool.cleanup();
}, 60000); // Every minute