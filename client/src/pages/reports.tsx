import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { 
  TrendingUp, 
  Plus, 
  Download, 
  FileText, 
  BarChart3, 
  PieChart, 
  Calendar,
  DollarSign,
  Folder,
  AlertTriangle
} from "lucide-react";
import type { Project, ChargeHistory } from "@shared/schema";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart as RechartsPieChart, Pie, Cell } from "recharts";

interface ReportMetrics {
  totalProjects: number;
  totalBudget: number;
  totalSpent: number;
  overBudgetProjects: number;
  averageBudgetUsage: number;
}

export default function Reports() {
  const [selectedPeriod, setSelectedPeriod] = useState("all");
  const [selectedReport, setSelectedReport] = useState<string | null>(null);

  const { data: projects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: chargeHistory } = useQuery<ChargeHistory[]>({
    queryKey: ["/api/charge-history"],
  });

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF'
    }).format(Number(amount));
  };

  // Calculate report metrics
  const metrics: ReportMetrics = {
    totalProjects: projects?.length || 0,
    totalBudget: projects?.reduce((sum, p) => sum + Number(p.totalBudget), 0) || 0,
    totalSpent: projects?.reduce((sum, p) => sum + Number(p.actualCost || 0), 0) || 0,
    overBudgetProjects: projects?.filter(p => Number(p.actualCost || 0) > Number(p.totalBudget)).length || 0,
    averageBudgetUsage: projects?.length ? 
      (projects.reduce((sum, p) => sum + ((Number(p.actualCost || 0) / Number(p.totalBudget)) * 100), 0) / projects.length) : 0
  };

  // Prepare chart data
  const projectBudgetData = projects?.map(project => ({
    name: project.name.length > 20 ? project.name.substring(0, 20) + '...' : project.name,
    budget: Number(project.totalBudget),
    spent: Number(project.actualCost || 0),
    remaining: Number(project.totalBudget) - Number(project.actualCost || 0)
  })) || [];

  const budgetStatusData = [
    {
      name: "On Track",
      value: projects?.filter(p => {
        const usage = Number(p.actualCost || 0) / Number(p.totalBudget);
        return usage <= 0.8;
      }).length || 0,
      color: "#22c55e"
    },
    {
      name: "At Risk",
      value: projects?.filter(p => {
        const usage = Number(p.actualCost || 0) / Number(p.totalBudget);
        return usage > 0.8 && usage <= 1.0;
      }).length || 0,
      color: "#f59e0b"
    },
    {
      name: "Over Budget",
      value: projects?.filter(p => {
        const usage = Number(p.actualCost || 0) / Number(p.totalBudget);
        return usage > 1.0;
      }).length || 0,
      color: "#ef4444"
    }
  ];

  const reportTypes = [
    {
      id: "budget-overview",
      title: "Budget Overview Report",
      description: "Complete financial overview with budget vs actual analysis",
      icon: BarChart3,
      type: "chart"
    },
    {
      id: "project-status",
      title: "Project Status Report",
      description: "Project health and budget utilization breakdown",
      icon: PieChart,
      type: "chart"
    },
    {
      id: "expense-summary",
      title: "Expense Summary Report",
      description: "Detailed expense tracking and categorization",
      icon: FileText,
      type: "table"
    },
    {
      id: "variance-analysis",
      title: "Budget Variance Analysis",
      description: "Variance analysis with overrun identification",
      icon: AlertTriangle,
      type: "analysis"
    }
  ];

  const generateReport = (reportType: string) => {
    console.log(`Generating ${reportType} report...`);
    // In a real implementation, this would export to PDF/Excel
    alert(`${reportType} report generated! (This would normally download a file)`);
  };

  return (
    <>
      <header className="bg-background border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Reports & Analytics</h2>
            <p className="text-sm text-muted-foreground">Generate comprehensive financial reports and insights</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
            <Button>
              <Download className="mr-2 h-4 w-4" />
              Export All
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
              <Folder className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalProjects}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(metrics.totalBudget)}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(metrics.totalSpent)}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.totalBudget > 0 ? ((metrics.totalSpent / metrics.totalBudget) * 100).toFixed(1) : 0}% of total budget
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Over Budget</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{metrics.overBudgetProjects}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.totalProjects > 0 ? ((metrics.overBudgetProjects / metrics.totalProjects) * 100).toFixed(1) : 0}% of projects
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Report Types */}
        <div className="grid gap-6 lg:grid-cols-2 mb-8">
          {reportTypes.map((report) => {
            const Icon = report.icon;
            return (
              <Card key={report.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Icon className="h-6 w-6 text-primary" />
                      <div>
                        <CardTitle className="text-lg">{report.title}</CardTitle>
                        <CardDescription>{report.description}</CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline">{report.type}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => generateReport(report.id)}
                    className="w-full"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Generate Report
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Charts Section */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Budget vs Spending Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="mr-2 h-5 w-5" />
                Budget vs Spending by Project
              </CardTitle>
              <CardDescription>
                Comparison of allocated budget and actual spending
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={projectBudgetData.slice(0, 6)} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      fontSize={12}
                    />
                    <YAxis fontSize={12} />
                    <Tooltip 
                      formatter={(value) => formatCurrency(value as number)}
                    />
                    <Legend />
                    <Bar dataKey="budget" fill="#3b82f6" name="Budget" />
                    <Bar dataKey="spent" fill="#f59e0b" name="Spent" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Project Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <PieChart className="mr-2 h-5 w-5" />
                Project Status Distribution
              </CardTitle>
              <CardDescription>
                Overview of project health based on budget utilization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={budgetStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {budgetStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
