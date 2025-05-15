import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { db } from "./db";
import { eq, and, count, sum, asc, desc, SQL, sql } from "drizzle-orm";
import axios from 'axios';
import { 
  users, 
  roles, 
  organizations, 
  aiSystems,
  riskItems,
  riskMitigations,
  complianceIssues,
  githubScanConfigs,
  githubScanResults,
  githubScanSummaries,
  biasAnalysisScans,
  biasAnalysisResults,
  frontierModelsList,
  frontierModelsAlertsConfig,
  frontierModelsAlerts,
  infraInventory,
  insertUserSchema,
  insertOrganizationSchema,
  insertRoleSchema,
  insertAiSystemSchema,
  insertRiskItemSchema,
  insertRiskMitigationSchema,
  insertComplianceIssueSchema,
  insertInfraInventorySchema,
  insertGithubScanConfigSchema,
  insertBiasAnalysisScanSchema,
  insertBiasAnalysisResultSchema,
  insertFrontierModelSchema,
  insertFrontierModelsAlertsConfigSchema,
  insertFrontierModelsAlertsSchema
} from "@shared/schema";
import { isAuthenticated } from "./auth";

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
  
  // Real OpenAI Chat API for Incognito ChatGPT
  app.post("/api/mock-chat", isAuthenticated, async (req, res) => {
    try {
      const { prompt, fileId } = req.body;
      const user = req.user;
      
      if (!prompt || !user) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      
      // Extract organization ID safely, handling different user object structures
      let organizationId: number;
      if (typeof user.organization === 'object' && user.organization !== null) {
        organizationId = user.organization.id;
      } else if (user.organizationId) {
        organizationId = user.organizationId;
      } else {
        organizationId = 1; // Default to organization ID 1 if not found
      }
      
      // If a file ID was provided, get the file content
      let fileContent: string | undefined = undefined;
      if (fileId) {
        const file = await storage.getDataStoreFileById(fileId);
        if (file && file.type === 'file') {
          fileContent = file.content;
        }
      }
      
      // Get response from OpenAI
      const { generateChatResponse } = await import('./openai');
      const response = await generateChatResponse(prompt, fileContent);
      
      // Store the prompt and response
      const promptAnswer = await storage.createPromptAnswer({
        prompt,
        response,
        userId: typeof user.id === 'number' ? user.id : 
                (user as any).id || 1, // Fallback user ID if type issues
        organizationId
      });
      
      return res.status(200).json(promptAnswer);
    } catch (error: unknown) {
      console.error("Chat API error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return res.status(500).json({ error: `Failed to process chat request: ${errorMessage}` });
    }
  });
  
  // Data Store Files API for Incognito ChatGPT
  app.get("/api/data-store", isAuthenticated, async (req, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const parentId = req.query.parentId ? parseInt(req.query.parentId as string) : undefined;
      
      const files = await storage.getDataStoreFiles(user.id, parentId);
      return res.status(200).json(files);
    } catch (error) {
      console.error("Data store files error:", error);
      return res.status(500).json({ error: "Failed to get data store files" });
    }
  });
  
  app.post("/api/data-store", isAuthenticated, async (req, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const organizationId = typeof user.organization === 'object' ? user.organization.id : 
        Array.isArray(user.organization) ? user.organization[0] : user.organization_id || 1;
      
      const { name, path, content, type, parentId } = req.body;
      
      if (!name || !type) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      
      const file = await storage.createDataStoreFile({
        name,
        path: path || name,
        content: content || "",
        type,
        userId: user.id,
        organizationId,
        parentId
      });
      
      return res.status(201).json(file);
    } catch (error) {
      console.error("Create data store file error:", error);
      return res.status(500).json({ error: "Failed to create data store file" });
    }
  });
  
  app.put("/api/data-store/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = req.user;
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const fileData = req.body;
      
      const file = await storage.updateDataStoreFile(id, fileData);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      
      return res.status(200).json(file);
    } catch (error) {
      console.error("Update data store file error:", error);
      return res.status(500).json({ error: "Failed to update data store file" });
    }
  });
  
  app.delete("/api/data-store/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = req.user;
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const success = await storage.deleteDataStoreFile(id);
      if (!success) {
        return res.status(404).json({ error: "File not found" });
      }
      
      return res.status(204).send();
    } catch (error) {
      console.error("Delete data store file error:", error);
      return res.status(500).json({ error: "Failed to delete data store file" });
    }
  });

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
  
  // Get all risk items for the organization with their latest mitigation
  app.get("/api/risk-items", isAuthenticated, async (req, res) => {
    try {
      const organizationId = req.user?.organization?.[0] || 1;
      
      // Get all risk items
      const items = await db
        .select()
        .from(riskItems)
        .where(eq(riskItems.organizationId, organizationId))
        .orderBy(desc(riskItems.createdAt));
      
      // For each risk item, get the latest mitigation
      const enrichedItems = await Promise.all(items.map(async (item) => {
        const latestMitigations = await db.query.riskMitigations.findMany({
          where: and(
            eq(riskMitigations.riskItemId, item.id),
            eq(riskMitigations.organizationId, organizationId)
          ),
          orderBy: desc(riskMitigations.createdAt),
          limit: 1
        });
        
        const latestMitigation = latestMitigations.length > 0 ? latestMitigations[0] : null;
        
        return {
          ...item,
          latestMitigation
        };
      }));
      
      res.json(enrichedItems);
    } catch (error) {
      console.error("Error fetching risk items:", error);
      res.status(500).json({ 
        message: "Failed to fetch risk items", 
        error: error.message 
      });
    }
  });

  // Get a specific risk item with its mitigations
  app.get("/api/risk-items/:id", isAuthenticated, async (req, res) => {
    try {
      const riskId = parseInt(req.params.id);
      const organizationId = req.user?.organization?.[0] || 1;
      
      // Get the risk item
      const [riskItem] = await db
        .select()
        .from(riskItems)
        .where(and(
          eq(riskItems.id, riskId),
          eq(riskItems.organizationId, organizationId)
        ));
      
      if (!riskItem) {
        return res.status(404).json({ message: "Risk item not found" });
      }
      
      // Get the mitigations for this risk item
      const mitigations = await db
        .select()
        .from(riskMitigations)
        .where(and(
          eq(riskMitigations.riskItemId, riskId),
          eq(riskMitigations.organizationId, organizationId)
        ))
        .orderBy(desc(riskMitigations.createdAt));
      
      // Return both the risk item and its mitigations
      res.json({
        riskItem,
        mitigations
      });
    } catch (error) {
      console.error("Error fetching risk item details:", error);
      res.status(500).json({ 
        message: "Failed to fetch risk item details", 
        error: error.message 
      });
    }
  });

  // Create a new risk item
  app.post("/api/risk-items", isAuthenticated, async (req, res) => {
    try {
      const organizationId = req.user?.organization?.[0] || 1;
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Create the risk item
      const [newRiskItem] = await db
        .insert(riskItems)
        .values({
          ...req.body,
          organizationId,
          createdById: userId,
        })
        .returning();
      
      res.status(201).json(newRiskItem);
    } catch (error) {
      console.error("Error creating risk item:", error);
      res.status(500).json({ 
        message: "Failed to create risk item", 
        error: error.message 
      });
    }
  });
  
  // Update a risk item
  app.put("/api/risk-items/:id", isAuthenticated, async (req, res) => {
    try {
      const riskId = parseInt(req.params.id);
      const organizationId = req.user?.organization?.[0] || 1;
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Check if the risk item exists and belongs to the user's organization
      const [existingRisk] = await db
        .select()
        .from(riskItems)
        .where(and(
          eq(riskItems.id, riskId),
          eq(riskItems.organizationId, organizationId)
        ));
      
      if (!existingRisk) {
        return res.status(404).json({ message: "Risk item not found" });
      }
      
      // Update the risk item
      const [updatedRiskItem] = await db
        .update(riskItems)
        .set({
          ...req.body,
          updatedAt: new Date(),
        })
        .where(and(
          eq(riskItems.id, riskId),
          eq(riskItems.organizationId, organizationId)
        ))
        .returning();
      
      res.json(updatedRiskItem);
    } catch (error) {
      console.error("Error updating risk item:", error);
      res.status(500).json({ 
        message: "Failed to update risk item", 
        error: error.message 
      });
    }
  });
  
  // Delete a risk item and its mitigations
  app.delete("/api/risk-items/:id", isAuthenticated, async (req, res) => {
    try {
      const riskId = parseInt(req.params.id);
      const organizationId = req.user?.organization?.[0] || 1;
      
      // Verify the risk item exists and belongs to the user's organization
      const [existingRisk] = await db
        .select()
        .from(riskItems)
        .where(and(
          eq(riskItems.id, riskId),
          eq(riskItems.organizationId, organizationId)
        ));
      
      if (!existingRisk) {
        return res.status(404).json({ message: "Risk item not found" });
      }
      
      // First delete all associated mitigations
      await db
        .delete(riskMitigations)
        .where(and(
          eq(riskMitigations.riskItemId, riskId),
          eq(riskMitigations.organizationId, organizationId)
        ));
      
      // Then delete the risk item
      await db
        .delete(riskItems)
        .where(and(
          eq(riskItems.id, riskId),
          eq(riskItems.organizationId, organizationId)
        ));
      
      res.status(200).json({ message: "Risk item and its mitigations deleted successfully" });
    } catch (error) {
      console.error("Error deleting risk item:", error);
      res.status(500).json({ 
        message: "Failed to delete risk item", 
        error: error.message 
      });
    }
  });

  // Update a risk item
  app.patch("/api/risk-items/:id", isAuthenticated, async (req, res) => {
    try {
      const riskId = parseInt(req.params.id);
      const organizationId = req.user?.organization?.[0] || 1;
      
      // Update the risk item
      const [updatedRiskItem] = await db
        .update(riskItems)
        .set({
          ...req.body,
          updatedAt: new Date()
        })
        .where(and(
          eq(riskItems.id, riskId),
          eq(riskItems.organizationId, organizationId)
        ))
        .returning();
      
      if (!updatedRiskItem) {
        return res.status(404).json({ message: "Risk item not found" });
      }
      
      res.json(updatedRiskItem);
    } catch (error) {
      console.error("Error updating risk item:", error);
      res.status(500).json({ 
        message: "Failed to update risk item", 
        error: error.message 
      });
    }
  });

  // Risk Mitigations API Endpoints
  
  // Get all mitigations for a risk item
  app.get("/api/risk-items/:riskId/mitigations", isAuthenticated, async (req, res) => {
    try {
      const riskId = parseInt(req.params.riskId);
      const organizationId = req.user?.organization?.[0] || 1;
      
      const mitigations = await db
        .select()
        .from(riskMitigations)
        .where(and(
          eq(riskMitigations.riskItemId, riskId),
          eq(riskMitigations.organizationId, organizationId)
        ))
        .orderBy(desc(riskMitigations.createdAt));
      
      res.json(mitigations);
    } catch (error) {
      console.error("Error fetching risk mitigations:", error);
      res.status(500).json({ 
        message: "Failed to fetch risk mitigations", 
        error: error.message 
      });
    }
  });

  // Get all mitigations across all risks
  app.get("/api/risk-mitigations", isAuthenticated, async (req, res) => {
    try {
      const organizationId = req.user?.organization?.[0] || 1;
      
      // Get mitigations with associated risk item information
      const mitigations = await db.query.riskMitigations.findMany({
        where: eq(riskMitigations.organizationId, organizationId),
        with: {
          riskItem: true,
          createdBy: {
            columns: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatarUrl: true
            }
          }
        },
        orderBy: [desc(riskMitigations.createdAt)]
      });
      
      res.json(mitigations);
    } catch (error) {
      console.error("Error fetching all risk mitigations:", error);
      res.status(500).json({ 
        message: "Failed to fetch all risk mitigations", 
        error: error.message 
      });
    }
  });

  // Add a mitigation to a risk item
  app.post("/api/risk-items/:riskId/mitigations", isAuthenticated, async (req, res) => {
    try {
      const riskId = parseInt(req.params.riskId);
      const organizationId = req.user?.organization?.[0] || 1;
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Check if risk item exists and belongs to the organization
      const [riskItem] = await db
        .select()
        .from(riskItems)
        .where(and(
          eq(riskItems.id, riskId),
          eq(riskItems.organizationId, organizationId)
        ));
      
      if (!riskItem) {
        return res.status(404).json({ message: "Risk item not found" });
      }
      
      // Create the mitigation
      const [newMitigation] = await db
        .insert(riskMitigations)
        .values({
          ...req.body,
          riskItemId: riskId,
          organizationId,
          createdById: userId
        })
        .returning();
      
      // If status is included in the mitigation, update the risk item status accordingly
      if (req.body.status === 'completed') {
        await db
          .update(riskItems)
          .set({ status: 'mitigated', updatedAt: new Date() })
          .where(eq(riskItems.id, riskId));
      }
      
      res.status(201).json(newMitigation);
    } catch (error) {
      console.error("Error creating risk mitigation:", error);
      res.status(500).json({ 
        message: "Failed to create risk mitigation", 
        error: error.message 
      });
    }
  });

  // Update a mitigation
  app.patch("/api/risk-mitigations/:id", isAuthenticated, async (req, res) => {
    try {
      const mitigationId = parseInt(req.params.id);
      const organizationId = req.user?.organization?.[0] || 1;
      
      // Update the mitigation
      const [updatedMitigation] = await db
        .update(riskMitigations)
        .set({
          ...req.body,
          updatedAt: new Date()
        })
        .where(and(
          eq(riskMitigations.id, mitigationId),
          eq(riskMitigations.organizationId, organizationId)
        ))
        .returning();
      
      if (!updatedMitigation) {
        return res.status(404).json({ message: "Mitigation not found" });
      }
      
      // If status is updated to 'completed', also update the risk item status
      if (req.body.status === 'completed') {
        await db
          .update(riskItems)
          .set({ status: 'mitigated', updatedAt: new Date() })
          .where(eq(riskItems.id, updatedMitigation.riskItemId));
      }
      
      res.json(updatedMitigation);
    } catch (error) {
      console.error("Error updating risk mitigation:", error);
      res.status(500).json({ 
        message: "Failed to update risk mitigation", 
        error: error.message 
      });
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

  // Infrastructure Inventory endpoints
  // Get all infrastructure inventory items for the organization
  app.get("/api/infra-inventory", isAuthenticated, async (req, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const organizationId = typeof user.organization === 'object' ? user.organization.id : 
        Array.isArray(user.organization) ? user.organization[0] : user.organization_id || 1;
      
      const items = await storage.getInfraInventory(organizationId);
      res.status(200).json(items);
    } catch (error) {
      console.error("Error getting infrastructure inventory:", error);
      res.status(500).json({ 
        message: "Failed to get infrastructure inventory", 
        error: error.message 
      });
    }
  });

  // Get a specific infrastructure inventory item
  app.get("/api/infra-inventory/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const item = await storage.getInfraInventoryById(id);
      
      if (!item) {
        return res.status(404).json({ message: "Infrastructure inventory item not found" });
      }
      
      res.status(200).json(item);
    } catch (error) {
      console.error("Error getting infrastructure inventory item:", error);
      res.status(500).json({ 
        message: "Failed to get infrastructure inventory item", 
        error: error.message 
      });
    }
  });

  // Create a new infrastructure inventory item
  app.post("/api/infra-inventory", isAuthenticated, async (req, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const organizationId = typeof user.organization === 'object' ? user.organization.id : 
        Array.isArray(user.organization) ? user.organization[0] : user.organization_id || 1;
      
      const userId = user.id;
      
      // Validate request data
      const validatedData = insertInfraInventorySchema.parse({
        ...req.body,
        organizationId,
        createdById: userId
      });
      
      const newItem = await storage.createInfraInventory(validatedData);
      res.status(201).json(newItem);
    } catch (error) {
      console.error("Error creating infrastructure inventory item:", error);
      res.status(500).json({ 
        message: "Failed to create infrastructure inventory item", 
        error: error.message 
      });
    }
  });

  // Update an existing infrastructure inventory item
  app.put("/api/infra-inventory/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = req.user;
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const organizationId = typeof user.organization === 'object' ? user.organization.id : 
        Array.isArray(user.organization) ? user.organization[0] : user.organization_id || 1;
      
      // First check if the item exists and belongs to the user's organization
      const existingItem = await storage.getInfraInventoryById(id);
      if (!existingItem) {
        return res.status(404).json({ message: "Infrastructure inventory item not found" });
      }
      
      if (existingItem.organizationId !== organizationId) {
        return res.status(403).json({ message: "You don't have permission to update this item" });
      }
      
      // Update the item
      const updatedItem = await storage.updateInfraInventory(id, req.body);
      res.status(200).json(updatedItem);
    } catch (error) {
      console.error("Error updating infrastructure inventory item:", error);
      res.status(500).json({ 
        message: "Failed to update infrastructure inventory item", 
        error: error.message 
      });
    }
  });

  // Delete an infrastructure inventory item
  app.delete("/api/infra-inventory/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = req.user;
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const organizationId = typeof user.organization === 'object' ? user.organization.id : 
        Array.isArray(user.organization) ? user.organization[0] : user.organization_id || 1;
      
      // First check if the item exists and belongs to the user's organization
      const existingItem = await storage.getInfraInventoryById(id);
      if (!existingItem) {
        return res.status(404).json({ message: "Infrastructure inventory item not found" });
      }
      
      if (existingItem.organizationId !== organizationId) {
        return res.status(403).json({ message: "You don't have permission to delete this item" });
      }
      
      // Delete the item
      const success = await storage.deleteInfraInventory(id);
      if (success) {
        res.status(200).json({ message: "Infrastructure inventory item deleted successfully" });
      } else {
        res.status(500).json({ message: "Failed to delete infrastructure inventory item" });
      }
    } catch (error) {
      console.error("Error deleting infrastructure inventory item:", error);
      res.status(500).json({ 
        message: "Failed to delete infrastructure inventory item", 
        error: error.message 
      });
    }
  });

  // Seed initial infrastructure inventory data for the organization
  app.post("/api/infra-inventory/seed", isAuthenticated, async (req, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const organizationId = typeof user.organization === 'object' ? user.organization.id : 
        Array.isArray(user.organization) ? user.organization[0] : user.organization_id || 1;
      
      const userId = user.id;
      
      // Sample dataset with icons
      const sampleData = [
        {
          label: "Linux On-Prem",
          category: "onprem",
          provider: null,
          count: 3,
          icon: "linux",
          organizationId,
          createdById: userId
        },
        {
          label: "Windows On-Prem",
          category: "onprem",
          provider: null,
          count: 5,
          icon: "windows",
          organizationId,
          createdById: userId
        },
        {
          label: "AWS EC2",
          category: "cloud",
          provider: "aws",
          count: 20,
          icon: "cloud-aws",
          organizationId,
          createdById: userId
        },
        {
          label: "Azure App Instances",
          category: "cloud",
          provider: "azure",
          count: 5,
          icon: "cloud-azure",
          organizationId,
          createdById: userId
        },
        {
          label: "GitHub Repositories",
          category: "sourcecontrol",
          provider: "github",
          count: 30,
          icon: "github",
          organizationId,
          createdById: userId
        }
      ];
      
      // First check if there's already data for this organization
      const existingItems = await storage.getInfraInventory(organizationId);
      if (existingItems.length > 0) {
        return res.status(200).json({ 
          message: "Infrastructure inventory already has data", 
          items: existingItems 
        });
      }
      
      // Create all the items
      const createdItems = [];
      for (const item of sampleData) {
        const newItem = await storage.createInfraInventory(item);
        createdItems.push(newItem);
      }
      
      res.status(201).json({
        message: "Sample infrastructure inventory data created successfully",
        items: createdItems
      });
    } catch (error) {
      console.error("Error seeding infrastructure inventory data:", error);
      res.status(500).json({ 
        message: "Failed to seed infrastructure inventory data", 
        error: error.message 
      });
    }
  });

  const httpServer = createServer(app);

  // Frontier Models endpoints
  app.get('/api/frontier-models', isAuthenticated, async (req, res) => {
    try {
      const models = await db.select().from(frontierModelsList).orderBy(frontierModelsList.name);
      res.json(models);
    } catch (error) {
      console.error('Error fetching frontier models:', error);
      res.status(500).json({ error: 'Failed to fetch frontier models' });
    }
  });

  app.get('/api/frontier-models/alerts-config', isAuthenticated, async (req, res) => {
    try {
      const userOrgId = req.user.organization.id;
      
      const alertConfigs = await db.select({
        id: frontierModelsAlertsConfig.id,
        model_id: frontierModelsAlertsConfig.model_id,
        category: frontierModelsAlertsConfig.category,
        created_at: frontierModelsAlertsConfig.created_at,
        modelName: frontierModelsList.name,
        modelProvider: frontierModelsList.provider,
      })
      .from(frontierModelsAlertsConfig)
      .innerJoin(
        frontierModelsList, 
        eq(frontierModelsAlertsConfig.model_id, frontierModelsList.id)
      )
      .where(eq(frontierModelsAlertsConfig.organization_id, userOrgId))
      .orderBy(frontierModelsAlertsConfig.created_at);
      
      res.json(alertConfigs);
    } catch (error) {
      console.error('Error fetching frontier model alert configs:', error);
      res.status(500).json({ error: 'Failed to fetch frontier model alert configs' });
    }
  });

  app.post('/api/frontier-models/alerts-config', isAuthenticated, async (req, res) => {
    try {
      const { model_id, category } = req.body;
      const userOrgId = req.user.organization.id;
      const userId = req.user.id;
      
      // Validate input
      if (!model_id || !category) {
        return res.status(400).json({ error: 'Model ID and category are required' });
      }
      
      if (!['security', 'feature'].includes(category)) {
        return res.status(400).json({ error: 'Category must be either "security" or "feature"' });
      }
      
      // Check if config already exists
      const existingConfig = await db.select()
        .from(frontierModelsAlertsConfig)
        .where(
          and(
            eq(frontierModelsAlertsConfig.model_id, model_id),
            eq(frontierModelsAlertsConfig.category, category),
            eq(frontierModelsAlertsConfig.organization_id, userOrgId)
          )
        );
      
      if (existingConfig.length > 0) {
        return res.status(409).json({ error: 'Alert config for this model and category already exists' });
      }
      
      // Create new alert config
      const [newConfig] = await db.insert(frontierModelsAlertsConfig)
        .values({
          model_id,
          category,
          organization_id: userOrgId,
          created_by_id: userId
        })
        .returning();
      
      res.status(201).json(newConfig);
    } catch (error) {
      console.error('Error creating frontier model alert config:', error);
      res.status(500).json({ error: 'Failed to create frontier model alert config' });
    }
  });

  app.delete('/api/frontier-models/alerts-config/:id', isAuthenticated, async (req, res) => {
    try {
      const configId = parseInt(req.params.id);
      const userOrgId = req.user.organization.id;
      
      if (isNaN(configId)) {
        return res.status(400).json({ error: 'Invalid config ID' });
      }
      
      // Check if config exists and belongs to user's organization
      const config = await db.select()
        .from(frontierModelsAlertsConfig)
        .where(
          and(
            eq(frontierModelsAlertsConfig.id, configId),
            eq(frontierModelsAlertsConfig.organization_id, userOrgId)
          )
        );
      
      if (config.length === 0) {
        return res.status(404).json({ error: 'Alert config not found' });
      }
      
      // Delete related alerts first
      await db.delete(frontierModelsAlerts)
        .where(eq(frontierModelsAlerts.alert_config_id, configId));
      
      // Delete the config
      await db.delete(frontierModelsAlertsConfig)
        .where(eq(frontierModelsAlertsConfig.id, configId));
      
      res.status(200).json({ message: 'Alert config deleted successfully' });
    } catch (error) {
      console.error('Error deleting frontier model alert config:', error);
      res.status(500).json({ error: 'Failed to delete frontier model alert config' });
    }
  });

  app.get('/api/frontier-models/alerts', isAuthenticated, async (req, res) => {
    try {
      const userOrgId = req.user.organization.id;
      
      const alerts = await db.select({
        id: frontierModelsAlerts.id,
        title: frontierModelsAlerts.title,
        description: frontierModelsAlerts.description,
        url: frontierModelsAlerts.url,
        date_published: frontierModelsAlerts.date_published,
        created_at: frontierModelsAlerts.created_at,
        config_id: frontierModelsAlertsConfig.id,
        category: frontierModelsAlertsConfig.category,
        model_name: frontierModelsList.name,
        model_provider: frontierModelsList.provider,
      })
      .from(frontierModelsAlerts)
      .innerJoin(
        frontierModelsAlertsConfig,
        eq(frontierModelsAlerts.alert_config_id, frontierModelsAlertsConfig.id)
      )
      .innerJoin(
        frontierModelsList,
        eq(frontierModelsAlertsConfig.model_id, frontierModelsList.id)
      )
      .where(eq(frontierModelsAlerts.organization_id, userOrgId))
      .orderBy(desc(frontierModelsAlerts.date_published));
      
      res.json(alerts);
    } catch (error) {
      console.error('Error fetching frontier model alerts:', error);
      res.status(500).json({ error: 'Failed to fetch frontier model alerts' });
    }
  });

  app.post('/api/frontier-models/alerts', isAuthenticated, async (req, res) => {
    try {
      const { alert_config_id, title, description, url, date_published } = req.body;
      const userOrgId = req.user.organization.id;
      
      // Validate input
      if (!alert_config_id || !title || !date_published) {
        return res.status(400).json({ error: 'Alert config ID, title, and date published are required' });
      }
      
      // Check if config exists and belongs to user's organization
      const config = await db.select()
        .from(frontierModelsAlertsConfig)
        .where(
          and(
            eq(frontierModelsAlertsConfig.id, alert_config_id),
            eq(frontierModelsAlertsConfig.organization_id, userOrgId)
          )
        );
      
      if (config.length === 0) {
        return res.status(404).json({ error: 'Alert config not found' });
      }
      
      // Create new alert
      const [newAlert] = await db.insert(frontierModelsAlerts)
        .values({
          alert_config_id,
          title,
          description: description || null,
          url: url || null,
          date_published: new Date(date_published),
          organization_id: userOrgId
        })
        .returning();
      
      res.status(201).json(newAlert);
    } catch (error) {
      console.error('Error creating frontier model alert:', error);
      res.status(500).json({ error: 'Failed to create frontier model alert' });
    }
  });

  app.delete('/api/frontier-models/alerts/:id', isAuthenticated, async (req, res) => {
    try {
      const alertId = parseInt(req.params.id);
      const userOrgId = req.user.organization.id;
      
      if (isNaN(alertId)) {
        return res.status(400).json({ error: 'Invalid alert ID' });
      }
      
      // Check if alert exists and belongs to user's organization
      const alert = await db.select()
        .from(frontierModelsAlerts)
        .where(
          and(
            eq(frontierModelsAlerts.id, alertId),
            eq(frontierModelsAlerts.organization_id, userOrgId)
          )
        );
      
      if (alert.length === 0) {
        return res.status(404).json({ error: 'Alert not found' });
      }
      
      // Delete the alert
      await db.delete(frontierModelsAlerts)
        .where(eq(frontierModelsAlerts.id, alertId));
      
      res.status(200).json({ message: 'Alert deleted successfully' });
    } catch (error) {
      console.error('Error deleting frontier model alert:', error);
      res.status(500).json({ error: 'Failed to delete frontier model alert' });
    }
  });

  return httpServer;
}
