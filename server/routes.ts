import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { db } from "./db";
import { eq, and, count, asc, desc } from "drizzle-orm";
import axios from 'axios';
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
  insertUserSchema,
  insertOrganizationSchema,
  insertRoleSchema,
  insertAiSystemSchema,
  insertRiskItemSchema,
  insertComplianceIssueSchema,
  insertGithubScanConfigSchema 
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
    const headers = {
      'Authorization': `token ${config.api_key}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'AIGovernancePlatform'
    };
    
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
                
                // Check for model files
                if (AI_FILE_PATTERNS.some(pattern => pattern.test(fileName))) {
                  aiSignals.push({
                    type: 'Model File',
                    path: filePath,
                    details: `Model file detected: ${fileName}`,
                    confidence: 0.8
                  });
                  
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
        
        // Determine if repo has AI usage
        const hasAiUsage = aiSignals.length > 0 || aiLibrariesFound.length > 0;
        
        if (hasAiUsage) {
          reposWithAI++;
          
          // Only log AI findings
          console.log(`AI usage detected in ${repo.name}:`);
          console.log(`- Libraries: ${aiLibrariesFound.join(', ')}`);
          console.log(`- Signals: ${aiSignals.map(s => s.type).join(', ')}`);
        }
        
        // Create a list of unique libraries
        const uniqueLibraries = [...new Set(aiLibrariesFound)];
        
        // Save repository scan result to database
        await db.insert(githubScanResults).values({
          scan_config_id: config.id,
          organization_id: config.organization_id,
          repository_name: repo.name,
          repository_url: repo.html_url,
          has_ai_usage: hasAiUsage,
          ai_libraries: uniqueLibraries,
          ai_frameworks: aiFrameworksFound.slice(0, 10) // Limit to avoid DB size issues
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
      const organizationId = req.user.organization?.id || req.user.organizationId;
      const configId = req.query.configId ? parseInt(req.query.configId as string) : undefined;
      
      let query = db.select()
        .from(githubScanResults)
        .where(eq(githubScanResults.organization_id, organizationId));
      
      if (configId) {
        query = query.where(eq(githubScanResults.scan_config_id, configId));
      }
      
      const results = await query.orderBy(desc(githubScanResults.scan_date));
      
      res.json(results);
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
      
      const organizationId = req.user.organization?.id || req.user.organizationId;
      
      // Get the scan result
      const [result] = await db.select()
        .from(githubScanResults)
        .where(and(
          eq(githubScanResults.id, resultId),
          eq(githubScanResults.organization_id, organizationId)
        ));
      
      if (!result) {
        return res.status(404).json({ message: "Scan result not found" });
      }
      
      if (result.added_to_risk) {
        return res.status(400).json({ message: "This result has already been added to the risk register" });
      }
      
      // Create a risk item
      const [riskItem] = await db.insert(riskItems)
        .values({
          title: `AI Usage in ${result.repository_name}`,
          description: `AI libraries detected: ${result.ai_libraries ? result.ai_libraries.join(', ') : 'None'}. Repository URL: ${result.repository_url}`,
          risk_level: "medium",
          risk_type: "operational",
          status: "open",
          organization_id: organizationId,
          created_by_id: req.user?.id || 1,
          mitigation_plan: "Review AI usage and implement governance controls"
        })
        .returning();
      
      // Mark the result as added to risk
      await db.update(githubScanResults)
        .set({ added_to_risk: true })
        .where(eq(githubScanResults.id, resultId));
      
      res.json({ message: "Added to risk register successfully", riskItemId: riskItem.id });
    } catch (error) {
      console.error("Error adding scan result to risk register:", error);
      res.status(500).json({ message: "Failed to add to risk register", error: error.message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
