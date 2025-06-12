import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import {
  insertDraftSchoolSchema,
  insertDraftResourcesSchema,
  insertDraftFeesSchema,
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Schools management routes
  app.get("/api/schools", isAuthenticated, async (req, res) => {
    try {
      const schools = await storage.getAllSchools();
      res.json(schools);
    } catch (error) {
      console.error("Error fetching schools:", error);
      res.status(500).json({ message: "Failed to fetch schools" });
    }
  });

  app.get("/api/schools/:schoolCode", isAuthenticated, async (req, res) => {
    try {
      const { schoolCode } = req.params;
      const school = await storage.getSchool(schoolCode);
      
      if (!school) {
        return res.status(404).json({ message: "School not found" });
      }
      
      res.json(school);
    } catch (error) {
      console.error("Error fetching school:", error);
      res.status(500).json({ message: "Failed to fetch school" });
    }
  });

  app.delete("/api/schools/:schoolCode", isAuthenticated, async (req, res) => {
    try {
      const { schoolCode } = req.params;
      await storage.deleteSchool(schoolCode);
      res.json({ message: "School deleted successfully" });
    } catch (error) {
      console.error("Error deleting school:", error);
      res.status(500).json({ message: "Failed to delete school" });
    }
  });

  app.patch("/api/schools/:schoolCode/toggle", isAuthenticated, async (req, res) => {
    try {
      const { schoolCode } = req.params;
      const school = await storage.getSchool(schoolCode);
      
      if (!school) {
        return res.status(404).json({ message: "School not found" });
      }
      
      const updatedSchool = await storage.updateSchool(schoolCode, {
        isActive: !school.isActive,
      });
      
      res.json(updatedSchool);
    } catch (error) {
      console.error("Error toggling school status:", error);
      res.status(500).json({ message: "Failed to toggle school status" });
    }
  });

  // Draft school routes
  app.post("/api/drafts/school", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertDraftSchoolSchema.parse(req.body);
      
      // Check if draft already exists
      const existingDraft = await storage.getDraftSchool(validatedData.schoolCode);
      
      let draft;
      if (existingDraft) {
        draft = await storage.updateDraftSchool(validatedData.schoolCode, validatedData);
      } else {
        draft = await storage.createDraftSchool(validatedData);
      }
      
      res.json(draft);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error saving draft school:", error);
      res.status(500).json({ message: "Failed to save draft school" });
    }
  });

  app.get("/api/drafts/school/:schoolCode", isAuthenticated, async (req, res) => {
    try {
      const { schoolCode } = req.params;
      const draft = await storage.getDraftSchool(schoolCode);
      
      if (!draft) {
        return res.status(404).json({ message: "Draft not found" });
      }
      
      res.json(draft);
    } catch (error) {
      console.error("Error fetching draft school:", error);
      res.status(500).json({ message: "Failed to fetch draft school" });
    }
  });

  // Draft resources routes
  app.post("/api/drafts/resources", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertDraftResourcesSchema.parse(req.body);
      
      // Check if draft already exists
      const existingDraft = await storage.getDraftResources(validatedData.schoolCode);
      
      let draft;
      if (existingDraft) {
        draft = await storage.updateDraftResources(validatedData.schoolCode, validatedData);
      } else {
        draft = await storage.createDraftResources(validatedData);
      }
      
      res.json(draft);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error saving draft resources:", error);
      res.status(500).json({ message: "Failed to save draft resources" });
    }
  });

  app.get("/api/drafts/resources/:schoolCode", isAuthenticated, async (req, res) => {
    try {
      const { schoolCode } = req.params;
      const draft = await storage.getDraftResources(schoolCode);
      
      if (!draft) {
        return res.status(404).json({ message: "Draft not found" });
      }
      
      res.json(draft);
    } catch (error) {
      console.error("Error fetching draft resources:", error);
      res.status(500).json({ message: "Failed to fetch draft resources" });
    }
  });

  // Draft fees routes
  app.post("/api/drafts/fees", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertDraftFeesSchema.parse(req.body);
      
      // Check if draft already exists
      const existingDraft = await storage.getDraftFees(validatedData.schoolCode);
      
      let draft;
      if (existingDraft) {
        draft = await storage.updateDraftFees(validatedData.schoolCode, validatedData);
      } else {
        draft = await storage.createDraftFees(validatedData);
      }
      
      res.json(draft);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error saving draft fees:", error);
      res.status(500).json({ message: "Failed to save draft fees" });
    }
  });

  app.get("/api/drafts/fees/:schoolCode", isAuthenticated, async (req, res) => {
    try {
      const { schoolCode } = req.params;
      const draft = await storage.getDraftFees(schoolCode);
      
      if (!draft) {
        return res.status(404).json({ message: "Draft not found" });
      }
      
      res.json(draft);
    } catch (error) {
      console.error("Error fetching draft fees:", error);
      res.status(500).json({ message: "Failed to fetch draft fees" });
    }
  });

  // Complete registration route
  app.post("/api/schools/:schoolCode/complete", isAuthenticated, async (req, res) => {
    try {
      const { schoolCode } = req.params;
      const school = await storage.completeRegistration(schoolCode);
      res.json(school);
    } catch (error) {
      console.error("Error completing registration:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to complete registration" 
      });
    }
  });

  // Get school credentials
  app.get("/api/schools/:schoolCode/credentials", isAuthenticated, async (req, res) => {
    try {
      const { schoolCode } = req.params;
      const credentials = await storage.getSchoolCredentials(schoolCode);
      
      if (!credentials) {
        return res.status(404).json({ message: "Credentials not found" });
      }
      
      // Don't return the actual password
      const { password, ...safeCredentials } = credentials;
      res.json(safeCredentials);
    } catch (error) {
      console.error("Error fetching school credentials:", error);
      res.status(500).json({ message: "Failed to fetch school credentials" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
