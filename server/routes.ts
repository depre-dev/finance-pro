import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertProjectSchema,
  insertFinancialRecordSchema,
  insertBudgetCategorySchema 
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Middleware to simulate user authentication (replace with real auth in production)
  app.use('/api', (req, res, next) => {
    // For demo purposes, simulate user ID 1
    req.user = { id: 1 };
    next();
  });

  // Dashboard metrics
  app.get("/api/dashboard/metrics", async (req, res) => {
    try {
      const metrics = await storage.getDashboardMetrics(req.user.id);
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard metrics" });
    }
  });

  // Projects endpoints
  app.get("/api/projects", async (req, res) => {
    try {
      const projects = await storage.getProjects(req.user.id);
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.get("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const project = await storage.getProject(id, req.user.id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      const validatedData = insertProjectSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      const project = await storage.createProject(validatedData);
      res.status(201).json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid project data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  app.put("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertProjectSchema.partial().parse(req.body);
      const project = await storage.updateProject(id, req.user.id, validatedData);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid project data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update project" });
    }
  });

  app.delete("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteProject(id, req.user.id);
      if (!deleted) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json({ message: "Project deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  // Financial records endpoints
  app.get("/api/projects/:projectId/financial-records", async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const records = await storage.getFinancialRecords(projectId, req.user.id);
      res.json(records);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch financial records" });
    }
  });

  app.post("/api/financial-records", async (req, res) => {
    try {
      const validatedData = insertFinancialRecordSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      const record = await storage.createFinancialRecord(validatedData);
      res.status(201).json(record);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid financial record data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create financial record" });
    }
  });

  app.put("/api/financial-records/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertFinancialRecordSchema.partial().parse(req.body);
      const record = await storage.updateFinancialRecord(id, req.user.id, validatedData);
      if (!record) {
        return res.status(404).json({ message: "Financial record not found" });
      }
      res.json(record);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid financial record data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update financial record" });
    }
  });

  app.delete("/api/financial-records/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteFinancialRecord(id, req.user.id);
      if (!deleted) {
        return res.status(404).json({ message: "Financial record not found" });
      }
      res.json({ message: "Financial record deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete financial record" });
    }
  });

  // Budget categories endpoints
  app.get("/api/projects/:projectId/budget-categories", async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const categories = await storage.getBudgetCategories(projectId, req.user.id);
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch budget categories" });
    }
  });

  app.post("/api/budget-categories", async (req, res) => {
    try {
      const validatedData = insertBudgetCategorySchema.parse({
        ...req.body,
        userId: req.user.id
      });
      const category = await storage.createBudgetCategory(validatedData);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid budget category data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create budget category" });
    }
  });

  app.put("/api/budget-categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertBudgetCategorySchema.partial().parse(req.body);
      const category = await storage.updateBudgetCategory(id, req.user.id, validatedData);
      if (!category) {
        return res.status(404).json({ message: "Budget category not found" });
      }
      res.json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid budget category data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update budget category" });
    }
  });

  app.delete("/api/budget-categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteBudgetCategory(id, req.user.id);
      if (!deleted) {
        return res.status(404).json({ message: "Budget category not found" });
      }
      res.json({ message: "Budget category deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete budget category" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
