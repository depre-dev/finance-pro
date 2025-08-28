import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Calendar, Filter, DollarSign, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { ChargeHistory, Project } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

const chargeFormSchema = z.object({
  projectId: z.string().min(1, "Project is required"),
  amount: z.string().min(1, "Amount is required"),
  description: z.string().min(1, "Description is required"),
  category: z.string().optional(),
  date: z.string().optional(),
});

type ChargeFormData = z.infer<typeof chargeFormSchema>;

export default function ChargeHistoryPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch all charge history
  const { data: chargeHistory = [], isLoading } = useQuery<ChargeHistory[]>({
    queryKey: ["/api/charge-history"],
  });

  // Fetch projects for dropdown
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  // Create charge mutation
  const createChargeMutation = useMutation({
    mutationFn: (data: ChargeFormData) => 
      apiRequest("POST", "/api/charge-history", {
        ...data,
        projectId: parseInt(data.projectId),
        amount: data.amount,
        date: data.date ? new Date(data.date) : new Date(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/charge-history"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard-metrics"] });
      setIsDialogOpen(false);
      form.reset();
    },
  });

  const form = useForm<ChargeFormData>({
    resolver: zodResolver(chargeFormSchema),
    defaultValues: {
      projectId: "",
      amount: "",
      description: "",
      category: "General",
      date: new Date().toISOString().split('T')[0],
    },
  });

  const onSubmit = (data: ChargeFormData) => {
    createChargeMutation.mutate(data);
  };

  // Filter charges based on selected project and search term
  const filteredCharges = chargeHistory.filter(charge => {
    const matchesProject = selectedProject === "all" || charge.projectId.toString() === selectedProject;
    const matchesSearch = charge.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         charge.category?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesProject && matchesSearch;
  });

  // Calculate totals
  const totalCharges = filteredCharges.reduce((sum, charge) => sum + parseFloat(charge.amount || "0"), 0);

  // Get project name by ID
  const getProjectName = (projectId: number) => {
    const project = projects.find(p => p.id === projectId);
    return project?.name || `Project ${projectId}`;
  };

  // Get project by ID
  const getProject = (projectId: number) => {
    return projects.find(p => p.id === projectId);
  };

  // Calculate running budget totals for each charge
  const getRunningTotals = () => {
    let runningTotals: { [key: number]: number } = {};
    
    // Sort charges by date
    const sortedCharges = [...filteredCharges].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    sortedCharges.forEach(charge => {
      if (!runningTotals[charge.projectId]) {
        runningTotals[charge.projectId] = 0;
      }
      runningTotals[charge.projectId] += parseFloat(charge.amount || "0");
    });
    
    return runningTotals;
  };

  // Calculate cumulative spending for display
  const calculateCumulativeSpending = (charges: typeof filteredCharges) => {
    const sortedCharges = [...charges].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    let cumulativeByProject: { [key: number]: number } = {};
    
    return sortedCharges.map(charge => {
      if (!cumulativeByProject[charge.projectId]) {
        cumulativeByProject[charge.projectId] = 0;
      }
      cumulativeByProject[charge.projectId] += parseFloat(charge.amount || "0");
      
      const project = getProject(charge.projectId);
      const totalBudget = parseFloat(project?.totalBudget || "0");
      const remainingBudget = totalBudget - cumulativeByProject[charge.projectId];
      
      return {
        ...charge,
        cumulativeSpending: cumulativeByProject[charge.projectId],
        remainingBudget,
        budgetUsagePercent: totalBudget > 0 ? (cumulativeByProject[charge.projectId] / totalBudget) * 100 : 0
      };
    });
  };

  const chargesWithBudgetInfo = calculateCumulativeSpending(filteredCharges);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading charge history...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-shrink-0 pb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Charge History</h1>
            <p className="text-muted-foreground">Track all expenses and costs across your projects</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Charge
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Charge</DialogTitle>
              <DialogDescription>
                Record a new expense or cost for a project.
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
                            {projects.map((project) => (
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
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount (CHF)</FormLabel>
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
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the expense or cost..."
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Hardware, Software, Consulting"
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createChargeMutation.isPending}>
                    {createChargeMutation.isPending ? "Adding..." : "Add Charge"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto space-y-6">
        {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Charges</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredCharges.length}</div>
            <p className="text-xs text-muted-foreground">
              {selectedProject === "all" ? "All projects" : "Selected project"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">CHF {totalCharges.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Combined expenses
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Latest Charge</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredCharges.length > 0 
                ? format(new Date(filteredCharges[0].date), "MMM dd")
                : "None"
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Most recent entry
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search descriptions and categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All projects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id.toString()}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Charge History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Charge History</CardTitle>
          <CardDescription>
            Complete record of all expenses and costs
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredCharges.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No charges found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {chargeHistory.length === 0 
                  ? "Get started by adding your first charge."
                  : "Try adjusting your filters to see more results."
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Cumulative</TableHead>
                    <TableHead className="text-right">Budget Remaining</TableHead>
                    <TableHead className="text-center">Usage %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {chargesWithBudgetInfo.map((charge) => (
                    <TableRow key={charge.id}>
                      <TableCell>
                        {format(new Date(charge.date), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell className="font-medium">
                        {getProjectName(charge.projectId)}
                      </TableCell>
                      <TableCell>{charge.description}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {charge.category || "General"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        CHF {parseFloat(charge.amount || "0").toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        <div className="flex flex-col">
                          <span className="text-blue-600 font-semibold">
                            CHF {charge.cumulativeSpending.toLocaleString()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        <div className={`flex flex-col ${charge.remainingBudget < 0 ? 'text-red-600' : 'text-green-600'}`}>
                          <span className="font-semibold">
                            CHF {Math.abs(charge.remainingBudget).toLocaleString()}
                          </span>
                          <span className="text-xs">
                            {charge.remainingBudget < 0 ? 'Over Budget' : 'Remaining'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center">
                          <span className={`text-sm font-medium ${
                            charge.budgetUsagePercent > 100 ? 'text-red-600' : 
                            charge.budgetUsagePercent > 90 ? 'text-amber-600' : 'text-green-600'
                          }`}>
                            {charge.budgetUsagePercent.toFixed(1)}%
                          </span>
                          <div className="w-16 h-1 bg-gray-200 rounded-full mt-1">
                            <div 
                              className={`h-1 rounded-full ${
                                charge.budgetUsagePercent > 100 ? 'bg-red-500' : 
                                charge.budgetUsagePercent > 90 ? 'bg-amber-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${Math.min(charge.budgetUsagePercent, 100)}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}