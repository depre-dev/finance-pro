import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Plus,
  Settings,
  Zap,
  CheckCircle,
  XCircle,
  Download,
  Upload,
  RefreshCw,
  Trash2,
  AlertTriangle,
  Globe,
  Key,
  Clock,
} from "lucide-react";

interface ApiConfig {
  id?: number;
  name: string;
  baseUrl: string;
  apiKey?: string;
  authType: 'none' | 'bearer' | 'api-key' | 'basic';
  headers?: Record<string, string>;
  timeout: number;
  isActive: boolean;
}

interface ApiTestResult {
  success: boolean;
  message: string;
  responseTime?: number;
}

export default function ApiIntegrations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddingApi, setIsAddingApi] = useState(false);
  const [editingApi, setEditingApi] = useState<ApiConfig | null>(null);
  const [testingApi, setTestingApi] = useState<number | null>(null);
  const [newApi, setNewApi] = useState<Omit<ApiConfig, 'id'>>({
    name: '',
    baseUrl: '',
    apiKey: '',
    authType: 'none',
    headers: {},
    timeout: 30000,
    isActive: true,
  });

  // Fetch API configurations
  const { data: apiConfigs = [], isLoading } = useQuery<ApiConfig[]>({
    queryKey: ["/api/integrations/configs"],
  });

  // Create/Update API configuration
  const saveApiMutation = useMutation({
    mutationFn: async (config: ApiConfig) => {
      const method = config.id ? 'PUT' : 'POST';
      const url = config.id ? `/api/integrations/configs/${config.id}` : '/api/integrations/configs';
      return await apiRequest(method, url, config);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/integrations/configs"] });
      setIsAddingApi(false);
      setEditingApi(null);
      setNewApi({
        name: '',
        baseUrl: '',
        apiKey: '',
        authType: 'none',
        headers: {},
        timeout: 30000,
        isActive: true,
      });
      toast({
        title: "Success",
        description: "API configuration saved successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete API configuration
  const deleteApiMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('DELETE', `/api/integrations/configs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/integrations/configs"] });
      toast({
        title: "Success",
        description: "API configuration deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Test API connection
  const testApiConnection = async (config: ApiConfig) => {
    if (!config.id) return;
    
    setTestingApi(config.id);
    const startTime = Date.now();
    
    try {
      const response = await fetch(`/api/integrations/test/${config.id}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': localStorage.getItem('sessionId') || '',
        },
      });
      
      const result = await response.json();
      const responseTime = Date.now() - startTime;
      
      toast({
        title: result.success ? "Connection Successful" : "Connection Failed",
        description: `${result.message} (${responseTime}ms)`,
        variant: result.success ? "default" : "destructive",
      });
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setTestingApi(null);
    }
  };

  // Sync data from external API
  const syncDataMutation = useMutation({
    mutationFn: async ({ apiId, type }: { apiId: number; type: 'projects' | 'financial-records' }) => {
      return await apiRequest('POST', `/api/integrations/sync/${apiId}`, { type });
    },
    onSuccess: (_, { type }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/charge-history"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      toast({
        title: "Sync Successful",
        description: `${type} synced successfully from external API`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Sync Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSaveApi = () => {
    const configToSave = editingApi || newApi;
    saveApiMutation.mutate(configToSave as ApiConfig);
  };

  const handleEditApi = (config: ApiConfig) => {
    setEditingApi(config);
    setNewApi(config);
    setIsAddingApi(true);
  };

  const currentConfig = editingApi || newApi;

  return (
    <>
      <header className="bg-white border-b border-neutral-20 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">API Integrations</h2>
            <p className="text-sm text-muted-foreground">
              Connect external APIs to replace Excel import/export functionality
            </p>
          </div>
          <Button
            onClick={() => setIsAddingApi(true)}
            disabled={isAddingApi}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add API
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* API Configurations List */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Configured APIs</h3>
            
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : apiConfigs.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="p-6 text-center">
                  <Globe className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No API integrations configured</p>
                  <p className="text-sm text-muted-foreground">
                    Add your first API to start syncing external data
                  </p>
                </CardContent>
              </Card>
            ) : (
              apiConfigs.map((config) => (
                <Card key={config.id} className="relative">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-medium">{config.name}</h4>
                          <Badge variant={config.isActive ? "default" : "secondary"}>
                            {config.isActive ? "Active" : "Inactive"}
                          </Badge>
                          <Badge variant="outline">{config.authType}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {config.baseUrl}
                        </p>
                        
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => testApiConnection(config)}
                            disabled={testingApi === config.id}
                          >
                            {testingApi === config.id ? (
                              <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
                            ) : (
                              <Zap className="mr-1 h-3 w-3" />
                            )}
                            Test
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => syncDataMutation.mutate({ apiId: config.id!, type: 'projects' })}
                            disabled={syncDataMutation.isPending}
                          >
                            <Download className="mr-1 h-3 w-3" />
                            Sync Projects
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => syncDataMutation.mutate({ apiId: config.id!, type: 'financial-records' })}
                            disabled={syncDataMutation.isPending}
                          >
                            <Download className="mr-1 h-3 w-3" />
                            Sync Records
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-1 ml-4">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditApi(config)}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteApiMutation.mutate(config.id!)}
                          disabled={deleteApiMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Add/Edit API Form */}
          {isAddingApi && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {editingApi ? 'Edit API Configuration' : 'Add New API'}
                  </CardTitle>
                  <CardDescription>
                    Configure connection details for your external API
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="api-name">API Name</Label>
                      <Input
                        id="api-name"
                        value={currentConfig.name}
                        onChange={(e) => setNewApi({ ...currentConfig, name: e.target.value })}
                        placeholder="e.g., SAP Finance API"
                      />
                    </div>
                    <div>
                      <Label htmlFor="auth-type">Authentication</Label>
                      <Select
                        value={currentConfig.authType}
                        onValueChange={(value: any) => setNewApi({ ...currentConfig, authType: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="bearer">Bearer Token</SelectItem>
                          <SelectItem value="api-key">API Key</SelectItem>
                          <SelectItem value="basic">Basic Auth</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="base-url">Base URL</Label>
                    <Input
                      id="base-url"
                      value={currentConfig.baseUrl}
                      onChange={(e) => setNewApi({ ...currentConfig, baseUrl: e.target.value })}
                      placeholder="https://api.example.com/v1"
                    />
                  </div>

                  {currentConfig.authType !== 'none' && (
                    <div>
                      <Label htmlFor="api-key">
                        {currentConfig.authType === 'bearer' ? 'Bearer Token' : 'API Key'}
                      </Label>
                      <Input
                        id="api-key"
                        type="password"
                        value={currentConfig.apiKey || ''}
                        onChange={(e) => setNewApi({ ...currentConfig, apiKey: e.target.value })}
                        placeholder="Enter your API key or token"
                      />
                    </div>
                  )}

                  <div>
                    <Label htmlFor="timeout">Timeout (ms)</Label>
                    <Input
                      id="timeout"
                      type="number"
                      value={currentConfig.timeout}
                      onChange={(e) => setNewApi({ ...currentConfig, timeout: parseInt(e.target.value) || 30000 })}
                      min="1000"
                      max="300000"
                    />
                  </div>

                  <Separator />

                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsAddingApi(false);
                        setEditingApi(null);
                        setNewApi({
                          name: '',
                          baseUrl: '',
                          apiKey: '',
                          authType: 'none',
                          headers: {},
                          timeout: 30000,
                          isActive: true,
                        });
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveApi}
                      disabled={!currentConfig.name || !currentConfig.baseUrl || saveApiMutation.isPending}
                    >
                      {saveApiMutation.isPending ? (
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      {editingApi ? 'Update' : 'Save'} API
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* API Documentation */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <AlertTriangle className="mr-2 h-5 w-5 text-amber-500" />
                    API Requirements
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <strong>Expected Endpoints:</strong>
                    <ul className="list-disc list-inside mt-1 text-muted-foreground space-y-1">
                      <li><code>GET /projects</code> - Return list of projects</li>
                      <li><code>GET /financial-records</code> - Return financial records</li>
                      <li><code>POST /projects</code> - Create/sync project data</li>
                      <li><code>GET /health</code> - Health check endpoint</li>
                    </ul>
                  </div>
                  <div>
                    <strong>Response Format:</strong>
                    <p className="text-muted-foreground">
                      APIs should return JSON data matching our internal schema or
                      standard REST API patterns with arrays of objects.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </>
  );
}