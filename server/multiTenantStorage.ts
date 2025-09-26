// SIMPLIFIED SINGLE-TENANT STORAGE - BACKWARD COMPATIBILITY WRAPPER
// This file now provides a compatibility layer that removes tenant-awareness

import { DatabaseStorage, type IStorage } from "./storage";
import type {
  User, InsertUser, Customer, InsertCustomer, LoanBook, InsertLoanBook,
  PaymentSchedule, InsertPaymentSchedule, Staff, InsertStaff,
  IncomeManagement, InsertIncomeManagement, Expense, InsertExpense,
  BankManagement, InsertBankManagement, PettyCash, InsertPettyCash,
  Inventory, InsertInventory, RentManagement, InsertRentManagement,
  Asset, InsertAsset, Liability, InsertLiability, Equity, InsertEquity,
  Report, InsertReport, UserAuditLog, InsertUserAuditLog,
  MfiRegistration, InsertMfiRegistration, Shareholder, InsertShareholder,
  LoanProduct, InsertLoanProduct, SupportTicket, InsertSupportTicket,
  SupportMessage, InsertSupportMessage
} from "@shared/schema";

// Default tenant ID for backward compatibility
const DEFAULT_TENANT_ID = "default-tenant-001";

// Simplified interface for single-tenant mode - removes tenant parameters
export interface IMultiTenantStorage {
  // Backward compatibility methods - these now ignore tenant context
  getUser(tenantId: string, id: number): Promise<User | undefined>;
  getUserByUsername(tenantId: string, username: string): Promise<User | undefined>;
  getUserByEmail(tenantId: string, email: string): Promise<User | undefined>;
  getAllUsers(tenantId: string): Promise<User[]>;
  createUser(tenantId: string, user: InsertUser): Promise<User>;
  updateUser(tenantId: string, id: number, user: Partial<InsertUser>): Promise<User>;
  updateUserPassword(tenantId: string, id: number, hashedPassword: string): Promise<User>;
  updateUserLastLogin(tenantId: string, id: number): Promise<User>;
  deleteUser(tenantId: string, id: number): Promise<void>;
  
  // User audit log methods
  getUserAuditLogs(tenantId: string, userId: number): Promise<UserAuditLog[]>;
  createUserAuditLog(tenantId: string, log: InsertUserAuditLog): Promise<UserAuditLog>;
  
  getCustomers(tenantId: string): Promise<Customer[]>;
  getCustomer(tenantId: string, id: number): Promise<Customer | undefined>;
  getCustomerByEmail(tenantId: string, email: string): Promise<Customer | undefined>;
  createCustomer(tenantId: string, customer: InsertCustomer): Promise<Customer>;
  updateCustomer(tenantId: string, id: number, customer: Partial<InsertCustomer>): Promise<Customer>;
  updateCustomerPassword(tenantId: string, id: number, hashedPassword: string): Promise<Customer>;
  updateCustomerLastLogin(tenantId: string, id: number): Promise<Customer>;
  deleteCustomer(tenantId: string, id: number): Promise<void>;
  
  getCustomerLoans(tenantId: string, customerId: number): Promise<LoanBook[]>;
  getCustomerPayments(tenantId: string, customerId: number): Promise<PaymentSchedule[]>;
  getCustomerUpcomingPayments(tenantId: string, customerId: number): Promise<PaymentSchedule[]>;

  getLoanProducts(tenantId: string): Promise<LoanProduct[]>;
  getLoanProduct(tenantId: string, id: number): Promise<LoanProduct | undefined>;
  createLoanProduct(tenantId: string, loanProduct: InsertLoanProduct): Promise<LoanProduct>;
  updateLoanProduct(tenantId: string, id: number, loanProduct: Partial<InsertLoanProduct>): Promise<LoanProduct>;
  deleteLoanProduct(tenantId: string, id: number): Promise<void>;

  getLoans(tenantId: string): Promise<LoanBook[]>;
  getLoan(tenantId: string, id: number): Promise<LoanBook | undefined>;
  createLoan(tenantId: string, loan: InsertLoanBook): Promise<LoanBook>;
  updateLoan(tenantId: string, id: number, loan: Partial<InsertLoanBook>): Promise<LoanBook>;
  deleteLoan(tenantId: string, id: number): Promise<void>;

  getPaymentSchedules(tenantId: string): Promise<PaymentSchedule[]>;
  getPaymentSchedule(tenantId: string, id: number): Promise<PaymentSchedule | undefined>;
  getPaymentSchedulesByLoan(tenantId: string, loanId: number): Promise<PaymentSchedule[]>;
  createPaymentSchedule(tenantId: string, schedule: InsertPaymentSchedule): Promise<PaymentSchedule>;
  updatePaymentSchedule(tenantId: string, id: number, schedule: Partial<InsertPaymentSchedule>): Promise<PaymentSchedule>;
  deletePaymentSchedule(tenantId: string, id: number): Promise<void>;

  getStaff(tenantId: string): Promise<Staff[]>;
  createStaff(tenantId: string, staff: InsertStaff): Promise<Staff>;
  updateStaff(tenantId: string, id: number, staff: Partial<InsertStaff>): Promise<Staff>;
  deleteStaff(tenantId: string, id: number): Promise<void>;

  getIncome(tenantId: string): Promise<IncomeManagement[]>;
  createIncome(tenantId: string, income: InsertIncomeManagement): Promise<IncomeManagement>;
  updateIncome(tenantId: string, id: number, income: Partial<InsertIncomeManagement>): Promise<IncomeManagement>;
  deleteIncome(tenantId: string, id: number): Promise<void>;

  getExpenses(tenantId: string): Promise<Expense[]>;
  createExpense(tenantId: string, expense: InsertExpense): Promise<Expense>;
  updateExpense(tenantId: string, id: number, expense: Partial<InsertExpense>): Promise<Expense>;
  deleteExpense(tenantId: string, id: number): Promise<void>;

  getBankAccounts(tenantId: string): Promise<BankManagement[]>;
  createBankAccount(tenantId: string, account: InsertBankManagement): Promise<BankManagement>;
  updateBankAccount(tenantId: string, id: number, account: Partial<InsertBankManagement>): Promise<BankManagement>;
  deleteBankAccount(tenantId: string, id: number): Promise<void>;

  getDashboardMetrics(tenantId: string): Promise<any>;
  getRecentPayments(tenantId: string): Promise<any>;
  getTodaysPayments(tenantId: string): Promise<any>;
  getMonthlyPayments(tenantId: string): Promise<any>;
}

// Backward compatibility class that delegates to DatabaseStorage
export class MultiTenantStorage implements IMultiTenantStorage {
  private storage: DatabaseStorage;
  
  constructor() {
    this.storage = new DatabaseStorage();
  }
  
  // All tenant-aware methods now ignore tenantId and use single-tenant operations
  
  // User methods (tenant parameter ignored)
  async getUser(tenantId: string, id: number): Promise<User | undefined> {
    return this.storage.getUser(id);
  }

  async getUserByUsername(tenantId: string, username: string): Promise<User | undefined> {
    return this.storage.getUserByUsername(username);
  }

  async getUserByEmail(tenantId: string, email: string): Promise<User | undefined> {
    return this.storage.getUserByEmail(email);
  }

  async getAllUsers(tenantId: string): Promise<User[]> {
    return this.storage.getAllUsers();
  }

  async createUser(tenantId: string, user: InsertUser): Promise<User> {
    return this.storage.createUser(user);
  }

  async updateUser(tenantId: string, id: number, user: Partial<InsertUser>): Promise<User> {
    return this.storage.updateUser(id, user);
  }

  async updateUserPassword(tenantId: string, id: number, hashedPassword: string): Promise<User> {
    return this.storage.updateUserPassword(id, hashedPassword);
  }

  async updateUserLastLogin(tenantId: string, id: number): Promise<User> {
    return this.storage.updateUserLastLogin(id);
  }

  async deleteUser(tenantId: string, id: number): Promise<void> {
    return this.storage.deleteUser(id);
  }

  // User audit log methods (tenant parameter ignored)
  async getUserAuditLogs(tenantId: string, userId: number): Promise<UserAuditLog[]> {
    return this.storage.getUserAuditLogs(userId);
  }

  async createUserAuditLog(tenantId: string, log: InsertUserAuditLog): Promise<UserAuditLog> {
    return this.storage.createUserAuditLog(log);
  }

  // Customer methods (tenant parameter ignored)
  async getCustomers(tenantId: string): Promise<Customer[]> {
    return this.storage.getCustomers();
  }

  async getCustomer(tenantId: string, id: number): Promise<Customer | undefined> {
    return this.storage.getCustomer(id);
  }

  async getCustomerByEmail(tenantId: string, email: string): Promise<Customer | undefined> {
    return this.storage.getCustomerByEmail(email);
  }

  async createCustomer(tenantId: string, customer: InsertCustomer): Promise<Customer> {
    return this.storage.createCustomer(customer);
  }

  async updateCustomer(tenantId: string, id: number, customer: Partial<InsertCustomer>): Promise<Customer> {
    return this.storage.updateCustomer(id, customer);
  }

  async updateCustomerPassword(tenantId: string, id: number, hashedPassword: string): Promise<Customer> {
    return this.storage.updateCustomerPassword(id, hashedPassword);
  }

  async updateCustomerLastLogin(tenantId: string, id: number): Promise<Customer> {
    return this.storage.updateCustomerLastLogin(id);
  }

  async deleteCustomer(tenantId: string, id: number): Promise<void> {
    return this.storage.deleteCustomer(id);
  }

  // Customer portal methods (tenant parameter ignored)
  async getCustomerLoans(tenantId: string, customerId: number): Promise<LoanBook[]> {
    return this.storage.getCustomerLoans(customerId);
  }

  async getCustomerPayments(tenantId: string, customerId: number): Promise<PaymentSchedule[]> {
    return this.storage.getCustomerPayments(customerId);
  }

  async getCustomerUpcomingPayments(tenantId: string, customerId: number): Promise<PaymentSchedule[]> {
    return this.storage.getCustomerUpcomingPayments(customerId);
  }

  // Loan product methods (tenant parameter ignored)
  async getLoanProducts(tenantId: string): Promise<LoanProduct[]> {
    return this.storage.getLoanProducts();
  }

  async getLoanProduct(tenantId: string, id: number): Promise<LoanProduct | undefined> {
    return this.storage.getLoanProduct(id);
  }

  async createLoanProduct(tenantId: string, loanProduct: InsertLoanProduct): Promise<LoanProduct> {
    return this.storage.createLoanProduct(loanProduct);
  }

  async updateLoanProduct(tenantId: string, id: number, loanProduct: Partial<InsertLoanProduct>): Promise<LoanProduct> {
    return this.storage.updateLoanProduct(id, loanProduct);
  }

  async deleteLoanProduct(tenantId: string, id: number): Promise<void> {
    return this.storage.deleteLoanProduct(id);
  }

  // Loan methods (tenant parameter ignored)
  async getLoans(tenantId: string): Promise<LoanBook[]> {
    return this.storage.getLoans();
  }

  async getLoan(tenantId: string, id: number): Promise<LoanBook | undefined> {
    return this.storage.getLoan(id);
  }

  async createLoan(tenantId: string, loan: InsertLoanBook): Promise<LoanBook> {
    return this.storage.createLoan(loan);
  }

  async updateLoan(tenantId: string, id: number, loan: Partial<InsertLoanBook>): Promise<LoanBook> {
    return this.storage.updateLoan(id, loan);
  }

  async deleteLoan(tenantId: string, id: number): Promise<void> {
    return this.storage.deleteLoan(id);
  }

  // Payment schedule methods (tenant parameter ignored)
  async getPaymentSchedules(tenantId: string): Promise<PaymentSchedule[]> {
    return this.storage.getPaymentSchedules();
  }

  async getPaymentSchedule(tenantId: string, id: number): Promise<PaymentSchedule | undefined> {
    return this.storage.getPaymentSchedule(id);
  }

  async getPaymentSchedulesByLoan(tenantId: string, loanId: number): Promise<PaymentSchedule[]> {
    return this.storage.getPaymentSchedulesByLoan(loanId);
  }

  async createPaymentSchedule(tenantId: string, schedule: InsertPaymentSchedule): Promise<PaymentSchedule> {
    return this.storage.createPaymentSchedule(schedule);
  }

  async updatePaymentSchedule(tenantId: string, id: number, schedule: Partial<InsertPaymentSchedule>): Promise<PaymentSchedule> {
    return this.storage.updatePaymentSchedule(id, schedule);
  }

  async deletePaymentSchedule(tenantId: string, id: number): Promise<void> {
    return this.storage.deletePaymentSchedule(id);
  }

  // Staff methods (tenant parameter ignored)
  async getStaff(tenantId: string): Promise<Staff[]> {
    return this.storage.getStaff();
  }

  async createStaff(tenantId: string, staff: InsertStaff): Promise<Staff> {
    return this.storage.createStaff(staff);
  }

  async updateStaff(tenantId: string, id: number, staff: Partial<InsertStaff>): Promise<Staff> {
    return this.storage.updateStaff(id, staff);
  }

  async deleteStaff(tenantId: string, id: number): Promise<void> {
    return this.storage.deleteStaff(id);
  }

  // Income methods (tenant parameter ignored)
  async getIncome(tenantId: string): Promise<IncomeManagement[]> {
    return this.storage.getIncome();
  }

  async createIncome(tenantId: string, income: InsertIncomeManagement): Promise<IncomeManagement> {
    return this.storage.createIncome(income);
  }

  async updateIncome(tenantId: string, id: number, income: Partial<InsertIncomeManagement>): Promise<IncomeManagement> {
    return this.storage.updateIncome(id, income);
  }

  async deleteIncome(tenantId: string, id: number): Promise<void> {
    return this.storage.deleteIncome(id);
  }

  // Expense methods (tenant parameter ignored)
  async getExpenses(tenantId: string): Promise<Expense[]> {
    return this.storage.getExpenses();
  }

  async createExpense(tenantId: string, expense: InsertExpense): Promise<Expense> {
    return this.storage.createExpense(expense);
  }

  async updateExpense(tenantId: string, id: number, expense: Partial<InsertExpense>): Promise<Expense> {
    return this.storage.updateExpense(id, expense);
  }

  async deleteExpense(tenantId: string, id: number): Promise<void> {
    return this.storage.deleteExpense(id);
  }

  // Bank account methods (tenant parameter ignored)
  async getBankAccounts(tenantId: string): Promise<BankManagement[]> {
    return this.storage.getBankAccounts();
  }

  async createBankAccount(tenantId: string, account: InsertBankManagement): Promise<BankManagement> {
    return this.storage.createBankAccount(account);
  }

  async updateBankAccount(tenantId: string, id: number, account: Partial<InsertBankManagement>): Promise<BankManagement> {
    return this.storage.updateBankAccount(id, account);
  }

  async deleteBankAccount(tenantId: string, id: number): Promise<void> {
    return this.storage.deleteBankAccount(id);
  }

  // Dashboard metrics (tenant parameter ignored)
  async getDashboardMetrics(tenantId: string): Promise<any> {
    return this.storage.getDashboardMetrics();
  }

  async getRecentPayments(tenantId: string): Promise<any> {
    return this.storage.getRecentPayments();
  }

  async getTodaysPayments(tenantId: string): Promise<any> {
    return this.storage.getTodaysPayments();
  }

  async getMonthlyPayments(tenantId: string): Promise<any> {
    return this.storage.getMonthlyPayments();
  }
}

// Backward compatibility storage instance
export class BackwardCompatibilityStorage extends MultiTenantStorage {
  // This class provides the same interface as before but without tenant filtering
  constructor() {
    super();
    console.log("BackwardCompatibilityStorage initialized - operating in single-tenant mode");
  }
}

// Export instance for backward compatibility
export const multiTenantStorage = new BackwardCompatibilityStorage();