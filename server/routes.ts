import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { 
  users, 
  roles, 
  organizations, 
  aiSystems,
  riskItems,
  complianceIssues,
  insertUserSchema,
  insertOrganizationSchema,
  insertRoleSchema,
  insertAiSystemSchema,
  insertRiskItemSchema,
  insertComplianceIssueSchema 
} from "@shared/schema";
import { isAuthenticated } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication endpoints
  setupAuth(app);

  // Dashboard data
  app.get("/api/dashboard", isAuthenticated, async (req, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const organizationId = user.organization?.id || user.organizationId;

      // Use static data for now to show the dashboard
      const stats = {
        aiSystemsCount: 5,
        complianceIssuesCount: 3,
        openRisksCount: 2
      };

      // Get recent activities (mock data for now)
      const activities = [
        {
          id: 1,
          type: 'success',
          message: 'New AI system added to inventory',
          entity: 'Customer Support Bot',
          timestamp: new Date(Date.now() - 7200000) // 2 hours ago
        },
        {
          id: 2,
          type: 'warning',
          message: 'Compliance issue detected in',
          entity: 'Product Recommendation Engine',
          timestamp: new Date(Date.now() - 86400000) // 1 day ago
        },
        {
          id: 3,
          type: 'info',
          message: 'Risk assessment updated for',
          entity: 'Content Moderation AI',
          timestamp: new Date(Date.now() - 172800000) // 2 days ago
        }
      ];

      res.json({
        stats,
        activities
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });

  // User management endpoints
  app.get("/api/users", isAuthenticated, async (req, res) => {
    try {
      // Check if user is admin
      if (req.user.roleId !== 1) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const allUsers = await db.query.users.findMany({
        with: {
          organization: true,
          role: true
        }
      });
      
      res.json(allUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/users", isAuthenticated, async (req, res) => {
    try {
      // Check if user is admin
      if (req.user.roleId !== 1) {
        return res.status(403).json({ message: "Forbidden" });
      }

      // Validate user data
      const userData = insertUserSchema.parse(req.body);
      
      // Create user
      const [newUser] = await db.insert(users).values(userData).returning();
      
      res.status(201).json(newUser);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.patch("/api/users/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Check if user is admin
      if (req.user.roleId !== 1) {
        return res.status(403).json({ message: "Forbidden" });
      }

      // Update user
      const [updatedUser] = await db.update(users)
        .set(req.body)
        .where(eq(users.id, userId))
        .returning();
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete("/api/users/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Check if user is admin
      if (req.user.roleId !== 1) {
        return res.status(403).json({ message: "Forbidden" });
      }

      // Delete user
      await db.delete(users).where(eq(users.id, userId));
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Organizations endpoints
  app.get("/api/organizations", isAuthenticated, async (req, res) => {
    try {
      const orgs = await db.select().from(organizations);
      res.json(orgs);
    } catch (error) {
      console.error("Error fetching organizations:", error);
      res.status(500).json({ message: "Failed to fetch organizations" });
    }
  });

  app.post("/api/organizations", isAuthenticated, async (req, res) => {
    try {
      // Check if user is admin
      if (!req.user || req.user.role.id !== 1) {
        return res.status(403).json({ message: "Forbidden: Only administrators can create organizations" });
      }

      // Validate organization data
      const orgData = insertOrganizationSchema.parse(req.body);
      
      // Check if organization already exists
      const existingOrg = await db.select()
        .from(organizations)
        .where(eq(organizations.name, orgData.name))
        .limit(1);
        
      if (existingOrg.length > 0) {
        return res.status(400).json({ message: "Organization with this name already exists" });
      }
      
      // Create organization
      const [newOrg] = await db.insert(organizations).values(orgData).returning();
      
      res.status(201).json(newOrg);
    } catch (error) {
      console.error("Error creating organization:", error);
      res.status(500).json({ message: "Failed to create organization" });
    }
  });

  app.patch("/api/organizations/:id", isAuthenticated, async (req, res) => {
    try {
      const orgId = parseInt(req.params.id);
      
      // Check if user is admin
      if (!req.user || req.user.role.id !== 1) {
        return res.status(403).json({ message: "Forbidden: Only administrators can update organizations" });
      }

      // Update organization
      const [updatedOrg] = await db.update(organizations)
        .set(req.body)
        .where(eq(organizations.id, orgId))
        .returning();
      
      if (!updatedOrg) {
        return res.status(404).json({ message: "Organization not found" });
      }
      
      res.json(updatedOrg);
    } catch (error) {
      console.error("Error updating organization:", error);
      res.status(500).json({ message: "Failed to update organization" });
    }
  });

  app.delete("/api/organizations/:id", isAuthenticated, async (req, res) => {
    try {
      const orgId = parseInt(req.params.id);
      
      // Check if user is admin
      if (!req.user || req.user.role.id !== 1) {
        return res.status(403).json({ message: "Forbidden: Only administrators can delete organizations" });
      }

      // Check if users exist in this organization
      const usersInOrg = await db.select()
        .from(users)
        .where(eq(users.organizationId, orgId))
        .limit(1);
        
      if (usersInOrg.length > 0) {
        return res.status(400).json({ 
          message: "Cannot delete organization with active users. Transfer or delete users first." 
        });
      }

      // Delete organization
      await db.delete(organizations).where(eq(organizations.id, orgId));
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting organization:", error);
      res.status(500).json({ message: "Failed to delete organization" });
    }
  });

  // Roles endpoints
  app.get("/api/roles", isAuthenticated, async (req, res) => {
    try {
      const allRoles = await db.select().from(roles);
      res.json(allRoles);
    } catch (error) {
      console.error("Error fetching roles:", error);
      res.status(500).json({ message: "Failed to fetch roles" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
