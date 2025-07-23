import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { useState } from "react";
import { 
  Plus, 
  Search, 
  Folder, 
  Edit,
  Eye,
  Trash2,
  Calendar,
  DollarSign,
  TrendingUp,
  CreditCard,
  X,
  AlertTriangle
} from "lucide-react";
import type { Project, ChargeHistory } from "@shared/schema";
import ProjectModal from "@/components/modals/project-modal";
import { format } from "date-fns";

export default function Projects() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | undefined>(undefined);
  const [viewingProject, setViewingProject] = useState<Project | undefined>(undefined);
  const [isDetailViewOpen, setIsDetailViewOpen] = useState(false);

  const { data: projects, isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  // Fetch charge history for the viewing project
  const { data: chargeHistory = [] } = useQuery<ChargeHistory[]>({
    queryKey: ["/api/projects", viewingProject?.id, "charge-history"],
    enabled: !!viewingProject?.id,
  });

  const filteredProjects = projects?.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.businessUnit?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF'
    }).format(Number(amount));
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'completed': return 'secondary';
      case 'on-hold': return 'outline';
      default: return 'default';
    }
  };

  const handleViewProject = (project: Project) => {
    setViewingProject(project);
    setIsDetailViewOpen(true);
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setIsProjectModalOpen(true);
  };

  const calculateBudgetUsage = (totalBudget: string, actualCost: string) => {
    const budget = parseFloat(totalBudget || "0");
    const spent = parseFloat(actualCost || "0");
    if (budget === 0) return 0;
    return Math.min((spent / budget) * 100, 100);
  };

  const getRemainingBudget = (totalBudget: string, actualCost: string) => {
    const budget = parseFloat(totalBudget || "0");
    const spent = parseFloat(actualCost || "0");
    return budget - spent;
  };

  const getTotalChargesForProject = (projectId: number) => {
    return chargeHistory
      .filter(charge => charge.projectId === projectId)
      .reduce((total, charge) => total + parseFloat(charge.amount || "0"), 0);
  };

  return (
    <>
      <header className="bg-white border-b border-neutral-20 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Projects</h2>
            <p className="text-sm text-muted-foreground">Manage your financial projects</p>
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
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            </div>
            <Button onClick={() => {
              setEditingProject(undefined);
              setIsProjectModalOpen(true);
            }}>
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <Skeleton className="w-10 h-10 rounded-lg mr-3" />
                      <div>
                        <Skeleton className="h-5 w-32 mb-1" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                    <Skeleton className="h-6 w-16" />
                  </div>
                  <Skeleton className="h-4 w-full mb-4" />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Skeleton className="h-3 w-12 mb-1" />
                      <Skeleton className="h-5 w-20" />
                    </div>
                    <div>
                      <Skeleton className="h-3 w-16 mb-1" />
                      <Skeleton className="h-5 w-16" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-12">
            <Folder className="mx-auto h-12 w-12 text-neutral-50 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No projects found</h3>
            <p className="text-neutral-50 mb-6">
              {searchTerm ? "No projects match your search criteria." : "Create your first project to get started."}
            </p>
            <Button onClick={() => {
              setEditingProject(undefined);
              setIsProjectModalOpen(true);
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Create Project
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <Card key={project.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mr-3">
                        <Folder className="text-primary h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{project.name}</h3>
                        <p className="text-sm text-muted-foreground">{project.businessUnit || "No business unit"}</p>
                      </div>
                    </div>
                    <Badge variant={getStatusVariant(project.status)}>
                      {project.status}
                    </Badge>
                  </div>
                  
                  <div className="text-sm text-muted-foreground mb-4">
                    <p><strong>Project ID:</strong> {project.projectId || "Not set"}</p>
                    <p><strong>WBS:</strong> {project.wbs || "Not set"}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Total Budget</p>
                      <p className="font-semibold">{formatCurrency(project.totalBudget)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Actual Cost</p>
                      <p className="font-semibold">{formatCurrency(project.actualCost || 0)}</p>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    {(() => {
                      const totalBudget = parseFloat(project.totalBudget);
                      const actualCost = parseFloat(project.actualCost || "0");
                      const remainingBudget = totalBudget - actualCost;
                      const isOverBudget = remainingBudget < 0;
                      
                      console.log(`Project ${project.name}: Budget=${totalBudget}, Actual=${actualCost}, Remaining=${remainingBudget}`);
                      
                      return (
                        <div className={`text-sm px-3 py-2 rounded ${
                          isOverBudget 
                            ? 'bg-red-50 text-red-700 border border-red-200' 
                            : 'bg-green-50 text-green-700 border border-green-200'
                        }`}>
                          <span className="font-medium">
                            {isOverBudget ? 'Over Budget: ' : 'Remaining: '}
                            {formatCurrency(Math.abs(remainingBudget))}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-neutral-20">
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setEditingProject(project);
                          setIsProjectModalOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleViewProject(project)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-neutral-50">
                      Updated {new Date(project.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => {
          setIsProjectModalOpen(false);
          setEditingProject(undefined);
        }}
        project={editingProject}
      />

      {/* Detailed Project View Modal */}
      <Dialog open={isDetailViewOpen} onOpenChange={setIsDetailViewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mr-4">
                  <Folder className="text-primary h-6 w-6" />
                </div>
                <div>
                  <DialogTitle className="text-2xl">{viewingProject?.name}</DialogTitle>
                  <DialogDescription className="text-lg">
                    {viewingProject?.businessUnit || "No business unit specified"}
                  </DialogDescription>
                </div>
              </div>
              <Badge variant={getStatusVariant(viewingProject?.status || "active")} className="text-sm px-3 py-1">
                {viewingProject?.status}
              </Badge>
            </div>
          </DialogHeader>

          {viewingProject && (
            <div className="space-y-6">
              {/* Project Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="mr-2 h-5 w-5" />
                    Project Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Project ID</label>
                        <p className="text-lg">{viewingProject.projectId || "Not specified"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">WBS Code</label>
                        <p className="text-lg">{viewingProject.wbs || "Not specified"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Target Release</label>
                        <p className="text-lg">{viewingProject.targetRelease || "Not specified"}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Total PDs</label>
                        <p className="text-lg">{viewingProject.totalPds || "Not specified"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">External PDs</label>
                        <p className="text-lg">{viewingProject.totalExternalPds || "Not specified"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Created</label>
                        <p className="text-lg">{format(new Date(viewingProject.createdAt), "MMM dd, yyyy")}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Budget Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <DollarSign className="mr-2 h-5 w-5" />
                    Budget Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {formatCurrency(viewingProject.totalBudget)}
                      </div>
                      <div className="text-sm text-blue-600 font-medium">Total Budget</div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">
                        {formatCurrency(viewingProject.actualCost || "0")}
                      </div>
                      <div className="text-sm text-orange-600 font-medium">Actual Cost</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className={`text-2xl font-bold ${
                        getRemainingBudget(viewingProject.totalBudget, viewingProject.actualCost || "0") < 0 
                          ? "text-red-600" 
                          : "text-green-600"
                      }`}>
                        {formatCurrency(Math.abs(getRemainingBudget(viewingProject.totalBudget, viewingProject.actualCost || "0")))}
                      </div>
                      <div className={`text-sm font-medium ${
                        getRemainingBudget(viewingProject.totalBudget, viewingProject.actualCost || "0") < 0 
                          ? "text-red-600" 
                          : "text-green-600"
                      }`}>
                        {getRemainingBudget(viewingProject.totalBudget, viewingProject.actualCost || "0") < 0 
                          ? "Over Budget" 
                          : "Remaining"}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Budget Usage</span>
                      <span>{calculateBudgetUsage(viewingProject.totalBudget, viewingProject.actualCost || "0").toFixed(1)}%</span>
                    </div>
                    <Progress 
                      value={calculateBudgetUsage(viewingProject.totalBudget, viewingProject.actualCost || "0")} 
                      className="h-3"
                    />
                    {calculateBudgetUsage(viewingProject.totalBudget, viewingProject.actualCost || "0") > 90 && (
                      <div className="flex items-center text-amber-600 text-sm">
                        <AlertTriangle className="mr-1 h-4 w-4" />
                        Budget is nearly exhausted
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Charge History */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CreditCard className="mr-2 h-5 w-5" />
                    Charge History
                  </CardTitle>
                  <CardDescription>
                    Complete record of all expenses and costs for this project
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {chargeHistory.length === 0 ? (
                    <div className="text-center py-8">
                      <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-semibold text-gray-900">No charges recorded</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        No expenses have been recorded for this project yet.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="text-center p-3 bg-slate-50 rounded-lg">
                          <div className="text-lg font-bold text-slate-600">
                            {chargeHistory.length}
                          </div>
                          <div className="text-sm text-slate-600">Total Charges</div>
                        </div>
                        <div className="text-center p-3 bg-purple-50 rounded-lg">
                          <div className="text-lg font-bold text-purple-600">
                            {formatCurrency(getTotalChargesForProject(viewingProject.id))}
                          </div>
                          <div className="text-sm text-purple-600">Total Amount</div>
                        </div>
                        <div className="text-center p-3 bg-indigo-50 rounded-lg">
                          <div className="text-lg font-bold text-indigo-600">
                            {format(new Date(chargeHistory[0]?.date), "MMM dd")}
                          </div>
                          <div className="text-sm text-indigo-600">Latest Charge</div>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead>Category</TableHead>
                              <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {chargeHistory.map((charge) => (
                              <TableRow key={charge.id}>
                                <TableCell>
                                  {format(new Date(charge.date), "MMM dd, yyyy")}
                                </TableCell>
                                <TableCell className="max-w-xs">
                                  <div className="truncate" title={charge.description}>
                                    {charge.description}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline">
                                    {charge.category || "General"}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right font-mono">
                                  {formatCurrency(charge.amount)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsDetailViewOpen(false)}>
                  Close
                </Button>
                <Button onClick={() => {
                  setIsDetailViewOpen(false);
                  handleEditProject(viewingProject);
                }}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Project
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
