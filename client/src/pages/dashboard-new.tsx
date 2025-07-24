import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  FolderOpen, 
  Plus,
  AlertTriangle,
  Calendar,
  Target,
  PieChart,
  Activity,
  CreditCard,
  Wallet,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Zap
} from "lucide-react";
import type { Project, ChargeHistory } from "@shared/schema";
import ProjectModal from "@/components/modals/project-modal-new";
import BudgetSnapshot from "@/components/budget-snapshot";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart as RechartsPieChart, Pie, Cell, Legend } from "recharts";

interface DashboardMetrics {
  activeProjects: number;
  totalBudget: string;
  monthlySpent: string;
  overBudgetProjects: number;
}

export default function Dashboard() {
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [snapshotProject, setSnapshotProject] = useState<Project | undefined>(undefined);
  const [isSnapshotOpen, setIsSnapshotOpen] = useState(false);
  const [targetReleaseFilter, setTargetReleaseFilter] = useState("all");

  const { data: metrics, isLoading: metricsLoading } = useQuery<DashboardMetrics>({
    queryKey: ["/api/dashboard/metrics"],
  });

  const { data: projects, isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: chargeHistory = [] } = useQuery<ChargeHistory[]>({
    queryKey: ["/api/charge-history"],
  });

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF'
    }).format(Number(amount));
  };

  // Get unique target releases for filter dropdown
  const uniqueTargetReleases = Array.from(new Set(
    projects?.map(p => p.targetRelease).filter(Boolean) || []
  )).sort();

  // Filter projects by target release
  const filteredProjects = projects?.filter(project => {
    return targetReleaseFilter === "all" || project.targetRelease === targetReleaseFilter;
  }) || [];

  // Calculate enhanced metrics from filtered projects
  const totalSpent = filteredProjects.reduce((sum, project) => sum + parseFloat(project.actualCost || "0"), 0) || 0;
  const totalBudget = filteredProjects.reduce((sum, project) => sum + parseFloat(project.totalBudget || "0"), 0) || 0;
  const remainingBudget = totalBudget - totalSpent;
  const budgetUsagePercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  // Prepare chart data from filtered projects
  const projectChartData = filteredProjects.map(project => ({
    name: project.name.length > 20 ? project.name.substring(0, 20) + "..." : project.name,
    budget: parseFloat(project.totalBudget || "0"),
    spent: parseFloat(project.actualCost || "0"),
    remaining: parseFloat(project.totalBudget || "0") - parseFloat(project.actualCost || "0"),
  })) || [];

  const recentProjects = filteredProjects.slice(0, 5) || [];

  const budgetStatusData = [
    { name: "Spend", value: totalSpent, color: "#f59e0b" },
    { name: "Remaining", value: remainingBudget > 0 ? remainingBudget : 0, color: "#10b981" },
    { name: "Over Budget", value: remainingBudget < 0 ? Math.abs(remainingBudget) : 0, color: "#ef4444" },
  ].filter(item => item.value > 0);

  // Recent charges for activity feed
  const recentCharges = chargeHistory
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const COLORS = ["#f59e0b", "#10b981", "#ef4444", "#3b82f6", "#8b5cf6"];

  if (metricsLoading || projectsLoading) {
    return (
      <div className="flex-1 overflow-y-auto space-y-6 p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 w-24 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-3 w-32 bg-gray-200 rounded animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Financial overview and project management
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Select value={targetReleaseFilter} onValueChange={setTargetReleaseFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filter by Target Release" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Releases</SelectItem>
              {uniqueTargetReleases.map(release => (
                <SelectItem key={release} value={release}>
                  {release}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => setIsSnapshotOpen(true)} variant="outline" className="w-full sm:w-auto">
            <Zap className="mr-2 h-4 w-4" />
            Quick Budget Snapshot
          </Button>
          <Button onClick={() => setIsProjectModalOpen(true)} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </div>
      </div>

      {/* Main Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 auto-rows-fr">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{filteredProjects.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Currently managed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold break-words">{formatCurrency(totalBudget)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Allocated across all projects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold break-words">{formatCurrency(totalSpent)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {budgetUsagePercentage.toFixed(1)}% of total budget
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Status</CardTitle>
            {remainingBudget < 0 ? (
              <AlertTriangle className="h-4 w-4 text-red-500" />
            ) : (
              <TrendingUp className="h-4 w-4 text-green-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-xl font-bold break-words ${remainingBudget < 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatCurrency(Math.abs(remainingBudget))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {remainingBudget < 0 ? 'Over budget' : 'Remaining'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Budget Overview Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="mr-2 h-5 w-5" />
            Budget Overview
          </CardTitle>
          <CardDescription>
            Overall budget utilization across all projects
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1 flex-1">
                <p className="text-sm font-medium">Budget Utilization</p>
                <p className="text-xl font-bold break-words">
                  {budgetUsagePercentage.toFixed(1)}%
                </p>
              </div>
              <div className="text-right space-y-1 flex-1">
                <p className="text-sm text-muted-foreground break-words">
                  {formatCurrency(totalSpent)} spend of {formatCurrency(totalBudget)}
                </p>
                <p className={`text-sm font-medium break-words ${remainingBudget < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {remainingBudget < 0 ? 'Over by ' : 'Remaining: '} 
                  {formatCurrency(Math.abs(remainingBudget))}
                </p>
              </div>
            </div>
            <Progress 
              value={Math.min(budgetUsagePercentage, 100)} 
              className="h-4"
            />
            {budgetUsagePercentage > 90 && (
              <div className="flex items-center text-amber-600 text-sm">
                <AlertTriangle className="mr-2 h-4 w-4" />
                Warning: Budget utilization is {budgetUsagePercentage > 100 ? 'exceeded' : 'nearly exhausted'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Charts Section */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        {/* Project Budget Comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="mr-2 h-5 w-5" />
              Project Budget vs Spending
            </CardTitle>
            <CardDescription>
              Budget allocation and actual spending by project
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={projectChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12 }}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    formatter={(value, name) => [formatCurrency(value as number), name]}
                    labelStyle={{ color: '#000' }}
                  />
                  <Legend />
                  <Bar dataKey="budget" fill="#3b82f6" name="Total Budget" />
                  <Bar dataKey="spent" fill="#f59e0b" name="Actual Spent" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Budget Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChart className="mr-2 h-5 w-5" />
              Budget Distribution
            </CardTitle>
            <CardDescription>
              Current budget allocation status
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
                  <Tooltip 
                    formatter={(value) => formatCurrency(value as number)}
                  />
                  <Legend />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4">
              {budgetStatusData.map((item, index) => (
                <div key={item.name} className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <div 
                      className="w-3 h-3 rounded mr-2" 
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className="text-sm font-medium">{item.name}</span>
                  </div>
                  <p className="text-lg font-bold break-words">{formatCurrency(item.value)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Project Status and Recent Activity */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        {/* Project Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="mr-2 h-5 w-5" />
              Project Status
            </CardTitle>
            <CardDescription>
              Current status of all active projects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {projects?.slice(0, 5).map(project => {
                const budget = parseFloat(project.totalBudget || "0");
                const spent = parseFloat(project.actualCost || "0");
                const usage = budget > 0 ? (spent / budget) * 100 : 0;
                const isOverBudget = spent > budget;
                
                return (
                  <div key={project.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-sm">{project.name}</h4>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSnapshotProject(project);
                              setIsSnapshotOpen(true);
                            }}
                            className="h-6 w-6 p-0 text-primary hover:text-primary"
                            title="Quick Budget Snapshot"
                          >
                            <Zap className="h-3 w-3" />
                          </Button>
                          <Badge variant={isOverBudget ? "destructive" : usage > 80 ? "secondary" : "default"}>
                            {isOverBudget ? "Over Budget" : usage > 80 ? "At Risk" : "On Track"}
                          </Badge>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{formatCurrency(spent)} spend</span>
                          <span>{formatCurrency(budget)} budget</span>
                        </div>
                        <Progress value={Math.min(usage, 100)} className="h-2" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="mr-2 h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Latest charges and transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentCharges.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="mx-auto h-8 w-8 mb-2" />
                  <p>No recent activity</p>
                </div>
              ) : (
                recentCharges.map(charge => {
                  const project = projects?.find(p => p.id === charge.projectId);
                  return (
                    <div key={charge.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                        <CreditCard className="h-5 w-5 text-orange-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {charge.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {project?.name || "Unknown Project"} • {new Date(charge.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{formatCurrency(charge.amount)}</p>
                        <Badge variant="outline" className="text-xs">
                          {charge.category || "General"}
                        </Badge>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        project={undefined}
      />

      {/* Budget Snapshot Modal */}
      {snapshotProject && (
        <BudgetSnapshot
          project={snapshotProject}
          isOpen={isSnapshotOpen}
          onClose={() => {
            setIsSnapshotOpen(false);
            setSnapshotProject(undefined);
          }}
        />
      )}
    </div>
  );
}