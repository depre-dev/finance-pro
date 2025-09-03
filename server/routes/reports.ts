import { Router } from "express";
import { db } from "../db";
import { eq, and, desc } from "drizzle-orm";
import { 
  reportConfigurations, 
  reportExecutions,
  insertReportConfigurationSchema,
  insertReportExecutionSchema 
} from "@shared/schema";
import { ReportService } from "../services/reportService";
import { authenticate } from "../auth";
import * as path from 'path';
import * as fs from 'fs';

const router = Router();
const reportService = ReportService.getInstance();

// Apply authentication middleware to all routes
router.use(authenticate);

// Get all report configurations for the user
router.get("/configurations", async (req, res) => {
  try {
    const userId = req.user!.id;
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const configs = await db
      .select()
      .from(reportConfigurations)
      .where(eq(reportConfigurations.userId, userId))
      .orderBy(desc(reportConfigurations.createdAt));

    res.json(configs);
  } catch (error) {
    console.error("Error fetching report configurations:", error);
    res.status(500).json({ message: "Failed to fetch report configurations" });
  }
});

// Create a new report configuration
router.post("/configurations", async (req, res) => {
  try {
    const userId = req.user!.id;
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const validatedData = insertReportConfigurationSchema.parse({
      ...req.body,
      userId
    });

    const [config] = await db
      .insert(reportConfigurations)
      .values({
        ...validatedData,
        recipients: validatedData.recipients || []
      })
      .returning();

    res.status(201).json(config);
  } catch (error) {
    console.error("Error creating report configuration:", error);
    res.status(500).json({ message: "Failed to create report configuration" });
  }
});

// Update a report configuration
router.put("/configurations/:id", async (req, res) => {
  try {
    const userId = req.user!.id;
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const configId = parseInt(req.params.id);
    const validatedData = insertReportConfigurationSchema.parse(req.body);

    const [config] = await db
      .update(reportConfigurations)
      .set({
        ...validatedData,
        recipients: validatedData.recipients || [],
        updatedAt: new Date()
      })
      .where(and(
        eq(reportConfigurations.id, configId),
        eq(reportConfigurations.userId, userId)
      ))
      .returning();

    if (!config) {
      return res.status(404).json({ message: "Report configuration not found" });
    }

    res.json(config);
  } catch (error) {
    console.error("Error updating report configuration:", error);
    res.status(500).json({ message: "Failed to update report configuration" });
  }
});

// Delete a report configuration
router.delete("/configurations/:id", async (req, res) => {
  try {
    const userId = req.user!.id;
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const configId = parseInt(req.params.id);

    const deleted = await db
      .delete(reportConfigurations)
      .where(and(
        eq(reportConfigurations.id, configId),
        eq(reportConfigurations.userId, userId)
      ))
      .returning();

    if (deleted.length === 0) {
      return res.status(404).json({ message: "Report configuration not found" });
    }

    res.json({ message: "Report configuration deleted successfully" });
  } catch (error) {
    console.error("Error deleting report configuration:", error);
    res.status(500).json({ message: "Failed to delete report configuration" });
  }
});

// Execute a report
router.post("/configurations/:id/execute", async (req, res) => {
  try {
    const userId = req.user!.id;
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const configId = parseInt(req.params.id);

    // Verify the configuration exists and belongs to the user
    const [config] = await db
      .select()
      .from(reportConfigurations)
      .where(and(
        eq(reportConfigurations.id, configId),
        eq(reportConfigurations.userId, userId)
      ));

    if (!config) {
      return res.status(404).json({ message: "Report configuration not found" });
    }

    // Execute the report
    const filePath = await reportService.executeReport(configId, userId);

    res.json({ 
      message: "Report generated successfully",
      filePath: path.basename(filePath)
    });
  } catch (error) {
    console.error("Error executing report:", error);
    res.status(500).json({ message: "Failed to execute report" });
  }
});

// Get report executions for a configuration
router.get("/configurations/:id/executions", async (req, res) => {
  try {
    const userId = req.user!.id;
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const configId = parseInt(req.params.id);

    const executions = await db
      .select()
      .from(reportExecutions)
      .where(and(
        eq(reportExecutions.reportConfigId, configId),
        eq(reportExecutions.userId, userId)
      ))
      .orderBy(desc(reportExecutions.startedAt));

    res.json(executions);
  } catch (error) {
    console.error("Error fetching report executions:", error);
    res.status(500).json({ message: "Failed to fetch report executions" });
  }
});

// Get all report executions for the user
router.get("/executions", async (req, res) => {
  try {
    const userId = req.user!.id;
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const executions = await db
      .select({
        id: reportExecutions.id,
        status: reportExecutions.status,
        startedAt: reportExecutions.startedAt,
        completedAt: reportExecutions.completedAt,
        filePath: reportExecutions.filePath,
        fileSize: reportExecutions.fileSize,
        errorMessage: reportExecutions.errorMessage,
        configName: reportConfigurations.name,
        configType: reportConfigurations.type,
        configFormat: reportConfigurations.format
      })
      .from(reportExecutions)
      .innerJoin(reportConfigurations, eq(reportExecutions.reportConfigId, reportConfigurations.id))
      .where(eq(reportExecutions.userId, userId))
      .orderBy(desc(reportExecutions.startedAt));

    res.json(executions);
  } catch (error) {
    console.error("Error fetching report executions:", error);
    res.status(500).json({ message: "Failed to fetch report executions" });
  }
});

// Download a generated report
router.get("/download/:filename", async (req, res) => {
  try {
    const userId = req.user!.id;
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const filename = req.params.filename;
    const filePath = path.join(process.cwd(), 'reports', filename);

    // Verify the file exists and belongs to the user
    const [execution] = await db
      .select()
      .from(reportExecutions)
      .where(and(
        eq(reportExecutions.userId, userId),
        eq(reportExecutions.filePath, filePath)
      ));

    if (!execution || !fs.existsSync(filePath)) {
      return res.status(404).json({ message: "Report file not found" });
    }

    // Set appropriate headers
    const ext = path.extname(filename).toLowerCase();
    let contentType = 'application/octet-stream';
    
    switch (ext) {
      case '.xlsx':
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        break;
      case '.csv':
        contentType = 'text/csv';
        break;
      case '.json':
        contentType = 'application/json';
        break;
      case '.pdf':
        contentType = 'application/pdf';
        break;
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error("Error downloading report:", error);
    res.status(500).json({ message: "Failed to download report" });
  }
});

// Generate preview data for a report type
router.post("/preview", async (req, res) => {
  try {
    const userId = req.user!.id;
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const { type, filters } = req.body;

    let previewData: any;
    switch (type) {
      case 'budget_summary':
        previewData = await reportService.generateBudgetSummaryReport(userId, filters);
        break;
      case 'project_status':
        previewData = await reportService.generateProjectStatusReport(userId, filters);
        break;
      case 'expense_analysis':
        previewData = await reportService.generateExpenseAnalysisReport(userId, filters);
        break;
      case 'variance_report':
        previewData = await reportService.generateVarianceReport(userId, filters);
        break;
      default:
        return res.status(400).json({ message: "Unsupported report type" });
    }

    res.json(previewData);
  } catch (error) {
    console.error("Error generating report preview:", error);
    res.status(500).json({ message: "Failed to generate report preview" });
  }
});

export default router;