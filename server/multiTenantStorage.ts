import { 
  users, 
  customers,
  loanBooks, 
  paymentSchedules,
  staff, 
  incomeManagement, 
  expenses,
  bankManagement,
  pettyCash,
  inventory,
  rentManagement,
  assets,
  liabilities,
  equity,
  reports,
  userAuditLogs,
  mfiRegistration,
  shareholders,
  loanProducts,
  tenants,
  userTenantAccess,
  roles,
  permissions,
  rolePermissions,
  userRoles,
  supportTickets,
  supportMessages,
  type User, 
  type InsertUser,
  type Customer,
  type InsertCustomer,
  type LoanBook,
  type InsertLoanBook,
  type PaymentSchedule,
  type InsertPaymentSchedule,
  type Staff,
  type InsertStaff,
  type IncomeManagement,
  type InsertIncomeManagement,
  type Expense,
  type InsertExpense,
  type BankManagement,
  type InsertBankManagement,
  type PettyCash,
  type InsertPettyCash,
  type Inventory,
  type InsertInventory,
  type RentManagement,
  type InsertRentManagement,
  type Asset,
  type InsertAsset,
  type Liability,
  type InsertLiability,
  type Equity,
  type InsertEquity,
  type Report,
  type InsertReport,
  type UserAuditLog,
  type InsertUserAuditLog,
  type MfiRegistration,
  type InsertMfiRegistration,
  type Shareholder,
  type InsertShareholder,
  type LoanProduct,
  type InsertLoanProduct,
  type Tenant,
  type InsertTenant,
  type UserTenantAccess,
  type InsertUserTenantAccess,
  type TenantContext,
  type JwtPayload,
  type Role,
  type InsertRole,
  type Permission,
  type InsertPermission,
  type UserRole,
  type InsertUserRole,
  type RolePermission,
  type InsertRolePermission,
  type SupportTicket,
  type InsertSupportTicket,
  type SupportMessage,
  type InsertSupportMessage
} from "@shared/schema";
import { simpleTenants } from "@shared/tenantSchema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";

// Multi-tenant interface extending the existing IStorage
export interface IMultiTenantStorage {
  // Tenant management
  getTenant(tenantId: string): Promise<Tenant | undefined>;
  getTenantBySlug(slug: string): Promise<Tenant | undefined>;
  createTenant(tenant: InsertTenant): Promise<Tenant>;
  updateTenant(tenantId: string, tenant: Partial<InsertTenant>): Promise<Tenant>;
  
  // User tenant access
  getUserTenantAccess(userId: number): Promise<UserTenantAccess[]>;
  createUserTenantAccess(access: InsertUserTenantAccess): Promise<UserTenantAccess>;
  updateUserTenantAccess(id: number, access: Partial<InsertUserTenantAccess>): Promise<UserTenantAccess>;
  
  // Tenant-aware user methods
  getUser(tenantId: string, id: number): Promise<User | undefined>;
  getUserByUsername(tenantId: string, username: string): Promise<User | undefined>;
  getAllUsers(tenantId: string): Promise<User[]>;
  createUser(tenantId: string, user: InsertUser): Promise<User>;
  updateUser(tenantId: string, id: number, user: Partial<InsertUser>): Promise<User>;
  updateUserPassword(tenantId: string, id: number, hashedPassword: string): Promise<User>;
  updateUserLastLogin(tenantId: string, id: number): Promise<User>;
  deleteUser(tenantId: string, id: number): Promise<void>;
  
  // Tenant-aware customer methods
  getCustomers(tenantId: string): Promise<Customer[]>;
  getCustomer(tenantId: string, id: number): Promise<Customer | undefined>;
  getCustomerByEmail(tenantId: string, email: string): Promise<Customer | undefined>;
  createCustomer(tenantId: string, customer: InsertCustomer): Promise<Customer>;
  updateCustomer(tenantId: string, id: number, customer: Partial<InsertCustomer>): Promise<Customer>;
  updateCustomerPassword(tenantId: string, id: number, hashedPassword: string): Promise<Customer>;
  updateCustomerLastLogin(tenantId: string, id: number): Promise<Customer>;
  deleteCustomer(tenantId: string, id: number): Promise<void>;
  
  // Customer portal methods (tenant-aware)
  getCustomerLoans(tenantId: string, customerId: number): Promise<LoanBook[]>;
  getCustomerPayments(tenantId: string, customerId: number): Promise<PaymentSchedule[]>;
  getCustomerUpcomingPayments(tenantId: string, customerId: number): Promise<PaymentSchedule[]>;

  // Tenant-aware loan product methods
  getLoanProducts(tenantId: string): Promise<LoanProduct[]>;
  getLoanProduct(tenantId: string, id: number): Promise<LoanProduct | undefined>;
  createLoanProduct(tenantId: string, loanProduct: InsertLoanProduct): Promise<LoanProduct>;
  updateLoanProduct(tenantId: string, id: number, loanProduct: Partial<InsertLoanProduct>): Promise<LoanProduct>;
  deleteLoanProduct(tenantId: string, id: number): Promise<void>;

  // Tenant-aware loan methods
  getLoans(tenantId: string): Promise<LoanBook[]>;
  getLoan(tenantId: string, id: number): Promise<LoanBook | undefined>;
  createLoan(tenantId: string, loan: InsertLoanBook): Promise<LoanBook>;
  updateLoan(tenantId: string, id: number, loan: Partial<InsertLoanBook>): Promise<LoanBook>;
  deleteLoan(tenantId: string, id: number): Promise<void>;

  // Tenant-aware payment schedule methods
  getPaymentSchedules(tenantId: string): Promise<PaymentSchedule[]>;
  getPaymentSchedule(tenantId: string, id: number): Promise<PaymentSchedule | undefined>;
  getPaymentSchedulesByLoan(tenantId: string, loanId: number): Promise<PaymentSchedule[]>;
  createPaymentSchedule(tenantId: string, schedule: InsertPaymentSchedule): Promise<PaymentSchedule>;
  updatePaymentSchedule(tenantId: string, id: number, schedule: Partial<InsertPaymentSchedule>): Promise<PaymentSchedule>;
  deletePaymentSchedule(tenantId: string, id: number): Promise<void>;

  // Tenant-aware staff methods
  getStaff(tenantId: string): Promise<Staff[]>;
  createStaff(tenantId: string, staff: InsertStaff): Promise<Staff>;
  updateStaff(tenantId: string, id: number, staff: Partial<InsertStaff>): Promise<Staff>;
  deleteStaff(tenantId: string, id: number): Promise<void>;

  // Tenant-aware income methods
  getIncome(tenantId: string): Promise<IncomeManagement[]>;
  createIncome(tenantId: string, income: InsertIncomeManagement): Promise<IncomeManagement>;
  updateIncome(tenantId: string, id: number, income: Partial<InsertIncomeManagement>): Promise<IncomeManagement>;
  deleteIncome(tenantId: string, id: number): Promise<void>;

  // Tenant-aware expense methods
  getExpenses(tenantId: string): Promise<Expense[]>;
  createExpense(tenantId: string, expense: InsertExpense): Promise<Expense>;
  updateExpense(tenantId: string, id: number, expense: Partial<InsertExpense>): Promise<Expense>;
  deleteExpense(tenantId: string, id: number): Promise<void>;

  // Tenant-aware bank account methods
  getBankAccounts(tenantId: string): Promise<BankManagement[]>;
  createBankAccount(tenantId: string, account: InsertBankManagement): Promise<BankManagement>;
  updateBankAccount(tenantId: string, id: number, account: Partial<InsertBankManagement>): Promise<BankManagement>;
  deleteBankAccount(tenantId: string, id: number): Promise<void>;

  // Dashboard metrics (tenant-aware)
  getDashboardMetrics(tenantId: string): Promise<any>;
  
  // Payment analytics methods (tenant-aware)
  getRecentPayments(tenantId: string): Promise<any>;
  getTodaysPayments(tenantId: string): Promise<any>;
  getMonthlyPayments(tenantId: string): Promise<any>;

  // Role and Permission Management
  getRoles(tenantId?: string): Promise<Role[]>;
  getRole(id: number): Promise<Role | undefined>;
  createRole(role: InsertRole): Promise<Role>;
  updateRole(id: number, role: Partial<InsertRole>): Promise<Role>;
  deleteRole(id: number): Promise<void>;

  getPermissions(): Promise<Permission[]>;
  getPermission(id: number): Promise<Permission | undefined>;
  getRolePermissions(roleId: number): Promise<Permission[]>;
  assignRolePermissions(roleId: number, permissionIds: number[]): Promise<void>;
  removeRolePermissions(roleId: number, permissionIds: number[]): Promise<void>;

  getUserRoles(tenantId: string): Promise<UserRole[]>;
  getUserRole(userId: number, tenantId: string): Promise<UserRole | undefined>;
  assignUserRole(userRole: InsertUserRole): Promise<UserRole>;
  updateUserRole(userId: number, tenantId: string, roleId: number): Promise<UserRole>;
  removeUserRole(userId: number, tenantId: string): Promise<void>;
}

// @ts-ignore - Temporarily suppress interface implementation warnings during migration
export class MultiTenantStorage implements IMultiTenantStorage {
  // Tenant management methods (updated for simple tenant structure)
  async getTenant(tenantId: string): Promise<any | undefined> {
    const [tenant] = await db.select().from(simpleTenants).where(eq(simpleTenants.id, tenantId));
    return tenant || undefined;
  }

  async getTenantBySlug(slug: string): Promise<any | undefined> {
    const [tenant] = await db.select().from(simpleTenants).where(eq(simpleTenants.slug, slug));
    return tenant || undefined;
  }

  async createTenant(insertTenant: any): Promise<any> {
    const [tenant] = await db
      .insert(simpleTenants)
      .values(insertTenant)
      .returning();
    return tenant;
  }

  async updateTenant(tenantId: string, updateTenant: any): Promise<any> {
    const [tenant] = await db
      .update(simpleTenants)
      .set({ ...updateTenant, updatedAt: new Date() })
      .where(eq(simpleTenants.id, tenantId))
      .returning();
    return tenant;
  }

  // User tenant access methods
  async getUserTenantAccess(userId: number): Promise<UserTenantAccess[]> {
    return await db
      .select()
      .from(userTenantAccess)
      .where(eq(userTenantAccess.userId, userId));
  }

  async createUserTenantAccess(insertAccess: InsertUserTenantAccess): Promise<UserTenantAccess> {
    const [access] = await db
      .insert(userTenantAccess)
      .values(insertAccess)
      .returning();
    return access;
  }

  async updateUserTenantAccess(id: number, updateAccess: Partial<InsertUserTenantAccess>): Promise<UserTenantAccess> {
    const [access] = await db
      .update(userTenantAccess)
      .set(updateAccess)
      .where(eq(userTenantAccess.id, id))
      .returning();
    return access;
  }

  // Tenant-aware user methods
  async getUser(tenantId: string, id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(and(eq(users.tenantId, tenantId), eq(users.id, id)));
    return user || undefined;
  }

  async getUserByUsername(tenantId: string, username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(and(eq(users.tenantId, tenantId), eq(users.username, username)));
    return user || undefined;
  }

  async getAllUsers(tenantId: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.tenantId, tenantId));
  }

  async createUser(tenantId: string, insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({ ...insertUser, tenantId })
      .returning();
    return user;
  }

  async updateUser(tenantId: string, id: number, updateUser: Partial<InsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updateUser, updatedAt: new Date() })
      .where(and(eq(users.tenantId, tenantId), eq(users.id, id)))
      .returning();
    return user;
  }

  async updateUserPassword(tenantId: string, id: number, hashedPassword: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(and(eq(users.tenantId, tenantId), eq(users.id, id)))
      .returning();
    return user;
  }

  async updateUserLastLogin(tenantId: string, id: number): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ lastLogin: new Date(), updatedAt: new Date() })
      .where(and(eq(users.tenantId, tenantId), eq(users.id, id)))
      .returning();
    return user;
  }

  async deleteUser(tenantId: string, id: number): Promise<void> {
    await db.delete(users).where(and(eq(users.tenantId, tenantId), eq(users.id, id)));
  }

  // User audit log methods (tenant-aware)
  async createUserAuditLog(tenantId: string, insertLog: InsertUserAuditLog): Promise<UserAuditLog> {
    const [log] = await db
      .insert(userAuditLogs)
      .values({ ...insertLog, tenantId })
      .returning();
    return log;
  }

  async getUserAuditLogs(tenantId: string, userId: number): Promise<UserAuditLog[]> {
    return await db
      .select()
      .from(userAuditLogs)
      .where(and(eq(userAuditLogs.tenantId, tenantId), eq(userAuditLogs.userId, userId)))
      .orderBy(desc(userAuditLogs.timestamp));
  }

  // Tenant-aware customer methods
  async getCustomers(tenantId: string): Promise<Customer[]> {
    return await db.select().from(customers).where(eq(customers.tenantId, tenantId)).orderBy(desc(customers.createdAt));
  }

  async getCustomer(tenantId: string, id: number): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(and(eq(customers.tenantId, tenantId), eq(customers.id, id)));
    return customer || undefined;
  }

  async getCustomerByEmail(tenantId: string, email: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(and(eq(customers.tenantId, tenantId), eq(customers.email, email)));
    return customer || undefined;
  }

  async createCustomer(tenantId: string, insertCustomer: InsertCustomer): Promise<Customer> {
    const [customer] = await db
      .insert(customers)
      .values({ ...insertCustomer, tenantId })
      .returning();
    return customer;
  }

  async updateCustomer(tenantId: string, id: number, updateCustomer: Partial<InsertCustomer>): Promise<Customer> {
    const [customer] = await db
      .update(customers)
      .set({ ...updateCustomer, updatedAt: new Date() })
      .where(and(eq(customers.tenantId, tenantId), eq(customers.id, id)))
      .returning();
    return customer;
  }

  async updateCustomerPassword(tenantId: string, id: number, hashedPassword: string): Promise<Customer> {
    const [customer] = await db
      .update(customers)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(and(eq(customers.tenantId, tenantId), eq(customers.id, id)))
      .returning();
    return customer;
  }

  async updateCustomerLastLogin(tenantId: string, id: number): Promise<Customer> {
    const [customer] = await db
      .update(customers)
      .set({ lastPortalLogin: new Date(), updatedAt: new Date() })
      .where(and(eq(customers.tenantId, tenantId), eq(customers.id, id)))
      .returning();
    return customer;
  }

  async deleteCustomer(tenantId: string, id: number): Promise<void> {
    console.log(`[MULTI_TENANT_DELETE] Starting deletion for customer ${id} in tenant ${tenantId}`);
    
    try {
      // Get all loans for this customer
      const customerLoans = await db.select().from(loanBooks)
        .where(and(eq(loanBooks.tenantId, tenantId), eq(loanBooks.customerId, id)));
      console.log(`[MULTI_TENANT_DELETE] Found ${customerLoans.length} loans for customer ${id}:`, customerLoans.map(l => l.id));
      
      // Delete payment schedules for each loan first
      for (const loan of customerLoans) {
        console.log(`[MULTI_TENANT_DELETE] Deleting payment schedules for loan ${loan.id}...`);
        const deletedSchedules = await db.delete(paymentSchedules)
          .where(and(eq(paymentSchedules.tenantId, tenantId), eq(paymentSchedules.loanId, loan.id)));
        console.log(`[MULTI_TENANT_DELETE] Deleted payment schedules for loan ${loan.id}:`, deletedSchedules);
      }
      
      // Delete all loans for this customer
      if (customerLoans.length > 0) {
        console.log(`[MULTI_TENANT_DELETE] Deleting ${customerLoans.length} loans for customer ${id}...`);
        const deletedLoans = await db.delete(loanBooks)
          .where(and(eq(loanBooks.tenantId, tenantId), eq(loanBooks.customerId, id)));
        console.log(`[MULTI_TENANT_DELETE] Deleted loans result:`, deletedLoans);
      }
      
      // Finally delete the customer
      console.log(`[MULTI_TENANT_DELETE] Deleting customer ${id}...`);
      const deletedCustomer = await db.delete(customers)
        .where(and(eq(customers.tenantId, tenantId), eq(customers.id, id)));
      console.log(`[MULTI_TENANT_DELETE] Deleted customer result:`, deletedCustomer);
      console.log(`[MULTI_TENANT_DELETE] Successfully deleted customer ${id}`);
      
    } catch (error) {
      console.error(`[MULTI_TENANT_DELETE] Error deleting customer ${id}:`, error);
      throw error;
    }
  }

  // Customer portal methods (tenant-aware)
  async getCustomerLoans(tenantId: string, customerId: number): Promise<LoanBook[]> {
    return await db.select().from(loanBooks).where(and(eq(loanBooks.tenantId, tenantId), eq(loanBooks.customerId, customerId)));
  }

  async getCustomerPayments(tenantId: string, customerId: number): Promise<PaymentSchedule[]> {
    const result = await db
      .select()
      .from(paymentSchedules)
      .where(
        and(
          eq(paymentSchedules.tenantId, tenantId),
          sql`${paymentSchedules.loanId} IN (
            SELECT id FROM loan_books WHERE tenant_id = ${tenantId} AND customer_id = ${customerId}
          )`
        )
      )
      .orderBy(desc(paymentSchedules.dueDate));
    
    return result;
  }

  async getCustomerUpcomingPayments(tenantId: string, customerId: number): Promise<PaymentSchedule[]> {
    const result = await db
      .select()
      .from(paymentSchedules)
      .where(
        and(
          eq(paymentSchedules.tenantId, tenantId),
          eq(paymentSchedules.status, 'pending'),
          sql`${paymentSchedules.loanId} IN (
            SELECT id FROM loan_books WHERE tenant_id = ${tenantId} AND customer_id = ${customerId}
          )`
        )
      )
      .orderBy(paymentSchedules.dueDate);
    
    return result;
  }

  // Tenant-aware loan product methods
  async getLoanProducts(tenantId: string): Promise<LoanProduct[]> {
    return await db.select().from(loanProducts).where(eq(loanProducts.tenantId, tenantId)).orderBy(desc(loanProducts.createdAt));
  }

  async getLoanProduct(tenantId: string, id: number): Promise<LoanProduct | undefined> {
    const [loanProduct] = await db.select().from(loanProducts).where(and(eq(loanProducts.tenantId, tenantId), eq(loanProducts.id, id)));
    return loanProduct || undefined;
  }

  async createLoanProduct(tenantId: string, insertLoanProduct: InsertLoanProduct): Promise<LoanProduct> {
    const [loanProduct] = await db
      .insert(loanProducts)
      .values({ ...insertLoanProduct, tenantId })
      .returning();
    return loanProduct;
  }

  async updateLoanProduct(tenantId: string, id: number, updateLoanProduct: Partial<InsertLoanProduct>): Promise<LoanProduct> {
    const [loanProduct] = await db
      .update(loanProducts)
      .set({ ...updateLoanProduct, updatedAt: new Date() })
      .where(and(eq(loanProducts.tenantId, tenantId), eq(loanProducts.id, id)))
      .returning();
    return loanProduct;
  }

  async deleteLoanProduct(tenantId: string, id: number): Promise<void> {
    await db.delete(loanProducts).where(and(eq(loanProducts.tenantId, tenantId), eq(loanProducts.id, id)));
  }

  // Tenant-aware loan methods
  async getLoans(tenantId: string): Promise<LoanBook[]> {
    return await db.select().from(loanBooks).where(eq(loanBooks.tenantId, tenantId)).orderBy(desc(loanBooks.createdAt));
  }

  async getLoan(tenantId: string, id: number): Promise<LoanBook | undefined> {
    const [loan] = await db.select().from(loanBooks).where(and(eq(loanBooks.tenantId, tenantId), eq(loanBooks.id, id)));
    return loan || undefined;
  }

  async createLoan(tenantId: string, insertLoan: InsertLoanBook): Promise<LoanBook> {
    const [loan] = await db
      .insert(loanBooks)
      .values({ ...insertLoan, tenantId })
      .returning();
    
    // Automatically create payment schedules for the loan
    await this.createPaymentSchedulesForLoan(tenantId, loan);
    
    return loan;
  }

  private async createPaymentSchedulesForLoan(tenantId: string, loan: LoanBook): Promise<void> {
    const principal = parseFloat(loan.loanAmount);
    const monthlyRate = parseFloat(loan.interestRate) / 100 / 12;
    const numPayments = loan.term;
    
    // Calculate monthly payment using amortization formula
    const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                          (Math.pow(1 + monthlyRate, numPayments) - 1);
    
    let remainingBalance = principal;
    const currentDate = new Date();
    
    const schedules: (InsertPaymentSchedule & { tenantId: string })[] = [];
    
    for (let i = 1; i <= numPayments; i++) {
      const interestPayment = remainingBalance * monthlyRate;
      const principalPayment = monthlyPayment - interestPayment;
      remainingBalance -= principalPayment;
      
      // Due date is first day of each month
      const dueDate = new Date(currentDate);
      dueDate.setMonth(currentDate.getMonth() + i);
      dueDate.setDate(1);
      
      schedules.push({
        tenantId,
        loanId: loan.id,
        dueDate,
        amount: monthlyPayment.toFixed(2),
        principalAmount: principalPayment.toFixed(2),
        interestAmount: interestPayment.toFixed(2),
        status: 'pending'
      });
    }
    
    // Insert all payment schedules
    await db.insert(paymentSchedules).values(schedules);
  }

  async updateLoan(tenantId: string, id: number, updateLoan: Partial<InsertLoanBook>): Promise<LoanBook> {
    const [loan] = await db
      .update(loanBooks)
      .set({ ...updateLoan, updatedAt: new Date() })
      .where(and(eq(loanBooks.tenantId, tenantId), eq(loanBooks.id, id)))
      .returning();
    return loan;
  }

  async deleteLoan(tenantId: string, id: number): Promise<void> {
    await db.delete(loanBooks).where(and(eq(loanBooks.tenantId, tenantId), eq(loanBooks.id, id)));
  }

  // Tenant-aware payment schedule methods
  async getPaymentSchedules(tenantId: string): Promise<PaymentSchedule[]> {
    return await db.select().from(paymentSchedules).where(eq(paymentSchedules.tenantId, tenantId));
  }

  async getPaymentSchedule(tenantId: string, id: number): Promise<PaymentSchedule | undefined> {
    console.log(`🔍 [DEBUG] getPaymentSchedule called with tenantId: ${tenantId} (type: ${typeof tenantId}), id: ${id} (type: ${typeof id})`);
    const [schedule] = await db.select().from(paymentSchedules).where(and(eq(paymentSchedules.id, Number(id)), eq(paymentSchedules.tenantId, String(tenantId))));
    return schedule || undefined;
  }

  async getPaymentSchedulesByLoan(tenantId: string, loanId: number): Promise<PaymentSchedule[]> {
    return await db.select().from(paymentSchedules).where(and(eq(paymentSchedules.tenantId, tenantId), eq(paymentSchedules.loanId, loanId)));
  }

  async createPaymentSchedule(tenantId: string, insertSchedule: InsertPaymentSchedule): Promise<PaymentSchedule> {
    const [schedule] = await db
      .insert(paymentSchedules)
      .values({ ...insertSchedule, tenantId })
      .returning();
    return schedule;
  }

  async updatePaymentSchedule(tenantId: string, id: number, updateSchedule: Partial<InsertPaymentSchedule>): Promise<PaymentSchedule> {
    // Get the current schedule before updating
    const currentSchedule = await this.getPaymentSchedule(tenantId, id);
    console.log(`🔍 [MultiTenant] Updating payment schedule ${id}. Current status: ${currentSchedule?.status}, New status: ${updateSchedule.status}`);
    
    const [schedule] = await db
      .update(paymentSchedules)
      .set({ ...updateSchedule, updatedAt: new Date() })
      .where(and(eq(paymentSchedules.id, Number(id)), eq(paymentSchedules.tenantId, String(tenantId))))
      .returning();
    
    console.log(`🔍 [MultiTenant] Updated schedule result:`, schedule);
    
    // If payment is being marked as paid, add interest to income table
    if (updateSchedule.status === 'paid' && currentSchedule?.status !== 'paid') {
      console.log(`🎯 [MultiTenant] Payment being marked as paid! Interest amount: ${schedule.interestAmount}`);
      
      if (schedule.interestAmount) {
        const interestAmount = parseFloat(schedule.interestAmount);
        console.log(`💰 [MultiTenant] Processing interest payment: ${interestAmount} for schedule ${schedule.id}`);
        
        if (interestAmount > 0) {
          const paidDate = schedule.paidDate ? new Date(schedule.paidDate) : new Date();
          console.log(`📅 [MultiTenant] Creating income record with date: ${paidDate.toISOString().split('T')[0]}`);
          
          try {
            const incomeRecord = await db.insert(incomeManagement).values({
              tenantId,
              source: 'Interest Payment',
              amount: schedule.interestAmount,
              description: `Interest payment from loan payment schedule #${schedule.id}`,
              date: paidDate.toISOString().split('T')[0],
              category: 'Loan Interest'
            }).returning();
            
            console.log(`✅ [MultiTenant] Successfully created income record:`, incomeRecord[0]);
          } catch (error) {
            console.error(`❌ [MultiTenant] Failed to create income record:`, error);
            throw error;
          }
        } else {
          console.log(`⚠️ [MultiTenant] Interest amount is 0, skipping income record`);
        }
      } else {
        console.log(`⚠️ [MultiTenant] No interest amount found on schedule`);
      }
    } else {
      console.log(`ℹ️ [MultiTenant] Not creating income record. Status change: ${currentSchedule?.status} -> ${updateSchedule.status}`);
    }
    
    return schedule;
  }

  async deletePaymentSchedule(tenantId: string, id: number): Promise<void> {
    await db.delete(paymentSchedules).where(and(eq(paymentSchedules.id, id), eq(paymentSchedules.tenantId, tenantId)));
  }

  // Tenant-aware staff methods
  async getStaff(tenantId: string): Promise<Staff[]> {
    return await db.select().from(staff).where(eq(staff.tenantId, tenantId));
  }

  async createStaff(tenantId: string, insertStaff: InsertStaff): Promise<Staff> {
    const [staffMember] = await db
      .insert(staff)
      .values({ ...insertStaff, tenantId })
      .returning();
    return staffMember;
  }

  async updateStaff(tenantId: string, id: number, updateStaff: Partial<InsertStaff>): Promise<Staff> {
    const [staffMember] = await db
      .update(staff)
      .set({ ...updateStaff, updatedAt: new Date() })
      .where(and(eq(staff.tenantId, tenantId), eq(staff.id, id)))
      .returning();
    return staffMember;
  }

  async deleteStaff(tenantId: string, id: number): Promise<void> {
    await db.delete(staff).where(and(eq(staff.tenantId, tenantId), eq(staff.id, id)));
  }

  // Tenant-aware income methods
  async getIncome(tenantId: string): Promise<IncomeManagement[]> {
    return await db.select().from(incomeManagement).where(eq(incomeManagement.tenantId, tenantId));
  }

  async createIncome(tenantId: string, insertIncome: InsertIncomeManagement): Promise<IncomeManagement> {
    const [income] = await db
      .insert(incomeManagement)
      .values({ ...insertIncome, tenantId })
      .returning();
    return income;
  }

  async updateIncome(tenantId: string, id: number, updateIncome: Partial<InsertIncomeManagement>): Promise<IncomeManagement> {
    const [income] = await db
      .update(incomeManagement)
      .set(updateIncome)
      .where(and(eq(incomeManagement.tenantId, tenantId), eq(incomeManagement.id, id)))
      .returning();
    return income;
  }

  async deleteIncome(tenantId: string, id: number): Promise<void> {
    await db.delete(incomeManagement).where(and(eq(incomeManagement.tenantId, tenantId), eq(incomeManagement.id, id)));
  }

  // Tenant-aware expense methods
  async getExpenses(tenantId: string): Promise<Expense[]> {
    return await db.select().from(expenses).where(eq(expenses.tenantId, tenantId));
  }

  async createExpense(tenantId: string, insertExpense: InsertExpense): Promise<Expense> {
    const [expense] = await db
      .insert(expenses)
      .values({ ...insertExpense, tenantId })
      .returning();
    return expense;
  }

  async updateExpense(tenantId: string, id: number, updateExpense: Partial<InsertExpense>): Promise<Expense> {
    const [expense] = await db
      .update(expenses)
      .set(updateExpense)
      .where(and(eq(expenses.tenantId, tenantId), eq(expenses.id, id)))
      .returning();
    return expense;
  }

  async deleteExpense(tenantId: string, id: number): Promise<void> {
    await db.delete(expenses).where(and(eq(expenses.tenantId, tenantId), eq(expenses.id, id)));
  }

  // Tenant-aware bank account methods
  async getBankAccounts(tenantId: string): Promise<BankManagement[]> {
    return await db.select().from(bankManagement).where(eq(bankManagement.tenantId, tenantId));
  }

  async createBankAccount(tenantId: string, insertAccount: InsertBankManagement): Promise<BankManagement> {
    const [account] = await db
      .insert(bankManagement)
      .values({ ...insertAccount, tenantId })
      .returning();
    return account;
  }

  async updateBankAccount(tenantId: string, id: number, updateAccount: Partial<InsertBankManagement>): Promise<BankManagement> {
    const [account] = await db
      .update(bankManagement)
      .set({ ...updateAccount, updatedAt: new Date() })
      .where(and(eq(bankManagement.tenantId, tenantId), eq(bankManagement.id, id)))
      .returning();
    return account;
  }

  async deleteBankAccount(tenantId: string, id: number): Promise<void> {
    await db.delete(bankManagement).where(and(eq(bankManagement.tenantId, tenantId), eq(bankManagement.id, id)));
  }

  // Tenant-aware dashboard metrics
  async getDashboardMetrics(tenantId: string): Promise<any> {
    // Total loans
    const totalLoansResult = await db
      .select({ total: sql`sum(${loanBooks.loanAmount}::numeric)` })
      .from(loanBooks)
      .where(eq(loanBooks.tenantId, tenantId));
    const totalLoans = totalLoansResult[0]?.total || 0;

    // Active customers
    const activeCustomersResult = await db
      .select({ count: sql`count(*)` })
      .from(customers)
      .where(and(eq(customers.tenantId, tenantId), eq(customers.status, 'active')));
    const activeCustomers = activeCustomersResult[0]?.count || 0;

    // Pending payments
    const pendingPaymentsResult = await db
      .select({ count: sql`count(*)` })
      .from(paymentSchedules)
      .where(and(eq(paymentSchedules.tenantId, tenantId), eq(paymentSchedules.status, 'pending')));
    const pendingPayments = pendingPaymentsResult[0]?.count || 0;

    // Total staff
    const totalStaffResult = await db
      .select({ count: sql`count(*)` })
      .from(staff)
      .where(eq(staff.tenantId, tenantId));
    const totalStaff = totalStaffResult[0]?.count || 0;

    return {
      totalLoans: `$${parseFloat(totalLoans.toString()).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      activeCustomers,
      pendingPayments,
      totalStaff
    };
  }

  // Tenant-aware payment analytics methods
  async getRecentPayments(tenantId: string): Promise<any> {
    const result = await db
      .select()
      .from(paymentSchedules)
      .where(and(eq(paymentSchedules.tenantId, tenantId), eq(paymentSchedules.status, 'paid')))
      .orderBy(desc(paymentSchedules.paidDate))
      .limit(10);
    
    return result;
  }

  async getTodaysPayments(tenantId: string): Promise<any> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const result = await db
      .select()
      .from(paymentSchedules)
      .where(
        and(
          eq(paymentSchedules.tenantId, tenantId),
          sql`${paymentSchedules.dueDate} >= ${today}`,
          sql`${paymentSchedules.dueDate} < ${tomorrow}`
        )
      );
    
    return result;
  }

  async getMonthlyPayments(tenantId: string): Promise<any> {
    // Last 12 months of payment data
    const result = await db
      .select({
        month: sql`TO_CHAR(${paymentSchedules.dueDate}, 'Mon')`,
        totalPayments: sql`count(*)`,
        totalAmount: sql`sum(${paymentSchedules.amount}::numeric)`
      })
      .from(paymentSchedules)
      .where(
        and(
          eq(paymentSchedules.tenantId, tenantId),
          sql`${paymentSchedules.dueDate} >= (CURRENT_DATE - INTERVAL '12 months')`
        )
      )
      .groupBy(sql`TO_CHAR(${paymentSchedules.dueDate}, 'Mon')`);
    
    return result;
  }

  // Dashboard analytics methods (tenant-aware)
  async getLoanPortfolio(tenantId: string): Promise<any> {
    const result = await db.execute(sql`
      SELECT 
        TO_CHAR(l.created_at, 'Mon') as month,
        COALESCE(SUM(l.loan_amount::numeric), 0) as "totalLoans",
        COUNT(l.id) as "loanCount"
      FROM loan_books l 
      WHERE l.tenant_id = ${tenantId}
        AND l.created_at >= (CURRENT_DATE - INTERVAL '12 months')
      GROUP BY TO_CHAR(l.created_at, 'Mon'), EXTRACT(MONTH FROM l.created_at)
      ORDER BY EXTRACT(MONTH FROM l.created_at)
    `);
    
    // If no data, return last 6 months with zero values for chart display
    if (result.rows.length === 0) {
      const months = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return months.map(month => ({
        month,
        totalLoans: 0,
        loanCount: 0
      }));
    }
    
    return result.rows;
  }

  async getPaymentStatus(tenantId: string): Promise<any> {
    const result = await db.execute(sql`
      SELECT 
        COUNT(CASE WHEN ps.status = 'pending' AND ps.due_date >= CURRENT_DATE THEN 1 END) as "onTime",
        COUNT(CASE WHEN ps.status = 'pending' AND ps.due_date < CURRENT_DATE AND ps.due_date >= (CURRENT_DATE - INTERVAL '7 days') THEN 1 END) as "overdue7Days",
        COUNT(CASE WHEN ps.status = 'pending' AND ps.due_date < (CURRENT_DATE - INTERVAL '7 days') AND ps.due_date >= (CURRENT_DATE - INTERVAL '30 days') THEN 1 END) as "overdue30Days",
        COUNT(CASE WHEN ps.status = 'pending' AND ps.due_date < (CURRENT_DATE - INTERVAL '30 days') THEN 1 END) as "overdue90Days",
        COUNT(CASE WHEN ps.status = 'pending' THEN 1 END) as "totalPending",
        COUNT(CASE WHEN ps.status = 'pending' AND ps.due_date < CURRENT_DATE THEN 1 END) as "totalOverdue"
      FROM payment_schedules ps 
      WHERE ps.tenant_id = ${tenantId}
    `);
    
    return result.rows[0] || {
      onTime: 0,
      overdue7Days: 0,
      overdue30Days: 0,
      overdue90Days: 0,
      totalPending: 0,
      totalOverdue: 0
    };
  }

  async getAdvancedAnalytics(tenantId: string): Promise<any> {
    const result = await db.execute(sql`
      SELECT 
        COALESCE(COUNT(DISTINCT c.id), 0) as total_customers,
        COALESCE(COUNT(DISTINCT l.id), 0) as total_loans,
        COALESCE(AVG(l.loan_amount), 0) as avg_loan_amount,
        COALESCE(SUM(CASE WHEN ps.status = 'completed' THEN ps.amount END), 0) as total_collected,
        
        -- Approval Analytics (disbursed loans are approved loans)
        COALESCE(COUNT(CASE WHEN l.status IN ('approved', 'disbursed') THEN 1 END), 0) as approved_loans,
        COALESCE(COUNT(CASE WHEN l.status = 'pending' THEN 1 END), 0) as pending_loans,
        COALESCE(COUNT(CASE WHEN l.status = 'rejected' THEN 1 END), 0) as rejected_loans,
        COALESCE(COUNT(CASE WHEN l.created_at >= CURRENT_DATE AND l.status IN ('approved', 'disbursed') THEN 1 END), 0) as loans_today,
        
        -- Risk Assessment
        COALESCE(COUNT(CASE WHEN l.status = 'defaulted' THEN 1 END), 0) as defaulted_loans,
        COALESCE(COUNT(CASE WHEN ps.status = 'overdue' AND ps.due_date < (CURRENT_DATE - INTERVAL '30 days') THEN 1 END), 0) as at_risk_loans
        
      FROM customers c
      LEFT JOIN loan_books l ON c.id = l.customer_id AND l.tenant_id = ${tenantId}
      LEFT JOIN payment_schedules ps ON l.id = ps.loan_id AND ps.tenant_id = ${tenantId}
      WHERE c.tenant_id = ${tenantId}
    `);
    
    const data = result.rows[0];
    const totalLoans = parseInt(data?.total_loans) || 0;
    const defaultedLoans = parseInt(data?.defaulted_loans) || 0;
    const approvedLoans = parseInt(data?.approved_loans) || 0;
    const rejectedLoans = parseInt(data?.rejected_loans) || 0;
    const totalApplications = approvedLoans + rejectedLoans + parseInt(data?.pending_loans || 0);
    
    // Calculate approval rate: Since disbursed loans are approved loans,
    // if we have disbursed loans but no rejected/pending, treat disbursed loans as approved applications
    const approvalRate = totalApplications > 0 ? Math.round((approvedLoans / totalApplications) * 100) : 
                        (approvedLoans > 0 ? 100 : 0); // If only disbursed loans exist, that's 100% approval
    
    // Calculate default rate
    const defaultRate = totalLoans > 0 ? ((defaultedLoans / totalLoans) * 100).toFixed(1) : "0.0";
    
    return {
      total_customers: data?.total_customers || 0,
      total_loans: data?.total_loans || 0,
      avg_loan_amount: data?.avg_loan_amount || 0,
      total_collected: data?.total_collected || 0,
      
      // Approval Analytics
      approval_rate: approvalRate,
      approved_today: parseInt(data?.loans_today) || 0,
      pending_review: parseInt(data?.pending_loans) || 0,
      
      // Risk Assessment  
      default_rate: defaultRate,
      at_risk_loans: parseInt(data?.at_risk_loans) || 0
    };
  }

  // Equity methods
  async getEquity(tenantId: string): Promise<Equity[]> {
    return await db.select().from(equity).where(eq(equity.tenantId, tenantId));
  }

  async createEquity(insertEquity: InsertEquity): Promise<Equity> {
    const [equityItem] = await db
      .insert(equity)
      .values({ ...insertEquity, tenantId: this.defaultTenantId })
      .returning();
    return equityItem;
  }

  async updateEquity(tenantId: string, id: number, updateEquity: Partial<InsertEquity>): Promise<Equity> {
    const [equityItem] = await db
      .update(equity)
      .set(updateEquity)
      .where(and(eq(equity.tenantId, tenantId), eq(equity.id, id)))
      .returning();
    return equityItem;
  }

  async deleteEquity(id: number): Promise<void> {
    await db.delete(equity).where(and(eq(equity.tenantId, this.defaultTenantId), eq(equity.id, id)));
  }

  // Report methods
  async getReports(tenantId: string): Promise<Report[]> {
    return await db.select().from(reports).where(eq(reports.tenantId, tenantId));
  }

  async createReport(insertReport: InsertReport): Promise<Report> {
    const [report] = await db
      .insert(reports)
      .values({ ...insertReport, tenantId: this.defaultTenantId })
      .returning();
    return report;
  }

  async updateReport(tenantId: string, id: number, updateReport: Partial<InsertReport>): Promise<Report> {
    const [report] = await db
      .update(reports)
      .set(updateReport)
      .where(and(eq(reports.tenantId, tenantId), eq(reports.id, id)))
      .returning();
    return report;
  }

  async deleteReport(id: number): Promise<void> {
    await db.delete(reports).where(and(eq(reports.tenantId, this.defaultTenantId), eq(reports.id, id)));
  }

  // MFI Registration methods
  async getMfiRegistration(tenantId: string): Promise<MfiRegistration | undefined> {
    const [registration] = await db.select().from(mfiRegistration).where(eq(mfiRegistration.tenantId, tenantId));
    return registration || undefined;
  }

  async createMfiRegistration(insertMfiRegistration: InsertMfiRegistration): Promise<MfiRegistration> {
    const [registration] = await db
      .insert(mfiRegistration)
      .values({ ...insertMfiRegistration, tenantId: this.defaultTenantId } as any)
      .returning();
    return registration;
  }

  async updateMfiRegistration(id: number, updateMfiRegistration: Partial<InsertMfiRegistration>): Promise<MfiRegistration> {
    // Handle Date conversion for licenseExpiryDate if present
    const updateData: any = { ...updateMfiRegistration, updatedAt: new Date() };
    if (updateData.licenseExpiryDate instanceof Date) {
      updateData.licenseExpiryDate = updateData.licenseExpiryDate.toISOString().split('T')[0];
    }
    
    const [registration] = await db
      .update(mfiRegistration)
      .set(updateData)
      .where(and(eq(mfiRegistration.tenantId, this.defaultTenantId), eq(mfiRegistration.id, id)))
      .returning();
    return registration;
  }

  // Shareholder methods
  async getShareholders(tenantId: string): Promise<Shareholder[]> {
    return await db.select().from(shareholders).where(eq(shareholders.tenantId, tenantId));
  }

  async getShareholder(id: number): Promise<Shareholder | undefined> {
    const [shareholder] = await db.select().from(shareholders).where(and(eq(shareholders.tenantId, this.defaultTenantId), eq(shareholders.id, id)));
    return shareholder || undefined;
  }

  async createShareholder(insertShareholder: InsertShareholder): Promise<Shareholder> {
    const [shareholder] = await db
      .insert(shareholders)
      .values({ ...insertShareholder, tenantId: this.defaultTenantId })
      .returning();
    return shareholder;
  }

  async updateShareholder(id: number, updateShareholder: Partial<InsertShareholder>): Promise<Shareholder> {
    const [shareholder] = await db
      .update(shareholders)
      .set(updateShareholder)
      .where(and(eq(shareholders.tenantId, this.defaultTenantId), eq(shareholders.id, id)))
      .returning();
    return shareholder;
  }

  async deleteShareholder(id: number): Promise<void> {
    await db.delete(shareholders).where(and(eq(shareholders.tenantId, this.defaultTenantId), eq(shareholders.id, id)));
  }

  // Inventory methods
  async getInventory(tenantId: string): Promise<Inventory[]> {
    return await db.select().from(inventory).where(eq(inventory.tenantId, tenantId));
  }

  async createInventory(insertInventory: InsertInventory): Promise<Inventory> {
    const [inventoryItem] = await db
      .insert(inventory)
      .values({ ...insertInventory, tenantId: this.defaultTenantId })
      .returning();
    return inventoryItem;
  }

  async updateInventory(tenantId: string, id: number, updateInventory: Partial<InsertInventory>): Promise<Inventory> {
    const [inventoryItem] = await db
      .update(inventory)
      .set(updateInventory)
      .where(and(eq(inventory.tenantId, tenantId), eq(inventory.id, id)))
      .returning();
    return inventoryItem;
  }

  async deleteInventory(id: number): Promise<void> {
    await db.delete(inventory).where(and(eq(inventory.tenantId, this.defaultTenantId), eq(inventory.id, id)));
  }

  // Asset methods
  async getAssets(tenantId: string): Promise<Asset[]> {
    return await db.select().from(assets).where(eq(assets.tenantId, tenantId));
  }

  async createAsset(insertAsset: InsertAsset): Promise<Asset> {
    const [asset] = await db
      .insert(assets)
      .values({ ...insertAsset, tenantId: this.defaultTenantId })
      .returning();
    return asset;
  }

  async updateAsset(tenantId: string, id: number, updateAsset: Partial<InsertAsset>): Promise<Asset> {
    const [asset] = await db
      .update(assets)
      .set(updateAsset)
      .where(and(eq(assets.tenantId, tenantId), eq(assets.id, id)))
      .returning();
    return asset;
  }

  async deleteAsset(id: number): Promise<void> {
    await db.delete(assets).where(and(eq(assets.tenantId, this.defaultTenantId), eq(assets.id, id)));
  }

  // Liabilities methods
  async getLiabilities(tenantId: string): Promise<Liability[]> {
    return await db.select().from(liabilities).where(eq(liabilities.tenantId, tenantId));
  }

  async createLiability(insertLiability: InsertLiability): Promise<Liability> {
    const [liability] = await db
      .insert(liabilities)
      .values({ ...insertLiability, tenantId: this.defaultTenantId })
      .returning();
    return liability;
  }

  async updateLiability(tenantId: string, id: number, updateLiability: Partial<InsertLiability>): Promise<Liability> {
    const [liability] = await db
      .update(liabilities)
      .set(updateLiability)
      .where(and(eq(liabilities.tenantId, tenantId), eq(liabilities.id, id)))
      .returning();
    return liability;
  }

  async deleteLiability(id: number): Promise<void> {
    await db.delete(liabilities).where(and(eq(liabilities.tenantId, this.defaultTenantId), eq(liabilities.id, id)));
  }
}

// Export the multi-tenant storage instance
export const multiTenantStorage = new MultiTenantStorage();

// Backward compatibility wrapper that uses default tenant for existing code
export class BackwardCompatibilityStorage {
  private defaultTenantId = 'default-tenant-001';
  
  // User methods with default tenant
  async getUser(id: number): Promise<User | undefined> {
    return multiTenantStorage.getUser(this.defaultTenantId, id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return multiTenantStorage.getUserByUsername(this.defaultTenantId, username);
  }

  async getAllUsers(): Promise<User[]> {
    return multiTenantStorage.getAllUsers(this.defaultTenantId);
  }

  async createUser(user: InsertUser): Promise<User> {
    return multiTenantStorage.createUser(this.defaultTenantId, user);
  }

  async updateUser(tenantId: string, id: number, user: Partial<InsertUser>): Promise<User> {
    return multiTenantStorage.updateUser(tenantId, id, user);
  }

  async updateUserPassword(tenantId: string, id: number, hashedPassword: string): Promise<User> {
    return multiTenantStorage.updateUserPassword(tenantId, id, hashedPassword);
  }

  async updateUserLastLogin(tenantId: string, id: number): Promise<User> {
    return multiTenantStorage.updateUserLastLogin(tenantId, id);
  }

  async deleteUser(id: number): Promise<void> {
    return multiTenantStorage.deleteUser(this.defaultTenantId, id);
  }

  // User audit log methods
  async getUserAuditLogs(userId: number): Promise<UserAuditLog[]> {
    return await db
      .select()
      .from(userAuditLogs)
      .where(and(eq(userAuditLogs.tenantId, this.defaultTenantId), eq(userAuditLogs.userId, userId)))
      .orderBy(desc(userAuditLogs.timestamp));
  }

  async createUserAuditLog(insertLog: InsertUserAuditLog): Promise<UserAuditLog> {
    const [log] = await db
      .insert(userAuditLogs)
      .values({ ...insertLog, tenantId: this.defaultTenantId })
      .returning();
    return log;
  }

  // Customer methods with default tenant
  async getCustomers(): Promise<Customer[]> {
    return multiTenantStorage.getCustomers(this.defaultTenantId);
  }

  async getCustomer(id: number): Promise<Customer | undefined> {
    return multiTenantStorage.getCustomer(this.defaultTenantId, id);
  }

  async getCustomerByEmail(email: string): Promise<Customer | undefined> {
    return multiTenantStorage.getCustomerByEmail(this.defaultTenantId, email);
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    return multiTenantStorage.createCustomer(this.defaultTenantId, customer);
  }

  async updateCustomer(tenantId: string, id: number, customer: Partial<InsertCustomer>): Promise<Customer> {
    return multiTenantStorage.updateCustomer(tenantId, id, customer);
  }

  async updateCustomerPassword(tenantId: string, id: number, hashedPassword: string): Promise<Customer> {
    return multiTenantStorage.updateCustomerPassword(tenantId, id, hashedPassword);
  }

  async updateCustomerLastLogin(tenantId: string, id: number): Promise<Customer> {
    return multiTenantStorage.updateCustomerLastLogin(tenantId, id);
  }

  async deleteCustomer(id: number): Promise<void> {
    return multiTenantStorage.deleteCustomer(this.defaultTenantId, id);
  }

  // Customer portal methods
  async getCustomerLoans(customerId: number): Promise<LoanBook[]> {
    return multiTenantStorage.getCustomerLoans(this.defaultTenantId, customerId);
  }

  async getCustomerPayments(customerId: number): Promise<PaymentSchedule[]> {
    return multiTenantStorage.getCustomerPayments(this.defaultTenantId, customerId);
  }

  async getCustomerUpcomingPayments(customerId: number): Promise<PaymentSchedule[]> {
    return multiTenantStorage.getCustomerUpcomingPayments(this.defaultTenantId, customerId);
  }

  // Loan Product methods
  async getLoanProducts(): Promise<LoanProduct[]> {
    return multiTenantStorage.getLoanProducts(this.defaultTenantId);
  }

  async getLoanProduct(id: number): Promise<LoanProduct | undefined> {
    return multiTenantStorage.getLoanProduct(this.defaultTenantId, id);
  }

  async createLoanProduct(loanProduct: InsertLoanProduct): Promise<LoanProduct> {
    return multiTenantStorage.createLoanProduct(this.defaultTenantId, loanProduct);
  }

  async updateLoanProduct(tenantId: string, id: number, loanProduct: Partial<InsertLoanProduct>): Promise<LoanProduct> {
    return multiTenantStorage.updateLoanProduct(tenantId, id, loanProduct);
  }

  async deleteLoanProduct(id: number): Promise<void> {
    return multiTenantStorage.deleteLoanProduct(this.defaultTenantId, id);
  }

  // Loan methods
  async getLoans(): Promise<LoanBook[]> {
    return multiTenantStorage.getLoans(this.defaultTenantId);
  }

  async getLoan(id: number): Promise<LoanBook | undefined> {
    return multiTenantStorage.getLoan(this.defaultTenantId, id);
  }

  async createLoan(loan: InsertLoanBook): Promise<LoanBook> {
    return multiTenantStorage.createLoan(this.defaultTenantId, loan);
  }

  async updateLoan(tenantId: string, id: number, loan: Partial<InsertLoanBook>): Promise<LoanBook> {
    return multiTenantStorage.updateLoan(tenantId, id, loan);
  }

  async deleteLoan(id: number): Promise<void> {
    return multiTenantStorage.deleteLoan(this.defaultTenantId, id);
  }

  // Payment Schedule methods
  async getPaymentSchedules(): Promise<PaymentSchedule[]> {
    return multiTenantStorage.getPaymentSchedules(this.defaultTenantId);
  }

  async getPaymentSchedule(id: number): Promise<PaymentSchedule | undefined> {
    return multiTenantStorage.getPaymentSchedule(this.defaultTenantId, id);
  }

  async getPaymentSchedulesByLoan(tenantId: string, loanId: number): Promise<PaymentSchedule[]> {
    return multiTenantStorage.getPaymentSchedulesByLoan(tenantId, loanId);
  }

  async createPaymentSchedule(schedule: InsertPaymentSchedule): Promise<PaymentSchedule> {
    return multiTenantStorage.createPaymentSchedule(this.defaultTenantId, schedule);
  }

  async updatePaymentSchedule(tenantId: string, id: number, schedule: Partial<InsertPaymentSchedule>): Promise<PaymentSchedule> {
    return multiTenantStorage.updatePaymentSchedule(tenantId, id, schedule);
  }

  async deletePaymentSchedule(id: number): Promise<void> {
    return multiTenantStorage.deletePaymentSchedule(this.defaultTenantId, id);
  }

  // Staff methods
  async getStaff(): Promise<Staff[]> {
    return multiTenantStorage.getStaff(this.defaultTenantId);
  }

  async createStaff(staff: InsertStaff): Promise<Staff> {
    return multiTenantStorage.createStaff(this.defaultTenantId, staff);
  }

  async updateStaff(tenantId: string, id: number, staff: Partial<InsertStaff>): Promise<Staff> {
    return multiTenantStorage.updateStaff(tenantId, id, staff);
  }

  async deleteStaff(id: number): Promise<void> {
    return multiTenantStorage.deleteStaff(this.defaultTenantId, id);
  }

  // Income methods
  async getIncome(): Promise<IncomeManagement[]> {
    return multiTenantStorage.getIncome(this.defaultTenantId);
  }

  async createIncome(income: InsertIncomeManagement): Promise<IncomeManagement> {
    return multiTenantStorage.createIncome(this.defaultTenantId, income);
  }

  async updateIncome(tenantId: string, id: number, income: Partial<InsertIncomeManagement>): Promise<IncomeManagement> {
    return multiTenantStorage.updateIncome(tenantId, id, income);
  }

  async deleteIncome(id: number): Promise<void> {
    return multiTenantStorage.deleteIncome(this.defaultTenantId, id);
  }

  // Expense methods
  async getExpenses(): Promise<Expense[]> {
    return multiTenantStorage.getExpenses(this.defaultTenantId);
  }

  async createExpense(expense: InsertExpense): Promise<Expense> {
    return multiTenantStorage.createExpense(this.defaultTenantId, expense);
  }

  async updateExpense(tenantId: string, id: number, expense: Partial<InsertExpense>): Promise<Expense> {
    return multiTenantStorage.updateExpense(tenantId, id, expense);
  }

  async deleteExpense(id: number): Promise<void> {
    return multiTenantStorage.deleteExpense(this.defaultTenantId, id);
  }

  // Bank Account methods
  async getBankAccounts(): Promise<BankManagement[]> {
    return multiTenantStorage.getBankAccounts(this.defaultTenantId);
  }

  async createBankAccount(account: InsertBankManagement): Promise<BankManagement> {
    return multiTenantStorage.createBankAccount(this.defaultTenantId, account);
  }

  async updateBankAccount(tenantId: string, id: number, account: Partial<InsertBankManagement>): Promise<BankManagement> {
    return multiTenantStorage.updateBankAccount(tenantId, id, account);
  }

  async deleteBankAccount(id: number): Promise<void> {
    return multiTenantStorage.deleteBankAccount(this.defaultTenantId, id);
  }

  // Dashboard metrics
  async getDashboardMetrics(): Promise<any> {
    return multiTenantStorage.getDashboardMetrics(this.defaultTenantId);
  }

  // Payment analytics methods
  async getRecentPayments(): Promise<any> {
    return multiTenantStorage.getRecentPayments(this.defaultTenantId);
  }

  async getTodaysPayments(): Promise<any> {
    return multiTenantStorage.getTodaysPayments(this.defaultTenantId);
  }

  async getMonthlyPayments(): Promise<any> {
    return multiTenantStorage.getMonthlyPayments(this.defaultTenantId);
  }

  // Support Ticket methods
  async getSupportTickets(): Promise<SupportTicket[]> {
    return await db.select().from(supportTickets).where(eq(supportTickets.tenantId, this.defaultTenantId)).orderBy(desc(supportTickets.createdAt));
  }

  async getSupportTicket(id: number): Promise<SupportTicket | undefined> {
    const [ticket] = await db.select().from(supportTickets).where(and(eq(supportTickets.id, id), eq(supportTickets.tenantId, this.defaultTenantId)));
    return ticket || undefined;
  }

  async createSupportTicket(insertTicket: InsertSupportTicket): Promise<SupportTicket> {
    const [ticket] = await db.insert(supportTickets).values({ ...insertTicket, tenantId: this.defaultTenantId }).returning();
    return ticket;
  }

  async updateSupportTicket(id: number, updateTicket: Partial<InsertSupportTicket>): Promise<SupportTicket> {
    const [ticket] = await db.update(supportTickets).set({ ...updateTicket, updatedAt: new Date() }).where(and(eq(supportTickets.id, id), eq(supportTickets.tenantId, this.defaultTenantId))).returning();
    return ticket;
  }

  async getSupportMessages(ticketId: number): Promise<SupportMessage[]> {
    return await db.select().from(supportMessages).where(and(eq(supportMessages.ticketId, ticketId), eq(supportMessages.tenantId, this.defaultTenantId))).orderBy(supportMessages.createdAt);
  }

  async createSupportMessage(insertMessage: InsertSupportMessage): Promise<SupportMessage> {
    const [message] = await db.insert(supportMessages).values({ ...insertMessage, tenantId: this.defaultTenantId }).returning();
    return message;
  }

  // Dashboard analytics methods
  async getLoanPortfolio(): Promise<any> {
    return new MultiTenantStorage().getLoanPortfolio(this.defaultTenantId);
  }

  async getAdvancedAnalytics(): Promise<any> {
    return new MultiTenantStorage().getAdvancedAnalytics(this.defaultTenantId);
  }

  async getPaymentStatus(): Promise<any> {
    return new MultiTenantStorage().getPaymentStatus(this.defaultTenantId);
  }

  // Additional methods needed by routes
  async getPettyCash(): Promise<PettyCash[]> {
    return await db.select().from(pettyCash).where(eq(pettyCash.tenantId, this.defaultTenantId));
  }

  async createPettyCash(insertPettyCash: InsertPettyCash): Promise<PettyCash> {
    const [cash] = await db
      .insert(pettyCash)
      .values({ ...insertPettyCash, tenantId: this.defaultTenantId })
      .returning();
    return cash;
  }

  async updatePettyCash(tenantId: string, id: number, updatePettyCash: Partial<InsertPettyCash>): Promise<PettyCash> {
    const [cash] = await db
      .update(pettyCash)
      .set(updatePettyCash)
      .where(and(eq(pettyCash.tenantId, tenantId), eq(pettyCash.id, id)))
      .returning();
    return cash;
  }

  async deletePettyCash(id: number): Promise<void> {
    await db.delete(pettyCash).where(and(eq(pettyCash.tenantId, this.defaultTenantId), eq(pettyCash.id, id)));
  }

  // Inventory methods
  async getInventory(): Promise<Inventory[]> {
    return await db.select().from(inventory).where(eq(inventory.tenantId, this.defaultTenantId));
  }

  async createInventory(insertInventory: InsertInventory): Promise<Inventory> {
    const [item] = await db
      .insert(inventory)
      .values({ ...insertInventory, tenantId: this.defaultTenantId })
      .returning();
    return item;
  }

  async updateInventory(tenantId: string, id: number, updateInventory: Partial<InsertInventory>): Promise<Inventory> {
    const [item] = await db
      .update(inventory)
      .set(updateInventory)
      .where(and(eq(inventory.tenantId, tenantId), eq(inventory.id, id)))
      .returning();
    return item;
  }

  async deleteInventory(id: number): Promise<void> {
    await db.delete(inventory).where(and(eq(inventory.tenantId, this.defaultTenantId), eq(inventory.id, id)));
  }

  // Rent Management methods
  async getRentManagement(): Promise<RentManagement[]> {
    return await db.select().from(rentManagement).where(eq(rentManagement.tenantId, this.defaultTenantId));
  }

  async createRentManagement(insertRent: InsertRentManagement): Promise<RentManagement> {
    const [rent] = await db
      .insert(rentManagement)
      .values({ ...insertRent, tenantId: this.defaultTenantId })
      .returning();
    return rent;
  }

  async updateRentManagement(tenantId: string, id: number, updateRent: Partial<InsertRentManagement>): Promise<RentManagement> {
    const [rent] = await db
      .update(rentManagement)
      .set(updateRent)
      .where(and(eq(rentManagement.tenantId, tenantId), eq(rentManagement.id, id)))
      .returning();
    return rent;
  }

  async deleteRentManagement(id: number): Promise<void> {
    await db.delete(rentManagement).where(and(eq(rentManagement.tenantId, this.defaultTenantId), eq(rentManagement.id, id)));
  }

  // Assets methods
  async getAssets(): Promise<Asset[]> {
    return await db.select().from(assets).where(eq(assets.tenantId, this.defaultTenantId));
  }

  async createAsset(insertAsset: InsertAsset): Promise<Asset> {
    const [asset] = await db
      .insert(assets)
      .values({ ...insertAsset, tenantId: this.defaultTenantId })
      .returning();
    return asset;
  }

  async updateAsset(tenantId: string, id: number, updateAsset: Partial<InsertAsset>): Promise<Asset> {
    const [asset] = await db
      .update(assets)
      .set(updateAsset)
      .where(and(eq(assets.tenantId, tenantId), eq(assets.id, id)))
      .returning();
    return asset;
  }

  async deleteAsset(id: number): Promise<void> {
    await db.delete(assets).where(and(eq(assets.tenantId, this.defaultTenantId), eq(assets.id, id)));
  }

  // Liabilities methods
  async getLiabilities(): Promise<Liability[]> {
    return await db.select().from(liabilities).where(eq(liabilities.tenantId, this.defaultTenantId));
  }

  async createLiability(insertLiability: InsertLiability): Promise<Liability> {
    const [liability] = await db
      .insert(liabilities)
      .values({ ...insertLiability, tenantId: this.defaultTenantId })
      .returning();
    return liability;
  }

  async updateLiability(tenantId: string, id: number, updateLiability: Partial<InsertLiability>): Promise<Liability> {
    const [liability] = await db
      .update(liabilities)
      .set(updateLiability)
      .where(and(eq(liabilities.tenantId, tenantId), eq(liabilities.id, id)))
      .returning();
    return liability;
  }

  async deleteLiability(id: number): Promise<void> {
    await db.delete(liabilities).where(and(eq(liabilities.tenantId, this.defaultTenantId), eq(liabilities.id, id)));
  }

  // Equity methods
  async getEquity(tenantId: string): Promise<Equity[]> {
    return await db.select().from(equity).where(eq(equity.tenantId, tenantId));
  }

  async createEquity(insertEquity: InsertEquity): Promise<Equity> {
    const [equityItem] = await db
      .insert(equity)
      .values({ ...insertEquity, tenantId: this.defaultTenantId })
      .returning();
    return equityItem;
  }

  async updateEquity(tenantId: string, id: number, updateEquity: Partial<InsertEquity>): Promise<Equity> {
    const [equityItem] = await db
      .update(equity)
      .set(updateEquity)
      .where(and(eq(equity.tenantId, tenantId), eq(equity.id, id)))
      .returning();
    return equityItem;
  }

  async deleteEquity(id: number): Promise<void> {
    await db.delete(equity).where(and(eq(equity.tenantId, this.defaultTenantId), eq(equity.id, id)));
  }

  // Report methods
  async getReports(tenantId: string): Promise<Report[]> {
    return await db.select().from(reports).where(eq(reports.tenantId, tenantId));
  }

  async createReport(insertReport: InsertReport): Promise<Report> {
    const [report] = await db
      .insert(reports)
      .values({ ...insertReport, tenantId: this.defaultTenantId })
      .returning();
    return report;
  }

  async updateReport(tenantId: string, id: number, updateReport: Partial<InsertReport>): Promise<Report> {
    const [report] = await db
      .update(reports)
      .set(updateReport)
      .where(and(eq(reports.tenantId, tenantId), eq(reports.id, id)))
      .returning();
    return report;
  }

  async deleteReport(id: number): Promise<void> {
    await db.delete(reports).where(and(eq(reports.tenantId, this.defaultTenantId), eq(reports.id, id)));
  }

  // MFI Registration methods
  async getMfiRegistration(tenantId: string): Promise<MfiRegistration | undefined> {
    const [registration] = await db.select().from(mfiRegistration).where(eq(mfiRegistration.tenantId, tenantId));
    return registration || undefined;
  }

  async createMfiRegistration(insertMfiRegistration: InsertMfiRegistration): Promise<MfiRegistration> {
    const [registration] = await db
      .insert(mfiRegistration)
      .values({ ...insertMfiRegistration, tenantId: this.defaultTenantId } as any)
      .returning();
    return registration;
  }

  async updateMfiRegistration(id: number, updateMfiRegistration: Partial<InsertMfiRegistration>): Promise<MfiRegistration> {
    // Handle Date conversion for licenseExpiryDate if present
    const updateData: any = { ...updateMfiRegistration, updatedAt: new Date() };
    if (updateData.licenseExpiryDate instanceof Date) {
      updateData.licenseExpiryDate = updateData.licenseExpiryDate.toISOString().split('T')[0];
    }
    
    const [registration] = await db
      .update(mfiRegistration)
      .set(updateData)
      .where(and(eq(mfiRegistration.tenantId, this.defaultTenantId), eq(mfiRegistration.id, id)))
      .returning();
    return registration;
  }

  // Shareholder methods
  async getShareholders(tenantId: string): Promise<Shareholder[]> {
    return await db.select().from(shareholders).where(eq(shareholders.tenantId, tenantId));
  }

  async getShareholder(id: number): Promise<Shareholder | undefined> {
    const [shareholder] = await db.select().from(shareholders).where(and(eq(shareholders.tenantId, this.defaultTenantId), eq(shareholders.id, id)));
    return shareholder || undefined;
  }

  async createShareholder(insertShareholder: InsertShareholder): Promise<Shareholder> {
    const [shareholder] = await db
      .insert(shareholders)
      .values({ ...insertShareholder, tenantId: this.defaultTenantId })
      .returning();
    return shareholder;
  }

  async updateShareholder(id: number, updateShareholder: Partial<InsertShareholder>): Promise<Shareholder> {
    const [shareholder] = await db
      .update(shareholders)
      .set(updateShareholder)
      .where(and(eq(shareholders.tenantId, this.defaultTenantId), eq(shareholders.id, id)))
      .returning();
    return shareholder;
  }

  async deleteShareholder(id: number): Promise<void> {
    await db.delete(shareholders).where(and(eq(shareholders.tenantId, this.defaultTenantId), eq(shareholders.id, id)));
  }

  // Role and Permission methods to complete interface
  async getRoles(tenantId?: string): Promise<Role[]> {
    if (tenantId) {
      return await db.select().from(roles).where(eq(roles.tenantId, tenantId));
    } else {
      return await db.select().from(roles).where(eq(roles.tenantId, this.defaultTenantId));
    }
  }

  async getRole(id: number): Promise<Role | undefined> {
    const [role] = await db.select().from(roles).where(eq(roles.id, id));
    return role || undefined;
  }

  async createRole(role: InsertRole): Promise<Role> {
    const [newRole] = await db.insert(roles).values(role).returning();
    return newRole;
  }

  async updateRole(id: number, role: Partial<InsertRole>): Promise<Role> {
    const [updatedRole] = await db.update(roles).set({ ...role, updatedAt: new Date() }).where(eq(roles.id, id)).returning();
    return updatedRole;
  }

  async deleteRole(id: number): Promise<void> {
    await db.delete(roles).where(eq(roles.id, id));
  }

  async getPermissions(): Promise<Permission[]> {
    return await db.select().from(permissions);
  }

  async getPermission(id: number): Promise<Permission | undefined> {
    const [permission] = await db.select().from(permissions).where(eq(permissions.id, id));
    return permission || undefined;
  }

  async getRolePermissions(roleId: number): Promise<Permission[]> {
    const rolePermissionsList = await db
      .select({
        id: permissions.id,
        name: permissions.name,
        category: permissions.category,
        description: permissions.description,
        resource: permissions.resource,
        action: permissions.action,
        createdAt: permissions.createdAt,
      })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(rolePermissions.roleId, roleId));
    return rolePermissionsList;
  }

  async assignRolePermissions(roleId: number, permissionIds: number[]): Promise<void> {
    const values = permissionIds.map(permissionId => ({ roleId, permissionId }));
    await db.insert(rolePermissions).values(values);
  }

  async removeRolePermissions(roleId: number, permissionIds: number[]): Promise<void> {
    await db.delete(rolePermissions).where(
      and(
        eq(rolePermissions.roleId, roleId),
        sql`${rolePermissions.permissionId} = ANY(${permissionIds})`
      )
    );
  }

  async getUserRoles(tenantId: string): Promise<UserRole[]> {
    return await db.select().from(userRoles).where(eq(userRoles.tenantId, tenantId));
  }

  async getUserRole(userId: number, tenantId: string): Promise<UserRole | undefined> {
    const [userRole] = await db.select().from(userRoles).where(
      and(eq(userRoles.userId, userId), eq(userRoles.tenantId, tenantId))
    );
    return userRole || undefined;
  }

  async assignUserRole(userRole: InsertUserRole): Promise<UserRole> {
    const [newUserRole] = await db.insert(userRoles).values(userRole).returning();
    return newUserRole;
  }

  async updateUserRole(userId: number, tenantId: string, roleId: number): Promise<UserRole> {
    const [updatedUserRole] = await db.update(userRoles)
      .set({ roleId })
      .where(and(eq(userRoles.userId, userId), eq(userRoles.tenantId, tenantId)))
      .returning();
    return updatedUserRole;
  }

  async removeUserRole(userId: number, tenantId: string): Promise<void> {
    await db.delete(userRoles).where(
      and(eq(userRoles.userId, userId), eq(userRoles.tenantId, tenantId))
    );
  }


}