import { db } from "../db";
import { eq, and, sql } from "drizzle-orm";
import { 
  projects, 
  chargeHistory, 
  reportConfigurations, 
  reportExecutions,
  users 
} from "@shared/schema";
import type { 
  BudgetSummaryReport, 
  ProjectStatusReport, 
  ExpenseAnalysisReport, 
  VarianceReport,
  ReportExecution
} from "@shared/types/reports";
import ExcelJS from 'exceljs';
import * as fs from 'fs';
import * as path from 'path';

export class ReportService {
  private static instance: ReportService;

  public static getInstance(): ReportService {
    if (!ReportService.instance) {
      ReportService.instance = new ReportService();
    }
    return ReportService.instance;
  }

  // Generate budget summary report
  async generateBudgetSummaryReport(userId: number, filters?: any): Promise<BudgetSummaryReport> {
    try {
      const userProjects = await db
        .select()
        .from(projects)
        .where(eq(projects.userId, userId));

      if (userProjects.length === 0) {
        return {
          totalBudget: 0,
          totalSpent: 0,
          remainingBudget: 0,
          utilizationPercentage: 0,
          projectCount: 0,
          overBudgetProjects: 0,
          projects: []
        };
      }

      const projectsWithCharges = await Promise.all(
        userProjects.map(async (project) => {
          const charges = await db
            .select()
            .from(chargeHistory)
            .where(eq(chargeHistory.projectId, project.id));

          const totalSpent = charges.reduce((sum, charge) => 
            sum + parseFloat(charge.amount.toString()), 0
          );

          const budget = parseFloat(project.totalBudget.toString());
          const remaining = budget - totalSpent;
          const utilization = budget > 0 ? (totalSpent / budget) * 100 : 0;

          return {
            id: project.id,
            name: project.name,
            budget,
            spent: totalSpent,
            remaining,
            utilizationPercentage: Math.round(utilization * 100) / 100,
            status: project.status
          };
        })
      );

      const totalBudget = projectsWithCharges.reduce((sum, p) => sum + p.budget, 0);
      const totalSpent = projectsWithCharges.reduce((sum, p) => sum + p.spent, 0);
      const remainingBudget = totalBudget - totalSpent;
      const utilizationPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
      const overBudgetProjects = projectsWithCharges.filter(p => p.remaining < 0).length;

      return {
        totalBudget,
        totalSpent,
        remainingBudget,
        utilizationPercentage: Math.round(utilizationPercentage * 100) / 100,
        projectCount: projectsWithCharges.length,
        overBudgetProjects,
        projects: projectsWithCharges
      };
    } catch (error) {
      console.error('Error generating budget summary report:', error);
      throw error;
    }
  }

  // Generate project status report
  async generateProjectStatusReport(userId: number, filters?: any): Promise<ProjectStatusReport> {
    try {
      const userProjects = await db
        .select()
        .from(projects)
        .where(eq(projects.userId, userId));

      const statusCounts = {
        active: userProjects.filter(p => p.status === 'active').length,
        completed: userProjects.filter(p => p.status === 'completed').length,
        onHold: userProjects.filter(p => p.status === 'on-hold').length
      };

      const projectsWithDetails = userProjects.map(project => ({
        id: project.id,
        name: project.name,
        status: project.status,
        budget: parseFloat(project.totalBudget.toString()),
        spent: parseFloat(project.actualCost?.toString() || "0"),
        startDate: project.createdAt,
        targetRelease: project.targetRelease || '',
        businessUnit: project.businessUnit || ''
      }));

      return {
        totalProjects: userProjects.length,
        activeProjects: statusCounts.active,
        completedProjects: statusCounts.completed,
        onHoldProjects: statusCounts.onHold,
        projects: projectsWithDetails
      };
    } catch (error) {
      console.error('Error generating project status report:', error);
      throw error;
    }
  }

  // Generate expense analysis report
  async generateExpenseAnalysisReport(userId: number, filters?: any): Promise<ExpenseAnalysisReport> {
    try {
      // Get all user projects
      const userProjects = await db
        .select()
        .from(projects)
        .where(eq(projects.userId, userId));

      if (userProjects.length === 0) {
        return {
          totalExpenses: 0,
          expensesByCategory: [],
          expensesByProject: [],
          monthlyTrend: []
        };
      }

      const projectIds = userProjects.map(p => p.id);

      // Get all charges for user projects
      const allCharges = await db
        .select()
        .from(chargeHistory)
        .where(sql`${chargeHistory.projectId} IN ${projectIds}`);

      const totalExpenses = allCharges.reduce((sum, charge) => 
        sum + parseFloat(charge.amount.toString()), 0
      );

      // Group by category
      const categoryMap = new Map<string, { amount: number; count: number }>();
      allCharges.forEach(charge => {
        const category = charge.category || 'General';
        const existing = categoryMap.get(category) || { amount: 0, count: 0 };
        categoryMap.set(category, {
          amount: existing.amount + parseFloat(charge.amount.toString()),
          count: existing.count + 1
        });
      });

      const expensesByCategory = Array.from(categoryMap.entries()).map(([category, data]) => ({
        category,
        amount: data.amount,
        percentage: totalExpenses > 0 ? (data.amount / totalExpenses) * 100 : 0,
        count: data.count
      }));

      // Group by project
      const projectMap = new Map<number, { name: string; amount: number; count: number }>();
      allCharges.forEach(charge => {
        const project = userProjects.find(p => p.id === charge.projectId);
        if (project) {
          const existing = projectMap.get(charge.projectId) || { name: project.name, amount: 0, count: 0 };
          projectMap.set(charge.projectId, {
            name: project.name,
            amount: existing.amount + parseFloat(charge.amount.toString()),
            count: existing.count + 1
          });
        }
      });

      const expensesByProject = Array.from(projectMap.entries()).map(([projectId, data]) => ({
        projectId,
        projectName: data.name,
        amount: data.amount,
        percentage: totalExpenses > 0 ? (data.amount / totalExpenses) * 100 : 0,
        count: data.count
      }));

      // Monthly trend (last 12 months)
      const monthlyMap = new Map<string, { amount: number; count: number }>();
      const now = new Date();
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = date.toISOString().slice(0, 7); // YYYY-MM
        monthlyMap.set(monthKey, { amount: 0, count: 0 });
      }

      allCharges.forEach(charge => {
        const monthKey = charge.date.toISOString().slice(0, 7);
        const existing = monthlyMap.get(monthKey);
        if (existing) {
          monthlyMap.set(monthKey, {
            amount: existing.amount + parseFloat(charge.amount.toString()),
            count: existing.count + 1
          });
        }
      });

      const monthlyTrend = Array.from(monthlyMap.entries()).map(([month, data]) => ({
        month,
        amount: data.amount,
        count: data.count
      }));

      return {
        totalExpenses,
        expensesByCategory,
        expensesByProject,
        monthlyTrend
      };
    } catch (error) {
      console.error('Error generating expense analysis report:', error);
      throw error;
    }
  }

  // Generate variance report
  async generateVarianceReport(userId: number, filters?: any): Promise<VarianceReport> {
    try {
      const budgetSummary = await this.generateBudgetSummaryReport(userId, filters);
      
      const projectVariances = budgetSummary.projects.map(project => {
        const variance = project.spent - project.budget;
        const variancePercentage = project.budget > 0 ? (variance / project.budget) * 100 : 0;
        
        let status: 'under_budget' | 'on_budget' | 'over_budget' = 'on_budget';
        if (variance < -project.budget * 0.05) status = 'under_budget'; // More than 5% under
        else if (variance > 0) status = 'over_budget';

        return {
          projectId: project.id,
          projectName: project.name,
          budgetedAmount: project.budget,
          actualAmount: project.spent,
          variance,
          variancePercentage: Math.round(variancePercentage * 100) / 100,
          status
        };
      });

      const totalBudgetVariance = budgetSummary.totalSpent - budgetSummary.totalBudget;
      const totalBudgetVariancePercentage = budgetSummary.totalBudget > 0 
        ? (totalBudgetVariance / budgetSummary.totalBudget) * 100 
        : 0;

      return {
        totalBudgetVariance,
        totalBudgetVariancePercentage: Math.round(totalBudgetVariancePercentage * 100) / 100,
        projectVariances
      };
    } catch (error) {
      console.error('Error generating variance report:', error);
      throw error;
    }
  }

  // Execute report generation
  async executeReport(configId: number, userId: number): Promise<string> {
    let executionId: number;

    try {
      // Create execution record
      const [execution] = await db
        .insert(reportExecutions)
        .values({
          reportConfigId: configId,
          status: 'generating',
          userId
        })
        .returning();

      executionId = execution.id;

      // Get report configuration
      const [config] = await db
        .select()
        .from(reportConfigurations)
        .where(eq(reportConfigurations.id, configId));

      if (!config) {
        throw new Error('Report configuration not found');
      }

      // Generate report data based on type
      let reportData: any;
      switch (config.type) {
        case 'budget_summary':
          reportData = await this.generateBudgetSummaryReport(userId, config.filters);
          break;
        case 'project_status':
          reportData = await this.generateProjectStatusReport(userId, config.filters);
          break;
        case 'expense_analysis':
          reportData = await this.generateExpenseAnalysisReport(userId, config.filters);
          break;
        case 'variance_report':
          reportData = await this.generateVarianceReport(userId, config.filters);
          break;
        default:
          throw new Error(`Unsupported report type: ${config.type}`);
      }

      // Generate file based on format
      const filePath = await this.generateReportFile(reportData, config, executionId);

      // Update execution record
      await db
        .update(reportExecutions)
        .set({
          status: 'completed',
          completedAt: new Date(),
          filePath,
          fileSize: fs.statSync(filePath).size,
          recipientsSent: config.recipients
        })
        .where(eq(reportExecutions.id, executionId));

      // Update configuration last executed time
      await db
        .update(reportConfigurations)
        .set({
          lastExecuted: new Date()
        })
        .where(eq(reportConfigurations.id, configId));

      return filePath;
    } catch (error) {
      console.error('Error executing report:', error);
      
      if (executionId!) {
        await db
          .update(reportExecutions)
          .set({
            status: 'failed',
            completedAt: new Date(),
            errorMessage: error instanceof Error ? error.message : 'Unknown error'
          })
          .where(eq(reportExecutions.id, executionId));
      }

      throw error;
    }
  }

  // Generate report file
  private async generateReportFile(data: any, config: any, executionId: number): Promise<string> {
    const reportsDir = path.join(process.cwd(), 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${config.name.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}_${executionId}`;
    const filePath = path.join(reportsDir, `${filename}.${config.format}`);

    switch (config.format) {
      case 'excel':
        await this.generateExcelReport(data, config, filePath);
        break;
      case 'csv':
        await this.generateCsvReport(data, config, filePath);
        break;
      case 'json':
        await this.generateJsonReport(data, config, filePath);
        break;
      default:
        throw new Error(`Unsupported format: ${config.format}`);
    }

    return filePath;
  }

  // Generate Excel report
  private async generateExcelReport(data: any, config: any, filePath: string): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(config.name);

    // Add header
    worksheet.addRow(['FinancePro Report']);
    worksheet.addRow([config.name]);
    worksheet.addRow([`Generated: ${new Date().toLocaleString()}`]);
    worksheet.addRow([]); // Empty row

    // Add data based on report type
    switch (config.type) {
      case 'budget_summary':
        this.addBudgetSummaryToExcel(worksheet, data);
        break;
      case 'project_status':
        this.addProjectStatusToExcel(worksheet, data);
        break;
      case 'expense_analysis':
        this.addExpenseAnalysisToExcel(worksheet, data);
        break;
      case 'variance_report':
        this.addVarianceReportToExcel(worksheet, data);
        break;
    }

    await workbook.xlsx.writeFile(filePath);
  }

  private addBudgetSummaryToExcel(worksheet: ExcelJS.Worksheet, data: BudgetSummaryReport): void {
    // Summary section
    worksheet.addRow(['Budget Summary']);
    worksheet.addRow(['Total Budget:', data.totalBudget]);
    worksheet.addRow(['Total Spent:', data.totalSpent]);
    worksheet.addRow(['Remaining Budget:', data.remainingBudget]);
    worksheet.addRow(['Utilization %:', data.utilizationPercentage]);
    worksheet.addRow([]);

    // Projects section
    worksheet.addRow(['Project Details']);
    worksheet.addRow(['Project Name', 'Budget', 'Spent', 'Remaining', 'Utilization %', 'Status']);
    
    data.projects.forEach(project => {
      worksheet.addRow([
        project.name,
        project.budget,
        project.spent,
        project.remaining,
        project.utilizationPercentage,
        project.status
      ]);
    });
  }

  private addProjectStatusToExcel(worksheet: ExcelJS.Worksheet, data: ProjectStatusReport): void {
    // Summary
    worksheet.addRow(['Project Status Summary']);
    worksheet.addRow(['Total Projects:', data.totalProjects]);
    worksheet.addRow(['Active Projects:', data.activeProjects]);
    worksheet.addRow(['Completed Projects:', data.completedProjects]);
    worksheet.addRow(['On Hold Projects:', data.onHoldProjects]);
    worksheet.addRow([]);

    // Project details
    worksheet.addRow(['Project Details']);
    worksheet.addRow(['Name', 'Status', 'Budget', 'Spent', 'Business Unit', 'Target Release']);
    
    data.projects.forEach(project => {
      worksheet.addRow([
        project.name,
        project.status,
        project.budget,
        project.spent,
        project.businessUnit,
        project.targetRelease
      ]);
    });
  }

  private addExpenseAnalysisToExcel(worksheet: ExcelJS.Worksheet, data: ExpenseAnalysisReport): void {
    // Summary
    worksheet.addRow(['Expense Analysis']);
    worksheet.addRow(['Total Expenses:', data.totalExpenses]);
    worksheet.addRow([]);

    // By category
    worksheet.addRow(['Expenses by Category']);
    worksheet.addRow(['Category', 'Amount', 'Percentage', 'Count']);
    data.expensesByCategory.forEach(item => {
      worksheet.addRow([item.category, item.amount, item.percentage, item.count]);
    });
    worksheet.addRow([]);

    // By project
    worksheet.addRow(['Expenses by Project']);
    worksheet.addRow(['Project', 'Amount', 'Percentage', 'Count']);
    data.expensesByProject.forEach(item => {
      worksheet.addRow([item.projectName, item.amount, item.percentage, item.count]);
    });
  }

  private addVarianceReportToExcel(worksheet: ExcelJS.Worksheet, data: VarianceReport): void {
    // Summary
    worksheet.addRow(['Variance Analysis']);
    worksheet.addRow(['Total Budget Variance:', data.totalBudgetVariance]);
    worksheet.addRow(['Total Variance %:', data.totalBudgetVariancePercentage]);
    worksheet.addRow([]);

    // Project variances
    worksheet.addRow(['Project Variances']);
    worksheet.addRow(['Project', 'Budgeted', 'Actual', 'Variance', 'Variance %', 'Status']);
    
    data.projectVariances.forEach(item => {
      worksheet.addRow([
        item.projectName,
        item.budgetedAmount,
        item.actualAmount,
        item.variance,
        item.variancePercentage,
        item.status
      ]);
    });
  }

  // Generate CSV report
  private async generateCsvReport(data: any, config: any, filePath: string): Promise<void> {
    let csvContent = `FinancePro Report: ${config.name}\n`;
    csvContent += `Generated: ${new Date().toLocaleString()}\n\n`;

    // Convert data to CSV based on type
    switch (config.type) {
      case 'budget_summary':
        csvContent += this.budgetSummaryToCsv(data);
        break;
      // Add other types as needed
    }

    fs.writeFileSync(filePath, csvContent, 'utf8');
  }

  private budgetSummaryToCsv(data: BudgetSummaryReport): string {
    let csv = 'Summary\n';
    csv += `Total Budget,${data.totalBudget}\n`;
    csv += `Total Spent,${data.totalSpent}\n`;
    csv += `Remaining Budget,${data.remainingBudget}\n`;
    csv += `Utilization %,${data.utilizationPercentage}\n\n`;
    
    csv += 'Project Name,Budget,Spent,Remaining,Utilization %,Status\n';
    data.projects.forEach(project => {
      csv += `"${project.name}",${project.budget},${project.spent},${project.remaining},${project.utilizationPercentage},"${project.status}"\n`;
    });
    
    return csv;
  }

  // Generate JSON report
  private async generateJsonReport(data: any, config: any, filePath: string): Promise<void> {
    const report = {
      metadata: {
        reportName: config.name,
        reportType: config.type,
        generatedAt: new Date().toISOString(),
        format: 'json'
      },
      data
    };

    fs.writeFileSync(filePath, JSON.stringify(report, null, 2), 'utf8');
  }
}