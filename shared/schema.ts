import { pgTable, text, serial, integer, boolean, timestamp, uniqueIndex, decimal } from "drizzle-orm/pg-core";
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

// GitHub Scan Configuration
export const githubScanConfigs = pgTable("github_scan_configs", {
  id: serial("id").primaryKey(),
  organization_id: integer("organization_id").references(() => organizations.id),
  github_org_name: text("github_org_name").notNull(),
  api_key: text("api_key").notNull(),
  created_at: timestamp("created_at").defaultNow(),
  last_scan_at: timestamp("last_scan_at"),
  status: text("status").default("idle"),
});

// GitHub Scan Results
export const githubScanResults = pgTable("github_scan_results", {
  id: serial("id").primaryKey(),
  scan_config_id: integer("scan_config_id").references(() => githubScanConfigs.id),
  organization_id: integer("organization_id").references(() => organizations.id),
  repository_name: text("repository_name").notNull(),
  repository_url: text("repository_url").notNull(),
  has_ai_usage: boolean("has_ai_usage").default(false),
  ai_libraries: text("ai_libraries").array(),
  ai_frameworks: text("ai_frameworks").array(),
  confidence_score: decimal("confidence_score", { precision: 4, scale: 2 }),
  detection_type: text("detection_type"),
  scan_date: timestamp("scan_date").defaultNow(),
  added_to_risk: boolean("added_to_risk").default(false),
});

// GitHub Scan Summary
export const githubScanSummaries = pgTable("github_scan_summaries", {
  id: serial("id").primaryKey(),
  scan_config_id: integer("scan_config_id").references(() => githubScanConfigs.id),
  organization_id: integer("organization_id").references(() => organizations.id),
  total_repositories: integer("total_repositories").notNull(),
  repositories_with_ai: integer("repositories_with_ai").notNull(),
  scan_date: timestamp("scan_date").defaultNow(),
});

// Relations
export const githubScanConfigsRelations = relations(githubScanConfigs, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [githubScanConfigs.organization_id],
    references: [organizations.id],
  }),
  results: many(githubScanResults),
  summaries: many(githubScanSummaries),
}));

export const githubScanResultsRelations = relations(githubScanResults, ({ one }) => ({
  scanConfig: one(githubScanConfigs, {
    fields: [githubScanResults.scan_config_id],
    references: [githubScanConfigs.id],
  }),
  organization: one(organizations, {
    fields: [githubScanResults.organization_id],
    references: [organizations.id],
  }),
}));

export const githubScanSummariesRelations = relations(githubScanSummaries, ({ one }) => ({
  scanConfig: one(githubScanConfigs, {
    fields: [githubScanSummaries.scan_config_id],
    references: [githubScanConfigs.id],
  }),
  organization: one(organizations, {
    fields: [githubScanSummaries.organization_id],
    references: [organizations.id],
  }),
}));

// Schemas
export const insertGithubScanConfigSchema = createInsertSchema(githubScanConfigs).omit({
  id: true,
  created_at: true,
  last_scan_at: true,
  status: true,
});

export const insertGithubScanResultSchema = createInsertSchema(githubScanResults).omit({
  id: true,
  scan_date: true,
  added_to_risk: true,
});

export const insertGithubScanSummarySchema = createInsertSchema(githubScanSummaries).omit({
  id: true,
  scan_date: true,
});

// Types
export type GithubScanConfig = typeof githubScanConfigs.$inferSelect;
export type InsertGithubScanConfig = z.infer<typeof insertGithubScanConfigSchema>;

export type GithubScanResult = typeof githubScanResults.$inferSelect;
export type InsertGithubScanResult = z.infer<typeof insertGithubScanResultSchema>;

export type GithubScanSummary = typeof githubScanSummaries.$inferSelect;
export type InsertGithubScanSummary = z.infer<typeof insertGithubScanSummarySchema>;
