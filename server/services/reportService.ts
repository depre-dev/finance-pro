import { storage } from "../storage";
import * as ExcelJS from "exceljs";
import * as fs from "fs";
import * as path from "path";
import { format } from "date-fns";
import type { ReportConfiguration } from "@shared/schema";

export interface ReportData {
  totalBudget?: number;
  totalSpent?: number;
  projectCount?: number;
  totalProjects?: number;
  totalExpenses?: number;
  projects?: any[];
  expenses?: any[];
  budgetCategories?: any[];
}

export class ReportService {
  private static instance: ReportService;

  public static getInstance(): ReportService {
    if (!ReportService.instance) {
      ReportService.instance = new ReportService();
    }
    return ReportService.instance;
  }

  // Generate Budget Summary Report
  async generateBudgetSummaryReport(userId: number, filters: any = {}): Promise<ReportData> {
    const projects = await storage.getProjects(userId);
    const chargeHistory = await storage.getChargeHistory(null, userId);
    
    const totalBudget = projects.reduce((sum, project) => sum + parseFloat(project.totalBudget), 0);
    const totalSpent = chargeHistory.reduce((sum, charge) => sum + parseFloat(charge.amount), 0);
    const projectCount = projects.length;

    return {
      totalBudget,
      totalSpent,
      projectCount,
      projects: projects.map(project => ({
        id: project.id,
        name: project.name,
        budget: parseFloat(project.totalBudget),
        spent: chargeHistory
          .filter(charge => charge.projectId === project.id)
          .reduce((sum, charge) => sum + parseFloat(charge.amount), 0),
        remaining: parseFloat(project.totalBudget) - chargeHistory
          .filter(charge => charge.projectId === project.id)
          .reduce((sum, charge) => sum + parseFloat(charge.amount), 0),
        status: project.status,
        client: project.client
      }))
    };
  }

  // Generate Project Status Report
  async generateProjectStatusReport(userId: number, filters: any = {}): Promise<ReportData> {
    const projects = await storage.getProjects(userId);
    const chargeHistory = await storage.getChargeHistory(null, userId);
    
    const projectsWithStatus = projects.map(project => {
      const spent = chargeHistory
        .filter(charge => charge.projectId === project.id)
        .reduce((sum, charge) => sum + parseFloat(charge.amount), 0);
      
      const budget = parseFloat(project.totalBudget);
      const remaining = budget - spent;
      const percentComplete = budget > 0 ? (spent / budget) * 100 : 0;
      
      let healthStatus = 'good';
      if (percentComplete > 90) healthStatus = 'warning';
      if (percentComplete > 100) healthStatus = 'critical';
      
      return {
        id: project.id,
        name: project.name,
        status: project.status,
        budget,
        spent,
        remaining,
        percentComplete: Math.round(percentComplete),
        healthStatus,
        startDate: project.startDate,
        endDate: project.endDate,
        client: project.client
      };
    });

    return {
      totalProjects: projects.length,
      projects: projectsWithStatus
    };
  }

  // Generate Expense Analysis Report
  async generateExpenseAnalysisReport(userId: number, filters: any = {}): Promise<ReportData> {
    const chargeHistory = await storage.getChargeHistory(null, userId);
    const projects = await storage.getProjects(userId);
    
    const expensesByCategory = chargeHistory.reduce((acc, charge) => {
      const category = charge.category || 'Uncategorized';
      if (!acc[category]) {
        acc[category] = { count: 0, total: 0, charges: [] };
      }
      acc[category].count++;
      acc[category].total += parseFloat(charge.amount);
      acc[category].charges.push(charge);
      return acc;
    }, {} as any);

    const totalExpenses = chargeHistory.reduce((sum, charge) => sum + parseFloat(charge.amount), 0);

    return {
      totalExpenses,
      projectCount: projects.length,
      expenses: Object.entries(expensesByCategory).map(([category, data]: [string, any]) => ({
        category,
        count: data.count,
        total: data.total,
        average: data.total / data.count,
        percentage: totalExpenses > 0 ? (data.total / totalExpenses) * 100 : 0,
        charges: data.charges
      }))
    };
  }

  // Generate Variance Report
  async generateVarianceReport(userId: number, filters: any = {}): Promise<ReportData> {
    const projects = await storage.getProjects(userId);
    const chargeHistory = await storage.getChargeHistory(null, userId);
    const budgetCategories = await storage.getBudgetCategories(userId);
    
    const projectVariances = projects.map(project => {
      const spent = chargeHistory
        .filter(charge => charge.projectId === project.id)
        .reduce((sum, charge) => sum + parseFloat(charge.amount), 0);
      
      const budget = parseFloat(project.totalBudget);
      const variance = spent - budget;
      const variancePercent = budget > 0 ? (variance / budget) * 100 : 0;
      
      return {
        id: project.id,
        name: project.name,
        budget,
        spent,
        variance,
        variancePercent: Math.round(variancePercent * 100) / 100,
        status: variance > 0 ? 'Over Budget' : variance < 0 ? 'Under Budget' : 'On Budget'
      };
    });

    const budgetVariances = budgetCategories.map(category => {
      const variance = parseFloat(category.actualAmount) - parseFloat(category.plannedAmount);
      const variancePercent = parseFloat(category.plannedAmount) > 0 
        ? (variance / parseFloat(category.plannedAmount)) * 100 
        : 0;
      
      return {
        id: category.id,
        category: category.category,
        planned: parseFloat(category.plannedAmount),
        actual: parseFloat(category.actualAmount),
        variance,
        variancePercent: Math.round(variancePercent * 100) / 100,
        status: variance > 0 ? 'Over Budget' : variance < 0 ? 'Under Budget' : 'On Budget'
      };
    });

    return {
      projects: projectVariances,
      budgetCategories: budgetVariances
    };
  }

  // Execute a report and save to file
  async executeReport(configId: number, userId: number): Promise<string> {
    // Get the configuration
    const configs = await storage.getReportConfigurations(userId);
    const config = configs.find(c => c.id === configId);
    
    if (!config) {
      throw new Error("Report configuration not found");
    }

    // Log execution start
    const executionId = await storage.createReportExecution({
      reportConfigId: configId,
      userId,
      status: 'generating',
      startedAt: new Date()
    });

    try {
      // Generate report data
      let reportData: ReportData;
      switch (config.type) {
        case 'budget_summary':
          reportData = await this.generateBudgetSummaryReport(userId);
          break;
        case 'project_status':
          reportData = await this.generateProjectStatusReport(userId);
          break;
        case 'expense_analysis':
          reportData = await this.generateExpenseAnalysisReport(userId);
          break;
        case 'variance_report':
          reportData = await this.generateVarianceReport(userId);
          break;
        default:
          throw new Error(`Unsupported report type: ${config.type}`);
      }

      // Generate file
      const fileName = `${config.name.replace(/[^a-zA-Z0-9]/g, '_')}_${format(new Date(), 'yyyy-MM-dd_HH-mm-ss')}.${config.format}`;
      const reportsDir = path.join(process.cwd(), 'reports');
      
      // Ensure reports directory exists
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }
      
      const filePath = path.join(reportsDir, fileName);

      if (config.format === 'excel') {
        await this.generateExcelFile(reportData, config, filePath);
      } else if (config.format === 'csv') {
        await this.generateCsvFile(reportData, config, filePath);
      } else if (config.format === 'json') {
        await this.generateJsonFile(reportData, config, filePath);
      }

      // Get file size
      const stats = fs.statSync(filePath);
      
      // Update execution record
      await storage.updateReportExecution(executionId, {
        status: 'completed',
        completedAt: new Date(),
        filePath,
        fileSize: stats.size
      });

      return filePath;
    } catch (error) {
      // Update execution record with error
      await storage.updateReportExecution(executionId, {
        status: 'failed',
        completedAt: new Date(),
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      });
      
      throw error;
    }
  }

  // Generate Excel file
  private async generateExcelFile(data: ReportData, config: ReportConfiguration, filePath: string): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(config.name);

    // Add header
    worksheet.addRow([config.name]);
    worksheet.addRow([`Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`]);
    worksheet.addRow([]);

    if (config.type === 'budget_summary' && data.projects) {
      worksheet.addRow(['Project Name', 'Budget', 'Spent', 'Remaining', 'Status', 'Client']);
      data.projects.forEach((project: any) => {
        worksheet.addRow([
          project.name,
          project.budget,
          project.spent,
          project.remaining,
          project.status,
          project.client
        ]);
      });
    } else if (config.type === 'project_status' && data.projects) {
      worksheet.addRow(['Project Name', 'Status', 'Budget', 'Spent', 'Remaining', '% Complete', 'Health']);
      data.projects.forEach((project: any) => {
        worksheet.addRow([
          project.name,
          project.status,
          project.budget,
          project.spent,
          project.remaining,
          project.percentComplete,
          project.healthStatus
        ]);
      });
    } else if (config.type === 'expense_analysis' && data.expenses) {
      worksheet.addRow(['Category', 'Count', 'Total', 'Average', 'Percentage']);
      data.expenses.forEach((expense: any) => {
        worksheet.addRow([
          expense.category,
          expense.count,
          expense.total,
          expense.average,
          expense.percentage
        ]);
      });
    } else if (config.type === 'variance_report') {
      if (data.projects) {
        worksheet.addRow(['Project Variances']);
        worksheet.addRow(['Project Name', 'Budget', 'Spent', 'Variance', 'Variance %', 'Status']);
        data.projects.forEach((project: any) => {
          worksheet.addRow([
            project.name,
            project.budget,
            project.spent,
            project.variance,
            project.variancePercent,
            project.status
          ]);
        });
      }
    }

    await workbook.xlsx.writeFile(filePath);
  }

  // Generate CSV file
  private async generateCsvFile(data: ReportData, config: ReportConfiguration, filePath: string): Promise<void> {
    let csvContent = `${config.name}\nGenerated: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}\n\n`;

    if (config.type === 'budget_summary' && data.projects) {
      csvContent += 'Project Name,Budget,Spent,Remaining,Status,Client\n';
      data.projects.forEach((project: any) => {
        csvContent += `"${project.name}",${project.budget},${project.spent},${project.remaining},"${project.status}","${project.client}"\n`;
      });
    }
    // Add other report types as needed

    fs.writeFileSync(filePath, csvContent);
  }

  // Generate JSON file
  private async generateJsonFile(data: ReportData, config: ReportConfiguration, filePath: string): Promise<void> {
    const jsonData = {
      reportName: config.name,
      generatedAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
      type: config.type,
      data
    };

    fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2));
  }
}