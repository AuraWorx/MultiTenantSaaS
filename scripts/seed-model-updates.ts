import { db } from "../server/db";
import { frontierModels, frontierModelUpdates } from "@shared/schema";
import { eq } from "drizzle-orm";

type ArticleData = {
  id: string;
  title: string;
  date: string;
  url: string | null;
};

type SeedData = {
  articles: ArticleData[];
};

const seedData: SeedData = {
  "articles": [
    {
      "id": "sec-001",
      "title": "Anthropic Releases Critical Security Patch for Claude 3.5 Sonnet",
      "date": "2025-04-15",
      "url": "https://aisecuritytoday.com/2025/04/15/anthropic-releases-critical-security-patch-claude-35-sonnet"
    },
    {
      "id": "feat-001",
      "title": "Claude 3.5 Sonnet Gets Major Update with Enhanced Reasoning Capabilities",
      "date": "2025-05-03",
      "url": "https://aiinsider.net/articles/claude-35-sonnet-reasoning-update-2025-05-03"
    },
    {
      "id": "sec-002",
      "title": "Anthropic Strengthens Claude 3.5 Sonnet's Data Privacy Controls",
      "date": "2025-04-21",
      "url": "https://enterpriseainews.com/security/2025/04/21/anthropic-claude-35-sonnet-privacy-controls"
    }
  ]
};

async function main() {
  try {
    console.log("Seeding frontier model updates from new data...");
    
    // Find the Claude 3.5 Sonnet model or create it if it doesn't exist
    let model = await db.query.frontierModels.findFirst({
      where: eq(frontierModels.name, "Claude 3.5 Sonnet")
    });
    
    if (!model) {
      console.log("Creating Claude 3.5 Sonnet model...");
      const [newModel] = await db.insert(frontierModels).values({
        name: "Claude 3.5 Sonnet",
        provider: "Anthropic",
        description: "Claude 3.5 Sonnet from Anthropic - a powerful frontier model with enhanced reasoning capabilities.",
        release_date: new Date("2025-03-01").toISOString(),
        created_by_id: 1, // admin user
        organization_id: 1, // admin organization
      }).returning();
      
      model = newModel;
    }
    
    console.log(`Using frontier model: ${model.name} (id: ${model.id})`);
    
    // Clear existing updates for this model
    await db.delete(frontierModelUpdates)
      .where(eq(frontierModelUpdates.frontier_model_id, model.id));
    
    console.log("Cleared existing updates for this model");
    
    // Insert new updates
    for (const article of seedData.articles) {
      // Determine if it's a security or feature update based on the ID
      const updateType = article.id.startsWith('sec') ? 'security' : 'feature';
      
      // Generate a description based on the title
      let description = "";
      if (updateType === 'security') {
        description = `Important security update for Claude 3.5 Sonnet users. ${article.title.split(' - ')[0]}.`;
      } else {
        description = `New feature update for Claude 3.5 Sonnet users. ${article.title.split(' - ')[0]}.`;
      }
      
      await db.insert(frontierModelUpdates).values({
        frontier_model_id: model.id,
        title: article.title,
        description,
        update_type: updateType,
        source_url: article.url,
        update_date: new Date().toISOString(), // Current date/time as update date
        published_date: new Date(article.date).toISOString(), // Provided date as published date
      });
      
      console.log(`Added update: ${article.title} (${updateType})`);
    }
    
    console.log("Seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding frontier model updates:", error);
    process.exit(1);
  }
}

main().then(() => process.exit(0));