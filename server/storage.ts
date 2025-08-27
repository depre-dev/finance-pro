import { 
  users, 
  projects, 
  financialRecords, 
  budgetCategories,
  chargeHistory,
  uploadedData,
  projectNotes,
  sessions,
  type User, 
  type InsertUser,
  type Project,
  type InsertProject,
  type FinancialRecord,
  type InsertFinancialRecord,
  type BudgetCategory,
  type InsertBudgetCategory,
  type ChargeHistory,
  type InsertChargeHistory,
  type UploadedData,
  type InsertUploadedData,
  type ProjectNote,
  type InsertProjectNote,
  type Session,
  type InsertSession,
  type LoginRequest,
  type RegisterRequest
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, sum } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  updateUserLastLogin(id: number): Promise<void>;

  // Authentication methods
  createSession(session: InsertSession): Promise<Session>;
  getSession(sessionId: string): Promise<Session | undefined>;
  deleteSession(sessionId: string): Promise<boolean>;
  deleteUserSessions(userId: number): Promise<boolean>;

  // Project methods
  getProjects(userId: number): Promise<Project[]>;
  getProject(id: number, userId: number): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, userId: number, project: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: number, userId: number): Promise<boolean>;

  // Financial record methods
  getAllFinancialRecords(userId: number): Promise<FinancialRecord[]>;
  getFinancialRecords(projectId: number, userId: number): Promise<FinancialRecord[]>;
  getFinancialRecord(id: number, userId: number): Promise<FinancialRecord | undefined>;
  createFinancialRecord(record: InsertFinancialRecord): Promise<FinancialRecord>;
  updateFinancialRecord(id: number, userId: number, record: Partial<InsertFinancialRecord>): Promise<FinancialRecord | undefined>;
  deleteFinancialRecord(id: number, userId: number): Promise<boolean>;

  // Budget category methods
  getAllBudgetCategories(userId: number): Promise<BudgetCategory[]>;
  getBudgetCategories(projectId: number, userId: number): Promise<BudgetCategory[]>;
  createBudgetCategory(category: InsertBudgetCategory): Promise<BudgetCategory>;
  updateBudgetCategory(id: number, userId: number, category: Partial<InsertBudgetCategory>): Promise<BudgetCategory | undefined>;
  deleteBudgetCategory(id: number, userId: number): Promise<boolean>;

  // Charge history methods
  getChargeHistory(projectId: number, userId: number): Promise<ChargeHistory[]>;
  getAllChargeHistory(userId: number): Promise<ChargeHistory[]>;
  createChargeHistory(charge: InsertChargeHistory): Promise<ChargeHistory>;

  // Dashboard metrics
  getDashboardMetrics(userId: number): Promise<{
    activeProjects: number;
    totalBudget: string;
    monthlySpent: string;
    overBudgetProjects: number;
  }>;

  // Excel project names
  getExcelProjectNames(userId: number): Promise<string[]>;
  
  // Excel project data
  getExcelProjectData(userId: number, projectName: string): Promise<any>;
  
  // Uploaded data methods
  createUploadedData(data: InsertUploadedData): Promise<UploadedData>;
  getUploadedData(userId: number): Promise<UploadedData[]>;
  getUploadedDataById(id: number, userId: number): Promise<UploadedData | undefined>;
  deleteUploadedData(id: number, userId: number): Promise<boolean>;

  // Project notes methods
  getProjectNotes(projectId: number): Promise<ProjectNote[]>;
  createProjectNote(note: InsertProjectNote): Promise<ProjectNote>;
  updateProjectNote(id: number, note: Partial<InsertProjectNote>): Promise<ProjectNote | undefined>;
  deleteProjectNote(id: number): Promise<boolean>;
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

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ ...user, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updatedUser || undefined;
  }

  async updateUserLastLogin(id: number): Promise<void> {
    await db
      .update(users)
      .set({ lastLogin: new Date() })
      .where(eq(users.id, id));
  }

  // Authentication methods
  async createSession(session: InsertSession): Promise<Session> {
    const [newSession] = await db
      .insert(sessions)
      .values(session)
      .returning();
    return newSession;
  }

  async getSession(sessionId: string): Promise<Session | undefined> {
    const [session] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, sessionId));
    return session || undefined;
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    const result = await db
      .delete(sessions)
      .where(eq(sessions.id, sessionId));
    return (result.rowCount ?? 0) > 0;
  }

  async deleteUserSessions(userId: number): Promise<boolean> {
    const result = await db
      .delete(sessions)
      .where(eq(sessions.userId, userId));
    return (result.rowCount ?? 0) > 0;
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
    return (result.rowCount ?? 0) > 0;
  }

  async getAllFinancialRecords(userId: number): Promise<FinancialRecord[]> {
    return await db
      .select()
      .from(financialRecords)
      .where(eq(financialRecords.userId, userId))
      .orderBy(desc(financialRecords.date));
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
    return (result.rowCount ?? 0) > 0;
  }

  async getAllBudgetCategories(userId: number): Promise<BudgetCategory[]> {
    return await db
      .select()
      .from(budgetCategories)
      .where(eq(budgetCategories.userId, userId))
      .orderBy(budgetCategories.name);
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
    return (result.rowCount ?? 0) > 0;
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

    // Over budget projects count using actualCost field
    const overBudgetQuery = await db
      .select({
        projectId: projects.id,
        totalBudget: projects.totalBudget,
        actualCost: projects.actualCost
      })
      .from(projects)
      .where(eq(projects.userId, userId));

    let overBudgetCount = 0;
    for (const project of overBudgetQuery) {
      const spent = parseFloat(project.actualCost || '0');
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

  async getExcelProjectNames(userId: number): Promise<string[]> {
    // First check uploaded data for project names
    const uploadedRecords = await db
      .select({ originalData: uploadedData.originalData })
      .from(uploadedData)
      .where(eq(uploadedData.userId, userId));

    const projectNames = new Set<string>();
    
    // Extract project names from uploaded data
    for (const upload of uploadedRecords) {
      const dataArray = upload.originalData as any[];
      if (Array.isArray(dataArray)) {
        for (const data of dataArray) {
          if (data && data.Name) {
            projectNames.add(data.Name);
          }
        }
      }
    }

    // Also check existing financial records for backward compatibility
    const records = await db
      .select({ originalData: financialRecords.originalData })
      .from(financialRecords)
      .where(
        and(
          eq(financialRecords.userId, userId),
          sql`${financialRecords.originalData} IS NOT NULL`
        )
      );

    for (const record of records) {
      const data = record.originalData as any;
      if (data && data.Name) {
        projectNames.add(data.Name);
      }
    }

    return Array.from(projectNames).sort();
  }

  async getExcelProjectData(userId: number, projectName: string): Promise<any> {
    // First check uploaded data
    const uploadedRecords = await db
      .select({ originalData: uploadedData.originalData })
      .from(uploadedData)
      .where(eq(uploadedData.userId, userId));

    // Search through uploaded data first
    for (const upload of uploadedRecords) {
      const dataArray = upload.originalData as any[];
      if (Array.isArray(dataArray)) {
        for (const data of dataArray) {
          if (data && data.Name === projectName) {
            return data;
          }
        }
      }
    }

    // Fallback to financial records for backward compatibility
    const records = await db
      .select({ originalData: financialRecords.originalData })
      .from(financialRecords)
      .where(
        and(
          eq(financialRecords.userId, userId),
          sql`${financialRecords.originalData}->>'Name' = ${projectName}`
        )
      )
      .limit(1);

    return records.length > 0 ? records[0].originalData : null;
  }

  async getChargeHistory(projectId: number, userId: number): Promise<ChargeHistory[]> {
    return await db
      .select()
      .from(chargeHistory)
      .where(and(eq(chargeHistory.projectId, projectId), eq(chargeHistory.userId, userId)))
      .orderBy(desc(chargeHistory.date));
  }

  async getAllChargeHistory(userId: number): Promise<ChargeHistory[]> {
    return await db
      .select()
      .from(chargeHistory)
      .where(eq(chargeHistory.userId, userId))
      .orderBy(desc(chargeHistory.date));
  }

  async createChargeHistory(charge: InsertChargeHistory): Promise<ChargeHistory> {
    const [newCharge] = await db
      .insert(chargeHistory)
      .values(charge)
      .returning();
    return newCharge;
  }

  async createUploadedData(data: InsertUploadedData): Promise<UploadedData> {
    const [newData] = await db
      .insert(uploadedData)
      .values(data)
      .returning();
    return newData;
  }

  async getUploadedData(userId: number): Promise<UploadedData[]> {
    return await db
      .select()
      .from(uploadedData)
      .where(eq(uploadedData.userId, userId))
      .orderBy(desc(uploadedData.uploadedAt));
  }

  async getUploadedDataById(id: number, userId: number): Promise<UploadedData | undefined> {
    const [data] = await db
      .select()
      .from(uploadedData)
      .where(and(eq(uploadedData.id, id), eq(uploadedData.userId, userId)));
    return data || undefined;
  }

  async deleteUploadedData(id: number, userId: number): Promise<boolean> {
    const result = await db
      .delete(uploadedData)
      .where(and(eq(uploadedData.id, id), eq(uploadedData.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  // Project notes methods
  async getProjectNotes(projectId: number): Promise<ProjectNote[]> {
    return await db
      .select()
      .from(projectNotes)
      .where(eq(projectNotes.projectId, projectId))
      .orderBy(desc(projectNotes.createdAt));
  }

  async createProjectNote(insertNote: InsertProjectNote): Promise<ProjectNote> {
    const [note] = await db
      .insert(projectNotes)
      .values(insertNote)
      .returning();
    return note;
  }

  async updateProjectNote(id: number, updateNote: Partial<InsertProjectNote>): Promise<ProjectNote | undefined> {
    const [note] = await db
      .update(projectNotes)
      .set({ ...updateNote, updatedAt: new Date() })
      .where(eq(projectNotes.id, id))
      .returning();
    return note || undefined;
  }

  async deleteProjectNote(id: number): Promise<boolean> {
    const result = await db.delete(projectNotes).where(eq(projectNotes.id, id));
    return result.rowCount! > 0;
  }
}

export const storage = new DatabaseStorage();
