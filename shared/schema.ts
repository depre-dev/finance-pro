import { pgTable, text, serial, integer, boolean, decimal, timestamp, varchar, json } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("Financial Analyst"),
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
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
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

export const insertProjectNoteSchema = createInsertSchema(projectNotes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

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
