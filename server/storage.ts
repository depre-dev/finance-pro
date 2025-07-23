import { 
  users, 
  projects, 
  financialRecords, 
  budgetCategories,
  type User, 
  type InsertUser,
  type Project,
  type InsertProject,
  type FinancialRecord,
  type InsertFinancialRecord,
  type BudgetCategory,
  type InsertBudgetCategory
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, sum } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Project methods
  getProjects(userId: number): Promise<Project[]>;
  getProject(id: number, userId: number): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, userId: number, project: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: number, userId: number): Promise<boolean>;

  // Financial record methods
  getFinancialRecords(projectId: number, userId: number): Promise<FinancialRecord[]>;
  getFinancialRecord(id: number, userId: number): Promise<FinancialRecord | undefined>;
  createFinancialRecord(record: InsertFinancialRecord): Promise<FinancialRecord>;
  updateFinancialRecord(id: number, userId: number, record: Partial<InsertFinancialRecord>): Promise<FinancialRecord | undefined>;
  deleteFinancialRecord(id: number, userId: number): Promise<boolean>;

  // Budget category methods
  getBudgetCategories(projectId: number, userId: number): Promise<BudgetCategory[]>;
  createBudgetCategory(category: InsertBudgetCategory): Promise<BudgetCategory>;
  updateBudgetCategory(id: number, userId: number, category: Partial<InsertBudgetCategory>): Promise<BudgetCategory | undefined>;
  deleteBudgetCategory(id: number, userId: number): Promise<boolean>;

  // Dashboard metrics
  getDashboardMetrics(userId: number): Promise<{
    activeProjects: number;
    totalBudget: string;
    monthlySpent: string;
    overBudgetProjects: number;
  }>;
}

export class DatabaseStorage implements IStorage {
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

  async getProjects(userId: number): Promise<Project[]> {
    return await db
      .select()
      .from(projects)
      .where(eq(projects.userId, userId))
      .orderBy(desc(projects.updatedAt));
  }

  async getProject(id: number, userId: number): Promise<Project | undefined> {
    const [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, id), eq(projects.userId, userId)));
    return project || undefined;
  }

  async createProject(project: InsertProject): Promise<Project> {
    const [newProject] = await db
      .insert(projects)
      .values(project)
      .returning();
    return newProject;
  }

  async updateProject(id: number, userId: number, project: Partial<InsertProject>): Promise<Project | undefined> {
    const [updatedProject] = await db
      .update(projects)
      .set({ ...project, updatedAt: new Date() })
      .where(and(eq(projects.id, id), eq(projects.userId, userId)))
      .returning();
    return updatedProject || undefined;
  }

  async deleteProject(id: number, userId: number): Promise<boolean> {
    const result = await db
      .delete(projects)
      .where(and(eq(projects.id, id), eq(projects.userId, userId)));
    return result.rowCount > 0;
  }

  async getFinancialRecords(projectId: number, userId: number): Promise<FinancialRecord[]> {
    return await db
      .select()
      .from(financialRecords)
      .where(and(eq(financialRecords.projectId, projectId), eq(financialRecords.userId, userId)))
      .orderBy(desc(financialRecords.date));
  }

  async getFinancialRecord(id: number, userId: number): Promise<FinancialRecord | undefined> {
    const [record] = await db
      .select()
      .from(financialRecords)
      .where(and(eq(financialRecords.id, id), eq(financialRecords.userId, userId)));
    return record || undefined;
  }

  async createFinancialRecord(record: InsertFinancialRecord): Promise<FinancialRecord> {
    const [newRecord] = await db
      .insert(financialRecords)
      .values(record)
      .returning();
    return newRecord;
  }

  async updateFinancialRecord(id: number, userId: number, record: Partial<InsertFinancialRecord>): Promise<FinancialRecord | undefined> {
    const [updatedRecord] = await db
      .update(financialRecords)
      .set({ ...record, updatedAt: new Date() })
      .where(and(eq(financialRecords.id, id), eq(financialRecords.userId, userId)))
      .returning();
    return updatedRecord || undefined;
  }

  async deleteFinancialRecord(id: number, userId: number): Promise<boolean> {
    const result = await db
      .delete(financialRecords)
      .where(and(eq(financialRecords.id, id), eq(financialRecords.userId, userId)));
    return result.rowCount > 0;
  }

  async getBudgetCategories(projectId: number, userId: number): Promise<BudgetCategory[]> {
    return await db
      .select()
      .from(budgetCategories)
      .where(and(eq(budgetCategories.projectId, projectId), eq(budgetCategories.userId, userId)))
      .orderBy(budgetCategories.name);
  }

  async createBudgetCategory(category: InsertBudgetCategory): Promise<BudgetCategory> {
    const [newCategory] = await db
      .insert(budgetCategories)
      .values(category)
      .returning();
    return newCategory;
  }

  async updateBudgetCategory(id: number, userId: number, category: Partial<InsertBudgetCategory>): Promise<BudgetCategory | undefined> {
    const [updatedCategory] = await db
      .update(budgetCategories)
      .set({ ...category, updatedAt: new Date() })
      .where(and(eq(budgetCategories.id, id), eq(budgetCategories.userId, userId)))
      .returning();
    return updatedCategory || undefined;
  }

  async deleteBudgetCategory(id: number, userId: number): Promise<boolean> {
    const result = await db
      .delete(budgetCategories)
      .where(and(eq(budgetCategories.id, id), eq(budgetCategories.userId, userId)));
    return result.rowCount > 0;
  }

  async getDashboardMetrics(userId: number): Promise<{
    activeProjects: number;
    totalBudget: string;
    monthlySpent: string;
    overBudgetProjects: number;
  }> {
    // Active projects count
    const [activeProjectsResult] = await db
      .select({ count: sql`count(*)`.as('count') })
      .from(projects)
      .where(and(eq(projects.userId, userId), eq(projects.status, 'active')));

    // Total budget
    const [totalBudgetResult] = await db
      .select({ total: sum(projects.totalBudget).as('total') })
      .from(projects)
      .where(eq(projects.userId, userId));

    // Monthly spending (current month)
    const currentMonth = new Date();
    currentMonth.setDate(1);
    const nextMonth = new Date(currentMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const [monthlySpentResult] = await db
      .select({ total: sum(financialRecords.amount).as('total') })
      .from(financialRecords)
      .where(
        and(
          eq(financialRecords.userId, userId),
          eq(financialRecords.type, 'expense'),
          sql`${financialRecords.date} >= ${currentMonth}`,
          sql`${financialRecords.date} < ${nextMonth}`
        )
      );

    // Over budget projects count
    const overBudgetQuery = await db
      .select({
        projectId: projects.id,
        totalBudget: projects.totalBudget,
        totalSpent: sum(financialRecords.amount).as('totalSpent')
      })
      .from(projects)
      .leftJoin(financialRecords, and(
        eq(financialRecords.projectId, projects.id),
        eq(financialRecords.type, 'expense')
      ))
      .where(eq(projects.userId, userId))
      .groupBy(projects.id, projects.totalBudget);

    let overBudgetCount = 0;
    for (const project of overBudgetQuery) {
      const spent = parseFloat(project.totalSpent || '0');
      const budget = parseFloat(project.totalBudget);
      if (spent > budget) {
        overBudgetCount++;
      }
    }

    return {
      activeProjects: parseInt(activeProjectsResult.count as string),
      totalBudget: totalBudgetResult.total || '0',
      monthlySpent: monthlySpentResult.total || '0',
      overBudgetProjects: overBudgetCount,
    };
  }
}

export const storage = new DatabaseStorage();
