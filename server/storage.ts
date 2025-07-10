import { 
  users, customers, loanBooks, paymentSchedules, staff, incomeManagement, 
  expenses, bankManagement, pettyCash, inventory, rentManagement, assets, 
  liabilities, equity, reports,
  type User, type InsertUser, type Customer, type InsertCustomer,
  type LoanBook, type InsertLoanBook, type PaymentSchedule, type InsertPaymentSchedule,
  type Staff, type InsertStaff, type IncomeManagement, type InsertIncomeManagement,
  type Expense, type InsertExpense, type BankManagement, type InsertBankManagement,
  type PettyCash, type InsertPettyCash, type Inventory, type InsertInventory,
  type RentManagement, type InsertRentManagement, type Asset, type InsertAsset,
  type Liability, type InsertLiability, type Equity, type InsertEquity,
  type Report, type InsertReport
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Customer methods
  getCustomers(): Promise<Customer[]>;
  getCustomer(id: number): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer>;
  deleteCustomer(id: number): Promise<void>;

  // Loan methods
  getLoans(): Promise<LoanBook[]>;
  getLoan(id: number): Promise<LoanBook | undefined>;
  createLoan(loan: InsertLoanBook): Promise<LoanBook>;
  updateLoan(id: number, loan: Partial<InsertLoanBook>): Promise<LoanBook>;
  deleteLoan(id: number): Promise<void>;

  // Payment Schedule methods
  getPaymentSchedules(): Promise<PaymentSchedule[]>;
  getPaymentSchedule(id: number): Promise<PaymentSchedule | undefined>;
  createPaymentSchedule(schedule: InsertPaymentSchedule): Promise<PaymentSchedule>;
  updatePaymentSchedule(id: number, schedule: Partial<InsertPaymentSchedule>): Promise<PaymentSchedule>;
  deletePaymentSchedule(id: number): Promise<void>;

  // Staff methods
  getStaff(): Promise<Staff[]>;
  createStaff(staff: InsertStaff): Promise<Staff>;
  updateStaff(id: number, staff: Partial<InsertStaff>): Promise<Staff>;
  deleteStaff(id: number): Promise<void>;

  // Income methods
  getIncome(): Promise<IncomeManagement[]>;
  createIncome(income: InsertIncomeManagement): Promise<IncomeManagement>;
  updateIncome(id: number, income: Partial<InsertIncomeManagement>): Promise<IncomeManagement>;
  deleteIncome(id: number): Promise<void>;

  // Expense methods
  getExpenses(): Promise<Expense[]>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpense(id: number, expense: Partial<InsertExpense>): Promise<Expense>;
  deleteExpense(id: number): Promise<void>;

  // Bank Account methods
  getBankAccounts(): Promise<BankManagement[]>;
  createBankAccount(account: InsertBankManagement): Promise<BankManagement>;
  updateBankAccount(id: number, account: Partial<InsertBankManagement>): Promise<BankManagement>;
  deleteBankAccount(id: number): Promise<void>;

  // Petty Cash methods
  getPettyCash(): Promise<PettyCash[]>;
  createPettyCash(pettyCash: InsertPettyCash): Promise<PettyCash>;
  updatePettyCash(id: number, pettyCash: Partial<InsertPettyCash>): Promise<PettyCash>;
  deletePettyCash(id: number): Promise<void>;

  // Inventory methods
  getInventory(): Promise<Inventory[]>;
  createInventory(inventory: InsertInventory): Promise<Inventory>;
  updateInventory(id: number, inventory: Partial<InsertInventory>): Promise<Inventory>;
  deleteInventory(id: number): Promise<void>;

  // Rent Management methods
  getRentManagement(): Promise<RentManagement[]>;
  createRentManagement(rent: InsertRentManagement): Promise<RentManagement>;
  updateRentManagement(id: number, rent: Partial<InsertRentManagement>): Promise<RentManagement>;
  deleteRentManagement(id: number): Promise<void>;

  // Asset methods
  getAssets(): Promise<Asset[]>;
  createAsset(asset: InsertAsset): Promise<Asset>;
  updateAsset(id: number, asset: Partial<InsertAsset>): Promise<Asset>;
  deleteAsset(id: number): Promise<void>;

  // Liability methods
  getLiabilities(): Promise<Liability[]>;
  createLiability(liability: InsertLiability): Promise<Liability>;
  updateLiability(id: number, liability: Partial<InsertLiability>): Promise<Liability>;
  deleteLiability(id: number): Promise<void>;

  // Equity methods
  getEquity(): Promise<Equity[]>;
  createEquity(equity: InsertEquity): Promise<Equity>;
  updateEquity(id: number, equity: Partial<InsertEquity>): Promise<Equity>;
  deleteEquity(id: number): Promise<void>;

  // Report methods
  getReports(): Promise<Report[]>;
  createReport(report: InsertReport): Promise<Report>;
  updateReport(id: number, report: Partial<InsertReport>): Promise<Report>;
  deleteReport(id: number): Promise<void>;

  // Dashboard metrics
  getDashboardMetrics(): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Customer methods
  async getCustomers(): Promise<Customer[]> {
    return await db.select().from(customers).orderBy(desc(customers.createdAt));
  }

  async getCustomer(id: number): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer || undefined;
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const [customer] = await db
      .insert(customers)
      .values(insertCustomer)
      .returning();
    return customer;
  }

  async updateCustomer(id: number, updateCustomer: Partial<InsertCustomer>): Promise<Customer> {
    const [customer] = await db
      .update(customers)
      .set({ ...updateCustomer, updatedAt: new Date() })
      .where(eq(customers.id, id))
      .returning();
    return customer;
  }

  async deleteCustomer(id: number): Promise<void> {
    await db.delete(customers).where(eq(customers.id, id));
  }

  // Loan methods
  async getLoans(): Promise<LoanBook[]> {
    return await db.select().from(loanBooks).orderBy(desc(loanBooks.createdAt));
  }

  async getLoan(id: number): Promise<LoanBook | undefined> {
    const [loan] = await db.select().from(loanBooks).where(eq(loanBooks.id, id));
    return loan || undefined;
  }

  async createLoan(insertLoan: InsertLoanBook): Promise<LoanBook> {
    const [loan] = await db
      .insert(loanBooks)
      .values(insertLoan)
      .returning();
    return loan;
  }

  async updateLoan(id: number, updateLoan: Partial<InsertLoanBook>): Promise<LoanBook> {
    const [loan] = await db
      .update(loanBooks)
      .set({ ...updateLoan, updatedAt: new Date() })
      .where(eq(loanBooks.id, id))
      .returning();
    return loan;
  }

  async deleteLoan(id: number): Promise<void> {
    await db.delete(loanBooks).where(eq(loanBooks.id, id));
  }

  // Payment Schedule methods
  async getPaymentSchedules(): Promise<PaymentSchedule[]> {
    return await db.select().from(paymentSchedules).orderBy(desc(paymentSchedules.dueDate));
  }

  async getPaymentSchedule(id: number): Promise<PaymentSchedule | undefined> {
    const [schedule] = await db.select().from(paymentSchedules).where(eq(paymentSchedules.id, id));
    return schedule || undefined;
  }

  async createPaymentSchedule(insertSchedule: InsertPaymentSchedule): Promise<PaymentSchedule> {
    const [schedule] = await db
      .insert(paymentSchedules)
      .values(insertSchedule)
      .returning();
    return schedule;
  }

  async updatePaymentSchedule(id: number, updateSchedule: Partial<InsertPaymentSchedule>): Promise<PaymentSchedule> {
    const [schedule] = await db
      .update(paymentSchedules)
      .set(updateSchedule)
      .where(eq(paymentSchedules.id, id))
      .returning();
    return schedule;
  }

  async deletePaymentSchedule(id: number): Promise<void> {
    await db.delete(paymentSchedules).where(eq(paymentSchedules.id, id));
  }

  // Staff methods
  async getStaff(): Promise<Staff[]> {
    return await db.select().from(staff).orderBy(desc(staff.createdAt));
  }

  async createStaff(insertStaff: InsertStaff): Promise<Staff> {
    const [member] = await db
      .insert(staff)
      .values(insertStaff)
      .returning();
    return member;
  }

  async updateStaff(id: number, updateStaff: Partial<InsertStaff>): Promise<Staff> {
    const [member] = await db
      .update(staff)
      .set({ ...updateStaff, updatedAt: new Date() })
      .where(eq(staff.id, id))
      .returning();
    return member;
  }

  async deleteStaff(id: number): Promise<void> {
    await db.delete(staff).where(eq(staff.id, id));
  }

  // Income methods
  async getIncome(): Promise<IncomeManagement[]> {
    return await db.select().from(incomeManagement).orderBy(desc(incomeManagement.date));
  }

  async createIncome(insertIncome: InsertIncomeManagement): Promise<IncomeManagement> {
    const [income] = await db
      .insert(incomeManagement)
      .values(insertIncome)
      .returning();
    return income;
  }

  async updateIncome(id: number, updateIncome: Partial<InsertIncomeManagement>): Promise<IncomeManagement> {
    const [income] = await db
      .update(incomeManagement)
      .set(updateIncome)
      .where(eq(incomeManagement.id, id))
      .returning();
    return income;
  }

  async deleteIncome(id: number): Promise<void> {
    await db.delete(incomeManagement).where(eq(incomeManagement.id, id));
  }

  // Expense methods
  async getExpenses(): Promise<Expense[]> {
    return await db.select().from(expenses).orderBy(desc(expenses.date));
  }

  async createExpense(insertExpense: InsertExpense): Promise<Expense> {
    const [expense] = await db
      .insert(expenses)
      .values(insertExpense)
      .returning();
    return expense;
  }

  async updateExpense(id: number, updateExpense: Partial<InsertExpense>): Promise<Expense> {
    const [expense] = await db
      .update(expenses)
      .set(updateExpense)
      .where(eq(expenses.id, id))
      .returning();
    return expense;
  }

  async deleteExpense(id: number): Promise<void> {
    await db.delete(expenses).where(eq(expenses.id, id));
  }

  // Bank Account methods
  async getBankAccounts(): Promise<BankManagement[]> {
    return await db.select().from(bankManagement).orderBy(desc(bankManagement.createdAt));
  }

  async createBankAccount(insertAccount: InsertBankManagement): Promise<BankManagement> {
    const [account] = await db
      .insert(bankManagement)
      .values(insertAccount)
      .returning();
    return account;
  }

  async updateBankAccount(id: number, updateAccount: Partial<InsertBankManagement>): Promise<BankManagement> {
    const [account] = await db
      .update(bankManagement)
      .set({ ...updateAccount, updatedAt: new Date() })
      .where(eq(bankManagement.id, id))
      .returning();
    return account;
  }

  async deleteBankAccount(id: number): Promise<void> {
    await db.delete(bankManagement).where(eq(bankManagement.id, id));
  }

  // Petty Cash methods
  async getPettyCash(): Promise<PettyCash[]> {
    return await db.select().from(pettyCash).orderBy(desc(pettyCash.date));
  }

  async createPettyCash(insertPettyCash: InsertPettyCash): Promise<PettyCash> {
    const [cash] = await db
      .insert(pettyCash)
      .values(insertPettyCash)
      .returning();
    return cash;
  }

  async updatePettyCash(id: number, updatePettyCash: Partial<InsertPettyCash>): Promise<PettyCash> {
    const [cash] = await db
      .update(pettyCash)
      .set(updatePettyCash)
      .where(eq(pettyCash.id, id))
      .returning();
    return cash;
  }

  async deletePettyCash(id: number): Promise<void> {
    await db.delete(pettyCash).where(eq(pettyCash.id, id));
  }

  // Inventory methods
  async getInventory(): Promise<Inventory[]> {
    return await db.select().from(inventory).orderBy(desc(inventory.createdAt));
  }

  async createInventory(insertInventory: InsertInventory): Promise<Inventory> {
    const [item] = await db
      .insert(inventory)
      .values(insertInventory)
      .returning();
    return item;
  }

  async updateInventory(id: number, updateInventory: Partial<InsertInventory>): Promise<Inventory> {
    const [item] = await db
      .update(inventory)
      .set(updateInventory)
      .where(eq(inventory.id, id))
      .returning();
    return item;
  }

  async deleteInventory(id: number): Promise<void> {
    await db.delete(inventory).where(eq(inventory.id, id));
  }

  // Rent Management methods
  async getRentManagement(): Promise<RentManagement[]> {
    return await db.select().from(rentManagement).orderBy(desc(rentManagement.dueDate));
  }

  async createRentManagement(insertRent: InsertRentManagement): Promise<RentManagement> {
    const [rent] = await db
      .insert(rentManagement)
      .values(insertRent)
      .returning();
    return rent;
  }

  async updateRentManagement(id: number, updateRent: Partial<InsertRentManagement>): Promise<RentManagement> {
    const [rent] = await db
      .update(rentManagement)
      .set(updateRent)
      .where(eq(rentManagement.id, id))
      .returning();
    return rent;
  }

  async deleteRentManagement(id: number): Promise<void> {
    await db.delete(rentManagement).where(eq(rentManagement.id, id));
  }

  // Asset methods
  async getAssets(): Promise<Asset[]> {
    return await db.select().from(assets).orderBy(desc(assets.createdAt));
  }

  async createAsset(insertAsset: InsertAsset): Promise<Asset> {
    const [asset] = await db
      .insert(assets)
      .values(insertAsset)
      .returning();
    return asset;
  }

  async updateAsset(id: number, updateAsset: Partial<InsertAsset>): Promise<Asset> {
    const [asset] = await db
      .update(assets)
      .set({ ...updateAsset, updatedAt: new Date() })
      .where(eq(assets.id, id))
      .returning();
    return asset;
  }

  async deleteAsset(id: number): Promise<void> {
    await db.delete(assets).where(eq(assets.id, id));
  }

  // Liability methods
  async getLiabilities(): Promise<Liability[]> {
    return await db.select().from(liabilities).orderBy(desc(liabilities.createdAt));
  }

  async createLiability(insertLiability: InsertLiability): Promise<Liability> {
    const [liability] = await db
      .insert(liabilities)
      .values(insertLiability)
      .returning();
    return liability;
  }

  async updateLiability(id: number, updateLiability: Partial<InsertLiability>): Promise<Liability> {
    const [liability] = await db
      .update(liabilities)
      .set({ ...updateLiability, updatedAt: new Date() })
      .where(eq(liabilities.id, id))
      .returning();
    return liability;
  }

  async deleteLiability(id: number): Promise<void> {
    await db.delete(liabilities).where(eq(liabilities.id, id));
  }

  // Equity methods
  async getEquity(): Promise<Equity[]> {
    return await db.select().from(equity).orderBy(desc(equity.date));
  }

  async createEquity(insertEquity: InsertEquity): Promise<Equity> {
    const [equityItem] = await db
      .insert(equity)
      .values(insertEquity)
      .returning();
    return equityItem;
  }

  async updateEquity(id: number, updateEquity: Partial<InsertEquity>): Promise<Equity> {
    const [equityItem] = await db
      .update(equity)
      .set(updateEquity)
      .where(eq(equity.id, id))
      .returning();
    return equityItem;
  }

  async deleteEquity(id: number): Promise<void> {
    await db.delete(equity).where(eq(equity.id, id));
  }

  // Report methods
  async getReports(): Promise<Report[]> {
    return await db.select().from(reports).orderBy(desc(reports.createdAt));
  }

  async createReport(insertReport: InsertReport): Promise<Report> {
    const [report] = await db
      .insert(reports)
      .values(insertReport)
      .returning();
    return report;
  }

  async updateReport(id: number, updateReport: Partial<InsertReport>): Promise<Report> {
    const [report] = await db
      .update(reports)
      .set(updateReport)
      .where(eq(reports.id, id))
      .returning();
    return report;
  }

  async deleteReport(id: number): Promise<void> {
    await db.delete(reports).where(eq(reports.id, id));
  }

  // Dashboard metrics
  async getDashboardMetrics(): Promise<any> {
    const [totalLoansResult] = await db
      .select({ 
        total: sql<number>`COALESCE(SUM(${loanBooks.loanAmount}), 0)`,
        count: sql<number>`COUNT(*)` 
      })
      .from(loanBooks)
      .where(eq(loanBooks.status, 'approved'));

    const [activeCustomersResult] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(customers)
      .where(eq(customers.status, 'active'));

    const [pendingPaymentsResult] = await db
      .select({ total: sql<number>`COALESCE(SUM(${paymentSchedules.amount}), 0)` })
      .from(paymentSchedules)
      .where(eq(paymentSchedules.status, 'pending'));

    const [monthlyRevenueResult] = await db
      .select({ total: sql<number>`COALESCE(SUM(${incomeManagement.amount}), 0)` })
      .from(incomeManagement)
      .where(sql`DATE_TRUNC('month', ${incomeManagement.date}) = DATE_TRUNC('month', CURRENT_DATE)`);

    return {
      totalLoans: `$${totalLoansResult?.total?.toLocaleString() || '0'}`,
      activeCustomers: activeCustomersResult?.count || 0,
      pendingPayments: `$${pendingPaymentsResult?.total?.toLocaleString() || '0'}`,
      monthlyRevenue: `$${monthlyRevenueResult?.total?.toLocaleString() || '0'}`,
      loanGrowth: 12.5,
      customerGrowth: 8.2,
      paymentGrowth: -3.1,
      revenueGrowth: 15.8,
    };
  }
}

export const storage = new DatabaseStorage();
