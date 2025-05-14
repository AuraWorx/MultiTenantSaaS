import { Router } from "express";
import { db } from "../db";
import { piiDetectionLogs } from "@shared/schema";
import { eq, and, gte, sql } from "drizzle-orm";
import { isAuthenticated } from "../auth";

const router = Router();

// Log PII detection results
router.post("/", isAuthenticated, async (req, res) => {
  try {
    const {
      sessionId,
      promptLength,
      hasPii,
      piiTypesDetected,
      promptText,
    } = req.body;

    const [log] = await db
      .insert(piiDetectionLogs)
      .values({
        sessionId,
        userId: req.user.id,
        promptLength,
        hasPii,
        piiTypesDetected,
        promptText,
        organizationId: req.user.organization.id,
      })
      .returning();

    res.status(201).json(log);
  } catch (error) {
    console.error("Error logging PII detection:", error);
    res.status(500).json({ message: "Failed to log PII detection" });
  }
});

// Get PII detection logs
router.get("/", isAuthenticated, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    
    const logs = await db
      .select()
      .from(piiDetectionLogs)
      .where(eq(piiDetectionLogs.organizationId, req.user.organization.id))
      .orderBy(sql`${piiDetectionLogs.timestamp} DESC`)
      .limit(Number(limit))
      .offset(Number(offset));

    res.json(logs);
  } catch (error) {
    console.error("Error fetching PII detection logs:", error);
    res.status(500).json({ message: "Failed to fetch PII detection logs" });
  }
});

// Get PII detection statistics
router.get("/stats", isAuthenticated, async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Get total prompts and PII prompts count
    const [totalStats] = await db
      .select({
        totalPrompts: sql<number>`count(*)`,
        piiPromptsCount: sql<number>`count(*) filter (where ${piiDetectionLogs.hasPii} = true)`,
      })
      .from(piiDetectionLogs)
      .where(
        and(
          eq(piiDetectionLogs.organizationId, req.user.organization.id),
          gte(piiDetectionLogs.timestamp, sevenDaysAgo)
        )
      );

    // Get PII types distribution
    const piiTypesDistribution = await db
      .select({
        piiType: sql<string>`unnest(${piiDetectionLogs.piiTypesDetected})`,
        count: sql<number>`count(*)`,
      })
      .from(piiDetectionLogs)
      .where(
        and(
          eq(piiDetectionLogs.organizationId, req.user.organization.id),
          gte(piiDetectionLogs.timestamp, sevenDaysAgo)
        )
      )
      .groupBy(sql`unnest(${piiDetectionLogs.piiTypesDetected})`);

    // Get daily PII counts
    const dailyPiiCounts = await db
      .select({
        date: sql<Date>`date_trunc('day', ${piiDetectionLogs.timestamp})`,
        count: sql<number>`count(*)`,
      })
      .from(piiDetectionLogs)
      .where(
        and(
          eq(piiDetectionLogs.organizationId, req.user.organization.id),
          gte(piiDetectionLogs.timestamp, sevenDaysAgo)
        )
      )
      .groupBy(sql`date_trunc('day', ${piiDetectionLogs.timestamp})`)
      .orderBy(sql`date_trunc('day', ${piiDetectionLogs.timestamp})`);

    res.json({
      totalPrompts: totalStats.totalPrompts,
      piiPromptsCount: totalStats.piiPromptsCount,
      piiTypesDistribution,
      dailyPiiCounts,
    });
  } catch (error) {
    console.error("Error fetching PII detection statistics:", error);
    res.status(500).json({ message: "Failed to fetch PII detection statistics" });
  }
});

export default router; 