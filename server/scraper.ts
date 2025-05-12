import { db } from "./db";
import { frontierModels, frontierModelUpdates, insertFrontierModelUpdateSchema } from "@shared/schema";
import { eq } from "drizzle-orm";
import axios from 'axios';
import * as cheerio from 'cheerio';
import Parser from 'rss-parser';

// Helper function to clean HTML from summaries
function cleanSummary(htmlText: string | null): string {
  if (!htmlText) return '';
  
  // Remove HTML tags
  const text = htmlText.replace(/<[^>]*>?/gm, '');
  
  // Trim and limit length
  return text.trim().substring(0, 250) + (text.length > 250 ? '...' : '');
}

// Generic function to scrape model updates by searching for model-related content
async function scrapeModelUpdates(model: string, category: 'security' | 'feature', daysAgo: number = 7, maxResults: number = 5): Promise<any[]> {
  const today = new Date();
  const results = [];
  
  try {
    // We could use Google Search API here for more robust results
    // This is a simplified approach using Google News
    const searchTerm = category === 'security' ? 
      `${model} AI security vulnerability privacy` : 
      `${model} AI new feature capability release`;
    
    const searchUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(searchTerm)}&hl=en-US&gl=US&ceid=US:en`;
    
    // Parse RSS feed
    const parser = new Parser();
    const feed = await parser.parseURL(searchUrl);
    
    // Extract relevant articles
    for (const item of feed.items.slice(0, maxResults)) {
      const pubDate = new Date(item.pubDate || today.toISOString());
      
      // Check if article is within our timeframe
      const diffDays = Math.floor((today.getTime() - pubDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays <= daysAgo) {
        results.push({
          title: item.title || `${model} ${category} update`,
          description: cleanSummary(item.contentSnippet || item.content),
          source_url: item.link || null,
          update_type: category,
          update_date: pubDate.toISOString()
        });
      }
    }
    
    return results;
  } catch (error) {
    console.error(`Error scraping ${category} updates for ${model}:`, error);
    return [];
  }
}

// Provider-specific scraping strategies
export async function scrapeProviderUpdates(providerName: string, modelName: string, modelId: number): Promise<any[]> {
  let results: any[] = [];
  
  switch(providerName.toLowerCase()) {
    case 'openai':
      results = await scrapeOpenAIUpdates(modelName, modelId);
      break;
    case 'anthropic':
      results = await scrapeAnthropicUpdates(modelName, modelId);
      break;
    case 'google':
      results = await scrapeGoogleUpdates(modelName, modelId);
      break;
    case 'meta':
      results = await scrapeMetaUpdates(modelName, modelId);
      break;
    default:
      // Default to Google News search for generic models
      const securityUpdates = await scrapeModelUpdates(modelName, 'security');
      const featureUpdates = await scrapeModelUpdates(modelName, 'feature');
      results = [...securityUpdates, ...featureUpdates];
  }
  
  // Process the results to match our database schema
  return results.map(update => ({
    ...update,
    frontier_model_id: modelId,
  }));
}

// Scrape OpenAI updates
async function scrapeOpenAIUpdates(modelName: string, modelId: number): Promise<any[]> {
  try {
    const response = await axios.get('https://openai.com/blog');
    const $ = cheerio.load(response.data);
    const updates: any[] = [];
    
    const today = new Date();
    
    // Find recent blog posts
    $('article, .mb-8').each((i, el) => {
      if (updates.length >= 5) return; // Limit to 5 updates
      
      const title = $(el).find('h3, h2').text().trim();
      const summary = $(el).find('p, .text-md').first().text().trim();
      const link = $(el).find('a').attr('href');
      const fullLink = link ? (link.startsWith('http') ? link : `https://openai.com${link}`) : null;
      
      // Check if the article mentions the model
      const modelPattern = new RegExp(modelName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i');
      const contentText = `${title} ${summary}`;
      
      if (contentText.match(modelPattern) || modelName.includes('GPT') && contentText.match(/GPT/i)) {
        // Determine type based on content
        const isSecurityRelated = 
          title.toLowerCase().includes('security') || 
          summary.toLowerCase().includes('security') ||
          title.toLowerCase().includes('safety') || 
          summary.toLowerCase().includes('safety') ||
          title.toLowerCase().includes('privacy') || 
          summary.toLowerCase().includes('privacy');
        
        updates.push({
          frontier_model_id: modelId,
          title,
          description: summary || 'New update for ' + modelName,
          source_url: fullLink,
          update_type: isSecurityRelated ? 'security' : 'feature',
          update_date: today.toISOString(),
        });
      }
    });
    
    // If no model-specific updates found, try generic OpenAI updates
    if (updates.length === 0) {
      $('article, .mb-8').slice(0, 3).each((i, el) => {
        const title = $(el).find('h3, h2').text().trim();
        const summary = $(el).find('p, .text-md').first().text().trim();
        const link = $(el).find('a').attr('href');
        const fullLink = link ? (link.startsWith('http') ? link : `https://openai.com${link}`) : null;
        
        // Determine type based on content
        const isSecurityRelated = 
          title.toLowerCase().includes('security') || 
          summary.toLowerCase().includes('security') ||
          title.toLowerCase().includes('safety') || 
          summary.toLowerCase().includes('safety');
        
        updates.push({
          frontier_model_id: modelId,
          title: `${title} (May affect ${modelName})`,
          description: summary || 'New update from OpenAI',
          source_url: fullLink,
          update_type: isSecurityRelated ? 'security' : 'feature',
          update_date: today.toISOString(),
        });
      });
    }
    
    return updates;
  } catch (error) {
    console.error(`Error scraping OpenAI updates:`, error);
    return [];
  }
}

// Scrape Anthropic updates
async function scrapeAnthropicUpdates(modelName: string, modelId: number): Promise<any[]> {
  try {
    const response = await axios.get('https://www.anthropic.com/blog');
    const $ = cheerio.load(response.data);
    const updates: any[] = [];
    
    const today = new Date();
    
    // Find blog articles
    $('.blog-posts article').each((i, el) => {
      if (updates.length >= 5) return; // Limit to 5 updates
      
      const title = $(el).find('h2, h3').text().trim();
      const link = $(el).find('a').attr('href');
      const summary = $(el).find('.mt-2, p').first().text().trim();
      const fullLink = link ? (link.startsWith('http') ? link : `https://www.anthropic.com${link}`) : null;
      
      // Check if the article mentions the model
      const modelPattern = new RegExp(modelName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i');
      const contentText = `${title} ${summary}`;
      
      if (contentText.match(modelPattern) || 
          (modelName.includes('Claude') && contentText.match(/Claude/i))) {
        
        // Determine type based on content
        const isSecurityRelated = 
          title.toLowerCase().includes('security') || 
          summary.toLowerCase().includes('security') ||
          title.toLowerCase().includes('safety') || 
          summary.toLowerCase().includes('safety') ||
          title.toLowerCase().includes('privacy') || 
          summary.toLowerCase().includes('privacy');
        
        updates.push({
          frontier_model_id: modelId,
          title,
          description: summary || 'New update for ' + modelName,
          source_url: fullLink,
          update_type: isSecurityRelated ? 'security' : 'feature',
          update_date: today.toISOString(),
        });
      }
    });
    
    // If no model-specific updates found, try generic company updates
    if (updates.length === 0) {
      $('.blog-posts article').slice(0, 3).each((i, el) => {
        const title = $(el).find('h2, h3').text().trim();
        const link = $(el).find('a').attr('href');
        const summary = $(el).find('.mt-2, p').first().text().trim();
        const fullLink = link ? (link.startsWith('http') ? link : `https://www.anthropic.com${link}`) : null;
        
        // Determine type based on content
        const isSecurityRelated = 
          title.toLowerCase().includes('security') || 
          summary.toLowerCase().includes('security') ||
          title.toLowerCase().includes('safety') || 
          summary.toLowerCase().includes('safety');
        
        updates.push({
          frontier_model_id: modelId,
          title: `${title} (May affect ${modelName})`,
          description: summary || 'New update from Anthropic',
          source_url: fullLink,
          update_type: isSecurityRelated ? 'security' : 'feature',
          update_date: today.toISOString(),
        });
      });
    }
    
    return updates;
  } catch (error) {
    console.error(`Error scraping Anthropic updates:`, error);
    return [];
  }
}

// Scrape Google updates
async function scrapeGoogleUpdates(modelName: string, modelId: number): Promise<any[]> {
  try {
    const response = await axios.get('https://blog.google/technology/ai/');
    const $ = cheerio.load(response.data);
    const updates: any[] = [];
    
    const today = new Date();
    
    // Find blog articles
    $('article.blog-c-entry').each((i, el) => {
      if (updates.length >= 5) return; // Limit to 5 updates
      
      const title = $(el).find('h3').text().trim();
      const link = $(el).find('a').attr('href');
      const summary = $(el).find('.blog-c-entry__snippet').text().trim();
      
      // Check if the article mentions the model
      const modelPattern = new RegExp(modelName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i');
      const contentText = `${title} ${summary}`;
      
      if (contentText.match(modelPattern) || 
          (modelName.includes('Gemini') && contentText.match(/Gemini/i))) {
        
        // Determine type based on content
        const isSecurityRelated = 
          title.toLowerCase().includes('security') || 
          summary.toLowerCase().includes('security') ||
          title.toLowerCase().includes('safety') || 
          summary.toLowerCase().includes('safety') ||
          title.toLowerCase().includes('privacy') || 
          summary.toLowerCase().includes('privacy');
        
        updates.push({
          frontier_model_id: modelId,
          title,
          description: summary || 'New update for ' + modelName,
          source_url: link,
          update_type: isSecurityRelated ? 'security' : 'feature',
          update_date: today.toISOString(),
        });
      }
    });
    
    // If no model-specific updates found, try generic Google AI updates
    if (updates.length === 0) {
      $('article.blog-c-entry').slice(0, 3).each((i, el) => {
        const title = $(el).find('h3').text().trim();
        const link = $(el).find('a').attr('href');
        const summary = $(el).find('.blog-c-entry__snippet').text().trim();
        
        // Determine type based on content
        const isSecurityRelated = 
          title.toLowerCase().includes('security') || 
          summary.toLowerCase().includes('security') ||
          title.toLowerCase().includes('safety') || 
          summary.toLowerCase().includes('safety');
        
        updates.push({
          frontier_model_id: modelId,
          title: `${title} (May affect ${modelName})`,
          description: summary || 'New update from Google AI',
          source_url: link,
          update_type: isSecurityRelated ? 'security' : 'feature',
          update_date: today.toISOString(),
        });
      });
    }
    
    return updates;
  } catch (error) {
    console.error(`Error scraping Google updates:`, error);
    return [];
  }
}

// Scrape Meta updates
async function scrapeMetaUpdates(modelName: string, modelId: number): Promise<any[]> {
  try {
    const response = await axios.get('https://ai.meta.com/blog/');
    const $ = cheerio.load(response.data);
    const updates: any[] = [];
    
    const today = new Date();
    
    // Find blog articles
    $('.post-item').each((i, el) => {
      if (updates.length >= 5) return; // Limit to 5 updates
      
      const title = $(el).find('h3').text().trim();
      const link = 'https://ai.meta.com' + $(el).find('a').attr('href');
      const description = $(el).find('.post-excerpt').text().trim();
      
      // Check if the article mentions the model
      if (title.toLowerCase().includes(modelName.toLowerCase()) || 
          description.toLowerCase().includes(modelName.toLowerCase())) {
        
        // Determine type based on content
        const isSecurityRelated = 
          title.toLowerCase().includes('security') || 
          description.toLowerCase().includes('security') ||
          title.toLowerCase().includes('safety') || 
          description.toLowerCase().includes('safety');
        
        updates.push({
          frontier_model_id: modelId,
          title,
          description,
          source_url: link,
          update_type: isSecurityRelated ? 'security' : 'feature',
          update_date: today.toISOString(),
        });
      }
    });
    
    return updates;
  } catch (error) {
    console.error(`Error scraping Meta updates:`, error);
    return [];
  }
}

// Main function to scrape all models and persist to database
export async function scrapeAndPersistModelUpdates(specificModelId?: number) {
  try {
    // Get models from database
    let modelsQuery = db.select().from(frontierModels);
    
    // If a specific model ID is provided, only scrape for that model
    if (specificModelId) {
      modelsQuery = modelsQuery.where(eq(frontierModels.id, specificModelId));
    }
    
    const models = await modelsQuery;
    console.log(`[DEBUG] Found ${models.length} models to process`);
    
    let totalUpdates = 0;
    
    for (const model of models) {
      console.log(`[DEBUG] Processing model: ${model.name} (${model.provider})`);
      
      // Scrape updates for this model using provider-specific strategies
      const updates = await scrapeProviderUpdates(model.provider, model.name, model.id);
      
      if (updates.length === 0) {
        console.log(`[DEBUG] No updates found for ${model.name}`);
        continue;
      }
      
      console.log(`[DEBUG] Found ${updates.length} updates for ${model.name}`);
      
      // Insert updates into database
      for (const update of updates) {
        try {
          // Validate with zod schema
          const validatedUpdate = insertFrontierModelUpdateSchema.parse(update);
          
          // Check if update with same source_url already exists
          const existingUpdate = await db.select()
            .from(frontierModelUpdates)
            .where(eq(frontierModelUpdates.source_url, update.source_url))
            .limit(1);
          
          if (existingUpdate.length === 0) {
            // Insert new update
            await db.insert(frontierModelUpdates).values(validatedUpdate);
            totalUpdates++;
          } else {
            console.log(`[DEBUG] Update with URL ${update.source_url} already exists, skipping`);
          }
        } catch (error) {
          console.error(`Error inserting update:`, error);
        }
      }
    }
    
    console.log(`[DEBUG] Total new updates inserted: ${totalUpdates}`);
    return totalUpdates;
  } catch (error) {
    console.error(`Error in scrapeAndPersistModelUpdates:`, error);
    throw error;
  }
}