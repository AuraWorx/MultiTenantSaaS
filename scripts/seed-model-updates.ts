import { db } from "../server/db";
import { frontierModels, frontierModelUpdates } from "@shared/schema";
import { eq } from "drizzle-orm";

async function main() {
  console.log("Adding seed model updates to database...");
  
  // First, get all frontierModels
  const models = await db.select().from(frontierModels);
  
  if (models.length === 0) {
    console.log("No frontier models found in database. Please run the main seed script first.");
    process.exit(1);
  }
  
  // Find Claude model (or use first model as fallback)
  const claudeModel = models.find(model => model.name.toLowerCase().includes('claude')) || models[0];
  
  // Sample model updates
  const sampleUpdates = [
    {
      title: "Anthropic Releases Critical Security Patch for Claude 3.5 Sonnet",
      description: "Anthropic issues a critical security update for Claude 3.5 Sonnet addressing a vulnerability that could potentially allow prompt injection attacks.",
      update_type: "security",
      source_url: "https://aisecuritytoday.com/2025/04/15/anthropic-releases-critical-security-patch-claude-35-sonnet",
      update_date: new Date("2025-04-15"),
      frontier_model_id: claudeModel.id
    },
    {
      title: "Claude 3.5 Sonnet Gets Major Update with Enhanced Reasoning Capabilities",
      description: "Anthropic rolls out a significant update to Claude 3.5 Sonnet, featuring improved reasoning abilities and specialized knowledge in several technical domains.",
      update_type: "feature",
      source_url: "https://aiinsider.net/articles/claude-35-sonnet-reasoning-update-2025-05-03",
      update_date: new Date("2025-05-03"),
      frontier_model_id: claudeModel.id
    },
    {
      title: "Anthropic Strengthens Claude 3.5 Sonnet's Data Privacy Controls",
      description: "New security features for Claude 3.5 Sonnet provide enterprise customers with enhanced data control options and improved privacy guarantees.",
      update_type: "security",
      source_url: "https://enterpriseainews.com/security/2025/04/21/anthropic-claude-35-sonnet-privacy-controls",
      update_date: new Date("2025-04-21"),
      frontier_model_id: claudeModel.id
    }
  ];
  
  // Add generic updates for each model
  const allUpdates = [
    ...sampleUpdates,
    ...models.flatMap(model => [
      {
        title: `Security Update for ${model.name}`,
        description: `Enhanced safety guardrails and improved data handling protocols for ${model.name}.`,
        update_type: "security",
        source_url: null,
        update_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        frontier_model_id: model.id
      },
      {
        title: `New Features for ${model.name}`,
        description: `${model.name} now includes improved response capabilities and expanded knowledge coverage.`,
        update_type: "feature",
        source_url: null,
        update_date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
        frontier_model_id: model.id
      }
    ])
  ];
  
  // Insert updates into database, skipping duplicates
  let insertedCount = 0;
  for (const update of allUpdates) {
    try {
      // Check if similar update already exists
      const existingUpdate = await db.select()
        .from(frontierModelUpdates)
        .where(
          eq(frontierModelUpdates.title, update.title)
        )
        .limit(1);
      
      if (existingUpdate.length === 0) {
        // Insert new update
        await db.insert(frontierModelUpdates).values(update);
        insertedCount++;
      } else {
        console.log(`Update "${update.title}" already exists, skipping`);
      }
    } catch (error) {
      console.error(`Error inserting update "${update.title}":`, error);
    }
  }
  
  console.log(`Successfully added ${insertedCount} model updates to the database.`);
}

main()
  .catch(error => {
    console.error("Error seeding model updates:", error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });