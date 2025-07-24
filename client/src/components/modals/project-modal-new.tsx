import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, FileText, Plus, Filter } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertProjectSchema, type Project } from "@shared/schema";

const formSchema = insertProjectSchema.extend({
  totalBudget: z.string().min(1, "Budget is required"),
}).omit({
  userId: true,
});

type FormData = z.infer<typeof formSchema>;

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project?: Project;
}

export default function ProjectModal({ isOpen, onClose, project }: ProjectModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRelease, setSelectedRelease] = useState("");

  // Fetch Excel project names and existing projects
  const { data: excelProjectNames } = useQuery<string[]>({
    queryKey: ["/api/excel-project-names"],
  });

  const { data: existingProjects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  // Get Excel project data for organizing by release
  const [excelProjectsData, setExcelProjectsData] = useState<any[]>([]);

  useEffect(() => {
    const fetchExcelData = async () => {
      if (!excelProjectNames?.length) return;
      
      const dataPromises = excelProjectNames.map(async (name) => {
        try {
          const response = await fetch(`/api/excel-project-data/${encodeURIComponent(name)}`);
          if (response.ok) {
            const data = await response.json();
            return { ...data, projectName: name };
          }
        } catch (error) {
          console.error(`Failed to fetch data for ${name}:`, error);
        }
        return null;
      });
      
      const results = await Promise.all(dataPromises);
      setExcelProjectsData(results.filter(Boolean));
    };

    fetchExcelData();
  }, [excelProjectNames]);

  // Group Excel projects by target release
  const projectsByRelease = excelProjectsData.reduce((acc, project) => {
    const release = project["Target Release"] || "No Release";
    if (!acc[release]) acc[release] = [];
    acc[release].push(project);
    return acc;
  }, {} as Record<string, any[]>);

  // Get unique releases for filter
  const availableReleases = Object.keys(projectsByRelease).sort();

  // Filter projects based on search and selected release
  const filteredExcelProjects = excelProjectsData.filter(project => {
    const matchesSearch = !searchTerm || 
      project.Name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project["Project ID"]?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project["Business Unit"]?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRelease = !selectedRelease || 
      selectedRelease === "all" || 
      (project["Target Release"] || "No Release") === selectedRelease;
    
    // Check if project already exists
    const alreadyExists = existingProjects?.some(p => 
      p.name === project.Name || p.projectId === project["Project ID"]
    );
    
    return matchesSearch && matchesRelease && !alreadyExists;
  });

  // Function to populate form with Excel data
  const populateFromExcel = async (projectName: string) => {
    try {
      const response = await fetch(`/api/excel-project-data/${encodeURIComponent(projectName)}`);
      if (response.ok) {
        const excelData = await response.json();
        if (excelData) {
          // Auto-populate form fields with Excel data
          form.setValue("name", excelData.Name || "");
          form.setValue("projectId", excelData["Project ID"] || "");
          form.setValue("businessUnit", excelData["Business Unit"] || "");
          form.setValue("wbs", excelData.WBS || "");
          form.setValue("totalBudget", excelData["Total Budget (CHF)"] || "");
          form.setValue("totalPds", excelData["Total PDs"] || "");
          form.setValue("totalExternalPds", excelData["Total External PDs"] || "");
          form.setValue("targetRelease", excelData["Target Release"] || "");
          form.setValue("actualCost", project?.actualCost || "0");
          
          // Switch to manual tab after populating
          setTimeout(() => {
            const manualTab = document.querySelector('[value="manual"]') as HTMLElement;
            if (manualTab) manualTab.click();
          }, 100);
        }
      }
    } catch (error) {
      console.error("Failed to fetch Excel project data:", error);
    }
  };

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: project?.name || "",
      projectId: project?.projectId || "",
      businessUnit: project?.businessUnit || "",
      wbs: project?.wbs || "",
      totalBudget: project?.totalBudget || "",
      totalPds: project?.totalPds || "",
      totalExternalPds: project?.totalExternalPds || "",
      targetRelease: project?.targetRelease || "",
      actualCost: project?.actualCost || "0",
      status: project?.status || "active",
    },
  });

  // Update form values when project prop changes
  useEffect(() => {
    if (project) {
      form.reset({
        name: project.name || "",
        projectId: project.projectId || "",
        businessUnit: project.businessUnit || "",
        wbs: project.wbs || "",
        totalBudget: project.totalBudget || "",
        totalPds: project.totalPds || "",
        totalExternalPds: project.totalExternalPds || "",
        targetRelease: project.targetRelease || "",
        actualCost: project.actualCost || "0",
        status: project.status || "active",
      });
    } else {
      form.reset({
        name: "",
        projectId: "",
        businessUnit: "",
        wbs: "",
        totalBudget: "",
        totalPds: "",
        totalExternalPds: "",
        targetRelease: "",
        actualCost: "0",
        status: "active",
      });
    }
  }, [project, form]);

  const saveProjectMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const projectData = {
        ...data,
        totalBudget: data.totalBudget,
      };
      
      const method = project ? "PUT" : "POST";
      const url = project ? `/api/projects/${project.id}` : "/api/projects";
      const response = await apiRequest(method, url, projectData);
      return response.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      await queryClient.refetchQueries({ queryKey: ["/api/projects"] });
      await queryClient.refetchQueries({ queryKey: ["/api/dashboard/metrics"] });
      toast({
        title: "Success",
        description: project ? "Project updated successfully" : "Project created successfully",
      });
      form.reset();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || (project ? "Failed to update project" : "Failed to create project"),
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      await saveProjectMutation.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{project ? "Edit Project" : "Create New Project"}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue={project ? "manual" : "excel"} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="excel" className="flex items-center">
              <FileText className="mr-2 h-4 w-4" />
              From Excel Data
            </TabsTrigger>
            <TabsTrigger value="manual" className="flex items-center">
              <Plus className="mr-2 h-4 w-4" />
              Manual Entry
            </TabsTrigger>
          </TabsList>

          <TabsContent value="excel" className="space-y-4">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search projects by name, ID, or business unit..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Select value={selectedRelease} onValueChange={setSelectedRelease}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Filter by Release" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Releases</SelectItem>
                    {availableReleases.map(release => (
                      <SelectItem key={release} value={release}>
                        {release}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Summary stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">{filteredExcelProjects.length}</div>
                    <p className="text-sm text-muted-foreground">Available Projects</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">{availableReleases.length}</div>
                    <p className="text-sm text-muted-foreground">Target Releases</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">{excelProjectsData.length - filteredExcelProjects.length}</div>
                    <p className="text-sm text-muted-foreground">Already Created</p>
                  </CardContent>
                </Card>
              </div>

              {/* Project listings grouped by release */}
              <div className="space-y-6 max-h-96 overflow-y-auto">
                {selectedRelease && selectedRelease !== "all" ? (
                  // Show projects for selected release
                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center">
                      <Badge variant="outline" className="mr-2">{selectedRelease}</Badge>
                      {filteredExcelProjects.length} projects
                    </h3>
                    <div className="grid gap-3">
                      {filteredExcelProjects.map((project, index) => (
                        <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer" 
                              onClick={() => populateFromExcel(project.projectName)}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium">{project.Name}</h4>
                                <p className="text-sm text-muted-foreground">{project["Project ID"]}</p>
                                <p className="text-sm text-muted-foreground">{project["Business Unit"]}</p>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-bold text-green-600">
                                  {project["Total Budget (CHF)"] ? `CHF ${Number(project["Total Budget (CHF)"]).toLocaleString()}` : "N/A"}
                                </div>
                                <Badge variant="secondary">{project["Target Release"] || "No Release"}</Badge>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ) : (
                  // Show projects grouped by release
                  Object.entries(projectsByRelease)
                    .filter(([release, projects]) => 
                      projects.some(p => filteredExcelProjects.includes(p))
                    )
                    .map(([release, projects]) => {
                      const releaseFilteredProjects = projects.filter(p => filteredExcelProjects.includes(p));
                      return (
                        <div key={release}>
                          <h3 className="font-semibold text-lg mb-3 flex items-center">
                            <Badge variant="outline" className="mr-2">{release}</Badge>
                            {releaseFilteredProjects.length} projects
                          </h3>
                          <div className="grid gap-3">
                            {releaseFilteredProjects.map((project, index) => (
                              <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer" 
                                    onClick={() => populateFromExcel(project.projectName)}>
                                <CardContent className="p-4">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <h4 className="font-medium">{project.Name}</h4>
                                      <p className="text-sm text-muted-foreground">{project["Project ID"]}</p>
                                      <p className="text-sm text-muted-foreground">{project["Business Unit"]}</p>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-lg font-bold text-green-600">
                                        {project["Total Budget (CHF)"] ? `CHF ${Number(project["Total Budget (CHF)"]).toLocaleString()}` : "N/A"}
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      );
                    })
                )}

                {filteredExcelProjects.length === 0 && (
                  <div className="text-center py-8">
                    <Filter className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
                    <p className="text-gray-500">
                      {searchTerm || selectedRelease 
                        ? "Try adjusting your search or filter criteria."
                        : "No Excel projects available or all have been created."}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="manual">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Name *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter project name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="projectId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project ID</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., 34321" value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="totalBudget"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Budget *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">CHF</span>
                            <Input 
                              type="number" 
                              min="0" 
                              step="0.01"
                              className="pl-12"
                              placeholder="0.00" 
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="actualCost"
                    render={({ field }) => {
                      const totalBudget = parseFloat(form.watch("totalBudget") || "0");
                      const actualCost = parseFloat(field.value || "0");
                      const remainingBudget = totalBudget - actualCost;
                      const isOverBudget = remainingBudget < 0;
                      
                      return (
                        <FormItem>
                          <FormLabel>Budget Spend</FormLabel>
                          <FormControl>
                            <div className="space-y-2">
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">CHF</span>
                                <Input 
                                  type="number" 
                                  min="0" 
                                  step="0.01"
                                  className="pl-12"
                                  placeholder="0.00" 
                                  {...field} 
                                  value={field.value || "0"}
                                />
                              </div>
                              {totalBudget > 0 && (
                                <div className={`text-sm px-3 py-1 rounded ${
                                  isOverBudget 
                                    ? 'bg-red-50 text-red-700 border border-red-200' 
                                    : 'bg-green-50 text-green-700 border border-green-200'
                                }`}>
                                  <span className="font-medium">
                                    {isOverBudget ? 'Over Budget: ' : 'Remaining: '}
                                    CHF {Math.abs(remainingBudget).toFixed(2)}
                                  </span>
                                </div>
                              )}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="businessUnit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Unit</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., Consumer" value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="wbs"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>WBS</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., A-008443-008152-102" value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="totalPds"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total PDs</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., 10" value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="totalExternalPds"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total External PDs</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., 5" value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="targetRelease"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Release</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., 25.3" value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <FormControl>
                          <select {...field} className="w-full border border-gray-300 rounded-md px-3 py-2">
                            <option value="active">Active</option>
                            <option value="completed">Completed</option>
                            <option value="on-hold">On Hold</option>
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Saving..." : (project ? "Update Project" : "Create Project")}
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}