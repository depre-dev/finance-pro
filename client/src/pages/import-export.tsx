import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Download, Upload, FileText, AlertCircle, CheckCircle, Info, FileSpreadsheet } from "lucide-react";
import type { Project } from "@shared/schema";

// Excel parsing utility using browser-compatible approach
const parseExcelToCSV = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        
        // Load XLSX library dynamically from CDN
        if (!window.XLSX) {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
          script.onload = () => {
            parseWithXLSX(arrayBuffer, resolve, reject);
          };
          script.onerror = () => reject(new Error("Failed to load Excel parser"));
          document.head.appendChild(script);
        } else {
          parseWithXLSX(arrayBuffer, resolve, reject);
        }
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsArrayBuffer(file);
  });
};

const parseWithXLSX = (arrayBuffer: ArrayBuffer, resolve: (value: string) => void, reject: (reason: any) => void) => {
  try {
    const workbook = window.XLSX.read(arrayBuffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const csvData = window.XLSX.utils.sheet_to_csv(sheet);
    resolve(csvData);
  } catch (error) {
    reject(error);
  }
};

// Extend Window interface for XLSX
declare global {
  interface Window {
    XLSX: any;
  }
}

export default function ImportExport() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [csvPreview, setCsvPreview] = useState<string>("");
  const [importResult, setImportResult] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileType, setFileType] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");

  const { data: projects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const importMutation = useMutation({
    mutationFn: async ({ csvData, projectId }: { csvData: string; projectId: string }) => {
      const response = await apiRequest("POST", "/api/import/financial-records", {
        csvData,
        projectId: parseInt(projectId)
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/financial-records"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      setImportResult(data);
      toast({
        title: "Import Completed",
        description: `Successfully imported ${data.imported} records`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import financial records",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setFileType(file.type);
    setImportResult(null);
    setIsProcessing(true);

    try {
      let csvContent = "";
      
      if (file.name.toLowerCase().endsWith('.csv')) {
        // Handle CSV files
        const reader = new FileReader();
        reader.onload = (e) => {
          csvContent = e.target?.result as string;
          setCsvPreview(csvContent);
          setIsProcessing(false);
        };
        reader.readAsText(file);
      } else if (file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')) {
        // Handle Excel files
        try {
          csvContent = await parseExcelToCSV(file);
          setCsvPreview(csvContent);
          toast({
            title: "Excel File Converted",
            description: "Excel file successfully converted to CSV format",
          });
        } catch (error) {
          toast({
            title: "Excel Conversion Failed",
            description: "Failed to convert Excel file. Please save as CSV and try again.",
            variant: "destructive",
          });
        }
        setIsProcessing(false);
      } else {
        toast({
          title: "Unsupported File Type",
          description: "Please upload a CSV or Excel (.xlsx, .xls) file",
          variant: "destructive",
        });
        setIsProcessing(false);
      }
    } catch (error) {
      toast({
        title: "File Processing Error",
        description: "Failed to process the uploaded file",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  const handleImport = async () => {
    if (!csvPreview || !selectedProject) {
      toast({
        title: "Missing Information",
        description: "Please select a project and upload a CSV file",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      await importMutation.mutateAsync({
        csvData: csvPreview,
        projectId: selectedProject
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExport = async (projectId?: string) => {
    try {
      const url = projectId 
        ? `/api/export/financial-records?projectId=${projectId}`
        : '/api/export/financial-records';
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Export failed');
      }
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = projectId 
        ? `financial-records-project-${projectId}.csv`
        : 'financial-records-all.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      toast({
        title: "Export Successful",
        description: "Financial records exported successfully",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export financial records",
        variant: "destructive",
      });
    }
  };

  const csvExample = `Date,Type,Category,Description,Amount
2024-01-15,expense,Materials,Office supplies purchase,125.50
2024-01-16,income,Client Payment,Project milestone payment,2500.00
2024-01-17,expense,Travel,Client meeting travel,85.75`;

  return (
    <>
      <header className="bg-white border-b border-neutral-20 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Import/Export</h2>
            <p className="text-sm text-neutral-50">Import and export financial data</p>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
            >
              <Upload className="mr-2 h-4 w-4" />
              Choose CSV/Excel
            </Button>
            <Button onClick={() => handleExport()} disabled={isProcessing}>
              <Download className="mr-2 h-4 w-4" />
              Export All
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Import Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Upload className="mr-2 h-5 w-5 text-primary" />
                Import Financial Records
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="project-select">Select Project *</Label>
                <Select onValueChange={setSelectedProject} value={selectedProject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a project" />
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

              <div>
                <Label htmlFor="file-upload">Upload File</Label>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button 
                  variant="outline" 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full mt-2"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent" />
                      Processing...
                    </>
                  ) : (
                    <>
                      {fileName ? <FileSpreadsheet className="mr-2 h-4 w-4" /> : <Upload className="mr-2 h-4 w-4" />}
                      {fileName ? `Change File (${fileName})` : "Choose CSV or Excel File"}
                    </>
                  )}
                </Button>
                {fileName && !isProcessing && (
                  <div className="mt-2 flex items-center text-sm text-neutral-50">
                    <FileSpreadsheet className="mr-1 h-3 w-3" />
                    {fileName} 
                    {fileType.includes('excel') || fileName.toLowerCase().includes('.xlsx') ? 
                      <Badge variant="secondary" className="ml-2">Excel</Badge> : 
                      <Badge variant="outline" className="ml-2">CSV</Badge>
                    }
                  </div>
                )}
              </div>

              {csvPreview && (
                <div>
                  <Label>File Preview</Label>
                  <Textarea
                    value={csvPreview.slice(0, 500) + (csvPreview.length > 500 ? "..." : "")}
                    readOnly
                    rows={6}
                    className="font-mono text-xs"
                  />
                </div>
              )}

              <Button 
                onClick={handleImport}
                disabled={!csvPreview || !selectedProject || isProcessing}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Import Records
                  </>
                )}
              </Button>

              {importResult && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span className="text-sm font-medium">Import Complete</span>
                  </div>
                  <div className="text-sm text-neutral-50">
                    <p>Imported: {importResult.imported} records</p>
                    {importResult.errors > 0 && (
                      <p className="text-destructive">Errors: {importResult.errors}</p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Export Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Download className="mr-2 h-5 w-5 text-success" />
                Export Financial Records
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Button 
                  onClick={() => handleExport()}
                  className="w-full"
                  disabled={isProcessing}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export All Records
                </Button>
                <p className="text-xs text-neutral-50 mt-2">
                  Export all financial records across all projects
                </p>
              </div>

              <div className="border-t pt-4">
                <Label>Export by Project</Label>
                <div className="space-y-2 mt-2">
                  {projects?.map((project) => (
                    <div key={project.id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <p className="font-medium">{project.name}</p>
                        <p className="text-xs text-neutral-50">{project.client || "No client"}</p>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleExport(project.id.toString())}
                        disabled={isProcessing}
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* File Format Guide */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Info className="mr-2 h-5 w-5 text-primary" />
              File Format Guide
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <h4 className="font-medium">CSV Files (.csv)</h4>
                  </div>
                  <p className="text-sm text-neutral-50">
                    Comma-separated values files that can be created in Excel, Google Sheets, or any text editor.
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <FileSpreadsheet className="h-5 w-5 text-success" />
                    <h4 className="font-medium">Excel Files (.xlsx, .xls)</h4>
                  </div>
                  <p className="text-sm text-neutral-50">
                    Microsoft Excel spreadsheet files. The first sheet will be used for import.
                  </p>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Required Columns</h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {["Date", "Type", "Category", "Description", "Amount"].map((column) => (
                    <Badge key={column} variant="outline">{column}</Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Example Format</h4>
                <pre className="bg-neutral-10 p-3 rounded text-xs overflow-x-auto">
                  {csvExample}
                </pre>
              </div>
              
              <div className="text-sm text-neutral-50 space-y-1">
                <p>• <strong>Date:</strong> Format as YYYY-MM-DD (e.g., 2024-01-15)</p>
                <p>• <strong>Type:</strong> Either "income" or "expense"</p>
                <p>• <strong>Category:</strong> Expense categories like "Materials", "Travel", etc.</p>
                <p>• <strong>Description:</strong> Brief description of the transaction</p>
                <p>• <strong>Amount:</strong> Numerical value (e.g., 125.50)</p>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                <div className="flex items-start space-x-2">
                  <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900 dark:text-blue-100">Excel Import Notes</p>
                    <p className="text-blue-700 dark:text-blue-200">
                      Excel files are automatically converted to CSV format during import. 
                      Only the first worksheet is processed. Make sure your data follows the same column structure.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
