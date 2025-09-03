import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AnimatedCard from "@/components/ui/animated-card";
import AnimatedButton from "@/components/ui/animated-button";
import AnimatedProgress from "@/components/ui/animated-progress";
import AnimatedNumber from "@/components/ui/animated-number";
import FloatingActionButton from "@/components/ui/floating-action-button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
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
import EnhancedBudgetChart from "@/components/charts/enhanced-budget-chart";
import EnhancedDistributionChart from "@/components/charts/enhanced-distribution-chart";
import ProjectHealthWidget from "@/components/charts/project-health-widget";

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
  const recentCharges = (chargeHistory || [])
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
                <SelectItem key={release} value={release || ""}>
                  {release || "No Release"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            onClick={() => {
              // Use the first available project for the general snapshot
              const firstProject = filteredProjects[0];
              if (firstProject) {
                setSnapshotProject(firstProject);
                setIsSnapshotOpen(true);
              }
            }} 
            variant="outline" 
            className="w-full sm:w-auto"
            disabled={filteredProjects.length === 0}
          >
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
        <AnimatedCard delay={0}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <AnimatedNumber 
              value={filteredProjects.length}
              className="text-xl font-bold"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Currently managed
            </p>
          </CardContent>
        </AnimatedCard>

        <AnimatedCard delay={0.1}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <AnimatedNumber 
              value={totalBudget}
              format="currency"
              className="text-xl font-bold break-words"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Allocated across all projects
            </p>
          </CardContent>
        </AnimatedCard>

        <AnimatedCard delay={0.2}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <AnimatedNumber 
              value={totalSpent}
              format="currency"
              className="text-xl font-bold break-words"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {budgetUsagePercentage.toFixed(1)}% of total budget
            </p>
          </CardContent>
        </AnimatedCard>

        <AnimatedCard delay={0.3}>
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
        </AnimatedCard>
      </div>

      {/* Budget Overview Progress */}
      <AnimatedCard delay={0.4}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="mr-2 h-5 w-5" />
            Budget Overview
            {targetReleaseFilter !== "all" && (
              <Badge variant="secondary" className="ml-2">
                {targetReleaseFilter || "No Release"}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            {targetReleaseFilter === "all" 
              ? "Overall budget utilization across all projects"
              : `Budget utilization for ${targetReleaseFilter || "No Release"} release`
            }
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
            <div className="w-full bg-secondary rounded-full h-4 overflow-hidden">
              <motion.div
                className={`h-full rounded-full transition-colors duration-300 ${
                  budgetUsagePercentage > 100 ? 'bg-red-500' : 
                  budgetUsagePercentage > 90 ? 'bg-yellow-500' : 
                  'bg-primary'
                }`}
                initial={{ width: "0%" }}
                animate={{ width: `${Math.min(budgetUsagePercentage, 100)}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
            </div>
            {budgetUsagePercentage > 90 && (
              <div className="flex items-center text-amber-600 text-sm">
                <AlertTriangle className="mr-2 h-4 w-4" />
                Warning: Budget utilization is {budgetUsagePercentage > 100 ? 'exceeded' : 'nearly exhausted'}
              </div>
            )}
          </div>
        </CardContent>
      </AnimatedCard>

      {/* Enhanced Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Enhanced Project Budget vs Spending Chart */}
        <AnimatedCard delay={0.5}>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="mr-2 h-5 w-5 text-primary" />
              Project Budget vs Spending
              {targetReleaseFilter !== "all" && (
                <Badge variant="outline" className="ml-2">
                  {targetReleaseFilter || "No Release"}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {targetReleaseFilter === "all"
                ? "Compare budgeted amounts with actual spending across all projects"
                : `Budget comparison for ${targetReleaseFilter || "No Release"} release projects`
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EnhancedBudgetChart data={projectChartData} />
          </CardContent>
        </AnimatedCard>

        {/* Enhanced Budget Distribution Chart */}
        <AnimatedCard delay={0.6}>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChart className="mr-2 h-5 w-5 text-primary" />
              Budget Distribution
              {targetReleaseFilter !== "all" && (
                <Badge variant="outline" className="ml-2">
                  {targetReleaseFilter || "No Release"}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {targetReleaseFilter === "all"
                ? "Current allocation of your total budget"
                : `Budget allocation for ${targetReleaseFilter || "No Release"} release`
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="relative">
            <EnhancedDistributionChart data={budgetStatusData} />
          </CardContent>
        </AnimatedCard>
      </div>

      {/* Project Summary with Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AnimatedCard delay={0.7}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="mr-2 h-5 w-5 text-primary" />
                Project Summary
                {targetReleaseFilter !== "all" && (
                  <Badge variant="outline" className="ml-2">
                    {targetReleaseFilter || "No Release"}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {targetReleaseFilter === "all"
                  ? "Quick overview of all active projects"
                  : `Project overview for ${targetReleaseFilter || "No Release"} release`
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredProjects.slice(0, 6).map((project, index) => {
                  const budget = parseFloat(project.totalBudget || "0");
                  const spent = parseFloat(project.actualCost || "0");
                  const usage = budget > 0 ? (spent / budget) * 100 : 0;
                  const isOverBudget = spent > budget;
                  
                  return (
                    <motion.div
                      key={project.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 + index * 0.1 }}
                      className="flex items-center justify-between p-4 rounded-lg border border-border bg-card/30 hover:bg-card/60 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-sm text-foreground truncate">
                            {project.name}
                          </h4>
                          <div className="flex items-center space-x-2 ml-2">
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
                            <Badge 
                              variant={isOverBudget ? "destructive" : usage > 80 ? "secondary" : "default"}
                              className="text-xs"
                            >
                              {isOverBudget ? "Over Budget" : usage > 80 ? "At Risk" : "On Track"}
                            </Badge>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{formatCurrency(spent)} spent</span>
                            <span>{formatCurrency(budget)} budget</span>
                          </div>
                          <AnimatedProgress 
                            value={Math.min(usage, 100)}
                            className="h-2"
                            color={usage > 90 ? "destructive" : usage > 75 ? "warning" : "default"}
                          />
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">{usage.toFixed(1)}% used</span>
                            <span className={`font-medium ${
                              isOverBudget ? 'text-red-600' : 
                              usage > 80 ? 'text-amber-600' : 
                              'text-emerald-600'
                            }`}>
                              {formatCurrency(budget - spent)} remaining
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
                {filteredProjects.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Target className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No projects found for the selected filter</p>
                  </div>
                )}
              </div>
            </CardContent>
          </AnimatedCard>
        </div>
        
        {/* Recent Activity Summary */}
        <AnimatedCard delay={0.8}>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="mr-2 h-5 w-5 text-primary" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Latest financial transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentCharges.map((charge, index) => {
                const project = projects?.find(p => p.id === charge.projectId);
                return (
                  <motion.div
                    key={charge.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.9 + index * 0.1 }}
                    className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/50 hover:bg-card/80 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {charge.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {project?.name || "Unknown Project"} • {new Date(charge.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right ml-2">
                      <p className="text-sm font-semibold text-foreground">
                        {formatCurrency(charge.amount)}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {charge.category || "General"}
                      </Badge>
                    </div>
                  </motion.div>
                );
              })}
              {recentCharges.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No recent activity</p>
                </div>
              )}
            </div>
          </CardContent>
        </AnimatedCard>
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