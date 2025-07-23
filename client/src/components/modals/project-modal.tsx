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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertProjectSchema, type Project } from "@shared/schema";

const formSchema = insertProjectSchema.extend({
  totalBudget: z.string().min(1, "Budget is required"),
  startDate: z.string().optional(),
  client: z.string().optional(),
  description: z.string().optional(),
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
  const [open, setOpen] = useState(false);

  // Fetch Excel project names
  const { data: excelProjectNames } = useQuery<string[]>({
    queryKey: ["/api/excel-project-names"],
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
      console.log("Project mutation success - invalidating caches");
      // Force refetch of projects and dashboard data
      await queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      // Also refetch to ensure fresh data
      await queryClient.refetchQueries({ queryKey: ["/api/projects"] });
      await queryClient.refetchQueries({ queryKey: ["/api/dashboard/metrics"] });
      console.log("Cache invalidation and refetch complete");
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{project ? "Edit Project" : "Create New Project"}</DialogTitle>
        </DialogHeader>
        
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
                      <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={open}
                            className="w-full justify-between"
                          >
                            {field.value
                              ? field.value
                              : "Select or enter project name..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput 
                              placeholder="Search or type new project name..." 
                              onValueChange={(value) => {
                                field.onChange(value);
                              }}
                            />
                            <CommandList>
                              <CommandEmpty>
                                <div className="p-2">
                                  <p className="text-sm text-muted-foreground mb-2">
                                    No matching projects found.
                                  </p>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="w-full"
                                    onClick={() => {
                                      setOpen(false);
                                    }}
                                  >
                                    Use current input
                                  </Button>
                                </div>
                              </CommandEmpty>
                              {excelProjectNames && excelProjectNames.length > 0 && (
                                <CommandGroup heading="From Excel Data">
                                  {excelProjectNames.map((projectName) => (
                                    <CommandItem
                                      key={projectName}
                                      value={projectName}
                                      onSelect={(currentValue) => {
                                        field.onChange(currentValue);
                                        populateFromExcel(currentValue);
                                        setOpen(false);
                                      }}
                                    >
                                      <Check
                                        className={`mr-2 h-4 w-4 ${
                                          field.value === projectName ? "opacity-100" : "opacity-0"
                                        }`}
                                      />
                                      {projectName}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              )}
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
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
                      <Input placeholder="Enter project ID" {...field} value={field.value || ""} />
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
                      <FormLabel>Actual Cost Spent</FormLabel>
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
                      <Input placeholder="Enter business unit" {...field} value={field.value || ""} />
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
                      <Input placeholder="Enter project ID" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="wbs"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>WBS</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter WBS code" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="targetRelease"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Release</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter target release" {...field} value={field.value || ""} />
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
                      <Input placeholder="Enter total PDs" {...field} value={field.value || ""} />
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
                      <Input placeholder="Enter total external PDs" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="flex justify-end space-x-4 pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting 
                  ? (project ? "Updating..." : "Creating...") 
                  : (project ? "Update Project" : "Create Project")
                }
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
