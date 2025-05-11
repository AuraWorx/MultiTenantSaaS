import { db } from '../server/db';
import { organizations, roles, users, aiSystems, riskItems, complianceIssues } from '../shared/schema';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function seed() {
  console.log('Starting database seed...');

  try {
    // Clear existing data (optional - comment out if you don't want to clear data)
    console.log('Clearing existing data...');
    await db.delete(complianceIssues);
    await db.delete(riskItems);
    await db.delete(aiSystems);
    await db.delete(users);
    await db.delete(roles);
    await db.delete(organizations);

    // Create organizations
    console.log('Creating organizations...');
    const [adminOrg] = await db.insert(organizations).values({
      name: 'Admin Organization',
    }).returning();

    const [techCorp] = await db.insert(organizations).values({
      name: 'TechCorp Inc.',
    }).returning();

    const [financeOrg] = await db.insert(organizations).values({
      name: 'Finance Global',
    }).returning();

    // Create roles
    console.log('Creating roles...');
    const [adminRole] = await db.insert(roles).values({
      name: 'Admin',
      permissions: ['admin:all', 'view:all', 'edit:all', 'delete:all'],
    }).returning();

    const [userRole] = await db.insert(roles).values({
      name: 'User',
      permissions: ['view:dashboard', 'edit:profile', 'view:reports', 'edit:ai-systems'],
    }).returning();

    const [viewerRole] = await db.insert(roles).values({
      name: 'Viewer',
      permissions: ['view:dashboard', 'view:reports'],
    }).returning();

    // Create users
    console.log('Creating users...');
    const hashedAdminPassword = await hashPassword('adminpassword');
    const [adminUser] = await db.insert(users).values({
      username: 'admin_user',
      email: 'admin@example.com',
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
    const [techUser] = await db.insert(users).values({
      username: 'tech_user',
      email: 'tech@example.com',
      password: hashedTechPassword,
      firstName: 'Tech',
      lastName: 'User',
      avatarUrl: null,
      active: true,
      organizationId: techCorp.id,
      roleId: adminRole.id,
    }).returning();

    // Create AI Systems
    console.log('Creating AI systems...');
    const [chatbot] = await db.insert(aiSystems).values({
      name: 'Customer Support Chatbot',
      description: 'AI chatbot for customer support with natural language processing capabilities',
      type: 'LLM',
      location: 'Internal',
      organizationId: adminOrg.id,
      createdById: adminUser.id,
    }).returning();

    const [fraudSystem] = await db.insert(aiSystems).values({
      name: 'Fraud Detection System',
      description: 'Machine learning system for detecting fraudulent transactions',
      type: 'Classification',
      location: 'Internal',
      organizationId: adminOrg.id,
      createdById: adminUser.id,
    }).returning();

    const [hrSystem] = await db.insert(aiSystems).values({
      name: 'HR Candidate Screening',
      description: 'AI system for initial screening of job candidates',
      type: 'Classification',
      location: 'Cloud',
      organizationId: adminOrg.id,
      createdById: demoUser.id,
    }).returning();

    const [recommendationEngine] = await db.insert(aiSystems).values({
      name: 'Product Recommendation Engine',
      description: 'AI system for recommending products to customers based on their preferences',
      type: 'Recommendation',
      location: 'Internal',
      organizationId: techCorp.id,
      createdById: techUser.id,
    }).returning();

    const [tradingBot] = await db.insert(aiSystems).values({
      name: 'Automated Trading System',
      description: 'AI system for algorithmic trading in financial markets',
      type: 'Prediction',
      location: 'Cloud',
      organizationId: financeOrg.id,
      createdById: adminUser.id,
    }).returning();

    // Create Risk Items
    console.log('Creating risk items...');
    await db.insert(riskItems).values({
      title: 'Data Privacy Risk',
      description: 'Risk of exposing customer PII through chat logs',
      severity: 'high',
      status: 'open',
      aiSystemId: chatbot.id,
      organizationId: adminOrg.id,
      createdById: adminUser.id,
    });

    await db.insert(riskItems).values({
      title: 'Model Bias Risk',
      description: 'Risk of bias in fraud detection for certain demographic groups',
      severity: 'medium',
      status: 'mitigated',
      aiSystemId: fraudSystem.id,
      organizationId: adminOrg.id,
      createdById: adminUser.id,
    });

    await db.insert(riskItems).values({
      title: 'Discriminatory Hiring Risk',
      description: 'Risk of discrimination in candidate screening process',
      severity: 'high',
      status: 'open',
      aiSystemId: hrSystem.id,
      organizationId: adminOrg.id,
      createdById: demoUser.id,
    });

    await db.insert(riskItems).values({
      title: 'Market Manipulation Risk',
      description: 'Risk of algorithm causing market manipulation',
      severity: 'critical',
      status: 'open',
      aiSystemId: tradingBot.id,
      organizationId: financeOrg.id,
      createdById: adminUser.id,
    });

    // Create Compliance Issues
    console.log('Creating compliance issues...');
    await db.insert(complianceIssues).values({
      title: 'GDPR Compliance Gap',
      description: 'Missing consent collection mechanism for chat data storage',
      severity: 'high',
      status: 'open',
      aiSystemId: chatbot.id,
      organizationId: adminOrg.id,
      createdById: adminUser.id,
    });

    await db.insert(complianceIssues).values({
      title: 'Missing Model Documentation',
      description: 'Inadequate documentation of model training data and parameters',
      severity: 'medium',
      status: 'in-progress',
      aiSystemId: fraudSystem.id,
      organizationId: adminOrg.id,
      createdById: adminUser.id,
    });

    await db.insert(complianceIssues).values({
      title: 'Equal Employment Issue',
      description: 'Potential violation of equal employment opportunity regulations',
      severity: 'high',
      status: 'open',
      aiSystemId: hrSystem.id,
      organizationId: adminOrg.id,
      createdById: demoUser.id,
    });

    console.log('Database seed completed successfully!');
    
    // Print login credentials for reference
    console.log('\nSample Login Credentials:');
    console.log('----------------------------------');
    console.log('Admin User:');
    console.log('  Username: admin_user');
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
    await db.pool.end();
  }
}

// Run the seed function
seed()
  .catch(err => {
    console.error('Seed failed:', err);
    process.exit(1);
  });