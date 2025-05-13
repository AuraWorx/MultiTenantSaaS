import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { db } from "./db";
import { eq, and, count, sum, asc, desc, SQL, sql } from "drizzle-orm";
import axios from 'axios';
import * as cheerio from 'cheerio';
import { scrapeAndPersistModelUpdates } from "./scraper";
import { 
  users, 
  roles, 
  organizations, 
  aiSystems,
  riskItems,
  complianceIssues,
  githubScanConfigs,
  githubScanResults,
  githubScanSummaries,
  biasAnalysisScans,
  biasAnalysisResults,
  frontierModels,
  frontierModelAlerts,
  frontierModelUpdates,
  insertUserSchema,
  insertOrganizationSchema,
  insertRoleSchema,
  insertAiSystemSchema,
  insertRiskItemSchema,
  insertComplianceIssueSchema,
  insertGithubScanConfigSchema,
  insertBiasAnalysisScanSchema,
  insertBiasAnalysisResultSchema,
  insertFrontierModelSchema,
  insertFrontierModelAlertSchema,
  insertFrontierModelUpdateSchema,
  FrontierModel
} from "@shared/schema";
import { isAuthenticated } from "./auth";

/**
 * Scrape updates for a frontier model based on its provider
 * Uses provider-specific scraping strategies to find the latest security and feature updates
 */
async function scrapeModelUpdates(model: FrontierModel) {
  try {
    console.log(`Scraping updates for ${model.name} from ${model.provider}`);
    
    // Choose scraping strategy based on provider
    switch(model.provider.toLowerCase()) {
      case 'openai':
        return await scrapeOpenAIUpdates(model);
      case 'anthropic':
        return await scrapeAnthropicUpdates(model);
      case 'google':
        return await scrapeGoogleUpdates(model);
      case 'meta':
        return await scrapeMetaUpdates(model);
      default:
        // For any other provider, generate generic updates
        return generateGenericUpdates(model);
    }
  } catch (error) {
    console.error(`Error scraping updates for ${model.name}:`, error);
    // Return generic updates on error
    return generateGenericUpdates(model);
  }
}

/**
 * Scrape OpenAI's blog for model updates
 */
async function scrapeOpenAIUpdates(model: FrontierModel) {
  const updates = [];
  
  try {
    // Fetch OpenAI blog
    const response = await axios.get('https://openai.com/blog');
    const $ = cheerio.load(response.data);
    
    // Find recent blog posts
    const blogPosts = $('.relative.mb-12').slice(0, 5);
    
    blogPosts.each((index, element) => {
      const title = $(element).find('h3').text().trim();
      const description = $(element).find('p').text().trim();
      const link = $(element).find('a').attr('href');
      
      // Determine if update is security or feature related
      const isSecurityUpdate = title.toLowerCase().includes('security') || 
                             description.toLowerCase().includes('security') ||
                             description.toLowerCase().includes('privacy') ||
                             description.toLowerCase().includes('safe');
      
      updates.push({
        frontier_model_id: model.id,
        title: title || `Update for ${model.name}`,
        description: description || `Latest update for ${model.name}`,
        update_type: isSecurityUpdate ? 'security' : 'feature',
        source_url: link ? `https://openai.com${link}` : null,
        update_date: new Date()
      });
    });
    
    // If no updates found, add generic ones
    if (updates.length === 0) {
      return generateGenericUpdates(model);
    }
    
    return updates;
  } catch (error) {
    console.error('Error scraping OpenAI updates:', error);
    return generateGenericUpdates(model);
  }
}

/**
 * Scrape Anthropic's blog for model updates
 */
async function scrapeAnthropicUpdates(model: FrontierModel) {
  const updates = [];
  
  try {
    // Fetch Anthropic blog
    const response = await axios.get('https://www.anthropic.com/blog');
    const $ = cheerio.load(response.data);
    
    // Find recent blog posts
    const blogPosts = $('article').slice(0, 5);
    
    blogPosts.each((index, element) => {
      const title = $(element).find('h3, h2').text().trim();
      const description = $(element).find('p').text().trim();
      const link = $(element).find('a').attr('href');
      
      // Determine if update is security or feature related
      const isSecurityUpdate = title.toLowerCase().includes('security') || 
                             description.toLowerCase().includes('security') ||
                             description.toLowerCase().includes('privacy') ||
                             description.toLowerCase().includes('safe');
      
      updates.push({
        frontier_model_id: model.id,
        title: title || `Update for ${model.name}`,
        description: description || `Latest update for ${model.name}`,
        update_type: isSecurityUpdate ? 'security' : 'feature',
        source_url: link ? `https://www.anthropic.com${link}` : null,
        update_date: new Date()
      });
    });
    
    // If no updates found, add generic ones
    if (updates.length === 0) {
      return generateGenericUpdates(model);
    }
    
    return updates;
  } catch (error) {
    console.error('Error scraping Anthropic updates:', error);
    return generateGenericUpdates(model);
  }
}

/**
 * Scrape Google AI blog for model updates
 */
async function scrapeGoogleUpdates(model: FrontierModel) {
  const updates = [];
  
  try {
    // Fetch Google AI blog
    const response = await axios.get('https://blog.google/technology/ai/');
    const $ = cheerio.load(response.data);
    
    // Find recent blog posts
    const blogPosts = $('article').slice(0, 5);
    
    blogPosts.each((index, element) => {
      const title = $(element).find('h3, h2').text().trim();
      const description = $(element).find('.xs-text, .blog-c-entry__snippet').text().trim();
      const link = $(element).find('a').attr('href');
      
      // Determine if update is security or feature related
      const isSecurityUpdate = title.toLowerCase().includes('security') || 
                             description.toLowerCase().includes('security') ||
                             description.toLowerCase().includes('privacy') ||
                             description.toLowerCase().includes('safe');
      
      updates.push({
        frontier_model_id: model.id,
        title: title || `Update for ${model.name}`,
        description: description || `Latest update for ${model.name}`,
        update_type: isSecurityUpdate ? 'security' : 'feature',
        source_url: link || null,
        update_date: new Date()
      });
    });
    
    // If no updates found, add generic ones
    if (updates.length === 0) {
      return generateGenericUpdates(model);
    }
    
    return updates;
  } catch (error) {
    console.error('Error scraping Google updates:', error);
    return generateGenericUpdates(model);
  }
}

/**
 * Scrape Meta AI blog for model updates
 */
async function scrapeMetaUpdates(model: FrontierModel) {
  const updates = [];
  
  try {
    // Fetch Meta AI blog
    const response = await axios.get('https://ai.meta.com/blog/');
    const $ = cheerio.load(response.data);
    
    // Find recent blog posts
    const blogPosts = $('.item').slice(0, 5);
    
    blogPosts.each((index, element) => {
      const title = $(element).find('.title, h3').text().trim();
      const description = $(element).find('.description, p').text().trim();
      const link = $(element).find('a').attr('href');
      
      // Determine if update is security or feature related
      const isSecurityUpdate = title.toLowerCase().includes('security') || 
                             description.toLowerCase().includes('security') ||
                             description.toLowerCase().includes('privacy') ||
                             description.toLowerCase().includes('safe');
      
      updates.push({
        frontier_model_id: model.id,
        title: title || `Update for ${model.name}`,
        description: description || `Latest update for ${model.name}`,
        update_type: isSecurityUpdate ? 'security' : 'feature',
        source_url: link ? `https://ai.meta.com${link}` : null,
        update_date: new Date()
      });
    });
    
    // If no updates found, add generic ones
    if (updates.length === 0) {
      return generateGenericUpdates(model);
    }
    
    return updates;
  } catch (error) {
    console.error('Error scraping Meta updates:', error);
    return generateGenericUpdates(model);
  }
}

/**
 * Generate generic updates for a model when scraping fails
 */
function generateGenericUpdates(model: FrontierModel) {
  return [
    {
      frontier_model_id: model.id,
      title: `Security Update for ${model.name}`,
      description: `Recent security enhancements for ${model.name} to improve data handling and privacy protections.`,
      update_type: 'security',
      source_url: null,
      update_date: new Date()
    },
    {
      frontier_model_id: model.id,
      title: `Feature Update for ${model.name}`,
      description: `New capabilities added to ${model.name} including improved response accuracy and expanded knowledge.`,
      update_type: 'feature',
      source_url: null,
      update_date: new Date()
    }
  ];
}

// List of common AI/ML libraries to detect in repositories
const AI_LIBRARIES = [
  'tensorflow', 'pytorch', 'keras', 'scikit-learn', 'huggingface', 'transformers',
  'openai', 'langchain', 'llama', 'gpt', 'bert', 'dalle', 'stable-diffusion',
  'anthropic', 'claude', 'whisper', 'gemini', 'palm', 'llama-index', 'rag',
  'machine-learning', 'deep-learning', 'neural-network', 'ml-agents', 'ai4j',
  'autodl', 'autogpt', 'mlflow', 'fastai', 'spacy', 'nltk', 'gensim'
];

// File patterns that indicate AI/ML model files
const AI_FILE_PATTERNS = [
  /\.h5$/, /\.pkl$/, /\.pt$/, /\.onnx$/, /\.pb$/,
  /_model\..+$/, /\.safetensors$/, /\.joblib$/,
  /\.ipynb$/ // Jupyter notebooks often contain AI/ML code
];

// Folder patterns that suggest AI/ML work
const AI_FOLDER_PATTERNS = [
  /models\//, /ai\//, /ml\//, /llm\//,
  /genai\//, /machine-learning\//, /deep-learning\//
];

/**
 * Scan GitHub repositories for AI usage
 */
/**
 * Scan GitHub repositories for AI usage detection
 * Based on best practices for detecting AI/ML usage in code repositories
 */
async function scanGitHubRepositories(config: typeof githubScanConfigs.$inferSelect) {
  try {
    console.log(`Starting GitHub scan for ${config.github_org_name}`);
    
    // Setup GitHub API client
    const apiUrl = `https://api.github.com`;
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'AIGovernancePlatform'
    };
    
    // Add authorization header if API key is provided
    if (config.api_key) {
      headers['Authorization'] = `token ${config.api_key}`;
      console.log('Using GitHub API key for authenticated access');
    } else {
      console.log('No GitHub API key provided, using unauthenticated access (rate limits apply)');
    }
    
    let repositories: any[] = [];
    
    try {
      // First try to get organization repositories
      const orgReposResponse = await axios.get(
        `${apiUrl}/orgs/${config.github_org_name}/repos?per_page=100`,
        { headers }
      );
      repositories = orgReposResponse.data;
    } catch (orgError) {
      console.log(`Not an organization or error accessing org. Trying as user: ${config.github_org_name}`);
      
      // If that fails, try as a user
      try {
        const userReposResponse = await axios.get(
          `${apiUrl}/users/${config.github_org_name}/repos?per_page=100`,
          { headers }
        );
        repositories = userReposResponse.data;
      } catch (userError) {
        const errMsg = userError instanceof Error ? userError.message : 'Unknown error';
        console.error(`Failed to access repositories: ${errMsg}`);
        throw new Error(`Could not access repositories for ${config.github_org_name}`);
      }
    }
    
    console.log(`Found ${repositories.length} repositories for ${config.github_org_name}`);
    
    // Update config status to scanning
    await db.update(githubScanConfigs)
      .set({ status: 'scanning' })
      .where(eq(githubScanConfigs.id, config.id));
    
    let reposWithAI = 0;
    
    // Process each repository with delay to avoid rate limits
    for (const repo of repositories) {
      console.log(`Scanning repository: ${repo.name}`);
      
      try {
        const aiSignals: { 
          type: string,
          path: string | null, 
          details: string, 
          confidence: number 
        }[] = [];
        
        const aiLibrariesFound: string[] = [];
        const aiFrameworksFound: string[] = [];
        
        // Check repository name and description for AI/ML keywords
        const repoName = repo.name.toLowerCase();
        const nameKeywords = AI_LIBRARIES.filter(kw => repoName.includes(kw.toLowerCase()));
        
        if (nameKeywords.length > 0) {
          aiSignals.push({
            type: 'Repository Name',
            path: null,
            details: `Keywords found: ${nameKeywords.join(', ')}`,
            confidence: 0.6
          });
        }
        
        if (repo.description) {
          const descKeywords = AI_LIBRARIES.filter(kw => 
            repo.description.toLowerCase().includes(kw.toLowerCase())
          );
          
          if (descKeywords.length > 0) {
            aiSignals.push({
              type: 'Repository Description',
              path: null,
              details: `Keywords found: ${descKeywords.join(', ')}`,
              confidence: 0.5
            });
          }
        }
        
        // Check dependency files
        const dependencyFiles = ['package.json', 'requirements.txt', 'environment.yml', 'Pipfile', 'pyproject.toml'];
        
        for (const depFile of dependencyFiles) {
          try {
            const response = await axios.get(
              `${apiUrl}/repos/${config.github_org_name}/${repo.name}/contents/${depFile}`,
              { headers }
            );
            
            if (response.status === 200) {
              const content = Buffer.from(response.data.content, 'base64').toString('utf-8');
              
              // Parse based on file type
              if (depFile === 'package.json') {
                try {
                  const packageJson = JSON.parse(content);
                  
                  // Check dependencies and devDependencies
                  const dependencies = {
                    ...(packageJson.dependencies || {}),
                    ...(packageJson.devDependencies || {})
                  };
                  
                  // Look for AI libraries
                  for (const [dep, version] of Object.entries(dependencies)) {
                    for (const lib of AI_LIBRARIES) {
                      if (dep.toLowerCase().includes(lib.toLowerCase())) {
                        if (!aiLibrariesFound.includes(dep)) {
                          aiLibrariesFound.push(dep);
                          aiFrameworksFound.push(`${dep}@${version}`);
                        }
                      }
                    }
                  }
                } catch (parseError) {
                  console.error(`Error parsing package.json for ${repo.name}:`, parseError);
                }
              } else {
                // For requirements.txt and other Python dependency files
                const lines = content.split('\n');
                
                for (const line of lines) {
                  if (line.trim() && !line.startsWith('#')) {
                    // Extract package name (strip version info)
                    const packageName = line.trim().split(/[=><~]/)[0].trim();
                    
                    for (const lib of AI_LIBRARIES) {
                      if (packageName.toLowerCase().includes(lib.toLowerCase())) {
                        if (!aiLibrariesFound.includes(packageName)) {
                          aiLibrariesFound.push(packageName);
                          aiFrameworksFound.push(line.trim());
                        }
                      }
                    }
                  }
                }
              }
              
              if (aiLibrariesFound.length > 0) {
                aiSignals.push({
                  type: 'Dependency File',
                  path: depFile,
                  details: `AI libraries found in ${depFile}: ${aiLibrariesFound.join(', ')}`,
                  confidence: 0.9
                });
              }
            }
          } catch (error) {
            // File might not exist, continue with other checks
          }
        }
        
        // Check top-level directory structure
        try {
          const contentsResponse = await axios.get(
            `${apiUrl}/repos/${config.github_org_name}/${repo.name}/contents`,
            { headers }
          );
          
          if (contentsResponse.status === 200) {
            const contents = contentsResponse.data;
            const interestingDirs: string[] = [];
            
            // First pass: scan top level files and directories
            for (const item of contents) {
              if (item.type === 'file') {
                const fileName = item.name.toLowerCase();
                const filePath = item.path;
                
                // Check for model files - higher confidence detection
                if (AI_FILE_PATTERNS.some(pattern => pattern.test(fileName))) {
                  aiSignals.push({
                    type: 'Model File',
                    path: filePath,
                    details: `Model file detected: ${fileName}`,
                    confidence: 0.9 // High confidence for model files
                  });
                }
                
                // Check for config files that might indicate AI usage
                if (fileName === '.env' || fileName.includes('config') || fileName.includes('settings')) {
                  try {
                    // For smaller text files, we can check content for API keys
                    const fileResponse = await axios.get(item.download_url, { headers });
                    const fileContent = fileResponse.data.toString();
                    
                    if (fileContent.includes('OPENAI_API') || 
                        fileContent.includes('HUGGINGFACE_API') || 
                        fileContent.includes('GPT_') || 
                        fileContent.includes('AI_KEY')) {
                      aiSignals.push({
                        type: 'API Configuration',
                        path: filePath,
                        details: 'AI API configuration detected',
                        confidence: 0.85
                      });
                    }
                  } catch (fileError) {
                    // Couldn't read file content, continue
                  }
                }
                
                // For Jupyter notebooks, try to look at content
                if (fileName.endsWith('.ipynb')) {
                  try {
                    const notebookResponse = await axios.get(item.download_url, { headers });
                    const notebookContent = JSON.stringify(notebookResponse.data);
                    
                    // Check for AI imports
                    for (const lib of AI_LIBRARIES) {
                      if (notebookContent.toLowerCase().includes(`import ${lib.toLowerCase()}`) ||
                          notebookContent.toLowerCase().includes(`from ${lib.toLowerCase()} import`)) {
                        if (!aiLibrariesFound.includes(lib)) {
                          aiLibrariesFound.push(lib);
                        }
                        
                        aiSignals.push({
                          type: 'Notebook Import',
                          path: filePath,
                          details: `AI library import: ${lib}`,
                          confidence: 0.95
                        });
                      }
                    }
                  } catch (notebookError) {
                    // Skip notebook content analysis on error
                  }
                }
              } else if (item.type === 'dir') {
                // Check for AI/ML related directories
                if (AI_FOLDER_PATTERNS.some(pattern => pattern.test(item.path.toLowerCase()))) {
                  aiSignals.push({
                    type: 'AI Directory',
                    path: item.path,
                    details: `Directory related to AI/ML: ${item.path}`,
                    confidence: 0.7
                  });
                  
                  interestingDirs.push(item.path);
                }
              }
            }
            
            // Second pass: check interesting directories (limit to avoid rate limits)
            for (const dir of interestingDirs.slice(0, 3)) {
              try {
                const dirResponse = await axios.get(
                  `${apiUrl}/repos/${config.github_org_name}/${repo.name}/contents/${dir}`,
                  { headers }
                );
                
                for (const item of dirResponse.data) {
                  if (item.type === 'file' && 
                      AI_FILE_PATTERNS.some(pattern => pattern.test(item.name.toLowerCase()))) {
                    aiSignals.push({
                      type: 'AI Model in AI Directory',
                      path: item.path,
                      details: `AI model file in AI directory: ${item.path}`,
                      confidence: 0.95
                    });
                    
                    // Add framework flag based on file extension
                    const ext = item.name.split('.').pop()?.toLowerCase();
                    if (ext === 'h5' || ext === 'keras') {
                      if (!aiLibrariesFound.includes('tensorflow')) {
                        aiLibrariesFound.push('tensorflow');
                        aiFrameworksFound.push('tensorflow/keras (model files)');
                      }
                    } else if (ext === 'pt' || ext === 'pth') {
                      if (!aiLibrariesFound.includes('pytorch')) {
                        aiLibrariesFound.push('pytorch');
                        aiFrameworksFound.push('pytorch (model files)');
                      }
                    } else if (ext === 'onnx') {
                      if (!aiLibrariesFound.includes('onnx')) {
                        aiLibrariesFound.push('onnx');
                        aiFrameworksFound.push('onnx (model files)');
                      }
                    }
                  }
                }
              } catch (dirError) {
                // Skip on directory error
              }
              
              // Small delay to avoid API rate limits
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        } catch (contentError) {
          console.error(`Error fetching repo contents for ${repo.name}:`, contentError);
        }
        
        // Determine if repo has AI usage and calculate confidence score
        const hasAiUsage = aiSignals.length > 0 || aiLibrariesFound.length > 0;
        
        // Calculate confidence score (0-100) based on signals
        let confidenceScore = 0;
        let primaryDetectionType = '';
        
        if (hasAiUsage) {
          // Sort signals by confidence (highest first)
          const sortedSignals = [...aiSignals].sort((a, b) => b.confidence - a.confidence);
          
          if (sortedSignals.length > 0) {
            // Use the highest confidence as the base
            const highestConfidence = sortedSignals[0].confidence;
            primaryDetectionType = sortedSignals[0].type;
            
            // Adjust score based on number of signals and their confidence
            confidenceScore = Math.round(highestConfidence * 100);
            
            // Boost confidence if multiple signals
            if (sortedSignals.length > 1) {
              confidenceScore = Math.min(100, confidenceScore + 5 * (sortedSignals.length - 1));
            }
            
            // Boost confidence if libraries are found
            if (aiLibrariesFound.length > 0) {
              confidenceScore = Math.min(100, confidenceScore + 10);
            }
          } else if (aiLibrariesFound.length > 0) {
            // If only libraries are found but no signals
            confidenceScore = 85;
            primaryDetectionType = 'Library Detection';
          }
          
          reposWithAI++;
          
          // Log AI findings with confidence score
          console.log(`AI usage detected in ${repo.name} (${confidenceScore}% confidence):`);
          console.log(`- Libraries: ${aiLibrariesFound.join(', ')}`);
          console.log(`- Signals: ${aiSignals.map(s => s.type).join(', ')}`);
        }
        
        // Create a list of unique libraries
        const uniqueLibraries = Array.from(new Set(aiLibrariesFound));
        
        // Save repository scan result to database
        await db.insert(githubScanResults).values({
          scan_config_id: config.id,
          organization_id: config.organization_id,
          repository_name: repo.name,
          repository_url: repo.html_url,
          has_ai_usage: hasAiUsage,
          ai_libraries: uniqueLibraries,
          ai_frameworks: aiFrameworksFound.slice(0, 10), // Limit to avoid DB size issues
          confidence_score: confidenceScore,
          detection_type: primaryDetectionType
        });
        
        // Pause to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (repoError) {
        const errorMessage = repoError instanceof Error ? repoError.message : 'Unknown error';
        console.error(`Error scanning repository ${repo.name}:`, errorMessage);
      }
    }
    
    // Create a summary record
    await db.insert(githubScanSummaries).values({
      scan_config_id: config.id,
      organization_id: config.organization_id,
      total_repositories: repositories.length,
      repositories_with_ai: reposWithAI
    });
    
    // Update config with completed status and timestamp
    await db.update(githubScanConfigs)
      .set({ 
        status: 'completed',
        last_scan_at: new Date()
      })
      .where(eq(githubScanConfigs.id, config.id));
    
    console.log(`GitHub scan completed for ${config.github_org_name}`);
    console.log(`Found ${reposWithAI} out of ${repositories.length} repositories using AI`);
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("GitHub scan failed:", errorMessage);
    
    // Update config with error status
    await db.update(githubScanConfigs)
      .set({ status: 'failed' })
      .where(eq(githubScanConfigs.id, config.id));
    
    throw error;
  }
}

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
      const organizationId = typeof user.organization === 'object' ? user.organization.id : 
        Array.isArray(user.organization) ? user.organization[0] : user.organization_id || 1;

      // Get actual counts from database
      // Count AI Systems - count repos with AI usage from scan results
      const aiSystemsCount = await db.select({ count: sql`count(*)` })
        .from(githubScanResults)
        .where(and(
          eq(githubScanResults.organization_id, organizationId),
          eq(githubScanResults.has_ai_usage, true)
        ))
        .then(result => Number(result[0]?.count || 0));

      // Count compliance issues
      const complianceIssuesCount = await db.select({ count: sql`count(*)` })
        .from(complianceIssues)
        .where(eq(complianceIssues.organizationId, organizationId))
        .then(result => Number(result[0]?.count || 0));

      // Count open risks
      const openRisksCount = await db.select({ count: sql`count(*)` })
        .from(riskItems)
        .where(and(
          eq(riskItems.organizationId, organizationId),
          eq(riskItems.status, 'open')
        ))
        .then(result => Number(result[0]?.count || 0));

      const stats = {
        aiSystemsCount: aiSystemsCount || 0,
        complianceIssuesCount: complianceIssuesCount || 0,
        openRisksCount: openRisksCount || 0
      };

      // Get recent activities (from GitHub scan results, risks, and compliance issues)
      // First get the latest scan results
      const recentScans = await db
        .select({
          id: githubScanResults.id,
          repoName: githubScanResults.repository_name, 
          createdAt: githubScanResults.scan_date,
        })
        .from(githubScanResults)
        .where(eq(githubScanResults.organization_id, organizationId))
        .orderBy(desc(githubScanResults.scan_date))
        .limit(5);
      
      // Then get recent risk items
      const recentRisks = await db.select({
        id: riskItems.id,
        title: riskItems.title,
        createdAt: riskItems.createdAt,
      })
      .from(riskItems)
      .where(eq(riskItems.organizationId, organizationId))
      .orderBy(desc(riskItems.createdAt))
      .limit(5);
      
      // Format activities from the combined data
      const activities = [
        ...recentScans.map(scan => ({
          id: scan.id,
          type: 'info' as const,
          message: 'AI usage scan completed for',
          entity: scan.repoName,
          timestamp: scan.createdAt
        })),
        ...recentRisks.map(risk => ({
          id: risk.id + 1000, // Ensure unique IDs
          type: 'warning' as const,
          message: 'Risk item created:',
          entity: risk.title,
          timestamp: risk.createdAt
        }))
      ]
      .sort((a, b) => {
        // Handle null timestamps
        if (!a.timestamp) return 1;
        if (!b.timestamp) return -1;
        
        const dateA = a.timestamp instanceof Date ? a.timestamp : new Date(String(a.timestamp));
        const dateB = b.timestamp instanceof Date ? b.timestamp : new Date(String(b.timestamp));
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 5);

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
      // Check if user has admin permissions
      if (!req.user?.role?.permissions?.includes('admin')) {
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
      // Check if user has admin permissions
      if (!req.user?.role?.permissions?.includes('admin')) {
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
      
      // Check if user has admin permissions
      if (!req.user?.role?.permissions?.includes('admin')) {
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
      
      // Check if user has admin permissions
      if (!req.user?.role?.permissions?.includes('admin')) {
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
      // Check if user has admin role for full access
      if (req.user?.role?.permissions?.includes('admin')) {
        const rolesList = await db.select().from(roles);
        res.json(rolesList);
      } else {
        // For non-admin users, only return non-admin roles
        const rolesList = await db.select()
          .from(roles)
          .where(sql`NOT ${roles.permissions}::text[] && ARRAY['admin']::text[]`);
        res.json(rolesList);
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
      res.status(500).json({ message: "Failed to fetch roles" });
    }
  });

  // Create a new organization (tenant)
  app.post("/api/organizations", isAuthenticated, async (req, res) => {
    try {
      // Check if user has admin role
      if (!req.user.role.permissions.includes('admin')) {
        return res.status(403).json({ message: "Insufficient permissions to create organizations" });
      }

      const { name, template } = req.body;
      
      if (!name) {
        return res.status(400).json({ message: "Organization name is required" });
      }
      
      // Check if organization with this name already exists
      const existingOrg = await db.select()
        .from(organizations)
        .where(eq(organizations.name, name))
        .limit(1);
        
      if (existingOrg.length > 0) {
        return res.status(400).json({ message: "An organization with this name already exists" });
      }
      
      // Create the organization
      const [newOrg] = await db.insert(organizations)
        .values({ name })
        .returning();
        
      // If template is specified, seed the organization with demo data
      if (template === 'demo') {
        // Create demo AI systems
        const [chatbot] = await db.insert(aiSystems).values({
          name: 'AI Customer Assistant',
          description: 'Virtual assistant using GPT-4 to handle customer queries',
          type: 'LLM',
          location: 'Cloud',
          organizationId: newOrg.id,
          createdById: req.user.id,
        }).returning();
        
        const [riskEngine] = await db.insert(aiSystems).values({
          name: 'Credit Risk Engine',
          description: 'ML model for credit risk assessment',
          type: 'Classification',
          location: 'Internal',
          organizationId: newOrg.id,
          createdById: req.user.id,
        }).returning();
        
        // Add some risk items
        await db.insert(riskItems).values([
          {
            title: 'Data Privacy Risk',
            description: 'Customer data handling concerns in AI assistant',
            severity: 'high',
            status: 'open',
            aiSystemId: chatbot.id,
            organizationId: newOrg.id,
            createdById: req.user.id,
          },
          {
            title: 'Model Bias Risk',
            description: 'Potential bias in credit risk model',
            severity: 'medium',
            status: 'mitigated',
            aiSystemId: riskEngine.id,
            organizationId: newOrg.id,
            createdById: req.user.id,
          }
        ]);
        
        // Add compliance issues
        await db.insert(complianceIssues).values([
          {
            title: 'GDPR Compliance Gap',
            description: 'Missing data retention policies',
            severity: 'high',
            status: 'open',
            aiSystemId: chatbot.id,
            organizationId: newOrg.id,
            createdById: req.user.id,
          }
        ]);
      }
      
      res.status(201).json(newOrg);
    } catch (error) {
      console.error("Error creating organization:", error);
      res.status(500).json({ message: "Failed to create organization" });
    }
  });

  // API endpoints for user management
  app.get("/api/users/admins", isAuthenticated, async (req, res) => {
    try {
      // Check if user has admin permissions
      if (!req.user?.role?.permissions?.includes('admin')) {
        return res.status(403).json({ message: "Forbidden: Insufficient permissions" });
      }

      // Get all admin users
      const adminUsers = await db.query.users.findMany({
        with: {
          organization: true,
          role: true
        },
        where: (users, { eq }) => eq(users.roleId, 1)
      });
      
      res.json(adminUsers);
    } catch (error) {
      console.error("Error fetching admin users:", error);
      res.status(500).json({ message: "Failed to fetch admin users" });
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

  // GitHub Scan Configuration endpoints
  app.post("/api/github-scan/config", isAuthenticated, async (req, res) => {
    try {
      const organizationId = req.user.organization?.id || req.user.organizationId;
      
      // Validate and parse the request body
      const configData = insertGithubScanConfigSchema.parse({
        ...req.body,
        organization_id: organizationId
      });
      
      // Create the scan configuration
      const [newConfig] = await db.insert(githubScanConfigs)
        .values(configData)
        .returning();
      
      res.status(201).json(newConfig);
    } catch (error) {
      console.error("Error creating GitHub scan configuration:", error);
      res.status(500).json({ message: "Failed to create scan configuration", error: error.message });
    }
  });

  app.get("/api/github-scan/configs", isAuthenticated, async (req, res) => {
    try {
      const organizationId = req.user.organization?.id || req.user.organizationId;
      
      // Fetch scan configs for the user's organization
      const configs = await db.select({
        id: githubScanConfigs.id,
        githubOrgName: githubScanConfigs.github_org_name,
        createdAt: githubScanConfigs.created_at,
        lastScanAt: githubScanConfigs.last_scan_at,
        status: githubScanConfigs.status
      })
      .from(githubScanConfigs)
      .where(eq(githubScanConfigs.organization_id, organizationId));
      
      res.json(configs);
    } catch (error) {
      console.error("Error fetching GitHub scan configurations:", error);
      res.status(500).json({ message: "Failed to fetch scan configurations" });
    }
  });

  // GitHub Scan Results
  app.get("/api/github-scan/results", isAuthenticated, async (req, res) => {
    try {
      // Extract organization ID from user object based on structure from the auth module
      const organizationId = req.user?.organization?.[0] || 1; // Default to org ID 1 if not found
      const configId = req.query.configId ? parseInt(req.query.configId as string) : undefined;
      
      console.log(`Fetching scan results for org: ${organizationId}, configId: ${configId || 'all'}`);
      
      let query = db.select()
        .from(githubScanResults)
        .where(eq(githubScanResults.organization_id, organizationId));
      
      if (configId) {
        query = query.where(eq(githubScanResults.scan_config_id, configId));
      }
      
      const results = await query.orderBy(desc(githubScanResults.scan_date));
      
      // Transform results to match the component's expected format
      const transformedResults = results.map(result => ({
        id: result.id,
        scan_config_id: result.scan_config_id,
        repository_name: result.repository_name,
        repository_url: result.repository_url,
        has_ai_usage: result.has_ai_usage,
        ai_libraries: Array.isArray(result.ai_libraries) ? result.ai_libraries : [],
        ai_frameworks: Array.isArray(result.ai_frameworks) ? result.ai_frameworks : [],
        scan_date: result.scan_date,
        added_to_risk: result.added_to_risk,
        confidence_score: result.confidence_score !== null ? result.confidence_score : 0,
        detection_type: result.detection_type || ''
      }));
      
      console.log(`Found ${transformedResults.length} scan results`);
      res.json(transformedResults);
    } catch (error) {
      console.error("Error fetching GitHub scan results:", error);
      res.status(500).json({ message: "Failed to fetch scan results" });
    }
  });

  // GitHub Scan Summaries
  app.get("/api/github-scan/summaries", isAuthenticated, async (req, res) => {
    try {
      const organizationId = req.user.organization?.id || req.user.organizationId;
      const configId = req.query.configId ? parseInt(req.query.configId as string) : undefined;
      
      let query = db.select()
        .from(githubScanSummaries)
        .where(eq(githubScanSummaries.organization_id, organizationId));
      
      if (configId) {
        query = query.where(eq(githubScanSummaries.scan_config_id, configId));
      }
      
      const summaries = await query.orderBy(desc(githubScanSummaries.scan_date));
      
      res.json(summaries);
    } catch (error) {
      console.error("Error fetching GitHub scan summaries:", error);
      res.status(500).json({ message: "Failed to fetch scan summaries" });
    }
  });

  // Trigger a GitHub scan
  app.post("/api/github-scan/start", isAuthenticated, async (req, res) => {
    try {
      const { configId } = req.body;
      if (!configId) {
        return res.status(400).json({ message: "configId is required" });
      }
      
      const organizationId = req.user.organization?.id || req.user.organizationId;
      
      // Get the scan configuration
      const [config] = await db.select()
        .from(githubScanConfigs)
        .where(and(
          eq(githubScanConfigs.id, configId),
          eq(githubScanConfigs.organization_id, organizationId)
        ));
      
      if (!config) {
        return res.status(404).json({ message: "Scan configuration not found" });
      }
      
      // Update config status to 'scanning'
      await db.update(githubScanConfigs)
        .set({ status: 'scanning' })
        .where(eq(githubScanConfigs.id, configId));
      
      // Scan repositories asynchronously
      scanGitHubRepositories(config).catch(error => {
        console.error("Error scanning GitHub repositories:", error);
        // Update status to 'failed' in case of error
        db.update(githubScanConfigs)
          .set({ status: 'failed' })
          .where(eq(githubScanConfigs.id, configId))
          .then(() => {
            console.log(`Updated scan status to 'failed' for config ${configId}`);
          })
          .catch(err => {
            console.error("Error updating scan status:", err);
          });
      });
      
      res.json({ message: "Scan started successfully", configId });
    } catch (error) {
      console.error("Error starting GitHub scan:", error);
      res.status(500).json({ message: "Failed to start scan", error: error.message });
    }
  });

  // Add scan result to risk register
  app.post("/api/github-scan/add-to-risk", isAuthenticated, async (req, res) => {
    try {
      const { resultId } = req.body;
      if (!resultId) {
        return res.status(400).json({ message: "resultId is required" });
      }
      
      // Get organization ID from user object
      const organizationId = req.user?.organization?.[0] || 1;
      
      // Get the scan result
      const [scanResult] = await db.select()
        .from(githubScanResults)
        .where(eq(githubScanResults.id, resultId));
      
      if (!scanResult) {
        return res.status(404).json({ message: "Scan result not found" });
      }
      
      if (scanResult.added_to_risk) {
        return res.status(400).json({ message: "This result has already been added to the risk register" });
      }
      
      // Create a default AI system if none exists for the organization
      const systemName = 'GitHub Repository Scanner';
      
      // Insert a new AI system or use an existing one
      let systemId = 1;
      
      try {
        // Try to get an existing AI system
        const systems = await db
          .select()
          .from(aiSystems)
          .where(eq(aiSystems.organizationId, organizationId));
        
        if (systems && systems.length > 0) {
          systemId = systems[0].id;
        } else {
          // Create a new AI system
          const [newSystem] = await db
            .insert(aiSystems)
            .values({
              name: systemName,
              description: 'System for tracking AI usage in repositories',
              type: 'Scanner',
              location: 'Internal',
              organizationId: organizationId,
              createdById: req.user?.id || 1,
            })
            .returning();
          
          systemId = newSystem.id;
        }
      } catch (err) {
        console.error("Error managing AI systems:", err);
        // Use default system ID if there's an error
      }
      
      // Create a risk item
      const [riskItem] = await db
        .insert(riskItems)
        .values({
          title: `AI Usage in ${scanResult.repository_name}`,
          description: `AI usage detected in repository: ${scanResult.repository_name}. Libraries: ${scanResult.ai_libraries ? scanResult.ai_libraries.join(', ') : 'None'}. URL: ${scanResult.repository_url}`,
          severity: "medium",
          status: "open",
          aiSystemId: systemId,
          organizationId: organizationId,
          createdById: req.user?.id || 1,
        })
        .returning();
      
      // Mark the result as added to risk
      await db
        .update(githubScanResults)
        .set({ added_to_risk: true })
        .where(eq(githubScanResults.id, resultId));
      
      res.json({ 
        message: "Added to risk register successfully", 
        riskItemId: riskItem.id 
      });
    } catch (error) {
      console.error("Error adding scan result to risk register:", error);
      res.status(500).json({ 
        message: "Failed to add to risk register", 
        error: error.message 
      });
    }
  });

  // Risk Register API Endpoints
  
  // Get all risk items for the organization
  app.get("/api/risk-items", isAuthenticated, async (req, res) => {
    try {
      const organizationId = req.user?.organization?.[0] || 1;
      
      const items = await db
        .select()
        .from(riskItems)
        .where(eq(riskItems.organizationId, organizationId))
        .orderBy(desc(riskItems.createdAt));
      
      res.json(items);
    } catch (error) {
      console.error("Error fetching risk items:", error);
      res.status(500).json({ 
        message: "Failed to fetch risk items", 
        error: error.message 
      });
    }
  });
  
  // Get a specific risk item
  app.get("/api/risk-items/:id", isAuthenticated, async (req, res) => {
    try {
      const riskId = parseInt(req.params.id);
      const organizationId = req.user?.organization?.[0] || 1;
      
      const [risk] = await db.select()
        .from(riskItems)
        .where(
          and(
            eq(riskItems.id, riskId),
            eq(riskItems.organizationId, organizationId)
          )
        );
      
      if (!risk) {
        return res.status(404).json({ message: "Risk item not found" });
      }
      
      res.json(risk);
    } catch (error) {
      console.error("Error fetching risk item:", error);
      res.status(500).json({ message: "Failed to fetch risk item" });
    }
  });
  
  // Update a risk item
  app.patch("/api/risk-items/:id", isAuthenticated, async (req, res) => {
    try {
      const riskId = parseInt(req.params.id);
      const organizationId = req.user?.organization?.[0] || 1;
      
      // Verify risk belongs to user's organization
      const existingRisk = await db.query.riskItems.findFirst({
        where: and(
          eq(riskItems.id, riskId),
          eq(riskItems.organizationId, organizationId)
        )
      });
      
      if (!existingRisk) {
        return res.status(404).json({ message: "Risk item not found" });
      }
      
      // Update the risk item
      const [updatedRisk] = await db.update(riskItems)
        .set({
          ...req.body,
          updatedAt: new Date()
        })
        .where(eq(riskItems.id, riskId))
        .returning();
      
      res.json(updatedRisk);
    } catch (error) {
      console.error("Error updating risk item:", error);
      res.status(500).json({ message: "Failed to update risk item" });
    }
  });
  
  // Add a note to a risk item
  app.post("/api/risk-items/:id/add-note", isAuthenticated, async (req, res) => {
    try {
      const riskId = parseInt(req.params.id);
      const organizationId = req.user?.organization?.[0] || 1;
      const userId = req.user?.id || 1;
      const { note } = req.body;
      
      if (!note || typeof note !== 'string') {
        return res.status(400).json({ message: "Note is required" });
      }
      
      // Verify risk belongs to user's organization
      const existingRisk = await db.query.riskItems.findFirst({
        where: and(
          eq(riskItems.id, riskId),
          eq(riskItems.organizationId, organizationId)
        )
      });
      
      if (!existingRisk) {
        return res.status(404).json({ message: "Risk item not found" });
      }
      
      // Update with new note
      const timestamp = new Date().toISOString();
      const formattedNote = `[${timestamp}] ${note}`;
      const notes = existingRisk.notes 
        ? `${existingRisk.notes}\n\n${formattedNote}`
        : formattedNote;
      
      const [updatedRisk] = await db.update(riskItems)
        .set({ 
          notes,
          lastActionDate: new Date(),
          lastActionBy: userId,
          updatedAt: new Date()
        })
        .where(eq(riskItems.id, riskId))
        .returning();
      
      res.json(updatedRisk);
    } catch (error) {
      console.error("Error adding note to risk item:", error);
      res.status(500).json({ message: "Failed to add note to risk item" });
    }
  });

  // Create a ServiceNow ticket for a risk item
  app.post("/api/risk-items/:id/create-servicenow-ticket", isAuthenticated, async (req, res) => {
    try {
      const riskId = parseInt(req.params.id);
      const organizationId = req.user?.organization?.[0] || 1;
      const userId = req.user?.id || 1;
      
      // Verify risk belongs to user's organization
      const existingRisk = await db.query.riskItems.findFirst({
        where: and(
          eq(riskItems.id, riskId),
          eq(riskItems.organizationId, organizationId)
        )
      });
      
      if (!existingRisk) {
        return res.status(404).json({ message: "Risk item not found" });
      }
      
      // Generate mock ServiceNow ticket ID (in a real implementation, this would call the ServiceNow API)
      const ticketId = `INC${Math.floor(Math.random() * 1000000)}`;
      const timestamp = new Date().toISOString();
      
      // Add note about creating ServiceNow ticket
      const note = `[${timestamp}] Created ServiceNow ticket: ${ticketId}`;
      const notes = existingRisk.notes 
        ? `${existingRisk.notes}\n\n${note}`
        : note;
      
      // Update risk with ticket ID and note
      const [updatedRisk] = await db.update(riskItems)
        .set({ 
          serviceNowTicketId: ticketId,
          notes,
          lastActionDate: new Date(),
          lastActionBy: userId,
          updatedAt: new Date()
        })
        .where(eq(riskItems.id, riskId))
        .returning();
      
      res.json({
        ...updatedRisk,
        message: "ServiceNow integration coming soon. This is a placeholder ticket ID."
      });
    } catch (error) {
      console.error("Error creating ServiceNow ticket:", error);
      res.status(500).json({ message: "Failed to create ServiceNow ticket" });
    }
  });

  // Accept a risk item
  app.post("/api/risk-items/:id/accept", isAuthenticated, async (req, res) => {
    try {
      const riskId = parseInt(req.params.id);
      const organizationId = req.user?.organization?.[0] || 1;
      const userId = req.user?.id || 1;
      
      // Verify risk belongs to user's organization
      const existingRisk = await db.query.riskItems.findFirst({
        where: and(
          eq(riskItems.id, riskId),
          eq(riskItems.organizationId, organizationId)
        )
      });
      
      if (!existingRisk) {
        return res.status(404).json({ message: "Risk item not found" });
      }
      
      // Add acceptance note
      const timestamp = new Date().toISOString();
      const note = `[${timestamp}] Risk accepted`;
      const notes = existingRisk.notes 
        ? `${existingRisk.notes}\n\n${note}`
        : note;
      
      // Update risk as accepted
      const [updatedRisk] = await db.update(riskItems)
        .set({ 
          isAccepted: true,
          isFlagged: false, // Clear flagged status if present
          notes,
          lastActionDate: new Date(),
          lastActionBy: userId,
          updatedAt: new Date()
        })
        .where(eq(riskItems.id, riskId))
        .returning();
      
      res.json(updatedRisk);
    } catch (error) {
      console.error("Error accepting risk item:", error);
      res.status(500).json({ message: "Failed to accept risk item" });
    }
  });

  // Flag a risk item
  app.post("/api/risk-items/:id/flag", isAuthenticated, async (req, res) => {
    try {
      const riskId = parseInt(req.params.id);
      const organizationId = req.user?.organization?.[0] || 1;
      const userId = req.user?.id || 1;
      
      // Verify risk belongs to user's organization
      const existingRisk = await db.query.riskItems.findFirst({
        where: and(
          eq(riskItems.id, riskId),
          eq(riskItems.organizationId, organizationId)
        )
      });
      
      if (!existingRisk) {
        return res.status(404).json({ message: "Risk item not found" });
      }
      
      // Add flag note
      const timestamp = new Date().toISOString();
      const note = `[${timestamp}] Risk flagged for review`;
      const notes = existingRisk.notes 
        ? `${existingRisk.notes}\n\n${note}`
        : note;
      
      // Update risk as flagged
      const [updatedRisk] = await db.update(riskItems)
        .set({ 
          isFlagged: true,
          isAccepted: false, // Clear accepted status if present
          notes,
          lastActionDate: new Date(),
          lastActionBy: userId,
          updatedAt: new Date()
        })
        .where(eq(riskItems.id, riskId))
        .returning();
      
      res.json(updatedRisk);
    } catch (error) {
      console.error("Error flagging risk item:", error);
      res.status(500).json({ message: "Failed to flag risk item" });
    }
  });
  
  // Get risk items summary for risk assessment chart
  app.get("/api/risk-items/summary", isAuthenticated, async (req, res) => {
    try {
      // Fix: Properly get organizationId from the user object
      const organizationId = req.user?.organization?.id || 1;
      
      // Get total risks count
      const totalRisksResult = await db.select({ count: sql`count(*)` })
        .from(riskItems)
        .where(eq(riskItems.organizationId, organizationId));
      const totalRisks = Number(totalRisksResult[0]?.count || 0);
      
      // Get flagged risks count
      const flaggedRisksResult = await db.select({ count: sql`count(*)` })
        .from(riskItems)
        .where(and(
          eq(riskItems.organizationId, organizationId),
          eq(riskItems.isFlagged, true)
        ));
      const flaggedRisks = Number(flaggedRisksResult[0]?.count || 0);
      
      // Get accepted risks count
      const acceptedRisksResult = await db.select({ count: sql`count(*)` })
        .from(riskItems)
        .where(and(
          eq(riskItems.organizationId, organizationId),
          eq(riskItems.isAccepted, true)
        ));
      const acceptedRisks = Number(acceptedRisksResult[0]?.count || 0);
      
      // Get open risks count
      const openRisksResult = await db.select({ count: sql`count(*)` })
        .from(riskItems)
        .where(and(
          eq(riskItems.organizationId, organizationId),
          eq(riskItems.status, 'open')
        ));
      const openRisks = Number(openRisksResult[0]?.count || 0);
      
      res.json({
        totalRisks,
        flaggedRisks,
        acceptedRisks,
        openRisks
      });
    } catch (error) {
      console.error("Error fetching risk items summary:", error);
      res.status(500).json({ message: "Failed to fetch risk items summary" });
    }
  });
  
  // Bias Analysis API Endpoints
  
  // Get all bias analysis scans for the organization
  app.get("/api/bias-analysis/scans", isAuthenticated, async (req, res) => {
    try {
      // Extract organization ID from user object based on structure from the auth module
      const organizationId = req.user?.organization?.[0] || 1; // Default to org ID 1 if not found
      
      const scans = await db.select()
        .from(biasAnalysisScans)
        .where(eq(biasAnalysisScans.organizationId, organizationId))
        .orderBy(desc(biasAnalysisScans.startedAt));
      
      res.json(scans);
    } catch (error) {
      console.error("Error fetching bias analysis scans:", error);
      res.status(500).json({ message: "Failed to fetch bias analysis scans" });
    }
  });
  
  // Get a specific bias analysis scan with its results
  app.get("/api/bias-analysis/scans/:scanId", isAuthenticated, async (req, res) => {
    try {
      const scanId = parseInt(req.params.scanId);
      const organizationId = req.user?.organization?.[0] || 1;
      
      // Get the scan
      const [scan] = await db.select()
        .from(biasAnalysisScans)
        .where(
          and(
            eq(biasAnalysisScans.id, scanId),
            eq(biasAnalysisScans.organizationId, organizationId)
          )
        );
      
      if (!scan) {
        return res.status(404).json({ message: "Bias analysis scan not found" });
      }
      
      // Get the results
      const results = await db.select()
        .from(biasAnalysisResults)
        .where(eq(biasAnalysisResults.scanId, scanId))
        .orderBy(asc(biasAnalysisResults.metricName));
      
      // Group results by demographic group
      const resultsByGroup = {};
      results.forEach(result => {
        const group = result.demographicGroup || "overall";
        if (!resultsByGroup[group]) {
          resultsByGroup[group] = [];
        }
        resultsByGroup[group].push(result);
      });
      
      res.json({
        scan,
        resultsByGroup
      });
    } catch (error) {
      console.error("Error fetching bias analysis scan:", error);
      res.status(500).json({ message: "Failed to fetch bias analysis scan details" });
    }
  });
  
  // Create a new bias analysis scan
  app.post("/api/bias-analysis/scans", isAuthenticated, async (req, res) => {
    try {
      // Get organizationId from the organization property (which is an array in the format [id, name, created_at])
      const organizationArray = req.user?.organization;
      const organizationId = organizationArray && Array.isArray(organizationArray) ? organizationArray[0] : 1;
      
      // Use the user ID or default to 2 (demo_user)
      const userId = req.user?.id || 2;
      
      const { name, description, dataSource } = req.body;
      
      if (!name || !dataSource) {
        return res.status(400).json({ message: "Name and data source are required" });
      }
      
      // Create the scan
      const [scan] = await db.insert(biasAnalysisScans)
        .values({
          name,
          description: description || null,
          dataSource,
          status: "pending",
          organizationId,
          createdBy: userId
        })
        .returning();
      
      res.status(201).json(scan);
    } catch (error) {
      console.error("Error creating bias analysis scan:", error);
      res.status(500).json({ message: "Failed to create bias analysis scan" });
    }
  });
  
  // Process a bias analysis scan (CSV/JSON upload or webhook data)
  app.post("/api/bias-analysis/scans/:scanId/process", isAuthenticated, async (req, res) => {
    try {
      const scanId = parseInt(req.params.scanId);
      const organizationId = req.user?.organization?.[0] || 1;
      
      // Get the scan
      const [scan] = await db.select()
        .from(biasAnalysisScans)
        .where(
          and(
            eq(biasAnalysisScans.id, scanId),
            eq(biasAnalysisScans.organizationId, organizationId)
          )
        );
      
      if (!scan) {
        return res.status(404).json({ message: "Bias analysis scan not found" });
      }
      
      if (scan.status !== "pending") {
        return res.status(400).json({ message: "Can only process scans in pending status" });
      }
      
      // Update scan to processing status
      await db.update(biasAnalysisScans)
        .set({ status: "processing" })
        .where(eq(biasAnalysisScans.id, scanId));
      
      // Determine the data source and how to process it
      let dataToAnalyze = null;
      
      if (scan.dataSource === "json") {
        // Use fileData for json data
        if (!req.body.fileData) {
          return res.status(400).json({ message: "JSON data is required" });
        }
        
        try {
          // Try to parse the JSON data
          if (typeof req.body.fileData === 'string') {
            // Check if the data starts with HTML DOCTYPE (which would indicate an HTML file was uploaded)
            if (req.body.fileData.trim().startsWith('<!DOCTYPE') || req.body.fileData.trim().startsWith('<html')) {
              return res.status(400).json({ message: "Invalid JSON format. Uploaded file appears to be HTML." });
            }
            
            dataToAnalyze = JSON.parse(req.body.fileData);
          } else {
            dataToAnalyze = req.body.fileData;
          }
        } catch (error) {
          console.error("Error parsing JSON:", error);
          return res.status(400).json({ 
            message: `Invalid JSON format: ${error.message}` 
          });
        }
      } else if (scan.dataSource === "csv") {
        if (!req.body.fileData) {
          return res.status(400).json({ message: "CSV data is required" });
        }
        
        try {
          // Check if the data starts with HTML DOCTYPE (which would indicate an HTML file was uploaded)
          if (req.body.fileData.trim().startsWith('<!DOCTYPE') || req.body.fileData.trim().startsWith('<html')) {
            return res.status(400).json({ message: "Invalid CSV format. Uploaded file appears to be HTML." });
          }
          
          // Convert CSV to JSON
          const csvData = req.body.fileData;
          // Simple CSV parsing (for production, use a proper CSV parser)
          const lines = csvData.split("\n");
          
          if (lines.length === 0) {
            return res.status(400).json({ message: "CSV data is empty" });
          }
          
          const headers = lines[0].split(",").map(h => h.trim());
          dataToAnalyze = [];
          
          for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            const values = line.split(",").map(v => v.trim());
            const dataRow = {};
            
            headers.forEach((header, idx) => {
              dataRow[header] = values[idx] || null;
            });
            
            dataToAnalyze.push(dataRow);
          }
          
          if (dataToAnalyze.length === 0) {
            return res.status(400).json({ message: "No valid data rows found in CSV" });
          }
        } catch (error) {
          console.error("Error parsing CSV:", error);
          return res.status(400).json({ 
            message: `Invalid CSV format: ${error.message}` 
          });
        }
      } else if (scan.dataSource === "webhook") {
        // For webhook data source, we need a webhook URL
        if (!req.body.webhookUrl) {
          return res.status(400).json({ message: "Webhook URL is required" });
        }
        
        try {
          // Use the webhook URL to fetch data
          const webhookResponse = await fetch(req.body.webhookUrl);
          
          if (!webhookResponse.ok) {
            return res.status(400).json({ 
              message: `Failed to fetch data from webhook: ${webhookResponse.statusText}` 
            });
          }
          
          // Try to parse the webhook response as JSON
          const webhookData = await webhookResponse.json();
          dataToAnalyze = webhookData;
        } catch (error) {
          console.error("Error fetching from webhook:", error);
          return res.status(400).json({ 
            message: `Error fetching from webhook: ${error.message}` 
          });
        }
      }
      
      if (!dataToAnalyze || (Array.isArray(dataToAnalyze) && dataToAnalyze.length === 0)) {
        await db.update(biasAnalysisScans)
          .set({ status: "failed", completedAt: new Date() })
          .where(eq(biasAnalysisScans.id, scanId));
          
        return res.status(400).json({ message: "No data to analyze" });
      }
      
      // For demonstration, we'll perform bias analysis on the data
      // In production, this would be a more sophisticated algorithm
      const biasResults = await analyzeBiasInData(dataToAnalyze, scanId, organizationId);
      
      // Update scan to completed status
      await db.update(biasAnalysisScans)
        .set({ status: "completed", completedAt: new Date() })
        .where(eq(biasAnalysisScans.id, scanId));
      
      res.json({
        message: "Bias analysis completed successfully",
        scanId,
        resultCount: biasResults.length
      });
    } catch (error) {
      console.error("Error processing bias analysis:", error);
      
      // Update scan to failed status
      await db.update(biasAnalysisScans)
        .set({ status: "failed", completedAt: new Date() })
        .where(eq(biasAnalysisScans.id, parseInt(req.params.scanId)));
        
      res.status(500).json({ message: "Failed to process bias analysis" });
    }
  });
  
  // Bias analysis function
  async function analyzeBiasInData(data, scanId, organizationId) {
    // This is a simplified bias analysis algorithm
    // In a real system, this would use proper statistical methods and ML techniques
    
    const results = [];
    
    // Add a gender bias test
    if (Array.isArray(data) && data.length > 0) {
      // Check if we have gender data
      const hasGenderField = data.some(row => 
        row.gender || row.Gender || row.sex || row.Sex || 
        Object.keys(row).some(key => key.toLowerCase().includes('gender') || key.toLowerCase().includes('sex'))
      );
      
      if (hasGenderField) {
        // Group by gender
        const genderGroups = {};
        const genderKey = Object.keys(data[0]).find(k => 
          k.toLowerCase().includes('gender') || k.toLowerCase().includes('sex')
        ) || 'gender';
        
        data.forEach(row => {
          const gender = (row[genderKey] || 'unknown').toLowerCase();
          if (!genderGroups[gender]) {
            genderGroups[gender] = 0;
          }
          genderGroups[gender]++;
        });
        
        // Calculate gender distribution
        const totalCount = Object.values(genderGroups).reduce((sum, count) => sum + count, 0);
        const genders = Object.keys(genderGroups);
        
        // Check for representation bias
        if (genders.length > 1) {
          const percentages = {};
          let maxPct = 0;
          let minPct = 100;
          
          genders.forEach(gender => {
            const pct = (genderGroups[gender] / totalCount) * 100;
            percentages[gender] = pct;
            maxPct = Math.max(maxPct, pct);
            minPct = Math.min(minPct, pct);
          });
          
          // Calculate bias score based on difference between max and min percentages
          const balanceScore = 100 - Math.min(100, (maxPct - minPct) * 2);
          
          // Add a result for gender representation bias
          const genderResult = {
            scanId,
            organizationId,
            metricName: "Gender Representation",
            metricDescription: "Measures balance in gender representation across the dataset",
            score: balanceScore,
            threshold: 70, // Threshold for passing
            status: balanceScore >= 70 ? "pass" : balanceScore >= 50 ? "warning" : "fail",
            demographicGroup: "overall",
            additionalData: JSON.stringify({ 
              percentages,
              totalSamples: totalCount 
            })
          };
          
          results.push(genderResult);
          
          // Save the result to the database
          await db.insert(biasAnalysisResults).values(genderResult);
        }
      }
      
      // Add other bias checks like age, ethnicity, etc. following similar patterns
      // ...
      
      // Example: Add a data completeness metric
      let totalFields = 0;
      let emptyFields = 0;
      
      data.forEach(row => {
        Object.values(row).forEach(value => {
          totalFields++;
          if (value === null || value === undefined || value === "") {
            emptyFields++;
          }
        });
      });
      
      const completenessScore = 100 - Math.min(100, (emptyFields / totalFields) * 100);
      
      const completenessResult = {
        scanId,
        organizationId,
        metricName: "Data Completeness",
        metricDescription: "Measures the completeness of the dataset, which can impact bias",
        score: completenessScore,
        threshold: 80,
        status: completenessScore >= 80 ? "pass" : completenessScore >= 60 ? "warning" : "fail",
        demographicGroup: "overall",
        additionalData: JSON.stringify({
          totalFields,
          emptyFields,
          completenessRate: ((totalFields - emptyFields) / totalFields).toFixed(2)
        })
      };
      
      results.push(completenessResult);
      
      // Save the result to the database
      await db.insert(biasAnalysisResults).values(completenessResult);
    }
    
    return results;
  }

  // =================== Frontier Model Alert API Routes ===================
  
  // Get all frontier models
  app.get("/api/frontier-models", isAuthenticated, async (req, res) => {
    try {
      // Regular users can see all frontier models
      const models = await db.query.frontierModels.findMany({
        with: {
          organization: true,
          createdBy: {
            columns: {
              id: true,
              username: true,
              first_name: true,
              last_name: true
            }
          }
        },
        orderBy: [desc(frontierModels.created_at)]
      });
      
      res.json(models);
    } catch (error) {
      console.error("Error fetching frontier models:", error);
      res.status(500).json({ message: "Failed to fetch frontier models" });
    }
  });

  // Create frontier model (admin org only)
  app.post("/api/frontier-models", isAuthenticated, async (req, res) => {
    try {
      // Check if user is from admin org and has admin permissions
      if (!req.user?.role?.permissions?.includes('admin')) {
        return res.status(403).json({ message: "Only admin users can create frontier models" });
      }

      // Validate data
      const modelData = insertFrontierModelSchema.parse(req.body);
      
      // Add created_by_id and organization_id
      const orgId = req.user.organization[0];
      const createdById = req.user.id;
      
      // Create frontier model
      const [newModel] = await db.insert(frontierModels)
        .values({
          ...modelData,
          created_by_id: createdById,
          organization_id: orgId
        })
        .returning();
      
      res.status(201).json(newModel);
    } catch (error) {
      console.error("Error creating frontier model:", error);
      res.status(500).json({ message: "Failed to create frontier model" });
    }
  });

  // Get a specific frontier model
  app.get("/api/frontier-models/:id", isAuthenticated, async (req, res) => {
    try {
      const modelId = parseInt(req.params.id);
      
      const [model] = await db.select()
        .from(frontierModels)
        .where(eq(frontierModels.id, modelId));
      
      if (!model) {
        return res.status(404).json({ message: "Frontier model not found" });
      }
      
      res.json(model);
    } catch (error) {
      console.error("Error fetching frontier model:", error);
      res.status(500).json({ message: "Failed to fetch frontier model" });
    }
  });

  // Update a frontier model (admin org only)
  app.patch("/api/frontier-models/:id", isAuthenticated, async (req, res) => {
    try {
      const modelId = parseInt(req.params.id);
      
      // Check if user is from admin org and has admin permissions
      if (!req.user?.role?.permissions?.includes('admin')) {
        return res.status(403).json({ message: "Only admin users can update frontier models" });
      }
      
      // Validate data
      const modelData = insertFrontierModelSchema.partial().parse(req.body);
      
      // Update model
      const [updatedModel] = await db.update(frontierModels)
        .set(modelData)
        .where(eq(frontierModels.id, modelId))
        .returning();
      
      if (!updatedModel) {
        return res.status(404).json({ message: "Frontier model not found" });
      }
      
      res.json(updatedModel);
    } catch (error) {
      console.error("Error updating frontier model:", error);
      res.status(500).json({ message: "Failed to update frontier model" });
    }
  });

  // Delete a frontier model (admin org only)
  app.delete("/api/frontier-models/:id", isAuthenticated, async (req, res) => {
    try {
      const modelId = parseInt(req.params.id);
      
      // Check if user is from admin org and has admin permissions
      if (!req.user?.role?.permissions?.includes('admin')) {
        return res.status(403).json({ message: "Only admin users can delete frontier models" });
      }
      
      // Delete model
      await db.delete(frontierModels)
        .where(eq(frontierModels.id, modelId));
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting frontier model:", error);
      res.status(500).json({ message: "Failed to delete frontier model" });
    }
  });

  // =================== Frontier Model Alert API Routes ===================
  
  // Get all alerts for a user's organization
  app.get("/api/frontier-model-alerts", isAuthenticated, async (req, res) => {
    try {
      const orgId = req.user.organization.id;
      
      const alerts = await db.query.frontierModelAlerts.findMany({
        where: eq(frontierModelAlerts.organization_id, orgId),
        with: {
          model: true,
          user: {
            columns: {
              id: true,
              username: true,
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: [desc(frontierModelAlerts.created_at)]
      });
      
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching frontier model alerts:", error);
      res.status(500).json({ message: "Failed to fetch frontier model alerts" });
    }
  });

  // Create a frontier model alert
  app.post("/api/frontier-model-alerts", isAuthenticated, async (req, res) => {
    try {
      console.log("User object:", JSON.stringify(req.user, null, 2));
      
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Extract organization ID from user object
      const orgId = req.user.organization?.id;
      const userId = req.user.id;
      
      if (!orgId || !userId) {
        return res.status(400).json({ 
          message: "Missing organization or user data",
          user: req.user
        });
      }
      
      // Prepare alert data with user and organization ID
      const alertData = {
        ...req.body,
        userId: userId,
        organizationId: orgId
      };
      
      // Validate the combined data
      const validatedData = insertFrontierModelAlertSchema.parse(alertData);
      
      // Create alert
      const [newAlert] = await db.insert(frontierModelAlerts)
        .values(validatedData)
        .returning();
      
      res.status(201).json(newAlert);
    } catch (error) {
      console.error("Error creating frontier model alert:", error);
      res.status(500).json({ message: "Failed to create frontier model alert" });
    }
  });

  // Update a frontier model alert
  app.patch("/api/frontier-model-alerts/:id", isAuthenticated, async (req, res) => {
    try {
      const alertId = parseInt(req.params.id);
      const orgId = req.user.organization.id;
      
      // Validate data
      const alertData = insertFrontierModelAlertSchema.partial().parse(req.body);
      
      // Ensure user can only update their organization's alerts
      const [alert] = await db.select()
        .from(frontierModelAlerts)
        .where(and(
          eq(frontierModelAlerts.id, alertId),
          eq(frontierModelAlerts.organization_id, orgId)
        ));
      
      if (!alert) {
        return res.status(404).json({ message: "Alert not found or you don't have permission to update it" });
      }
      
      // Update alert
      const [updatedAlert] = await db.update(frontierModelAlerts)
        .set(alertData)
        .where(eq(frontierModelAlerts.id, alertId))
        .returning();
      
      res.json(updatedAlert);
    } catch (error) {
      console.error("Error updating frontier model alert:", error);
      res.status(500).json({ message: "Failed to update frontier model alert" });
    }
  });

  // Delete a frontier model alert
  app.delete("/api/frontier-model-alerts/:id", isAuthenticated, async (req, res) => {
    try {
      const alertId = parseInt(req.params.id);
      const orgId = req.user.organization.id;
      
      // Ensure user can only delete their organization's alerts
      const [alert] = await db.select()
        .from(frontierModelAlerts)
        .where(and(
          eq(frontierModelAlerts.id, alertId),
          eq(frontierModelAlerts.organization_id, orgId)
        ));
      
      if (!alert) {
        return res.status(404).json({ message: "Alert not found or you don't have permission to delete it" });
      }
      
      // Delete alert
      await db.delete(frontierModelAlerts)
        .where(eq(frontierModelAlerts.id, alertId));
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting frontier model alert:", error);
      res.status(500).json({ message: "Failed to delete frontier model alert" });
    }
  });

  // =================== Frontier Model Updates API Routes ===================
  
  // Get latest updates across all models for the dashboard widget
  app.get("/api/frontier-model-updates/latest", isAuthenticated, async (req, res) => {
    try {
      // Simply get the latest 10 updates of any type, sorted by date
      const updates = await db.select({
        id: frontierModelUpdates.id,
        title: frontierModelUpdates.title,
        description: frontierModelUpdates.description,
        update_type: frontierModelUpdates.update_type,
        source_url: frontierModelUpdates.source_url,
        update_date: frontierModelUpdates.update_date,
        published_date: frontierModelUpdates.published_date,
        frontier_model_id: frontierModelUpdates.frontier_model_id,
        model: {
          id: frontierModels.id,
          name: frontierModels.name,
          provider: frontierModels.provider
        }
      })
      .from(frontierModelUpdates)
      .innerJoin(frontierModels, eq(frontierModelUpdates.frontier_model_id, frontierModels.id))
      .orderBy(desc(frontierModelUpdates.update_date))
      .limit(10);
      
      res.json(updates);
    } catch (error) {
      console.error("Error fetching latest frontier model updates:", error);
      res.status(500).json({ message: "Failed to fetch latest frontier model updates" });
    }
  });

  // Get all updates for a specific frontier model
  app.get("/api/frontier-model-updates/:modelId", isAuthenticated, async (req, res) => {
    try {
      // Make sure modelId is a valid number
      const modelIdParam = req.params.modelId;
      
      if (!modelIdParam || isNaN(Number(modelIdParam))) {
        return res.status(400).json({ message: "Invalid model ID provided" });
      }
      
      const modelId = parseInt(modelIdParam);
      
      const updates = await db.select({
        id: frontierModelUpdates.id,
        title: frontierModelUpdates.title,
        description: frontierModelUpdates.description,
        update_type: frontierModelUpdates.update_type,
        source_url: frontierModelUpdates.source_url,
        update_date: frontierModelUpdates.update_date,
        published_date: frontierModelUpdates.published_date,
        frontier_model_id: frontierModelUpdates.frontier_model_id,
        created_at: frontierModelUpdates.created_at
      })
      .from(frontierModelUpdates)
      .where(eq(frontierModelUpdates.frontier_model_id, modelId))
      .orderBy(desc(frontierModelUpdates.update_date));
      
      res.json(updates);
    } catch (error) {
      console.error("Error fetching frontier model updates:", error);
      res.status(500).json({ message: "Failed to fetch frontier model updates" });
    }
  });
  
  // This endpoint would be called by a scheduled job or UI button to scrape and update frontier model information
  app.post("/api/frontier-model-updates/scrape/:modelId", isAuthenticated, async (req, res) => {
    try {
      const modelId = parseInt(req.params.modelId);
      
      // Check if user is from admin org and has admin permissions
      if (!req.user?.role?.permissions?.includes('admin')) {
        return res.status(403).json({ message: "Only admin users can trigger update scraping" });
      }
      
      // Get the frontier model
      const [model] = await db.select()
        .from(frontierModels)
        .where(eq(frontierModels.id, modelId));
      
      if (!model) {
        return res.status(404).json({ message: "Frontier model not found" });
      }
      
      // Use our new advanced scraper to fetch model updates and persist them to DB
      const updatesCount = await scrapeAndPersistModelUpdates(modelId);
      
      res.status(201).json({ 
        message: "Model updates scraped and stored successfully", 
        count: updatesCount 
      });
    } catch (error) {
      console.error("Error scraping frontier model updates:", error);
      res.status(500).json({ message: "Failed to scrape frontier model updates" });
    }
  });
  
  // New endpoint to trigger scraping for all models at once (for admin use or scheduled cron jobs)
  app.post("/api/frontier-model-updates/scrape-all", isAuthenticated, async (req, res) => {
    try {
      // Check if user is from admin org and has admin permissions
      if (!req.user?.role?.permissions?.includes('admin')) {
        return res.status(403).json({ message: "Only admin users can trigger update scraping" });
      }
      
      // Use our scraper to fetch updates for all models
      const updatesCount = await scrapeAndPersistModelUpdates();
      
      res.status(201).json({ 
        message: "Updates for all models scraped and stored successfully", 
        count: updatesCount 
      });
    } catch (error) {
      console.error("Error scraping frontier model updates:", error);
      res.status(500).json({ message: "Failed to scrape frontier model updates" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
