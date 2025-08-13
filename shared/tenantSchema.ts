// Simplified tenant schema matching current database structure
import { pgTable, text, uuid, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const simpleTenants = pgTable("tenants", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  settings: jsonb("settings").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSimpleTenantSchema = createInsertSchema(simpleTenants).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type SimpleTenant = typeof simpleTenants.$inferSelect;
export type InsertSimpleTenant = z.infer<typeof insertSimpleTenantSchema>;

// Tenant Context Types for Multi-tenant Operations
export type SimpleTenantContext = {
  tenant: SimpleTenant;
  tenantId: string;
  slug: string;
};