import { pgTable, text, serial, integer, boolean, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Organizations (Tenants)
export const organizations = pgTable("organizations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User Roles
export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  permissions: text("permissions").array().notNull(),
});

// Users
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  avatarUrl: text("avatar_url"),
  active: boolean("active").default(true).notNull(),
  organizationId: integer("organization_id")
    .references(() => organizations.id)
    .notNull(),
  roleId: integer("role_id")
    .references(() => roles.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// AI Systems
export const aiSystems = pgTable("ai_systems", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(),
  location: text("location").notNull(),
  organizationId: integer("organization_id")
    .references(() => organizations.id)
    .notNull(),
  createdById: integer("created_by_id")
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Risk Items
export const riskItems = pgTable("risk_items", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  severity: text("severity").notNull(), // low, medium, high, critical
  status: text("status").notNull(), // open, in_progress, resolved
  aiSystemId: integer("ai_system_id")
    .references(() => aiSystems.id)
    .notNull(),
  organizationId: integer("organization_id")
    .references(() => organizations.id)
    .notNull(),
  createdById: integer("created_by_id")
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Compliance Issues
export const complianceIssues = pgTable("compliance_issues", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  severity: text("severity").notNull(), // low, medium, high, critical
  status: text("status").notNull(), // open, in_progress, resolved
  aiSystemId: integer("ai_system_id")
    .references(() => aiSystems.id)
    .notNull(),
  organizationId: integer("organization_id")
    .references(() => organizations.id)
    .notNull(),
  createdById: integer("created_by_id")
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Define relations
export const organizationsRelations = relations(organizations, ({ many }) => ({
  users: many(users),
  aiSystems: many(aiSystems),
  riskItems: many(riskItems),
  complianceIssues: many(complianceIssues),
}));

export const usersRelations = relations(users, ({ one }) => ({
  organization: one(organizations, {
    fields: [users.organizationId],
    references: [organizations.id],
  }),
  role: one(roles, {
    fields: [users.roleId],
    references: [roles.id],
  }),
}));

export const aiSystemsRelations = relations(aiSystems, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [aiSystems.organizationId],
    references: [organizations.id],
  }),
  createdBy: one(users, {
    fields: [aiSystems.createdById],
    references: [users.id],
  }),
  risks: many(riskItems),
  complianceIssues: many(complianceIssues),
}));

export const riskItemsRelations = relations(riskItems, ({ one }) => ({
  aiSystem: one(aiSystems, {
    fields: [riskItems.aiSystemId],
    references: [aiSystems.id],
  }),
  organization: one(organizations, {
    fields: [riskItems.organizationId],
    references: [organizations.id],
  }),
  createdBy: one(users, {
    fields: [riskItems.createdById],
    references: [users.id],
  }),
}));

export const complianceIssuesRelations = relations(complianceIssues, ({ one }) => ({
  aiSystem: one(aiSystems, {
    fields: [complianceIssues.aiSystemId],
    references: [aiSystems.id],
  }),
  organization: one(organizations, {
    fields: [complianceIssues.organizationId],
    references: [organizations.id],
  }),
  createdBy: one(users, {
    fields: [complianceIssues.createdById],
    references: [users.id],
  }),
}));

// Insert Schemas
export const insertOrganizationSchema = createInsertSchema(organizations).omit({
  id: true,
  createdAt: true,
});

export const insertRoleSchema = createInsertSchema(roles).omit({
  id: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertAiSystemSchema = createInsertSchema(aiSystems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRiskItemSchema = createInsertSchema(riskItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertComplianceIssueSchema = createInsertSchema(complianceIssues).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Type Exports
export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;

export type Role = typeof roles.$inferSelect;
export type InsertRole = z.infer<typeof insertRoleSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type AiSystem = typeof aiSystems.$inferSelect;
export type InsertAiSystem = z.infer<typeof insertAiSystemSchema>;

export type RiskItem = typeof riskItems.$inferSelect;
export type InsertRiskItem = z.infer<typeof insertRiskItemSchema>;

export type ComplianceIssue = typeof complianceIssues.$inferSelect;
export type InsertComplianceIssue = z.infer<typeof insertComplianceIssueSchema>;
