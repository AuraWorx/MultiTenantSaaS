import { pgTable, text, serial, integer, boolean, timestamp, uniqueIndex, decimal, date } from "drizzle-orm/pg-core";
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
  impact: text("impact").default("medium"), // low, medium, high
  likelihood: text("likelihood").default("medium"), // low, medium, high
  category: text("category").default("security"), // security, privacy, bias
  status: text("status").notNull(), // open, mitigated, closed
  systemDetails: text("system_details"),
  aiSystemId: integer("ai_system_id")
    .references(() => aiSystems.id),
  organizationId: integer("organization_id")
    .references(() => organizations.id)
    .notNull(),
  createdById: integer("created_by_id")
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Risk Mitigations
export const riskMitigations = pgTable("risk_mitigations", {
  id: serial("id").primaryKey(),
  riskItemId: integer("risk_item_id")
    .references(() => riskItems.id)
    .notNull(),
  description: text("description").notNull(),
  status: text("status").notNull(), // planned, in-progress, completed, rejected
  notes: text("notes"),
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
  riskMitigations: many(riskMitigations),
  complianceIssues: many(complianceIssues),
  infraInventory: many(infraInventory),
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

export const riskItemsRelations = relations(riskItems, ({ one, many }) => ({
  aiSystem: one(aiSystems, {
    fields: [riskItems.aiSystemId],
    references: [aiSystems.id],
    relationName: 'riskItem_aiSystem',
  }),
  organization: one(organizations, {
    fields: [riskItems.organizationId],
    references: [organizations.id],
  }),
  createdBy: one(users, {
    fields: [riskItems.createdById],
    references: [users.id],
  }),
  mitigations: many(riskMitigations),
}));

export const riskMitigationsRelations = relations(riskMitigations, ({ one }) => ({
  riskItem: one(riskItems, {
    fields: [riskMitigations.riskItemId],
    references: [riskItems.id],
  }),
  organization: one(organizations, {
    fields: [riskMitigations.organizationId],
    references: [organizations.id],
  }),
  createdBy: one(users, {
    fields: [riskMitigations.createdById],
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

export const insertRiskMitigationSchema = createInsertSchema(riskMitigations).omit({
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

export type RiskMitigation = typeof riskMitigations.$inferSelect;
export type InsertRiskMitigation = z.infer<typeof insertRiskMitigationSchema>;

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
  confidence_score: integer("confidence_score"),
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

// Bias Analysis
export const biasAnalysisScans = pgTable("bias_analysis_scans", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id")
    .notNull()
    .references(() => organizations.id),
  name: text("name").notNull(),
  description: text("description"),
  dataSource: text("data_source").notNull(), // 'csv', 'json', 'webhook'
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  createdBy: integer("created_by")
    .notNull()
    .references(() => users.id),
});

export const biasAnalysisResults = pgTable("bias_analysis_results", {
  id: serial("id").primaryKey(),
  scanId: integer("scan_id")
    .notNull()
    .references(() => biasAnalysisScans.id),
  organizationId: integer("organization_id")
    .notNull()
    .references(() => organizations.id),
  metricName: text("metric_name").notNull(),
  metricDescription: text("metric_description"),
  score: integer("score").notNull(), // 0-100 score
  threshold: integer("threshold").notNull(), // Threshold for passing/failing
  status: text("status").notNull(), // 'pass', 'warning', 'fail'
  demographicGroup: text("demographic_group"), // Which demographic group this applies to
  additionalData: text("additional_data"), // JSON string with additional metric data
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const biasAnalysisScansRelations = relations(biasAnalysisScans, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [biasAnalysisScans.organizationId],
    references: [organizations.id],
  }),
  creator: one(users, {
    fields: [biasAnalysisScans.createdBy],
    references: [users.id],
  }),
  results: many(biasAnalysisResults),
}));

export const biasAnalysisResultsRelations = relations(biasAnalysisResults, ({ one }) => ({
  scan: one(biasAnalysisScans, {
    fields: [biasAnalysisResults.scanId],
    references: [biasAnalysisScans.id],
  }),
  organization: one(organizations, {
    fields: [biasAnalysisResults.organizationId],
    references: [organizations.id],
  }),
}));

// Insert Schemas
export const insertBiasAnalysisScanSchema = createInsertSchema(biasAnalysisScans).omit({
  id: true,
  startedAt: true,
  completedAt: true,
});

export const insertBiasAnalysisResultSchema = createInsertSchema(biasAnalysisResults).omit({
  id: true,
  createdAt: true,
});

// Types
export type BiasAnalysisScan = typeof biasAnalysisScans.$inferSelect;
export type InsertBiasAnalysisScan = z.infer<typeof insertBiasAnalysisScanSchema>;

export type BiasAnalysisResult = typeof biasAnalysisResults.$inferSelect;
export type InsertBiasAnalysisResult = z.infer<typeof insertBiasAnalysisResultSchema>;

// Frontier Models Schema
export const frontierModelsList = pgTable("frontier_models_list", {
  id: serial("id").primaryKey(),
  model_id: text("model_id").notNull().unique(),
  name: text("name").notNull(),
  provider: text("provider").notNull(),
  release_date: timestamp("release_date"),
  description: text("description"),
  capabilities: text("capabilities").array(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const frontierModelsAlertsConfig = pgTable("frontier_models_alerts_config", {
  id: serial("id").primaryKey(),
  model_id: integer("model_id").references(() => frontierModelsList.id).notNull(),
  category: text("category").notNull(), // 'security' or 'feature'
  organization_id: integer("organization_id").references(() => organizations.id).notNull(),
  created_by_id: integer("created_by_id").references(() => users.id).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const frontierModelsAlerts = pgTable("frontier_models_alerts", {
  id: serial("id").primaryKey(),
  alert_config_id: integer("alert_config_id").references(() => frontierModelsAlertsConfig.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  url: text("url"),
  date_published: timestamp("date_published").notNull(),
  organization_id: integer("organization_id").references(() => organizations.id).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Relations for frontier models
export const frontierModelsListRelations = relations(frontierModelsList, ({ many }) => ({
  alertConfigs: many(frontierModelsAlertsConfig),
}));

export const frontierModelsAlertsConfigRelations = relations(frontierModelsAlertsConfig, ({ one, many }) => ({
  model: one(frontierModelsList, {
    fields: [frontierModelsAlertsConfig.model_id],
    references: [frontierModelsList.id],
  }),
  alerts: many(frontierModelsAlerts),
  organization: one(organizations, {
    fields: [frontierModelsAlertsConfig.organization_id],
    references: [organizations.id],
  }),
  createdBy: one(users, {
    fields: [frontierModelsAlertsConfig.created_by_id],
    references: [users.id],
  }),
}));

export const frontierModelsAlertsRelations = relations(frontierModelsAlerts, ({ one }) => ({
  alertConfig: one(frontierModelsAlertsConfig, {
    fields: [frontierModelsAlerts.alert_config_id],
    references: [frontierModelsAlertsConfig.id],
  }),
  organization: one(organizations, {
    fields: [frontierModelsAlerts.organization_id],
    references: [organizations.id],
  }),
}));

// Schemas for frontier models
export const insertFrontierModelSchema = createInsertSchema(frontierModelsList, {
  capabilities: z.array(z.string()).optional(),
}).omit({ 
  id: true, 
  created_at: true, 
  updated_at: true 
});

export const insertFrontierModelsAlertsConfigSchema = createInsertSchema(frontierModelsAlertsConfig).omit({ 
  id: true, 
  created_at: true, 
  updated_at: true 
});

export const insertFrontierModelsAlertsSchema = createInsertSchema(frontierModelsAlerts).omit({ 
  id: true, 
  created_at: true 
});

// Types for frontier models
export type FrontierModel = typeof frontierModelsList.$inferSelect;
export type InsertFrontierModel = z.infer<typeof insertFrontierModelSchema>;

export type FrontierModelsAlertsConfig = typeof frontierModelsAlertsConfig.$inferSelect;
export type InsertFrontierModelsAlertsConfig = z.infer<typeof insertFrontierModelsAlertsConfigSchema>;

export type FrontierModelsAlert = typeof frontierModelsAlerts.$inferSelect;
export type InsertFrontierModelsAlert = z.infer<typeof insertFrontierModelsAlertsSchema>;

// Infrastructure Inventory for Visualization
export const infraInventory = pgTable("infra_inventory", {
  id: serial("id").primaryKey(),
  label: text("label").notNull(),
  category: text("category").notNull(), // onprem, cloud, sourcecontrol, etc.
  provider: text("provider"), // aws, azure, github, etc. (nullable)
  count: integer("count").notNull().default(0),
  icon: text("icon").notNull(), // Icon identifier for visualization
  organizationId: integer("organization_id")
    .references(() => organizations.id)
    .notNull(),
  createdById: integer("created_by_id")
    .references(() => users.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const infraInventoryRelations = relations(infraInventory, ({ one }) => ({
  organization: one(organizations, {
    fields: [infraInventory.organizationId],
    references: [organizations.id],
  }),
  createdBy: one(users, {
    fields: [infraInventory.createdById],
    references: [users.id],
  }),
}));

export const insertInfraInventorySchema = createInsertSchema(infraInventory).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export type InfraInventory = typeof infraInventory.$inferSelect;
export type InsertInfraInventory = z.infer<typeof insertInfraInventorySchema>;
