import { z } from 'zod';

// API Configuration Schema
export const apiConfigSchema = z.object({
  name: z.string(),
  baseUrl: z.string().url(),
  apiKey: z.string().optional(),
  authType: z.enum(['none', 'bearer', 'api-key', 'basic']),
  headers: z.record(z.string()).optional(),
  timeout: z.number().default(30000),
});

export type ApiConfig = z.infer<typeof apiConfigSchema>;

// Project Data Schema for API responses
export const externalProjectSchema = z.object({
  projectId: z.string(),
  name: z.string(),
  businessUnit: z.string().optional(),
  totalBudget: z.number(),
  wbs: z.string().optional(),
  targetRelease: z.string().optional(),
  status: z.enum(['Planning', 'Active', 'On Hold', 'Completed', 'Cancelled']).default('Active'),
  totalPds: z.number().optional(),
  totalExternalPds: z.number().optional(),
});

export type ExternalProject = z.infer<typeof externalProjectSchema>;

// Financial Record Schema for API responses
export const externalFinancialRecordSchema = z.object({
  projectId: z.string(),
  amount: z.number(),
  description: z.string(),
  category: z.string(),
  date: z.string().datetime(),
  type: z.enum(['income', 'expense']),
});

export type ExternalFinancialRecord = z.infer<typeof externalFinancialRecordSchema>;

export class ApiIntegrationService {
  private configs: Map<string, ApiConfig> = new Map();

  // Register API configuration
  registerApi(name: string, config: ApiConfig) {
    this.configs.set(name, config);
  }

  // Generic API request method
  private async makeRequest<T>(
    apiName: string, 
    endpoint: string, 
    options: {
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
      body?: any;
      queryParams?: Record<string, string>;
    } = {}
  ): Promise<T> {
    const config = this.configs.get(apiName);
    if (!config) {
      throw new Error(`API configuration not found: ${apiName}`);
    }

    const { method = 'GET', body, queryParams } = options;
    
    // Build URL with query parameters
    const url = new URL(endpoint, config.baseUrl);
    if (queryParams) {
      Object.entries(queryParams).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    // Prepare headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...config.headers,
    };

    // Add authentication headers
    if (config.authType === 'bearer' && config.apiKey) {
      headers['Authorization'] = `Bearer ${config.apiKey}`;
    } else if (config.authType === 'api-key' && config.apiKey) {
      headers['X-API-Key'] = config.apiKey;
    }

    try {
      const response = await fetch(url.toString(), {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(config.timeout),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request error for ${apiName}:`, error);
      throw error;
    }
  }

  // Fetch projects from external API
  async fetchProjects(apiName: string, endpoint: string = '/projects'): Promise<ExternalProject[]> {
    const data = await this.makeRequest<any>(apiName, endpoint);
    
    // Handle different response formats
    const projectsArray = Array.isArray(data) ? data : data.projects || data.data || [];
    
    return projectsArray.map((item: any) => {
      try {
        return externalProjectSchema.parse(item);
      } catch (error) {
        console.warn('Invalid project data from API:', item, error);
        return null;
      }
    }).filter(Boolean);
  }

  // Fetch financial records from external API
  async fetchFinancialRecords(
    apiName: string, 
    endpoint: string = '/financial-records',
    projectId?: string
  ): Promise<ExternalFinancialRecord[]> {
    const queryParams = projectId ? { projectId } : undefined;
    const data = await this.makeRequest<any>(apiName, endpoint, { queryParams });
    
    // Handle different response formats
    const recordsArray = Array.isArray(data) ? data : data.records || data.data || [];
    
    return recordsArray.map((item: any) => {
      try {
        return externalFinancialRecordSchema.parse(item);
      } catch (error) {
        console.warn('Invalid financial record data from API:', item, error);
        return null;
      }
    }).filter(Boolean);
  }

  // Sync project data to external API
  async syncProjectToExternal(apiName: string, project: ExternalProject): Promise<void> {
    await this.makeRequest(apiName, '/projects', {
      method: 'POST',
      body: project,
    });
  }

  // Sync financial record to external API
  async syncFinancialRecordToExternal(
    apiName: string, 
    record: ExternalFinancialRecord
  ): Promise<void> {
    await this.makeRequest(apiName, '/financial-records', {
      method: 'POST',
      body: record,
    });
  }

  // Test API connection
  async testConnection(apiName: string): Promise<{ success: boolean; message: string }> {
    try {
      await this.makeRequest(apiName, '/health', { method: 'GET' });
      return { success: true, message: 'Connection successful' };
    } catch (error) {
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Connection failed' 
      };
    }
  }

  // Get all registered APIs
  getRegisteredApis(): string[] {
    return Array.from(this.configs.keys());
  }
}

// Singleton instance
export const apiIntegrationService = new ApiIntegrationService();