import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { FileSpreadsheet, Download, Trash2, ArrowRight, Clock, CheckCircle } from "lucide-react";
import type { Project } from "@shared/schema";
import { format } from "date-fns";

interface UploadedData {
  id: number;
  fileName: string;
  originalData: any[];
  columnMapping: any;
  totalRows: number;
  uploadedAt: string;
  isProcessed: boolean;
  userId: number;
}

export default function UploadedDataPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedProjects, setSelectedProjects] = useState<Record<number, string>>({});

  const { data: uploads, isLoading: uploadsLoading } = useQuery<UploadedData[]>({
    queryKey: ["/api/uploaded-data"],
  });

  const { data: projects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const convertMutation = useMutation({
    mutationFn: async ({ uploadId, projectId }: { uploadId: number; projectId: string }) => {
      const response = await apiRequest("POST", `/api/uploaded-data/${uploadId}/convert`, {
        projectId: parseInt(projectId)
      });
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/uploaded-data"] });
      queryClient.invalidateQueries({ queryKey: ["/api/financial-records"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      
      toast({
        title: "Data Imported Successfully",
        description: `Imported ${data.imported} records to the selected project.`,
      });

      // Remove from local selection
      setSelectedProjects(prev => {
        const newState = { ...prev };
        delete newState[variables.uploadId];
        return newState;
      });
    },
    onError: (error: any) => {
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import uploaded data",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (uploadId: number) => {
      const response = await apiRequest("DELETE", `/api/uploaded-data/${uploadId}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/uploaded-data"] });
      toast({
        title: "Data Deleted",
        description: "Uploaded data has been removed.",
      });
    },
    onError: () => {
      toast({
        title: "Delete Failed",
        description: "Failed to delete uploaded data",
        variant: "destructive",
      });
    },
  });

  const handleImport = (uploadId: number) => {
    const projectId = selectedProjects[uploadId];
    if (!projectId) {
      toast({
        title: "No Project Selected",
        description: "Please select a project before importing the data.",
        variant: "destructive",
      });
      return;
    }

    convertMutation.mutate({ uploadId, projectId });
  };

  const handleProjectChange = (uploadId: number, projectId: string) => {
    setSelectedProjects(prev => ({
      ...prev,
      [uploadId]: projectId
    }));
  };

  return (
    <>
      <header className="bg-white border-b border-neutral-20 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Uploaded Data</h2>
            <p className="text-sm text-neutral-50">View uploaded Excel files - Create projects from this data using the Projects page</p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        {/* Info Banner for new workflow */}
        <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-green-900 dark:text-green-100 mb-1">
                Excel Data Successfully Stored
              </h4>
              <p className="text-sm text-green-700 dark:text-green-300 mb-2">
                Your Excel data has been uploaded and is ready to use. To create a new project using this data:
              </p>
              <ol className="text-sm text-green-700 dark:text-green-300 list-decimal list-inside space-y-1">
                <li>Go to the <strong>Projects</strong> page</li>
                <li>Click <strong>"Create New Project"</strong></li>
                <li>Select from the uploaded project names shown at the top of the form</li>
                <li>The form will auto-fill with your Excel data</li>
              </ol>
            </div>
          </div>
        </div>

        {uploadsLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : uploads && uploads.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {uploads.map((upload) => (
              <Card key={upload.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-lg">
                    <div className="flex items-center">
                      <FileSpreadsheet className="mr-2 h-5 w-5 text-primary" />
                      <span className="truncate">{upload.fileName}</span>
                    </div>
                    {upload.isProcessed ? (
                      <Badge variant="secondary">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Imported
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        <Clock className="mr-1 h-3 w-3" />
                        Pending
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Total Rows</p>
                      <p className="font-medium">{upload.totalRows}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Uploaded</p>
                      <p className="font-medium">
                        {format(new Date(upload.uploadedAt), "MMM dd, HH:mm")}
                      </p>
                    </div>
                  </div>

                  {/* Data Preview */}
                  {upload.originalData && upload.originalData.length > 0 && (
                    <div className="border rounded-lg p-3 bg-gray-50">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Data Preview</p>
                      <div className="space-y-1 text-xs">
                        {Object.keys(upload.originalData[0]).slice(0, 3).map((key, index) => (
                          <div key={index} className="flex justify-between">
                            <span className="font-medium text-muted-foreground">{key}:</span>
                            <span className="truncate ml-2 max-w-32">
                              {upload.originalData[0][key] || '-'}
                            </span>
                          </div>
                        ))}
                        {Object.keys(upload.originalData[0]).length > 3 && (
                          <p className="text-center text-muted-foreground">
                            ... and {Object.keys(upload.originalData[0]).length - 3} more columns
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {!upload.isProcessed && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium">Assign to Project</label>
                        <Select 
                          value={selectedProjects[upload.id] || ""} 
                          onValueChange={(value) => handleProjectChange(upload.id, value)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Choose a project..." />
                          </SelectTrigger>
                          <SelectContent>
                            {projects?.map((project) => (
                              <SelectItem key={project.id} value={project.id.toString()}>
                                {project.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex space-x-2">
                        <Button 
                          onClick={() => handleImport(upload.id)}
                          disabled={!selectedProjects[upload.id] || convertMutation.isPending}
                          className="flex-1"
                        >
                          {convertMutation.isPending ? (
                            <>
                              <div className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-b-transparent" />
                              Importing...
                            </>
                          ) : (
                            <>
                              <ArrowRight className="mr-2 h-3 w-3" />
                              Import Data
                            </>
                          )}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => deleteMutation.mutate(upload.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <FileSpreadsheet className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">No Uploaded Data</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Upload Excel or CSV files from the Import/Export page to see them here
            </p>
            <Button variant="outline" onClick={() => window.location.href = '/import-export'}>
              <Download className="mr-2 h-4 w-4" />
              Go to Import/Export
            </Button>
          </div>
        )}
      </div>
    </>
  );
}