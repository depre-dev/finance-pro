import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Download, 
  FileSpreadsheet, 
  CheckCircle, 
  User, 
  Building, 
  CalendarDays,
  DollarSign
} from "lucide-react";
import type { Project } from "@shared/schema";

interface RebookingExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedProjects?: number[];
}

interface RebookingData {
  currency: string;
  vendor: string;
  responsiblePerson: string;
  monthQuarter: number;
  voucherDescription: string;
  amount: number;
  pspElement: string;
  glAccount: number;
}

export default function RebookingExportModal({ 
  open, 
  onOpenChange,
  preselectedProjects = []
}: RebookingExportModalProps) {
  const [selectedProjectIds, setSelectedProjectIds] = useState<number[]>(preselectedProjects);
  const [responsiblePerson, setResponsiblePerson] = useState("Pascal Kuriger");
  const [vendor, setVendor] = useState("Infosys");
  const [description, setDescription] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  // Fetch all projects
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const selectedProjects = projects.filter(p => selectedProjectIds.includes(p.id));
  const totalSelectedBudget = selectedProjects.reduce((sum, p) => sum + parseFloat(p.totalBudget || "0"), 0);

  const handleProjectToggle = (projectId: number) => {
    setSelectedProjectIds(prev => 
      prev.includes(projectId) 
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };

  const handleSelectAll = () => {
    if (selectedProjectIds.length === projects.length) {
      setSelectedProjectIds([]);
    } else {
      setSelectedProjectIds(projects.map(p => p.id));
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF'
    }).format(amount);
  };

  const handleExport = async () => {
    if (selectedProjectIds.length === 0) {
      toast({
        title: "No projects selected",
        description: "Please select at least one project to export.",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    try {
      const requestBody = {
        projectIds: selectedProjectIds,
        responsiblePerson,
        vendor,
        description: description || undefined
      };

      const response = await fetch("/api/export/rebooking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Get the Excel file as a blob
      const blob = await response.blob();
      
      // Create download link
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      
      // Extract filename from response headers or use default
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'Infosys_Reposting_Export.xlsx';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      link.download = filename;
      link.click();
      
      // Clean up the blob URL
      URL.revokeObjectURL(link.href);

      toast({
        title: "Excel Export Successful",
        description: `Re-booking Excel file generated for ${selectedProjectIds.length} projects matching Infosys template format.`,
      });

      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Excel Export Failed",
        description: "There was an error generating the re-booking Excel file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-blue-600" />
            Capex Re-booking Export
          </DialogTitle>
          <DialogDescription>
            Generate Excel export for financial re-booking and cost reallocation
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Configuration Panel */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Export Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="responsible-person" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Responsible Person
                  </Label>
                  <Input
                    id="responsible-person"
                    value={responsiblePerson}
                    onChange={(e) => setResponsiblePerson(e.target.value)}
                    placeholder="Pascal Kuriger"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vendor" className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Vendor
                  </Label>
                  <Input
                    id="vendor"
                    value={vendor}
                    onChange={(e) => setVendor(e.target.value)}
                    placeholder="Infosys"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    Voucher Description
                  </Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Custom description (optional)"
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty for auto-generated description
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Summary */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Selection Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Projects:</span>
                  <Badge variant="secondary">{selectedProjectIds.length}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Budget:</span>
                  <span className="text-sm font-medium">{formatCurrency(totalSelectedBudget)}</span>
                </div>
                <Separator />
                <Button 
                  onClick={handleExport} 
                  disabled={isExporting || selectedProjectIds.length === 0}
                  className="w-full"
                >
                  {isExporting ? (
                    "Generating Excel..."
                  ) : (
                    <>
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      Export Excel (.xlsx)
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Project Selection Panel */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Select Projects</CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleSelectAll}
                  >
                    {selectedProjectIds.length === projects.length ? "Deselect All" : "Select All"}
                  </Button>
                </div>
                <CardDescription>
                  Choose projects to include in the re-booking export
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-3">
                    {projects.map((project) => {
                      const isSelected = selectedProjectIds.includes(project.id);
                      const budgetAmount = parseFloat(project.totalBudget || "0");
                      
                      return (
                        <div
                          key={project.id}
                          className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            isSelected 
                              ? "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800" 
                              : "hover:bg-gray-50 dark:hover:bg-gray-800"
                          }`}
                          onClick={() => handleProjectToggle(project.id)}
                        >
                          <Checkbox 
                            checked={isSelected}
                            onChange={() => handleProjectToggle(project.id)}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-medium truncate pr-2">
                                {project.name}
                              </h4>
                              {isSelected && (
                                <CheckCircle className="h-4 w-4 text-blue-600 flex-shrink-0" />
                              )}
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <p className="text-xs text-muted-foreground">
                                Unit: {project.businessUnit || "N/A"}
                              </p>
                              <span className="text-xs font-medium">
                                {formatCurrency(budgetAmount)}
                              </span>
                            </div>
                            <div className="flex items-center mt-1">
                              <Badge variant="outline" className="text-xs">
                                ID: {project.id}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}