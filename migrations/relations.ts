import { relations } from "drizzle-orm/relations";
import { tenants, assets, bankManagement, loanBooks, paymentSchedules, liabilities, equity, expenses, incomeManagement, users, userAuditLogs, reports, mfiRegistration, shareholders, userTenantAccess, staff, roles, rolePermissions, permissions, customers, loanProducts, pettyCash, rentManagement, userRoles, inventory, supportTickets, supportMessages } from "./schema";

export const assetsRelations = relations(assets, ({one}) => ({
	tenant: one(tenants, {
		fields: [assets.tenantId],
		references: [tenants.id]
	}),
}));

export const tenantsRelations = relations(tenants, ({many}) => ({
	assets: many(assets),
	bankManagements: many(bankManagement),
	paymentSchedules: many(paymentSchedules),
	liabilities: many(liabilities),
	equities: many(equity),
	expenses: many(expenses),
	incomeManagements: many(incomeManagement),
	userAuditLogs: many(userAuditLogs),
	reports: many(reports),
	mfiRegistrations: many(mfiRegistration),
	shareholders: many(shareholders),
	userTenantAccesses: many(userTenantAccess),
	staff: many(staff),
	customers: many(customers),
	loanBooks: many(loanBooks),
	loanProducts: many(loanProducts),
	pettyCashes: many(pettyCash),
	rentManagements: many(rentManagement),
	userRoles: many(userRoles),
	roles: many(roles),
	users: many(users),
	inventories: many(inventory),
}));

export const bankManagementRelations = relations(bankManagement, ({one}) => ({
	tenant: one(tenants, {
		fields: [bankManagement.tenantId],
		references: [tenants.id]
	}),
}));

export const paymentSchedulesRelations = relations(paymentSchedules, ({one}) => ({
	loanBook: one(loanBooks, {
		fields: [paymentSchedules.loanId],
		references: [loanBooks.id]
	}),
	tenant: one(tenants, {
		fields: [paymentSchedules.tenantId],
		references: [tenants.id]
	}),
}));

export const loanBooksRelations = relations(loanBooks, ({one, many}) => ({
	paymentSchedules: many(paymentSchedules),
	customer: one(customers, {
		fields: [loanBooks.customerId],
		references: [customers.id]
	}),
	user_approvedBy: one(users, {
		fields: [loanBooks.approvedBy],
		references: [users.id],
		relationName: "loanBooks_approvedBy_users_id"
	}),
	loanProduct: one(loanProducts, {
		fields: [loanBooks.loanProductId],
		references: [loanProducts.id]
	}),
	user_assignedOfficer: one(users, {
		fields: [loanBooks.assignedOfficer],
		references: [users.id],
		relationName: "loanBooks_assignedOfficer_users_id"
	}),
	user_disbursedBy: one(users, {
		fields: [loanBooks.disbursedBy],
		references: [users.id],
		relationName: "loanBooks_disbursedBy_users_id"
	}),
	tenant: one(tenants, {
		fields: [loanBooks.tenantId],
		references: [tenants.id]
	}),
}));

export const liabilitiesRelations = relations(liabilities, ({one}) => ({
	tenant: one(tenants, {
		fields: [liabilities.tenantId],
		references: [tenants.id]
	}),
}));

export const equityRelations = relations(equity, ({one}) => ({
	tenant: one(tenants, {
		fields: [equity.tenantId],
		references: [tenants.id]
	}),
}));

export const expensesRelations = relations(expenses, ({one}) => ({
	tenant: one(tenants, {
		fields: [expenses.tenantId],
		references: [tenants.id]
	}),
}));

export const incomeManagementRelations = relations(incomeManagement, ({one}) => ({
	tenant: one(tenants, {
		fields: [incomeManagement.tenantId],
		references: [tenants.id]
	}),
}));

export const userAuditLogsRelations = relations(userAuditLogs, ({one}) => ({
	user: one(users, {
		fields: [userAuditLogs.userId],
		references: [users.id]
	}),
	tenant: one(tenants, {
		fields: [userAuditLogs.tenantId],
		references: [tenants.id]
	}),
}));

export const usersRelations = relations(users, ({one, many}) => ({
	userAuditLogs: many(userAuditLogs),
	reports: many(reports),
	loanBooks_approvedBy: many(loanBooks, {
		relationName: "loanBooks_approvedBy_users_id"
	}),
	loanBooks_assignedOfficer: many(loanBooks, {
		relationName: "loanBooks_assignedOfficer_users_id"
	}),
	loanBooks_disbursedBy: many(loanBooks, {
		relationName: "loanBooks_disbursedBy_users_id"
	}),
	userRoles_userId: many(userRoles, {
		relationName: "userRoles_userId_users_id"
	}),
	userRoles_assignedBy: many(userRoles, {
		relationName: "userRoles_assignedBy_users_id"
	}),
	tenant: one(tenants, {
		fields: [users.tenantId],
		references: [tenants.id]
	}),
}));

export const reportsRelations = relations(reports, ({one}) => ({
	user: one(users, {
		fields: [reports.generatedBy],
		references: [users.id]
	}),
	tenant: one(tenants, {
		fields: [reports.tenantId],
		references: [tenants.id]
	}),
}));

export const mfiRegistrationRelations = relations(mfiRegistration, ({one}) => ({
	tenant: one(tenants, {
		fields: [mfiRegistration.tenantId],
		references: [tenants.id]
	}),
}));

export const shareholdersRelations = relations(shareholders, ({one}) => ({
	tenant: one(tenants, {
		fields: [shareholders.tenantId],
		references: [tenants.id]
	}),
}));

export const userTenantAccessRelations = relations(userTenantAccess, ({one}) => ({
	tenant: one(tenants, {
		fields: [userTenantAccess.tenantId],
		references: [tenants.id]
	}),
}));

export const staffRelations = relations(staff, ({one, many}) => ({
	tenant: one(tenants, {
		fields: [staff.tenantId],
		references: [tenants.id]
	}),
	pettyCashes: many(pettyCash),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({one}) => ({
	role: one(roles, {
		fields: [rolePermissions.roleId],
		references: [roles.id]
	}),
	permission: one(permissions, {
		fields: [rolePermissions.permissionId],
		references: [permissions.id]
	}),
}));

export const rolesRelations = relations(roles, ({one, many}) => ({
	rolePermissions: many(rolePermissions),
	userRoles: many(userRoles),
	tenant: one(tenants, {
		fields: [roles.tenantId],
		references: [tenants.id]
	}),
}));

export const permissionsRelations = relations(permissions, ({many}) => ({
	rolePermissions: many(rolePermissions),
}));

export const customersRelations = relations(customers, ({one, many}) => ({
	tenant: one(tenants, {
		fields: [customers.tenantId],
		references: [tenants.id]
	}),
	loanBooks: many(loanBooks),
}));

export const loanProductsRelations = relations(loanProducts, ({one, many}) => ({
	loanBooks: many(loanBooks),
	tenant: one(tenants, {
		fields: [loanProducts.tenantId],
		references: [tenants.id]
	}),
}));

export const pettyCashRelations = relations(pettyCash, ({one}) => ({
	staff: one(staff, {
		fields: [pettyCash.handledBy],
		references: [staff.id]
	}),
	tenant: one(tenants, {
		fields: [pettyCash.tenantId],
		references: [tenants.id]
	}),
}));

export const rentManagementRelations = relations(rentManagement, ({one}) => ({
	tenant: one(tenants, {
		fields: [rentManagement.tenantId],
		references: [tenants.id]
	}),
}));

export const userRolesRelations = relations(userRoles, ({one}) => ({
	user_userId: one(users, {
		fields: [userRoles.userId],
		references: [users.id],
		relationName: "userRoles_userId_users_id"
	}),
	role: one(roles, {
		fields: [userRoles.roleId],
		references: [roles.id]
	}),
	user_assignedBy: one(users, {
		fields: [userRoles.assignedBy],
		references: [users.id],
		relationName: "userRoles_assignedBy_users_id"
	}),
	tenant: one(tenants, {
		fields: [userRoles.tenantId],
		references: [tenants.id]
	}),
}));

export const inventoryRelations = relations(inventory, ({one}) => ({
	tenant: one(tenants, {
		fields: [inventory.tenantId],
		references: [tenants.id]
	}),
}));

export const supportMessagesRelations = relations(supportMessages, ({one}) => ({
	supportTicket: one(supportTickets, {
		fields: [supportMessages.ticketId],
		references: [supportTickets.id]
	}),
}));

export const supportTicketsRelations = relations(supportTickets, ({many}) => ({
	supportMessages: many(supportMessages),
}));