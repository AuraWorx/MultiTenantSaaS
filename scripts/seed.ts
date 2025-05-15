import { randomBytes, scryptSync } from 'crypto';
import {
  users, organizations, roles, aiSystems, riskItems, riskMitigations, complianceIssues,
  githubScanConfigs, githubScanResults, githubScanSummaries,
  biasAnalysisScans, biasAnalysisResults,
  frontierModelsList, frontierModelsAlertsConfig, frontierModelsAlerts,
  infraInventory, promptAnswers, dataStoreFiles
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
    await db.delete(dataStoreFiles);
    await db.delete(promptAnswers);
    await db.delete(infraInventory);
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

    // Create Frontier Models
    console.log('Creating frontier models list...');
    const [gpt4o] = await db.insert(frontierModelsList).values({
      modelId: 'gpt-4o',
      name: 'GPT-4o',
      provider: 'OpenAI',
    }).returning();

    const [claude] = await db.insert(frontierModelsList).values({
      modelId: 'claude-3-sonnet',
      name: 'Claude Sonnet 3.7',
      provider: 'Anthropic',
    }).returning();

    const [gemini] = await db.insert(frontierModelsList).values({
      modelId: 'gemini-ultra-1.5',
      name: 'Gemini Ultra 1.5',
      provider: 'Google',
    }).returning();

    // Create Frontier Model Alert Configurations
    console.log('Creating frontier model alert configurations...');
    const [gpt4oSecurityConfig] = await db.insert(frontierModelsAlertsConfig).values({
      modelId: gpt4o.id,
      organizationId: adminOrg.id,
      category: 'security',
    }).returning();

    const [claudeFeatureConfig] = await db.insert(frontierModelsAlertsConfig).values({
      modelId: claude.id,
      organizationId: adminOrg.id,
      category: 'feature',
    }).returning();

    const [geminiSecurityConfig] = await db.insert(frontierModelsAlertsConfig).values({
      modelId: gemini.id,
      organizationId: adminOrg.id,
      category: 'security',
    }).returning();

    // Create Frontier Model Alerts
    console.log('Creating frontier model alerts...');
    await db.insert(frontierModelsAlerts).values([
      {
        alertConfigId: gpt4oSecurityConfig.id,
        title: 'Security Vulnerability CVE-2024-1234',
        description: 'Critical security issue discovered in GPT-4o that could allow prompt injection attacks',
        url: 'https://example.com/openai-security',
        datePublished: new Date('2024-05-10'),
        organizationId: adminOrg.id,
      },
      {
        alertConfigId: claudeFeatureConfig.id,
        title: 'Claude Sonnet 3.7 New Feature Release',
        description: 'Enhanced multimodal capabilities with improved vision understanding and better reasoning',
        url: 'https://example.com/anthropic-features',
        datePublished: new Date('2024-05-12'),
        organizationId: adminOrg.id,
      },
      {
        alertConfigId: geminiSecurityConfig.id,
        title: 'Gemini Ultra 1.5 Security Update',
        description: 'Important security patch addressing potential data leakage issues in latest model version',
        url: 'https://example.com/gemini-security',
        datePublished: new Date('2024-05-05'),
        organizationId: adminOrg.id,
      },
    ]);

    // Create Infrastructure Inventory items
    console.log('Creating infrastructure inventory items...');
    await db.insert(infraInventory).values([
      {
        label: 'Linux Servers',
        category: 'onprem',
        provider: 'In-house',
        count: 12,
        icon: 'linux',
        organizationId: adminOrg.id,
        createdById: adminUser.id,
      },
      {
        label: 'Windows Servers',
        category: 'onprem',
        provider: 'In-house',
        count: 8,
        icon: 'windows',
        organizationId: adminOrg.id,
        createdById: adminUser.id,
      },
      {
        label: 'AWS EC2',
        category: 'cloud',
        provider: 'AWS',
        count: 24,
        icon: 'cloud-aws',
        organizationId: adminOrg.id,
        createdById: adminUser.id,
      },
      {
        label: 'Azure VMs',
        category: 'cloud',
        provider: 'Azure',
        count: 16,
        icon: 'cloud-azure',
        organizationId: adminOrg.id,
        createdById: adminUser.id,
      },
      {
        label: 'GitHub Repos',
        category: 'sourcecontrol',
        provider: 'GitHub',
        count: 38,
        icon: 'github',
        organizationId: adminOrg.id,
        createdById: adminUser.id,
      },
      {
        label: 'Databases',
        category: 'onprem',
        provider: 'In-house',
        count: 7,
        icon: 'database',
        organizationId: adminOrg.id,
        createdById: adminUser.id,
      },
      {
        label: 'Tech Cloud VMs',
        category: 'cloud',
        provider: 'GCP',
        count: 15,
        icon: 'cloud-aws',
        organizationId: techOrg.id,
        createdById: techAdmin.id,
      },
      {
        label: 'Tech GitHub',
        category: 'sourcecontrol',
        provider: 'GitHub',
        count: 27,
        icon: 'github',
        organizationId: techOrg.id,
        createdById: techAdmin.id,
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
    
    // Create sample prompt answers for Incognito ChatGPT
    console.log('Creating sample prompt answers...');
    await db.insert(promptAnswers).values([
      {
        prompt: 'What is AI governance?',
        response: 'AI governance refers to the frameworks, policies, and practices designed to ensure that artificial intelligence systems are developed, deployed, and used in an ethical, transparent, accountable, and legally compliant manner. It encompasses risk management, regulatory compliance, and ethical considerations to mitigate potential negative impacts of AI while maximizing its benefits.',
        userId: demoUser.id,
        organizationId: adminOrg.id,
      },
      {
        prompt: 'How can I detect bias in my ML models?',
        response: 'To detect bias in ML models, you should: 1) Analyze your training data for representation imbalances across demographic groups, 2) Use metrics like demographic parity, equal opportunity, and equalized odds to measure fairness, 3) Implement tools like Aequitas, Fairlearn, or IBM AI Fairness 360, 4) Test your model with diverse input scenarios, and 5) Conduct regular audits of model decisions across different population segments to identify disparate impacts.',
        userId: demoUser.id,
        organizationId: adminOrg.id,
      }
    ]);
    
    // Create sample data store files for Incognito ChatGPT
    console.log('Creating sample data store files...');
    const [rootFolder] = await db.insert(dataStoreFiles).values({
      name: 'AI Policies',
      path: 'AI Policies',
      type: 'folder',
      content: '',
      userId: demoUser.id,
      organizationId: adminOrg.id,
    }).returning();
    
    await db.insert(dataStoreFiles).values([
      {
        name: 'Model Risk Management.txt',
        path: 'Model Risk Management.txt',
        type: 'file',
        content: 'Model Risk Management Policy\n\nThis document outlines the framework for identifying, assessing, and mitigating risks associated with AI models used within the organization.\n\n1. Model Inventory\n- All AI models must be registered in the central model inventory\n- Documentation must include model purpose, input features, and expected outputs\n\n2. Risk Assessment\n- Models must undergo risk assessment before deployment\n- High-risk models require additional governance and oversight\n\n3. Validation\n- Independent validation required for all models\n- Testing must cover fairness, robustness, and explainability\n\n4. Monitoring\n- Continuous monitoring of model performance\n- Drift detection and regular retraining schedule\n\n5. Governance\n- Clear ownership and accountability for each model\n- Regular reporting to the AI Governance Committee',
        userId: demoUser.id,
        organizationId: adminOrg.id,
      },
      {
        name: 'Ethics Guidelines.txt',
        path: 'Ethics Guidelines.txt',
        type: 'file',
        content: 'AI Ethics Guidelines\n\n1. Fairness\n- AI systems should be designed to minimize harmful bias\n- Regular testing for disparate impacts across protected groups\n\n2. Transparency\n- Clear documentation of AI decision-making processes\n- Explainability appropriate to the use case and audience\n\n3. Privacy\n- Data minimization principles in all AI applications\n- Strong controls for sensitive personal data\n\n4. Accountability\n- Clear lines of responsibility for AI outcomes\n- Human oversight for high-impact decisions\n\n5. Safety & Security\n- Rigorous testing before deployment\n- Regular vulnerability assessments\n\n6. Human Agency\n- AI systems should augment human capabilities, not replace human judgment\n- Clear disclosure when interacting with AI systems',
        userId: demoUser.id,
        organizationId: adminOrg.id,
      },
      {
        name: 'Sample Data.txt',
        path: 'Sample Data.txt',
        type: 'file',
        content: 'age,income,zip_code,risk_score\n32,75000,90210,0.12\n45,65000,10001,0.25\n28,120000,60007,0.05\n52,45000,30306,0.45\n39,85000,02116,0.18\n61,95000,94103,0.32\n25,55000,75001,0.22\n48,105000,20008,0.15\n36,72000,80202,0.28\n58,130000,98101,0.08',
        userId: demoUser.id,
        organizationId: adminOrg.id,
      },
      {
        name: 'Implementation Plan.txt',
        path: 'Implementation Plan.txt',
        type: 'file',
        content: 'AI Governance Implementation Plan\n\n1. Discovery & Assessment (Month 1-2)\n- Complete AI inventory\n- Risk assessment of existing systems\n- Gap analysis against regulatory requirements\n\n2. Policy Development (Month 3-4)\n- Develop governance framework\n- Create policies and procedures\n- Define roles and responsibilities\n\n3. Tool Implementation (Month 5-6)\n- Deploy monitoring tools\n- Implement documentation systems\n- Set up reporting mechanisms\n\n4. Training (Month 7)\n- Train AI developers on governance requirements\n- Train business users on responsible AI usage\n- Train compliance team on AI-specific considerations\n\n5. Rollout (Month 8-9)\n- Phased implementation across departments\n- Feedback collection and adjustment\n\n6. Audit & Review (Month 10-12)\n- Internal audit of implementation\n- Process improvement\n- Prepare for external assessment',
        parentId: rootFolder.id,
        userId: demoUser.id,
        organizationId: adminOrg.id,
      }
    ]);
    
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