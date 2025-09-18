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
export interface IMultiTenantStorage extends IStorage {
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
export class MultiTenantStorage extends DatabaseStorage implements IMultiTenantStorage {
  // All tenant-aware methods now ignore tenantId and use single-tenant operations
  
  // User methods (tenant parameter ignored)
  async getUser(tenantId: string, id: number): Promise<User | undefined> {
    return super.getUser(id);
  }

  async getUserByUsername(tenantId: string, username: string): Promise<User | undefined> {
    return super.getUserByUsername(username);
  }

  async getUserByEmail(tenantId: string, email: string): Promise<User | undefined> {
    return super.getUserByEmail(email);
  }

  async getAllUsers(tenantId: string): Promise<User[]> {
    return super.getAllUsers();
  }

  async createUser(tenantId: string, user: InsertUser): Promise<User> {
    return super.createUser(user);
  }

  async updateUser(tenantId: string, id: number, user: Partial<InsertUser>): Promise<User> {
    return super.updateUser(id, user);
  }

  async updateUserPassword(tenantId: string, id: number, hashedPassword: string): Promise<User> {
    return super.updateUserPassword(id, hashedPassword);
  }

  async updateUserLastLogin(tenantId: string, id: number): Promise<User> {
    return super.updateUserLastLogin(id);
  }

  async deleteUser(tenantId: string, id: number): Promise<void> {
    return super.deleteUser(id);
  }

  // Customer methods (tenant parameter ignored)
  async getCustomers(tenantId: string): Promise<Customer[]> {
    return super.getCustomers();
  }

  async getCustomer(tenantId: string, id: number): Promise<Customer | undefined> {
    return super.getCustomer(id);
  }

  async getCustomerByEmail(tenantId: string, email: string): Promise<Customer | undefined> {
    return super.getCustomerByEmail(email);
  }

  async createCustomer(tenantId: string, customer: InsertCustomer): Promise<Customer> {
    return super.createCustomer(customer);
  }

  async updateCustomer(tenantId: string, id: number, customer: Partial<InsertCustomer>): Promise<Customer> {
    return super.updateCustomer(tenantId, id, customer);
  }

  async updateCustomerPassword(tenantId: string, id: number, hashedPassword: string): Promise<Customer> {
    return super.updateCustomerPassword(tenantId, id, hashedPassword);
  }

  async updateCustomerLastLogin(tenantId: string, id: number): Promise<Customer> {
    return super.updateCustomerLastLogin(id);
  }

  async deleteCustomer(tenantId: string, id: number): Promise<void> {
    return super.deleteCustomer(id);
  }

  // Customer portal methods (tenant parameter ignored)
  async getCustomerLoans(tenantId: string, customerId: number): Promise<LoanBook[]> {
    return super.getCustomerLoans(customerId);
  }

  async getCustomerPayments(tenantId: string, customerId: number): Promise<PaymentSchedule[]> {
    return super.getCustomerPayments(customerId);
  }

  async getCustomerUpcomingPayments(tenantId: string, customerId: number): Promise<PaymentSchedule[]> {
    return super.getCustomerUpcomingPayments(customerId);
  }

  // Loan product methods (tenant parameter ignored)
  async getLoanProducts(tenantId: string): Promise<LoanProduct[]> {
    return super.getLoanProducts();
  }

  async getLoanProduct(tenantId: string, id: number): Promise<LoanProduct | undefined> {
    return super.getLoanProduct(id);
  }

  async createLoanProduct(tenantId: string, loanProduct: InsertLoanProduct): Promise<LoanProduct> {
    return super.createLoanProduct(loanProduct);
  }

  async updateLoanProduct(tenantId: string, id: number, loanProduct: Partial<InsertLoanProduct>): Promise<LoanProduct> {
    return super.updateLoanProduct(id, loanProduct);
  }

  async deleteLoanProduct(tenantId: string, id: number): Promise<void> {
    return super.deleteLoanProduct(id);
  }

  // Loan methods (tenant parameter ignored)
  async getLoans(tenantId: string): Promise<LoanBook[]> {
    return super.getLoans();
  }

  async getLoan(tenantId: string, id: number): Promise<LoanBook | undefined> {
    return super.getLoan(id);
  }

  async createLoan(tenantId: string, loan: InsertLoanBook): Promise<LoanBook> {
    return super.createLoan(loan);
  }

  async updateLoan(tenantId: string, id: number, loan: Partial<InsertLoanBook>): Promise<LoanBook> {
    return super.updateLoan(id, loan);
  }

  async deleteLoan(tenantId: string, id: number): Promise<void> {
    return super.deleteLoan(id);
  }

  // Payment schedule methods (tenant parameter ignored)
  async getPaymentSchedules(tenantId: string): Promise<PaymentSchedule[]> {
    return super.getPaymentSchedules();
  }

  async getPaymentSchedule(tenantId: string, id: number): Promise<PaymentSchedule | undefined> {
    return super.getPaymentSchedule(id);
  }

  async getPaymentSchedulesByLoan(tenantId: string, loanId: number): Promise<PaymentSchedule[]> {
    return super.getPaymentSchedulesByLoan(tenantId, loanId);
  }

  async createPaymentSchedule(tenantId: string, schedule: InsertPaymentSchedule): Promise<PaymentSchedule> {
    return super.createPaymentSchedule(schedule);
  }

  async updatePaymentSchedule(tenantId: string, id: number, schedule: Partial<InsertPaymentSchedule>): Promise<PaymentSchedule> {
    return super.updatePaymentSchedule(id, schedule);
  }

  async deletePaymentSchedule(tenantId: string, id: number): Promise<void> {
    return super.deletePaymentSchedule(id);
  }

  // Staff methods (tenant parameter ignored)
  async getStaff(tenantId: string): Promise<Staff[]> {
    return super.getStaff();
  }

  async createStaff(tenantId: string, staff: InsertStaff): Promise<Staff> {
    return super.createStaff(staff);
  }

  async updateStaff(tenantId: string, id: number, staff: Partial<InsertStaff>): Promise<Staff> {
    return super.updateStaff(id, staff);
  }

  async deleteStaff(tenantId: string, id: number): Promise<void> {
    return super.deleteStaff(id);
  }

  // Income methods (tenant parameter ignored)
  async getIncome(tenantId: string): Promise<IncomeManagement[]> {
    return super.getIncome();
  }

  async createIncome(tenantId: string, income: InsertIncomeManagement): Promise<IncomeManagement> {
    return super.createIncome(income);
  }

  async updateIncome(tenantId: string, id: number, income: Partial<InsertIncomeManagement>): Promise<IncomeManagement> {
    return super.updateIncome(id, income);
  }

  async deleteIncome(tenantId: string, id: number): Promise<void> {
    return super.deleteIncome(id);
  }

  // Expense methods (tenant parameter ignored)
  async getExpenses(tenantId: string): Promise<Expense[]> {
    return super.getExpenses();
  }

  async createExpense(tenantId: string, expense: InsertExpense): Promise<Expense> {
    return super.createExpense(expense);
  }

  async updateExpense(tenantId: string, id: number, expense: Partial<InsertExpense>): Promise<Expense> {
    return super.updateExpense(id, expense);
  }

  async deleteExpense(tenantId: string, id: number): Promise<void> {
    return super.deleteExpense(id);
  }

  // Bank account methods (tenant parameter ignored)
  async getBankAccounts(tenantId: string): Promise<BankManagement[]> {
    return super.getBankAccounts();
  }

  async createBankAccount(tenantId: string, account: InsertBankManagement): Promise<BankManagement> {
    return super.createBankAccount(account);
  }

  async updateBankAccount(tenantId: string, id: number, account: Partial<InsertBankManagement>): Promise<BankManagement> {
    return super.updateBankAccount(id, account);
  }

  async deleteBankAccount(tenantId: string, id: number): Promise<void> {
    return super.deleteBankAccount(id);
  }

  // Dashboard metrics (tenant parameter ignored)
  async getDashboardMetrics(tenantId: string): Promise<any> {
    return super.getDashboardMetrics();
  }

  async getRecentPayments(tenantId: string): Promise<any> {
    return super.getRecentPayments();
  }

  async getTodaysPayments(tenantId: string): Promise<any> {
    return super.getTodaysPayments();
  }

  async getMonthlyPayments(tenantId: string): Promise<any> {
    return super.getMonthlyPayments();
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