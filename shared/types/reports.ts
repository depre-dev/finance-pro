import { z } from 'zod';

// Report configuration schema
export const reportConfigSchema = z.object({
  name: z.string().min(1, 'Report name is required'),
  description: z.string().optional(),
  type: z.enum(['budget_summary', 'project_status', 'expense_analysis', 'variance_report', 'custom']),
  schedule: z.enum(['manual', 'daily', 'weekly', 'monthly', 'quarterly']),
  format: z.enum(['pdf', 'excel', 'csv', 'json']),
  recipients: z.array(z.string().email()).min(1, 'At least one recipient is required'),
  filters: z.object({
    projectIds: z.array(z.number()).optional(),
    dateRange: z.object({
      from: z.string(),
      to: z.string()
    }).optional(),
    budgetThreshold: z.number().optional(),
    categories: z.array(z.string()).optional()
  }).optional(),
  isActive: z.boolean().default(true)
});

export type ReportConfig = z.infer<typeof reportConfigSchema>;

// Report types
export interface BudgetSummaryReport {
  totalBudget: number;
  totalSpent: number;
  remainingBudget: number;
  utilizationPercentage: number;
  projectCount: number;
  overBudgetProjects: number;
  projects: Array<{
    id: number;
    name: string;
    budget: number;
    spent: number;
    remaining: number;
    utilizationPercentage: number;
    status: string;
  }>;
}

export interface ProjectStatusReport {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  onHoldProjects: number;
  projects: Array<{
    id: number;
    name: string;
    status: string;
    budget: number;
    spent: number;
    startDate: Date;
    targetRelease: string;
    businessUnit: string;
  }>;
}

export interface ExpenseAnalysisReport {
  totalExpenses: number;
  expensesByCategory: Array<{
    category: string;
    amount: number;
    percentage: number;
    count: number;
  }>;
  expensesByProject: Array<{
    projectId: number;
    projectName: string;
    amount: number;
    percentage: number;
    count: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    amount: number;
    count: number;
  }>;
}

export interface VarianceReport {
  totalBudgetVariance: number;
  totalBudgetVariancePercentage: number;
  projectVariances: Array<{
    projectId: number;
    projectName: string;
    budgetedAmount: number;
    actualAmount: number;
    variance: number;
    variancePercentage: number;
    status: 'under_budget' | 'on_budget' | 'over_budget';
  }>;
}

export type ReportData = BudgetSummaryReport | ProjectStatusReport | ExpenseAnalysisReport | VarianceReport;

// Report execution result
export interface ReportExecution {
  id: string;
  configId: number;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  filePath?: string;
  errorMessage?: string;
  recipients: string[];
  format: string;
}