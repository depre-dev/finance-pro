import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calculator, 
  Plus, 
  PieChart, 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  CheckCircle,
  Target,
  Edit,
  Trash2,
  DollarSign
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Project, BudgetCategory } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

// Form schemas
const budgetCategorySchema = z.object({
  projectId: z.string().min(1, "Project is required"),
  name: z.string().min(1, "Category name is required"),
  budgetedAmount: z.string().min(1, "Budgeted amount is required"),
});

type BudgetCategoryFormData = z.infer<typeof budgetCategorySchema>;

export default function BudgetPlanning() {
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<BudgetCategory | null>(null);

  // Fetch projects and budget categories
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: budgetCategories = [] } = useQuery<BudgetCategory[]>({
    queryKey: ["/api/budget-categories"],
  });

  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: (data: BudgetCategoryFormData) => 
      apiRequest("/api/budget-categories", "POST", {
        ...data,
        projectId: parseInt(data.projectId),
        budgetedAmount: data.budgetedAmount,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budget-categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setIsCreateModalOpen(false);
      form.reset();
    },
  });

  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<BudgetCategoryFormData> }) =>
      apiRequest(`/api/budget-categories/${id}`, "PUT", {
        ...data,
        projectId: data.projectId ? parseInt(data.projectId) : undefined,
        budgetedAmount: data.budgetedAmount,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budget-categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setEditingCategory(null);
      form.reset();
    },
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/budget-categories/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budget-categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
    },
  });

  const form = useForm<BudgetCategoryFormData>({
    resolver: zodResolver(budgetCategorySchema),
    defaultValues: {
      projectId: "",
      name: "",
      budgetedAmount: "",
    },
  });

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF'
    }).format(Number(amount));
  };

  // Filter categories by selected project
  const filteredCategories = selectedProject === "all" 
    ? budgetCategories 
    : budgetCategories.filter(cat => cat.projectId.toString() === selectedProject);

  // Calculate summary metrics
  const totalBudgeted = filteredCategories.reduce((sum, cat) => sum + parseFloat(cat.budgetedAmount || "0"), 0);
  const totalActual = filteredCategories.reduce((sum, cat) => sum + parseFloat(cat.actualAmount || "0"), 0);
  const variance = totalBudgeted - totalActual;
  const variancePercentage = totalBudgeted > 0 ? (variance / totalBudgeted) * 100 : 0;

  // Prepare chart data
  const categoryChartData = filteredCategories.map(cat => ({
    name: cat.name,
    budgeted: parseFloat(cat.budgetedAmount || "0"),
    actual: parseFloat(cat.actualAmount || "0"),
    variance: parseFloat(cat.budgetedAmount || "0") - parseFloat(cat.actualAmount || "0"),
  }));

  const budgetDistributionData = filteredCategories.map((cat, index) => ({
    name: cat.name,
    value: parseFloat(cat.budgetedAmount || "0"),
    color: `hsl(${(index * 137.5) % 360}, 70%, 50%)`,
  }));

  const onSubmit = (data: BudgetCategoryFormData) => {
    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, data });
    } else {
      createCategoryMutation.mutate(data);
    }
  };

  const handleEdit = (category: BudgetCategory) => {
    setEditingCategory(category);
    form.reset({
      projectId: category.projectId.toString(),
      name: category.name,
      budgetedAmount: category.budgetedAmount,
    });
    setIsCreateModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
    setEditingCategory(null);
    form.reset();
  };

  return (
    <div className="flex-1 overflow-y-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Budget Planning</h2>
          <p className="text-muted-foreground">
            Plan, track, and analyze project budgets by category
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filter by Project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map(project => (
                <SelectItem key={project.id} value={project.id.toString()}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={isCreateModalOpen} onOpenChange={handleCloseModal}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Add Budget Category
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>
                  {editingCategory ? "Edit Budget Category" : "Create Budget Category"}
                </DialogTitle>
                <DialogDescription>
                  {editingCategory 
                    ? "Update the budget category details below."
                    : "Add a new budget category to track expenses by type."
                  }
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="projectId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a project" />
                            </SelectTrigger>
                            <SelectContent>
                              {projects.map(project => (
                                <SelectItem key={project.id} value={project.id.toString()}>
                                  {project.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Development, Consulting, Infrastructure" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="budgetedAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Budgeted Amount (CHF)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            placeholder="0.00" 
                            {...field} 
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button type="button" variant="outline" onClick={handleCloseModal}>
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
                    >
                      {editingCategory ? "Update" : "Create"} Category
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budgeted</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalBudgeted)}</div>
            <p className="text-xs text-muted-foreground">
              Across {filteredCategories.length} categories
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalActual)}</div>
            <p className="text-xs text-muted-foreground">
              {totalBudgeted > 0 ? `${((totalActual / totalBudgeted) * 100).toFixed(1)}% of budget` : "No budget set"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Variance</CardTitle>
            {variance >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(Math.abs(variance))}
            </div>
            <p className="text-xs text-muted-foreground">
              {variance >= 0 ? 'Under budget' : 'Over budget'} by {Math.abs(variancePercentage).toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Health</CardTitle>
            {variancePercentage >= -10 ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {variancePercentage >= -5 ? "Excellent" : 
               variancePercentage >= -10 ? "Good" : 
               variancePercentage >= -20 ? "Warning" : "Critical"}
            </div>
            <p className="text-xs text-muted-foreground">
              Budget compliance status
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Analysis */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analysis">Variance Analysis</TabsTrigger>
          <TabsTrigger value="categories">Manage Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Budget Distribution Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Budget Distribution</CardTitle>
                <CardDescription>
                  Breakdown of budgeted amounts by category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={budgetDistributionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {budgetDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Budget vs Actual Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Budget vs Actual</CardTitle>
                <CardDescription>
                  Comparison of budgeted vs actual spending by category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        angle={-45}
                        textAnchor="end"
                        height={100}
                        fontSize={12}
                      />
                      <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Legend />
                      <Bar dataKey="budgeted" fill="#3b82f6" name="Budgeted" />
                      <Bar dataKey="actual" fill="#f59e0b" name="Actual" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Variance Analysis</CardTitle>
              <CardDescription>
                Detailed breakdown of budget variances by category
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredCategories.map(category => {
                  const budgeted = parseFloat(category.budgetedAmount || "0");
                  const actual = parseFloat(category.actualAmount || "0");
                  const variance = budgeted - actual;
                  const variancePercent = budgeted > 0 ? (variance / budgeted) * 100 : 0;
                  const usage = budgeted > 0 ? (actual / budgeted) * 100 : 0;
                  
                  return (
                    <div key={category.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">{category.name}</h4>
                        <Badge variant={variance >= 0 ? "default" : "destructive"}>
                          {variance >= 0 ? "Under Budget" : "Over Budget"}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                        <div>
                          <p className="text-sm text-muted-foreground">Budgeted</p>
                          <p className="font-medium">{formatCurrency(budgeted)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Actual</p>
                          <p className="font-medium">{formatCurrency(actual)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Variance</p>
                          <p className={`font-medium ${variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(Math.abs(variance))}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">% Used</p>
                          <p className="font-medium">{usage.toFixed(1)}%</p>
                        </div>
                      </div>
                      
                      <Progress value={Math.min(usage, 100)} className="h-2" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Budget Categories</CardTitle>
              <CardDescription>
                Manage your budget categories and allocations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Budgeted</TableHead>
                    <TableHead>Actual</TableHead>
                    <TableHead>Variance</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCategories.map(category => {
                    const project = projects.find(p => p.id === category.projectId);
                    const budgeted = parseFloat(category.budgetedAmount || "0");
                    const actual = parseFloat(category.actualAmount || "0");
                    const variance = budgeted - actual;
                    
                    return (
                      <TableRow key={category.id}>
                        <TableCell className="font-medium">{category.name}</TableCell>
                        <TableCell>{project?.name || "Unknown"}</TableCell>
                        <TableCell>{formatCurrency(budgeted)}</TableCell>
                        <TableCell>{formatCurrency(actual)}</TableCell>
                        <TableCell>
                          <span className={variance >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {formatCurrency(Math.abs(variance))}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(category)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (confirm("Are you sure you want to delete this category?")) {
                                  deleteCategoryMutation.mutate(category.id);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
