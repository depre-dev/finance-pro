import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  FileText, 
  Plus, 
  Play, 
  Download, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Settings,
  BarChart3,
  FileSpreadsheet,
  Eye,
  TrendingUp,
  PieChart,
  Calendar
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import AnimatedCard from "@/components/ui/animated-card";
import AnimatedButton from "@/components/ui/animated-button";

export default function Reports() {
  const { toast } = useToast();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState("budget_summary");

  // Get projects and financial data for report generation
  const { data: projects = [] } = useQuery<any[]>({
    queryKey: ["/api/projects"],
  });

  const { data: chargeHistory = [] } = useQuery<any[]>({
    queryKey: ["/api/charge-history"],
  });

  // Calculate report data
  const generateReportData = (type: string) => {
    if (!projects?.length || !chargeHistory) return null;

    switch (type) {
      case "budget_summary":
        const totalBudget = projects?.reduce((sum, p) => sum + parseFloat(p.totalBudget || "0"), 0) || 0;
        const totalSpent = chargeHistory?.reduce((sum, c) => sum + parseFloat(c.amount || "0"), 0) || 0;
        const budgetUtilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
        return {
          totalBudget: totalBudget.toLocaleString('en-US', { style: 'currency', currency: 'CHF' }),
          totalSpent: totalSpent.toLocaleString('en-US', { style: 'currency', currency: 'CHF' }),
          remaining: (totalBudget - totalSpent).toLocaleString('en-US', { style: 'currency', currency: 'CHF' }),
          utilization: `${budgetUtilization.toFixed(1)}%`,
          projects: projects?.length || 0,
          overBudget: projects?.filter(p => {
            const spent = chargeHistory
              ?.filter(c => c.projectId === p.id)
              ?.reduce((sum, c) => sum + parseFloat(c.amount || "0"), 0) || 0;
            return spent > parseFloat(p.totalBudget || "0");
          })?.length || 0
        };

      case "project_status":
        const activeProjects = projects?.filter(p => p.status === 'active')?.length || 0;
        const completedProjects = projects?.filter(p => p.status === 'completed')?.length || 0;
        const avgBudgetUsage = projects?.reduce((sum, p) => {
          const spent = chargeHistory
            ?.filter(c => c.projectId === p.id)
            ?.reduce((sum, c) => sum + parseFloat(c.amount || "0"), 0) || 0;
          const budget = parseFloat(p.totalBudget || "0");
          return sum + (budget > 0 ? (spent / budget) * 100 : 0);
        }, 0) / (projects?.length || 1) || 0;
        
        return {
          totalProjects: projects?.length || 0,
          activeProjects,
          completedProjects,
          avgBudgetUsage: `${avgBudgetUsage.toFixed(1)}%`,
          recentActivity: chargeHistory?.slice(0, 5) || []
        };

      case "expense_analysis":
        const expensesByCategory = chargeHistory?.reduce((acc, charge) => {
          const category = charge.category || 'Uncategorized';
          if (!acc[category]) acc[category] = 0;
          acc[category] += parseFloat(charge.amount || "0");
          return acc;
        }, {} as Record<string, number>) || {};

        const sortedCategories = Object.entries(expensesByCategory)
          .sort(([,a], [,b]) => (b as number) - (a as number))
          .slice(0, 5);

        const totalExpenseAmount = Object.values(expensesByCategory).reduce((sum, amount) => sum + (amount as number), 0);

        return {
          totalExpenses: totalExpenseAmount.toLocaleString('en-US', { style: 'currency', currency: 'CHF' }),
          categories: sortedCategories.length,
          topCategory: sortedCategories[0] ? {
            name: sortedCategories[0][0],
            amount: (sortedCategories[0][1] as number).toLocaleString('en-US', { style: 'currency', currency: 'CHF' })
          } : null,
          breakdown: sortedCategories.map(([name, amount]) => ({
            name,
            amount: (amount as number).toLocaleString('en-US', { style: 'currency', currency: 'CHF' }),
            percentage: (((amount as number) / totalExpenseAmount) * 100).toFixed(1)
          }))
        };

      default:
        return null;
    }
  };

  const reportData = generateReportData(selectedReportType);

  const handleDownloadReport = (type: string, format: string) => {
    const data = generateReportData(type);
    if (!data) return;

    // Create downloadable content
    let content = "";
    const timestamp = new Date().toISOString().split('T')[0];
    
    if (format === 'csv') {
      if (type === 'budget_summary') {
        content = `Report Type,Budget Summary\nGenerated,${timestamp}\n\nMetric,Value\nTotal Budget,${data.totalBudget}\nTotal Spent,${data.totalSpent}\nRemaining,${data.remaining}\nUtilization,${data.utilization}\nProjects,${data.projects}\nOver Budget,${data.overBudget}`;
      }
    } else if (format === 'json') {
      content = JSON.stringify({ type, generated: timestamp, data }, null, 2);
    } else {
      // Plain text format
      content = `${type.replace('_', ' ').toUpperCase()} REPORT\nGenerated: ${timestamp}\n\n${JSON.stringify(data, null, 2)}`;
    }

    // Download file
    const blob = new Blob([content], { type: format === 'csv' ? 'text/csv' : 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_report_${timestamp}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "Report downloaded successfully",
    });
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            Generate comprehensive reports from your financial data
          </p>
        </div>
        <AnimatedButton
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          {showCreateForm ? "Cancel" : "Generate Report"}
        </AnimatedButton>
      </div>

      {/* Report Generation Form */}
      {showCreateForm && (
        <AnimatedCard delay={0.1}>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="mr-2 h-5 w-5" />
              Generate New Report
            </CardTitle>
            <CardDescription>
              Select report type and format to generate your financial report
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Report Type</Label>
                <Select value={selectedReportType} onValueChange={setSelectedReportType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="budget_summary">Budget Summary</SelectItem>
                    <SelectItem value="project_status">Project Status</SelectItem>
                    <SelectItem value="expense_analysis">Expense Analysis</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Format</Label>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleDownloadReport(selectedReportType, 'csv')}
                    className="flex-1"
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-1" />
                    CSV
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleDownloadReport(selectedReportType, 'json')}
                    className="flex-1"
                  >
                    <FileText className="h-4 w-4 mr-1" />
                    JSON
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleDownloadReport(selectedReportType, 'txt')}
                    className="flex-1"
                  >
                    <FileText className="h-4 w-4 mr-1" />
                    TXT
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </AnimatedCard>
      )}

      {/* Report Preview */}
      {reportData && (
        <AnimatedCard delay={0.2}>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Eye className="mr-2 h-5 w-5" />
              Report Preview - {selectedReportType.replace('_', ' ').toUpperCase()}
            </CardTitle>
            <CardDescription>
              Preview of your {selectedReportType.replace('_', ' ')} report data
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedReportType === 'budget_summary' && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total Budget</p>
                  <p className="text-2xl font-bold text-primary">{reportData.totalBudget}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total Spent</p>
                  <p className="text-2xl font-bold text-orange-600">{reportData.totalSpent}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Remaining</p>
                  <p className="text-2xl font-bold text-emerald-600">{reportData.remaining}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Utilization</p>
                  <p className="text-2xl font-bold">{reportData.utilization}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Projects</p>
                  <p className="text-2xl font-bold">{reportData.projects}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Over Budget</p>
                  <p className="text-2xl font-bold text-red-600">{reportData.overBudget}</p>
                </div>
              </div>
            )}

            {selectedReportType === 'project_status' && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total Projects</p>
                  <p className="text-2xl font-bold">{reportData.totalProjects}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold text-emerald-600">{reportData.activeProjects}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold text-blue-600">{reportData.completedProjects}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Avg Budget Usage</p>
                  <p className="text-2xl font-bold">{reportData.avgBudgetUsage}</p>
                </div>
              </div>
            )}

            {selectedReportType === 'expense_analysis' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Total Expenses</p>
                    <p className="text-2xl font-bold text-red-600">{reportData.totalExpenses}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Categories</p>
                    <p className="text-2xl font-bold">{reportData.categories}</p>
                  </div>
                </div>
                {reportData.breakdown && reportData.breakdown.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Top Expense Categories</h4>
                    <div className="space-y-2">
                      {reportData.breakdown.map((item: any, index: number) => (
                        <div key={index} className="flex justify-between items-center p-2 border rounded">
                          <span className="font-medium">{item.name}</span>
                          <div className="text-right">
                            <div className="font-bold">{item.amount}</div>
                            <div className="text-sm text-muted-foreground">{item.percentage}%</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </AnimatedCard>
      )}

      {/* Quick Report Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <AnimatedCard delay={0.3}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Summary</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Real-time</div>
            <p className="text-xs text-muted-foreground">
              Live budget analysis and variance reporting
            </p>
            <Button 
              size="sm" 
              variant="outline" 
              className="mt-2"
              onClick={() => {
                setSelectedReportType('budget_summary');
                setShowCreateForm(true);
              }}
            >
              Generate
            </Button>
          </CardContent>
        </AnimatedCard>

        <AnimatedCard delay={0.4}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Project Status</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Real-time</div>
            <p className="text-xs text-muted-foreground">
              Project health and progress tracking reports
            </p>
            <Button 
              size="sm" 
              variant="outline" 
              className="mt-2"
              onClick={() => {
                setSelectedReportType('project_status');
                setShowCreateForm(true);
              }}
            >
              Generate
            </Button>
          </CardContent>
        </AnimatedCard>

        <AnimatedCard delay={0.5}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expense Analysis</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Real-time</div>
            <p className="text-xs text-muted-foreground">
              Detailed expense breakdown and categorization
            </p>
            <Button 
              size="sm" 
              variant="outline" 
              className="mt-2"
              onClick={() => {
                setSelectedReportType('expense_analysis');
                setShowCreateForm(true);
              }}
            >
              Generate
            </Button>
          </CardContent>
        </AnimatedCard>
      </div>
    </div>
  );
}