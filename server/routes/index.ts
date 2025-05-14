import { Express } from "express";
import { createServer } from "http";
import piiRoutes from "./pii";

export async function registerRoutes(app: Express) {
  const server = createServer(app);

  // Register PII detection routes
  app.use("/api/analytics/pii", piiRoutes);

  return server;
} 