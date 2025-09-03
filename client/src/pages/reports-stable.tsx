import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Plus, 
  Download, 
  BarChart3,
  FileSpreadsheet,
  TrendingUp,
  PieChart
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AnimatedCard from "@/components/ui/animated-card";
import AnimatedButton from "@/components/ui/animated-button";

interface Project {
  id: number;
  name: string;
  totalBudget: string;
  status: string;
}

interface ChargeHistory {
  id: number;
  projectId: number;
  amount: string;
  category: string;
  description: string;
  date: string;
}

export default function Reports() {
  const { toast } = useToast();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState("budget_summary");

  // Get projects and financial data for report generation
  const { data: projects = [], isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: chargeHistory = [], isLoading: chargeLoading } = useQuery<ChargeHistory[]>({
    queryKey: ["/api/charge-history"],
  });

  // Calculate report data safely
  const reportData = useMemo(() => {
    if (projectsLoading || chargeLoading || !projects.length) {
      return null;
    }

    try {
      switch (selectedReportType) {
        case "budget_summary": {
          const totalBudget = projects.reduce((sum, p) => {
            const budget = parseFloat(p.totalBudget || "0");
            return sum + (isNaN(budget) ? 0 : budget);
          }, 0);
          
          const totalSpent = chargeHistory.reduce((sum, c) => {
            const amount = parseFloat(c.amount || "0");
            return sum + (isNaN(amount) ? 0 : amount);
          }, 0);
          
          const budgetUtilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
          
          const overBudgetCount = projects.filter(p => {
            const budget = parseFloat(p.totalBudget || "0");
            const spent = chargeHistory
              .filter(c => c.projectId === p.id)
              .reduce((sum, c) => {
                const amount = parseFloat(c.amount || "0");
                return sum + (isNaN(amount) ? 0 : amount);
              }, 0);
            return spent > budget;
          }).length;

          return {
            totalBudget: new Intl.NumberFormat('en-CH', { 
              style: 'currency', 
              currency: 'CHF' 
            }).format(totalBudget),
            totalSpent: new Intl.NumberFormat('en-CH', { 
              style: 'currency', 
              currency: 'CHF' 
            }).format(totalSpent),
            remaining: new Intl.NumberFormat('en-CH', { 
              style: 'currency', 
              currency: 'CHF' 
            }).format(totalBudget - totalSpent),
            utilization: `${budgetUtilization.toFixed(1)}%`,
            projects: projects.length,
            overBudget: overBudgetCount
          };
        }

        case "project_status": {
          const activeProjects = projects.filter(p => p.status === 'active').length;
          const completedProjects = projects.filter(p => p.status === 'completed').length;
          
          const avgBudgetUsage = projects.reduce((sum, p) => {
            const budget = parseFloat(p.totalBudget || "0");
            if (budget === 0) return sum;
            
            const spent = chargeHistory
              .filter(c => c.projectId === p.id)
              .reduce((chargeSum, c) => {
                const amount = parseFloat(c.amount || "0");
                return chargeSum + (isNaN(amount) ? 0 : amount);
              }, 0);
            
            return sum + (spent / budget) * 100;
          }, 0) / Math.max(projects.length, 1);

          return {
            totalProjects: projects.length,
            activeProjects,
            completedProjects,
            avgBudgetUsage: `${avgBudgetUsage.toFixed(1)}%`,
            recentActivity: chargeHistory.slice(0, 5).length
          };
        }

        case "expense_analysis": {
          const expensesByCategory: Record<string, number> = {};
          
          chargeHistory.forEach(charge => {
            const category = charge.category || 'Uncategorized';
            const amount = parseFloat(charge.amount || "0");
            if (!isNaN(amount)) {
              expensesByCategory[category] = (expensesByCategory[category] || 0) + amount;
            }
          });

          const sortedCategories = Object.entries(expensesByCategory)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

          const totalExpenseAmount = Object.values(expensesByCategory).reduce((sum, amount) => sum + amount, 0);

          return {
            totalExpenses: new Intl.NumberFormat('en-CH', { 
              style: 'currency', 
              currency: 'CHF' 
            }).format(totalExpenseAmount),
            categories: Object.keys(expensesByCategory).length,
            topCategory: sortedCategories.length > 0 ? {
              name: sortedCategories[0][0],
              amount: new Intl.NumberFormat('en-CH', { 
                style: 'currency', 
                currency: 'CHF' 
              }).format(sortedCategories[0][1])
            } : null,
            breakdown: sortedCategories.map(([name, amount]) => ({
              name,
              amount: new Intl.NumberFormat('en-CH', { 
                style: 'currency', 
                currency: 'CHF' 
              }).format(amount),
              percentage: totalExpenseAmount > 0 ? ((amount / totalExpenseAmount) * 100).toFixed(1) : "0.0"
            }))
          };
        }

        default:
          return null;
      }
    } catch (error) {
      console.error("Error calculating report data:", error);
      return null;
    }
  }, [selectedReportType, projects, chargeHistory, projectsLoading, chargeLoading]);

  const handleDownloadReport = (type: string, format: string) => {
    if (!reportData) {
      toast({
        title: "Error",
        description: "No report data available",
        variant: "destructive",
      });
      return;
    }

    try {
      const timestamp = new Date().toISOString().split('T')[0];
      let content = "";
      let filename = `${type}_report_${timestamp}`;
      let mimeType = "text/plain";

      if (format === 'csv') {
        mimeType = "text/csv";
        filename += ".csv";
        
        if (type === 'budget_summary') {
          content = [
            "Report Type,Budget Summary",
            `Generated,${timestamp}`,
            "",
            "Metric,Value",
            `Total Budget,${reportData.totalBudget}`,
            `Total Spent,${reportData.totalSpent}`,
            `Remaining,${reportData.remaining}`,
            `Utilization,${reportData.utilization}`,
            `Projects,${reportData.projects}`,
            `Over Budget,${reportData.overBudget}`
          ].join('\n');
        }
      } else if (format === 'json') {
        mimeType = "application/json";
        filename += ".json";
        content = JSON.stringify({ 
          type, 
          generated: timestamp, 
          data: reportData 
        }, null, 2);
      } else {
        filename += ".txt";
        content = `${type.replace('_', ' ').toUpperCase()} REPORT\nGenerated: ${timestamp}\n\n${JSON.stringify(reportData, null, 2)}`;
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Report downloaded successfully",
      });
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Error",
        description: "Failed to download report",
        variant: "destructive",
      });
    }
  };

  if (projectsLoading || chargeLoading) {
    return (
      <div className="flex-1 space-y-6 p-4 md:p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
            <p className="text-muted-foreground">Loading report data...</p>
          </div>
        </div>
      </div>
    );
  }

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
            <CardTitle>Generate New Report</CardTitle>
            <CardDescription>
              Select report type and format to generate your financial report
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Report Type</label>
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
                <label className="text-sm font-medium">Download Format</label>
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
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
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

            {selectedReportType === 'expense_analysis' && reportData.breakdown && (
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
                {reportData.breakdown.length > 0 && (
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