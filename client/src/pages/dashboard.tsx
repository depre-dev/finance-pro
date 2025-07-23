import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { 
  BarChart3, 
  Calculator, 
  DollarSign, 
  Folder, 
  Plus, 
  Search, 
  AlertTriangle,
  Edit,
  Eye,
  ChevronRight,
  FileText,
  Upload,
  PlusCircle
} from "lucide-react";
import type { Project } from "@shared/schema";
import BudgetOverviewChart from "@/components/charts/budget-overview-chart";
import ProjectModal from "@/components/modals/project-modal";
import FinancialRecordModal from "@/components/modals/financial-record-modal";

interface DashboardMetrics {
  activeProjects: number;
  totalBudget: string;
  monthlySpent: string;
  overBudgetProjects: number;
}

export default function Dashboard() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isFinancialModalOpen, setIsFinancialModalOpen] = useState(false);

  const { data: metrics, isLoading: metricsLoading } = useQuery<DashboardMetrics>({
    queryKey: ["/api/dashboard/metrics"],
  });

  const { data: projects, isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const filteredProjects = projects?.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.client?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF'
    }).format(Number(amount));
  };

  const getProjectStatus = (project: Project) => {
    // This would normally calculate from financial records
    const budget = Number(project.totalBudget);
    const spent = budget * 0.7; // Mock calculation
    const remaining = budget - spent;
    
    if (remaining < 0) return { status: "Over Budget", variant: "destructive" as const };
    if (spent / budget > 0.8) return { status: "At Risk", variant: "secondary" as const };
    return { status: "On Track", variant: "default" as const };
  };

  const quickActions = [
    {
      icon: PlusCircle,
      title: "Add Expense",
      description: "Record a new expense",
      color: "text-primary",
      onClick: () => setIsFinancialModalOpen(true)
    },
    {
      icon: Calculator,
      title: "Create Budget",
      description: "Set up budget categories",
      color: "text-success",
      onClick: () => toast({ title: "Feature coming soon" })
    },
    {
      icon: FileText,
      title: "Generate Report",
      description: "Export financial report",
      color: "text-warning",
      onClick: () => toast({ title: "Feature coming soon" })
    },
    {
      icon: Upload,
      title: "Import Data",
      description: "Upload financial data",
      color: "text-error",
      onClick: () => toast({ title: "Feature coming soon" })
    }
  ];

  return (
    <>
      <header className="bg-white border-b border-neutral-20 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Dashboard</h2>
            <p className="text-sm text-neutral-50">Overview of your financial projects and budgets</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Input
                type="search"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-50 h-4 w-4" />
            </div>
            <Button onClick={() => setIsProjectModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Folder className="h-6 w-6 text-primary" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-neutral-50">Active Projects</p>
                  {metricsLoading ? (
                    <Skeleton className="h-8 w-12" />
                  ) : (
                    <p className="text-2xl font-semibold text-foreground">{metrics?.activeProjects || 0}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-success/10 rounded-lg">
                  <DollarSign className="h-6 w-6 text-success" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-neutral-50">Total Budget</p>
                  {metricsLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    <p className="text-2xl font-semibold text-foreground">
                      {formatCurrency(metrics?.totalBudget || 0)}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-warning/10 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-warning" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-neutral-50">Spent This Month</p>
                  {metricsLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    <p className="text-2xl font-semibold text-foreground">
                      {formatCurrency(metrics?.monthlySpent || 0)}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-destructive/10 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-neutral-50">Over Budget</p>
                  {metricsLoading ? (
                    <Skeleton className="h-8 w-12" />
                  ) : (
                    <p className="text-2xl font-semibold text-foreground">{metrics?.overBudgetProjects || 0}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Budget Overview Chart */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-foreground">Budget Overview</h3>
                  <Select defaultValue="6months">
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="6months">Last 6 months</SelectItem>
                      <SelectItem value="year">Last year</SelectItem>
                      <SelectItem value="thisyear">This year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <BudgetOverviewChart />
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-6">Quick Actions</h3>
              <div className="space-y-4">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={action.onClick}
                    className="w-full flex items-center justify-between p-3 border border-neutral-20 rounded-lg hover:bg-neutral-10 transition-colors"
                  >
                    <div className="flex items-center">
                      <action.icon className={`${action.color} mr-3 h-5 w-5`} />
                      <span className="text-sm font-medium">{action.title}</span>
                    </div>
                    <ChevronRight className="text-neutral-50 h-4 w-4" />
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Projects Table */}
        <Card>
          <CardContent className="p-0">
            <div className="px-6 py-4 border-b border-neutral-20">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">Recent Projects</h3>
                <Button variant="link" className="text-primary">View All</Button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-10">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-50 uppercase tracking-wider">
                      Project
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-50 uppercase tracking-wider">
                      Budget
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-50 uppercase tracking-wider">
                      Spent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-50 uppercase tracking-wider">
                      Remaining
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-50 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-50 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-20">
                  {projectsLoading ? (
                    Array.from({ length: 3 }).map((_, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <Skeleton className="w-8 h-8 rounded-lg mr-3" />
                            <div>
                              <Skeleton className="h-4 w-32 mb-1" />
                              <Skeleton className="h-3 w-24" />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4"><Skeleton className="h-4 w-16" /></td>
                        <td className="px-6 py-4"><Skeleton className="h-4 w-16" /></td>
                        <td className="px-6 py-4"><Skeleton className="h-4 w-16" /></td>
                        <td className="px-6 py-4"><Skeleton className="h-6 w-20" /></td>
                        <td className="px-6 py-4"><Skeleton className="h-4 w-12" /></td>
                      </tr>
                    ))
                  ) : filteredProjects.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-neutral-50">
                        No projects found. Create your first project to get started.
                      </td>
                    </tr>
                  ) : (
                    filteredProjects.slice(0, 5).map((project) => {
                      const budget = Number(project.totalBudget);
                      const spent = budget * 0.7; // Mock calculation
                      const remaining = budget - spent;
                      const statusInfo = getProjectStatus(project);

                      return (
                        <tr key={project.id} className="hover:bg-neutral-10">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mr-3">
                                <Folder className="text-primary h-4 w-4" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-foreground">{project.name}</div>
                                <div className="text-sm text-neutral-50">{project.client || "No client"}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                            {formatCurrency(budget)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                            {formatCurrency(spent)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={remaining < 0 ? "text-destructive" : "text-foreground"}>
                              {formatCurrency(remaining)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant={statusInfo.variant}>{statusInfo.status}</Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
      />

      <FinancialRecordModal
        isOpen={isFinancialModalOpen}
        onClose={() => setIsFinancialModalOpen(false)}
      />
    </>
  );
}
