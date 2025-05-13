import { randomBytes, scryptSync } from 'crypto';
import {
  users, organizations, roles, aiSystems, riskItems, riskMitigations, complianceIssues,
  githubScanConfigs, githubScanResults, githubScanSummaries,
  biasAnalysisScans, biasAnalysisResults
} from '../shared/schema';
import { db, pool } from '../server/db';

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${hash}.${salt}`;
}

async function seed() {
  try {
    console.log('Starting database seed process...');

    // Clear existing data
    console.log('Clearing existing data...');
    await db.delete(complianceIssues);
    await db.delete(riskItems);
    await db.delete(aiSystems);
    await db.delete(biasAnalysisResults);
    await db.delete(biasAnalysisScans);
    await db.delete(githubScanResults);
    await db.delete(githubScanSummaries);
    await db.delete(githubScanConfigs);
    await db.delete(users);
    await db.delete(roles);
    await db.delete(organizations);

    // Create roles
    console.log('Creating roles...');
    const [adminRole] = await db.insert(roles).values({
      name: 'Administrator',
      permissions: ['admin', 'manage_users', 'manage_organizations', 'view_all', 'edit_all'],
    }).returning();

    const [userRole] = await db.insert(roles).values({
      name: 'User',
      permissions: ['view_own', 'edit_own'],
    }).returning();

    const [analystRole] = await db.insert(roles).values({
      name: 'Analyst',
      permissions: ['view_all', 'edit_own'],
    }).returning();

    const [viewerRole] = await db.insert(roles).values({
      name: 'Viewer',
      permissions: ['view_own'],
    }).returning();

    // Create organizations
    console.log('Creating organizations...');
    const [adminOrg] = await db.insert(organizations).values({
      name: 'Admin Organization',
    }).returning();

    const [financeOrg] = await db.insert(organizations).values({
      name: 'Finance Corp.',
    }).returning();

    const [techOrg] = await db.insert(organizations).values({
      name: 'TechCorp Inc.',
    }).returning();

    // Create users
    console.log('Creating users...');
    const hashedAdminPassword = await hashPassword('adminpassword');
    const [adminUser] = await db.insert(users).values({
      username: 'admin',
      email: 'admin@auraai.com',
      password: hashedAdminPassword,
      firstName: 'Admin',
      lastName: 'User',
      avatarUrl: null,
      active: true,
      organizationId: adminOrg.id,
      roleId: adminRole.id,
    }).returning();

    const hashedDemoPassword = await hashPassword('demopassword');
    const [demoUser] = await db.insert(users).values({
      username: 'demo_user',
      email: 'demo@example.com',
      password: hashedDemoPassword,
      firstName: 'Demo',
      lastName: 'User',
      avatarUrl: null,
      active: true,
      organizationId: adminOrg.id,
      roleId: userRole.id,
    }).returning();

    const hashedViewerPassword = await hashPassword('viewerpassword');
    const [viewerUser] = await db.insert(users).values({
      username: 'viewer_user',
      email: 'viewer@example.com',
      password: hashedViewerPassword,
      firstName: 'Viewer',
      lastName: 'User',
      avatarUrl: null,
      active: true,
      organizationId: adminOrg.id,
      roleId: viewerRole.id,
    }).returning();

    // Create TechCorp users
    const hashedTechPassword = await hashPassword('techpassword');
    const [techAdmin] = await db.insert(users).values({
      username: 'tech_admin',
      email: 'admin@techcorp.com',
      password: hashedTechPassword,
      firstName: 'Tech',
      lastName: 'Admin',
      avatarUrl: null,
      active: true,
      organizationId: techOrg.id,
      roleId: adminRole.id,
    }).returning();

    // Create AI Systems
    console.log('Creating AI systems...');
    const [chatbot] = await db.insert(aiSystems).values({
      name: 'Customer Support Chatbot',
      description: 'AI assistant for customer support',
      type: 'Conversational AI',
      location: 'cloud',
      organizationId: adminOrg.id,
      createdById: adminUser.id,
    }).returning();

    const [fraudSystem] = await db.insert(aiSystems).values({
      name: 'Fraud Detection System',
      description: 'ML system to detect financial fraud',
      type: 'Machine Learning',
      location: 'on-premise',
      organizationId: adminOrg.id,
      createdById: adminUser.id,
    }).returning();

    const [hrSystem] = await db.insert(aiSystems).values({
      name: 'HR Candidate Screening',
      description: 'AI for screening job candidates',
      type: 'Machine Learning',
      location: 'cloud',
      organizationId: adminOrg.id,
      createdById: demoUser.id,
    }).returning();

    const [tradingBot] = await db.insert(aiSystems).values({
      name: 'Automated Trading Bot',
      description: 'AI for high-frequency trading',
      type: 'Decision System',
      location: 'hybrid',
      organizationId: financeOrg.id,
      createdById: adminUser.id,
    }).returning();

    const [recommender] = await db.insert(aiSystems).values({
      name: 'Product Recommender',
      description: 'ML system for product recommendations',
      type: 'Recommendation Engine',
      location: 'cloud',
      organizationId: techOrg.id,
      createdById: techAdmin.id,
    }).returning();

    // Create Risk Items
    console.log('Creating risk items...');
    const [privacyRisk] = await db.insert(riskItems).values({
      title: 'Data Privacy Risk',
      description: 'Risk of exposing customer PII through chat logs',
      severity: 'high',
      impact: 'high',
      likelihood: 'medium',
      category: 'privacy',
      status: 'open',
      systemDetails: 'Chatbot processes and stores user conversations that may contain sensitive data',
      aiSystemId: chatbot.id,
      organizationId: adminOrg.id,
      createdById: adminUser.id,
    }).returning();
    
    const [biasRisk] = await db.insert(riskItems).values({
      title: 'Model Bias Risk',
      description: 'Risk of bias in fraud detection for certain demographic groups',
      severity: 'medium',
      impact: 'high',
      likelihood: 'medium',
      category: 'bias',
      status: 'mitigated',
      systemDetails: 'Model may be biased against certain demographic groups due to training data imbalance',
      aiSystemId: fraudSystem.id,
      organizationId: adminOrg.id,
      createdById: adminUser.id,
    }).returning();
    
    const [hiringRisk] = await db.insert(riskItems).values({
      title: 'Discriminatory Hiring Risk',
      description: 'Risk of discrimination in candidate screening process',
      severity: 'high',
      impact: 'high',
      likelihood: 'high',
      category: 'bias',
      status: 'open',
      systemDetails: 'AI screening system may introduce unintended bias in hiring decisions',
      aiSystemId: hrSystem.id,
      organizationId: adminOrg.id,
      createdById: demoUser.id,
    }).returning();
    
    const [marketRisk] = await db.insert(riskItems).values({
      title: 'Market Manipulation Risk',
      description: 'Risk of algorithm causing market manipulation',
      severity: 'critical',
      impact: 'high',
      likelihood: 'medium',
      category: 'security',
      status: 'open',
      systemDetails: 'Algorithmic trading system could potentially cause market volatility or manipulation',
      aiSystemId: tradingBot.id,
      organizationId: financeOrg.id,
      createdById: adminUser.id,
    }).returning();
    
    // Create Risk Mitigations
    console.log('Creating risk mitigations...');
    await db.insert(riskMitigations).values([
      {
        riskItemId: biasRisk.id,
        description: 'Rebalanced training data and implemented fairness metrics',
        status: 'completed',
        notes: 'Fairness metrics show improved performance across demographic groups',
        organizationId: adminOrg.id,
        createdById: adminUser.id,
      },
      {
        riskItemId: privacyRisk.id,
        description: 'Implement PII detection and automatic redaction',
        status: 'in-progress',
        notes: 'Currently evaluating PII detection libraries',
        organizationId: adminOrg.id,
        createdById: adminUser.id,
      },
      {
        riskItemId: hiringRisk.id,
        description: 'Human oversight of all AI recommendations',
        status: 'planned',
        notes: 'Plan to implement by end of quarter',
        organizationId: adminOrg.id,
        createdById: demoUser.id,
      },
      {
        riskItemId: marketRisk.id,
        description: 'Transfer risk through third-party monitoring service',
        status: 'in-progress',
        notes: 'Evaluating third-party services for real-time market monitoring',
        organizationId: financeOrg.id,
        createdById: adminUser.id,
      },
    ]);

    // Create Compliance Issues
    console.log('Creating compliance issues...');
    await db.insert(complianceIssues).values([
      {
        title: 'GDPR Compliance Gap',
        description: 'Missing consent collection mechanism for chat data storage',
        severity: 'high',
        status: 'open',
        aiSystemId: chatbot.id,
        organizationId: adminOrg.id,
        createdById: adminUser.id,
      },
      {
        title: 'Missing Model Documentation',
        description: 'Inadequate documentation of model training data and parameters',
        severity: 'medium',
        status: 'in-progress',
        aiSystemId: fraudSystem.id,
        organizationId: adminOrg.id,
        createdById: adminUser.id,
      },
      {
        title: 'Equal Employment Issue',
        description: 'Potential violation of equal employment opportunity regulations',
        severity: 'high',
        status: 'open',
        aiSystemId: hrSystem.id,
        organizationId: adminOrg.id,
        createdById: demoUser.id,
      }
    ]);

    // Create GitHub Scan Configs
    console.log('Creating GitHub scan configs...');
    const [auraWorxConfig] = await db.insert(githubScanConfigs).values({
      githubOrgName: 'AuraWorx',
      organizationId: adminOrg.id,
      createdById: adminUser.id,
      lastScanAt: new Date(),
      status: 'completed',
    }).returning();

    const [techCorpConfig] = await db.insert(githubScanConfigs).values({
      githubOrgName: 'TechCorp',
      organizationId: techOrg.id,
      createdById: techAdmin.id,
      lastScanAt: new Date(),
      status: 'completed',
    }).returning();

    const [financeCorpConfig] = await db.insert(githubScanConfigs).values({
      githubOrgName: 'FinanceCorp',
      organizationId: financeOrg.id,
      createdById: adminUser.id,
      lastScanAt: null,
      status: 'pending',
    }).returning();

    // Create GitHub Scan Results
    console.log('Creating GitHub scan results...');
    await db.insert(githubScanResults).values([
      {
        scanConfigId: auraWorxConfig.id,
        repositoryName: 'llm-anthropic',
        repositoryUrl: 'https://github.com/AuraWorx/llm-anthropic',
        hasAiUsage: true,
        aiLibraries: ['anthropic'],
        aiFrameworks: ['anthropic>=0.48.0'],
        scanDate: new Date(),
        addedToRisk: false,
        confidenceScore: 100,
        detectionType: 'Dependency File',
      },
      {
        scanConfigId: auraWorxConfig.id,
        repositoryName: 'MultiTenantSaaS',
        repositoryUrl: 'https://github.com/AuraWorx/MultiTenantSaaS',
        hasAiUsage: true,
        aiLibraries: ['openai'],
        aiFrameworks: ['openai@^4.98.0'],
        scanDate: new Date(),
        addedToRisk: true,
        confidenceScore: 100,
        detectionType: 'Dependency File',
      },
      {
        scanConfigId: auraWorxConfig.id,
        repositoryName: 'SmartGlasses',
        repositoryUrl: 'https://github.com/AuraWorx/SmartGlasses',
        hasAiUsage: false,
        aiLibraries: [],
        aiFrameworks: [],
        scanDate: new Date(),
        addedToRisk: false,
        confidenceScore: 0,
        detectionType: '',
      },
      {
        scanConfigId: techCorpConfig.id,
        repositoryName: 'ai-assistant',
        repositoryUrl: 'https://github.com/TechCorp/ai-assistant',
        hasAiUsage: true,
        aiLibraries: ['langchain', 'openai'],
        aiFrameworks: ['langchain@^0.0.200', 'openai@^4.2.0'],
        scanDate: new Date(),
        addedToRisk: true,
        confidenceScore: 100,
        detectionType: 'Dependency File',
      },
    ]);

    // Create GitHub Scan Summaries
    console.log('Creating GitHub scan summaries...');
    await db.insert(githubScanSummaries).values([
      {
        scanConfigId: auraWorxConfig.id,
        totalRepositories: 3,
        repositoriesWithAi: 2,
        scanDate: new Date(),
        organizationId: adminOrg.id,
      },
      {
        scanConfigId: techCorpConfig.id,
        totalRepositories: 1,
        repositoriesWithAi: 1,
        scanDate: new Date(),
        organizationId: techOrg.id,
      },
    ]);

    // Create Bias Analysis Scans
    console.log('Creating bias analysis scans...');
    const [hiringBiasScan] = await db.insert(biasAnalysisScans).values({
      name: 'Hiring Data Bias Analysis',
      description: 'Analysis of potential bias in HR hiring data',
      status: 'completed',
      dataSource: 'CSV Upload',
      aiSystemId: hrSystem.id,
      organizationId: adminOrg.id,
      createdById: demoUser.id,
    }).returning();

    const [lendingBiasScan] = await db.insert(biasAnalysisScans).values({
      name: 'Lending Algorithm Bias Check',
      description: 'Analysis of potential bias in lending decisions',
      status: 'completed',
      dataSource: 'API Webhook',
      aiSystemId: fraudSystem.id,
      organizationId: adminOrg.id,
      createdById: adminUser.id,
    }).returning();

    // Create Bias Analysis Results
    console.log('Creating bias analysis results...');
    await db.insert(biasAnalysisResults).values([
      {
        scanId: hiringBiasScan.id,
        biasType: 'gender',
        biasScore: 0.78,
        description: 'Significant gender bias detected in hiring data',
        attributeContributions: JSON.stringify({
          'education': 0.35,
          'previous_roles': 0.28,
          'age': 0.15
        }),
        recommendedActions: 'Review and adjust model weights for education and previous roles attributes',
        organizationId: adminOrg.id,
      },
      {
        scanId: lendingBiasScan.id,
        biasType: 'racial',
        biasScore: 0.42,
        description: 'Moderate racial bias detected in lending decisions',
        attributeContributions: JSON.stringify({
          'zip_code': 0.45,
          'income': 0.22,
          'credit_history_length': 0.18
        }),
        recommendedActions: 'Remove zip code as a factor in lending decisions',
        organizationId: adminOrg.id,
      },
    ]);

    console.log('Database seed completed successfully!');
    
    // Print login credentials for reference
    console.log('\nSample Login Credentials:');
    console.log('----------------------------------');
    console.log('Admin User:');
    console.log('  Username: admin');
    console.log('  Password: adminpassword');
    console.log('\nDemo User:');
    console.log('  Username: demo_user');
    console.log('  Password: demopassword');
    console.log('\nViewer User:');
    console.log('  Username: viewer_user');
    console.log('  Password: viewerpassword');
    console.log('----------------------------------');
    
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    // Close the database connection
    await pool.end();
  }
}

// Run the seed function
seed()
  .catch(err => {
    console.error('Seed failed:', err);
    process.exit(1);
  });