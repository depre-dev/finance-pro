import { pgTable, text, serial, integer, boolean, decimal, timestamp, varchar, json } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull().default("Financial Analyst"),
  isActive: boolean("is_active").default(true),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Session storage table for authentication
export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  projectId: text("project_id"), // Project ID from Excel
  businessUnit: text("business_unit"), // Business Unit from Excel
  wbs: text("wbs"), // WBS from Excel
  totalBudget: decimal("total_budget", { precision: 12, scale: 2 }).notNull(), // Total Budget (CHF)
  totalPds: text("total_pds"), // Total PDs from Excel
  totalExternalPds: text("total_external_pds"), // Total External PDs from Excel
  targetRelease: text("target_release"), // Target Release from Excel
  actualCost: decimal("actual_cost", { precision: 12, scale: 2 }).default("0"), // Actual cost spent
  status: varchar("status", { length: 50 }).notNull().default("active"),
  userId: integer("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const financialRecords = pgTable("financial_records", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  type: varchar("type", { length: 20 }).notNull(), // 'income' or 'expense'
  category: text("category").notNull(),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  date: timestamp("date").notNull(),
  userId: integer("user_id").notNull(),
  originalData: json("original_data"), // Store original Excel columns
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const budgetCategories = pgTable("budget_categories", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  name: text("name").notNull(),
  budgetedAmount: decimal("budgeted_amount", { precision: 12, scale: 2 }).notNull(),
  actualAmount: decimal("actual_amount", { precision: 12, scale: 2 }).default("0"),
  userId: integer("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const chargeHistory = pgTable("charge_history", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  description: text("description").notNull(),
  category: text("category").default("General"),
  date: timestamp("date").defaultNow().notNull(),
  userId: integer("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const projectNotes = pgTable("project_notes", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id),
  content: text("content").notNull(),
  authorName: text("author_name").notNull(),
  color: text("color").default("yellow"),
  position: json("position").$type<{ x: number; y: number }>(),
  isPrivate: boolean("is_private").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Table for storing uploaded data before project assignment
export const uploadedData = pgTable("uploaded_data", {
  id: serial("id").primaryKey(),
  fileName: text("file_name").notNull(),
  originalData: json("original_data").notNull(),
  columnMapping: json("column_mapping"),
  totalRows: integer("total_rows").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  isProcessed: boolean("is_processed").default(false),
  userId: integer("user_id").notNull(),
});

// API Integration configurations
export const apiConfigurations = pgTable("api_configurations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  baseUrl: text("base_url").notNull(),
  apiKey: text("api_key"),
  authType: varchar("auth_type", { length: 20 }).notNull().default("none"),
  headers: json("headers").default({}),
  timeout: integer("timeout").default(30000),
  isActive: boolean("is_active").default(true),
  userId: integer("user_id").notNull().references(() => users.id),
  lastSyncAt: timestamp("last_sync_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// API sync logs to track integration history
export const apiSyncLogs = pgTable("api_sync_logs", {
  id: serial("id").primaryKey(),
  apiConfigId: integer("api_config_id").notNull().references(() => apiConfigurations.id),
  syncType: varchar("sync_type", { length: 50 }).notNull(), // 'projects', 'financial-records', 'export'
  status: varchar("status", { length: 20 }).notNull(), // 'success', 'failed', 'partial'
  recordsProcessed: integer("records_processed").default(0),
  errorMessage: text("error_message"),
  responseTime: integer("response_time"), // in milliseconds
  userId: integer("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Automated reporting tables
export const reportConfigurations = pgTable("report_configurations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  type: varchar("type", { length: 50 }).notNull(), // 'budget_summary', 'project_status', 'expense_analysis', 'variance_report', 'custom'
  schedule: varchar("schedule", { length: 20 }).notNull().default("manual"), // 'manual', 'daily', 'weekly', 'monthly', 'quarterly'
  format: varchar("format", { length: 10 }).notNull().default("pdf"), // 'pdf', 'excel', 'csv', 'json'
  recipients: json("recipients").$type<string[]>().notNull(), // Email addresses
  filters: json("filters").default({}), // Report filters and parameters
  isActive: boolean("is_active").default(true),
  lastExecuted: timestamp("last_executed"),
  nextExecution: timestamp("next_execution"),
  userId: integer("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const reportExecutions = pgTable("report_executions", {
  id: serial("id").primaryKey(),
  reportConfigId: integer("report_config_id").notNull().references(() => reportConfigurations.id),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // 'pending', 'generating', 'completed', 'failed'
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  filePath: text("file_path"), // Path to generated report file
  fileSize: integer("file_size"), // File size in bytes
  errorMessage: text("error_message"),
  executionTime: integer("execution_time"), // Time taken in milliseconds
  recipientsSent: json("recipients_sent").$type<string[]>(), // Successfully sent recipients
  userId: integer("user_id").notNull().references(() => users.id),
});

// Relations
export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(users, {
    fields: [projects.userId],
    references: [users.id],
  }),
  financialRecords: many(financialRecords),
  budgetCategories: many(budgetCategories),
  chargeHistory: many(chargeHistory),
  projectNotes: many(projectNotes),
}));

export const financialRecordsRelations = relations(financialRecords, ({ one }) => ({
  project: one(projects, {
    fields: [financialRecords.projectId],
    references: [projects.id],
  }),
  user: one(users, {
    fields: [financialRecords.userId],
    references: [users.id],
  }),
}));

export const chargeHistoryRelations = relations(chargeHistory, ({ one }) => ({
  project: one(projects, {
    fields: [chargeHistory.projectId],
    references: [projects.id],
  }),
  user: one(users, {
    fields: [chargeHistory.userId],
    references: [users.id],
  }),
}));

export const budgetCategoriesRelations = relations(budgetCategories, ({ one }) => ({
  project: one(projects, {
    fields: [budgetCategories.projectId],
    references: [projects.id],
  }),
  user: one(users, {
    fields: [budgetCategories.userId],
    references: [users.id],
  }),
}));

export const projectNotesRelations = relations(projectNotes, ({ one }) => ({
  project: one(projects, {
    fields: [projectNotes.projectId],
    references: [projects.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
  financialRecords: many(financialRecords),
  budgetCategories: many(budgetCategories),
  sessions: many(sessions),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLogin: true,
});

export const insertSessionSchema = createInsertSchema(sessions).omit({
  createdAt: true,
});

// Login schema
export const loginSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6),
});

// Registration schema
export const registerSchema = insertUserSchema.extend({
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFinancialRecordSchema = createInsertSchema(financialRecords).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBudgetCategorySchema = createInsertSchema(budgetCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChargeHistorySchema = createInsertSchema(chargeHistory).omit({
  id: true,
  createdAt: true,
});

export const insertUploadedDataSchema = createInsertSchema(uploadedData).omit({
  id: true,
  uploadedAt: true,
});

export const insertApiConfigurationSchema = createInsertSchema(apiConfigurations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastSyncAt: true,
});

export const insertApiSyncLogSchema = createInsertSchema(apiSyncLogs).omit({
  id: true,
  createdAt: true,
});

export const insertProjectNoteSchema = createInsertSchema(projectNotes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertReportConfigurationSchema = createInsertSchema(reportConfigurations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastExecuted: true,
  nextExecution: true,
});

export const insertReportExecutionSchema = createInsertSchema(reportExecutions).omit({
  id: true,
  startedAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof sessions.$inferSelect;

export type LoginRequest = z.infer<typeof loginSchema>;
export type RegisterRequest = z.infer<typeof registerSchema>;

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

export type InsertFinancialRecord = z.infer<typeof insertFinancialRecordSchema>;
export type FinancialRecord = typeof financialRecords.$inferSelect;

export type InsertBudgetCategory = z.infer<typeof insertBudgetCategorySchema>;
export type BudgetCategory = typeof budgetCategories.$inferSelect;

export type InsertChargeHistory = z.infer<typeof insertChargeHistorySchema>;
export type ChargeHistory = typeof chargeHistory.$inferSelect;

export type InsertUploadedData = z.infer<typeof insertUploadedDataSchema>;
export type UploadedData = typeof uploadedData.$inferSelect;

export type InsertProjectNote = z.infer<typeof insertProjectNoteSchema>;
export type ProjectNote = typeof projectNotes.$inferSelect;

export type InsertApiConfiguration = z.infer<typeof insertApiConfigurationSchema>;
export type ApiConfiguration = typeof apiConfigurations.$inferSelect;

export type InsertApiSyncLog = z.infer<typeof insertApiSyncLogSchema>;
export type ApiSyncLog = typeof apiSyncLogs.$inferSelect;

export type InsertReportConfiguration = z.infer<typeof insertReportConfigurationSchema>;
export type ReportConfiguration = typeof reportConfigurations.$inferSelect;

export type InsertReportExecution = z.infer<typeof insertReportExecutionSchema>;
export type ReportExecution = typeof reportExecutions.$inferSelect;
