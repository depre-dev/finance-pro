import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  FileText, 
  Plus, 
  Play, 
  Download, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Settings,
  BarChart3,
  FileSpreadsheet,
  Eye,
  Trash2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
// import type { ReportConfiguration, ReportExecution } from "@shared/schema";
import AnimatedCard from "@/components/ui/animated-card";
import AnimatedButton from "@/components/ui/animated-button";

interface ReportPreview {
  totalBudget?: number;
  totalSpent?: number;
  projectCount?: number;
  totalProjects?: number;
  totalExpenses?: number;
}

export default function Reports() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<any | null>(null);
  const [previewData, setPreviewData] = useState<ReportPreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "budget_summary",
    schedule: "manual",
    format: "excel",
    recipients: [""],
    isActive: true
  });

  // Temporarily disable reports API calls to fix runtime errors
  const configurations: any[] = [];
  const executions: any[] = [];
  const configsLoading = false;
  const executionsLoading = false;

  // Create configuration mutation
  const createConfigMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/reports/configurations", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports/configurations"] });
      setShowCreateForm(false);
      resetForm();
      toast({
        title: "Report Configuration Created",
        description: "Your automated report has been set up successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to create report configuration.",
        variant: "destructive",
      });
    },
  });

  // Execute report mutation
  const executeReportMutation = useMutation({
    mutationFn: async (configId: number) => {
      const response = await apiRequest("POST", `/api/reports/configurations/${configId}/execute`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports/executions"] });
      toast({
        title: "Report Generated",
        description: "Your report has been generated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to generate report.",
        variant: "destructive",
      });
    },
  });

  // Delete configuration mutation
  const deleteConfigMutation = useMutation({
    mutationFn: async (configId: number) => {
      const response = await apiRequest("DELETE", `/api/reports/configurations/${configId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reports/configurations"] });
      toast({
        title: "Configuration Deleted",
        description: "Report configuration has been removed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to delete configuration.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      type: "budget_summary",
      schedule: "manual",
      format: "excel",
      recipients: [""],
      isActive: true
    });
    setPreviewData(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validRecipients = formData.recipients.filter(email => email.trim() !== "");
    createConfigMutation.mutate({
      ...formData,
      recipients: validRecipients
    });
  };

  const handlePreview = async () => {
    setLoadingPreview(true);
    try {
      const response = await apiRequest("POST", "/api/reports/preview", {
        type: formData.type,
        filters: {}
      });
      const data = await response.json();
      setPreviewData(data);
    } catch (error) {
      toast({
        title: "Preview Error",
        description: "Failed to generate preview data.",
        variant: "destructive",
      });
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleAddRecipient = () => {
    setFormData(prev => ({
      ...prev,
      recipients: [...prev.recipients, ""]
    }));
  };

  const handleRemoveRecipient = (index: number) => {
    setFormData(prev => ({
      ...prev,
      recipients: prev.recipients.filter((_, i) => i !== index)
    }));
  };

  const handleRecipientChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      recipients: prev.recipients.map((email, i) => i === index ? value : email)
    }));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'generating':
        return <Clock className="h-4 w-4 text-blue-600 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'excel':
        return <FileSpreadsheet className="h-4 w-4 text-green-600" />;
      case 'csv':
        return <FileText className="h-4 w-4 text-blue-600" />;
      case 'pdf':
        return <FileText className="h-4 w-4 text-red-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const handleDownload = async (filename: string) => {
    try {
      const response = await fetch(`/api/reports/download/${filename}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      toast({
        title: "Download Error",
        description: "Failed to download report file.",
        variant: "destructive",
      });
    }
  };

  if (configsLoading || executionsLoading) {
    return (
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Automated Reports</h1>
            <p className="text-muted-foreground mt-1">
              Generate and schedule financial reports automatically
            </p>
          </div>
          <AnimatedButton
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Report
          </AnimatedButton>
        </div>

        {/* Create Report Form */}
        {showCreateForm && (
          <AnimatedCard>
            <CardHeader>
              <CardTitle>Create New Report Configuration</CardTitle>
              <CardDescription>
                Set up an automated report that can be generated on demand or scheduled
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Report Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Monthly Budget Summary"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">Report Type</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="budget_summary">Budget Summary</SelectItem>
                        <SelectItem value="project_status">Project Status</SelectItem>
                        <SelectItem value="expense_analysis">Expense Analysis</SelectItem>
                        <SelectItem value="variance_report">Variance Report</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe what this report includes..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="schedule">Schedule</Label>
                    <Select
                      value={formData.schedule}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, schedule: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Manual Only</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="format">Format</Label>
                    <Select
                      value={formData.format}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, format: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                        <SelectItem value="csv">CSV (.csv)</SelectItem>
                        <SelectItem value="json">JSON (.json)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Email Recipients</Label>
                  <div className="space-y-2">
                    {formData.recipients.map((email, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          type="email"
                          value={email}
                          onChange={(e) => handleRecipientChange(index, e.target.value)}
                          placeholder="recipient@company.com"
                          className="flex-1"
                        />
                        {formData.recipients.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveRecipient(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddRecipient}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Recipient
                    </Button>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="active"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                  />
                  <Label htmlFor="active">Active</Label>
                </div>

                {/* Preview Section */}
                {previewData && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Preview Data</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      {previewData.totalBudget !== undefined && (
                        <div>
                          <span className="text-gray-600">Total Budget:</span>
                          <span className="font-medium ml-2">
                            {new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' })
                              .format(previewData.totalBudget)}
                          </span>
                        </div>
                      )}
                      {previewData.totalSpent !== undefined && (
                        <div>
                          <span className="text-gray-600">Total Spent:</span>
                          <span className="font-medium ml-2">
                            {new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' })
                              .format(previewData.totalSpent)}
                          </span>
                        </div>
                      )}
                      {previewData.projectCount !== undefined && (
                        <div>
                          <span className="text-gray-600">Projects:</span>
                          <span className="font-medium ml-2">{previewData.projectCount}</span>
                        </div>
                      )}
                      {previewData.totalProjects !== undefined && (
                        <div>
                          <span className="text-gray-600">Total Projects:</span>
                          <span className="font-medium ml-2">{previewData.totalProjects}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex justify-between">
                  <div className="space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handlePreview}
                      disabled={loadingPreview}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      {loadingPreview ? "Loading..." : "Preview"}
                    </Button>
                  </div>
                  <div className="space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowCreateForm(false);
                        resetForm();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createConfigMutation.isPending}>
                      {createConfigMutation.isPending ? "Creating..." : "Create Report"}
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </AnimatedCard>
        )}

        {/* Report Configurations */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {configurations?.map((config, index) => (
            <AnimatedCard key={config.id} delay={index * 0.1}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{config.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {config.description || `${config.type.replace('_', ' ')} report`}
                    </CardDescription>
                  </div>
                  <Badge variant={config.isActive ? "default" : "secondary"}>
                    {config.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Type:</span>
                  <Badge variant="outline">
                    {config.type.replace('_', ' ')}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Schedule:</span>
                  <span className="font-medium">{config.schedule}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Format:</span>
                  <div className="flex items-center gap-1">
                    {getFormatIcon(config.format)}
                    <span className="font-medium">{config.format.toUpperCase()}</span>
                  </div>
                </div>
                {config.lastExecuted && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Last Run:</span>
                    <span className="font-medium">
                      {format(new Date(config.lastExecuted), "MMM dd, yyyy")}
                    </span>
                  </div>
                )}
                <Separator />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => executeReportMutation.mutate(config.id)}
                    disabled={executeReportMutation.isPending}
                    className="flex-1"
                  >
                    <Play className="h-3 w-3 mr-1" />
                    {executeReportMutation.isPending ? "Running..." : "Run Now"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteConfigMutation.mutate(config.id)}
                    disabled={deleteConfigMutation.isPending}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </AnimatedCard>
          ))}
        </div>

        {/* Recent Executions */}
        {executions && executions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="mr-2 h-5 w-5" />
                Recent Report Executions
              </CardTitle>
              <CardDescription>
                Download completed reports or check execution status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {executions.slice(0, 10).map((execution) => (
                  <div
                    key={execution.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(execution.status)}
                      <div>
                        <div className="font-medium">{execution.configName}</div>
                        <div className="text-sm text-gray-600">
                          {format(new Date(execution.startedAt), "MMM dd, yyyy 'at' HH:mm")}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {execution.configFormat?.toUpperCase()}
                      </Badge>
                      {execution.status === 'completed' && execution.filePath && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownload(execution.filePath.split('/').pop())}
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}