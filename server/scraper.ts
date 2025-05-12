import axios from 'axios';
import Parser from 'rss-parser';
import * as cheerio from 'cheerio';
import { db } from './db';
import { frontierModels, frontierModelUpdates, insertFrontierModelUpdateSchema } from '@shared/schema';
import { eq } from 'drizzle-orm';

const parser = new Parser();

// Function to clean HTML and get first sentence
function cleanSummary(htmlText: string | null): string {
  if (!htmlText) return '';
  
  // Remove HTML tags
  const text = htmlText.replace(/<[^<]+?>/g, '').trim();
  
  // Get first sentence
  const parts = text.split('. ');
  return parts[0] && parts[0].length > 0 ? `${parts[0]}.` : text;
}

// Scrape updates for a specific model
async function scrapeModelUpdates(model: string, category: 'security' | 'feature', daysAgo: number = 7, maxResults: number = 5): Promise<any[]> {
  console.log(`[DEBUG] Processing model '${model}' for category '${category}'...`);
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
  
  const phrase = category === 'security' ? 'security incident' : 'feature update';
  const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(`${model} ${phrase}`)}`;
  
  console.log(`[DEBUG] Fetching RSS: ${rssUrl}`);
  
  try {
    const feed = await parser.parseURL(rssUrl);
    console.log(`[DEBUG] Entries fetched: ${feed.items.length}`);
    
    const results: any[] = [];
    let count = 0;
    
    for (const item of feed.items) {
      if (!item.pubDate) continue;
      
      const publishedDate = new Date(item.pubDate);
      if (publishedDate < cutoffDate) continue;
      
      const summary = cleanSummary(item.contentSnippet || item.content || '');
      
      results.push({
        model,
        update_type: category,
        source_url: item.link || '',
        description: summary,
        title: item.title || 'Update',
        update_date: publishedDate.toISOString(),
      });
      
      count++;
      if (count >= maxResults) break;
    }
    
    console.log(`[DEBUG] Added ${count} items for ${model}/${category}`);
    return results;
  } catch (error) {
    console.error(`Error scraping updates for ${model}/${category}:`, error);
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

// Scrape OpenAI updates from their blog
async function scrapeOpenAIUpdates(modelName: string, modelId: number): Promise<any[]> {
  try {
    const response = await axios.get('https://openai.com/blog');
    const $ = cheerio.load(response.data);
    const updates: any[] = [];
    
    const today = new Date();
    
    // Find blog articles
    $('article').each((i, el) => {
      if (updates.length >= 5) return; // Limit to 5 updates
      
      const title = $(el).find('h3').text().trim();
      const link = 'https://openai.com' + $(el).find('a').attr('href');
      const description = $(el).find('p').text().trim();
      
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
    console.error(`Error scraping OpenAI updates:`, error);
    return [];
  }
}

// Scrape Anthropic updates
async function scrapeAnthropicUpdates(modelName: string, modelId: number): Promise<any[]> {
  try {
    const response = await axios.get('https://www.anthropic.com/news');
    const $ = cheerio.load(response.data);
    const updates: any[] = [];
    
    const today = new Date();
    
    // Find news items
    $('.news-list-item').each((i, el) => {
      if (updates.length >= 5) return; // Limit to 5 updates
      
      const title = $(el).find('h3').text().trim();
      const link = 'https://www.anthropic.com' + $(el).find('a').attr('href');
      const description = $(el).find('p').text().trim();
      
      // Check if the item mentions the model
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
    $('.post-item').each((i, el) => {
      if (updates.length >= 5) return; // Limit to 5 updates
      
      const title = $(el).find('h3').text().trim();
      const link = $(el).find('a').attr('href');
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