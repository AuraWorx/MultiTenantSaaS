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
      const organizationId = user.organizationId;

      // Get AI systems count
      const aiSystemsCount = await db.select({ count: db.fn.count() })
        .from(aiSystems)
        .where(eq(aiSystems.organizationId, organizationId));

      // Get compliance issues count
      const complianceIssuesCount = await db.select({ count: db.fn.count() })
        .from(complianceIssues)
        .where(
          eq(complianceIssues.organizationId, organizationId)
        );

      // Get open risks count
      const openRisksCount = await db.select({ count: db.fn.count() })
        .from(riskItems)
        .where(
          eq(riskItems.organizationId, organizationId) && 
          eq(riskItems.status, 'open')
        );

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
        stats: {
          aiSystemsCount: aiSystemsCount[0]?.count || 0,
          complianceIssuesCount: complianceIssuesCount[0]?.count || 0,
          openRisksCount: openRisksCount[0]?.count || 0
        },
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
