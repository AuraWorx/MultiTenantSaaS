import pg from 'pg';
import { randomBytes, scryptSync } from 'crypto';

const { Client } = pg;

// Default connection string if not provided
const DEFAULT_DB_URL = 'postgresql://postgres:postgres@localhost:5432/ai_governance';
const connectionString = process.env.DATABASE_URL || DEFAULT_DB_URL;

console.log(`Using database URL: ${connectionString}`);

async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${hash}.${salt}`;
}

async function seed() {
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL database');

    // Clear existing data
    console.log('Clearing existing data...');
    await client.query('DELETE FROM compliance_issues');
    await client.query('DELETE FROM risk_items');
    await client.query('DELETE FROM ai_systems');
    await client.query('DELETE FROM users');
    await client.query('DELETE FROM roles');
    await client.query('DELETE FROM organizations');

    // Reset sequences
    console.log('Resetting sequences...');
    await client.query('ALTER SEQUENCE organizations_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE roles_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE users_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE ai_systems_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE risk_items_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE compliance_issues_id_seq RESTART WITH 1');

    // Create roles
    console.log('Creating roles...');
    const adminRoleRes = await client.query(`
      INSERT INTO roles (name, permissions) 
      VALUES ('Administrator', ARRAY['admin', 'manage_users', 'manage_organizations', 'view_all', 'edit_all'])
      RETURNING *
    `);
    const adminRole = adminRoleRes.rows[0];

    const userRoleRes = await client.query(`
      INSERT INTO roles (name, permissions) 
      VALUES ('User', ARRAY['view_own', 'edit_own'])
      RETURNING *
    `);
    const userRole = userRoleRes.rows[0];

    const analystRoleRes = await client.query(`
      INSERT INTO roles (name, permissions) 
      VALUES ('Analyst', ARRAY['view_all', 'edit_own'])
      RETURNING *
    `);
    const analystRole = analystRoleRes.rows[0];

    const viewerRoleRes = await client.query(`
      INSERT INTO roles (name, permissions) 
      VALUES ('Viewer', ARRAY['view_own'])
      RETURNING *
    `);
    const viewerRole = viewerRoleRes.rows[0];

    // Create organizations
    console.log('Creating organizations...');
    const adminOrgRes = await client.query(`
      INSERT INTO organizations (name) 
      VALUES ('Admin Organization')
      RETURNING *
    `);
    const adminOrg = adminOrgRes.rows[0];

    const financeOrgRes = await client.query(`
      INSERT INTO organizations (name) 
      VALUES ('Finance Corp.')
      RETURNING *
    `);
    const financeOrg = financeOrgRes.rows[0];

    // Create users
    console.log('Creating users...');
    const adminUserRes = await client.query(`
      INSERT INTO users (
        username, email, password, first_name, last_name, 
        organization_id, role_id, active
      ) VALUES (
        'admin_user', 'admin@auraai.com', $1, 'Admin', 'User', 
        $2, $3, true
      ) RETURNING *
    `, [await hashPassword('adminpassword'), adminOrg.id, adminRole.id]);
    const adminUser = adminUserRes.rows[0];

    const demoUserRes = await client.query(`
      INSERT INTO users (
        username, email, password, first_name, last_name, 
        organization_id, role_id, active
      ) VALUES (
        'demo_user', 'demo@auraai.com', $1, 'Demo', 'User', 
        $2, $3, true
      ) RETURNING *
    `, [await hashPassword('demopassword'), adminOrg.id, userRole.id]);
    const demoUser = demoUserRes.rows[0];

    const viewerUserRes = await client.query(`
      INSERT INTO users (
        username, email, password, first_name, last_name, 
        organization_id, role_id, active
      ) VALUES (
        'viewer_user', 'viewer@auraai.com', $1, 'Viewer', 'User', 
        $2, $3, true
      ) RETURNING *
    `, [await hashPassword('viewerpassword'), financeOrg.id, viewerRole.id]);
    const viewerUser = viewerUserRes.rows[0];

    // Create AI Systems
    console.log('Creating AI systems...');
    const chatbotRes = await client.query(`
      INSERT INTO ai_systems (
        name, description, version, status, risk_level,
        organization_id, created_by_id
      ) VALUES (
        'Customer Support Chatbot', 'AI assistant for customer support', '1.0', 
        'production', 'medium', $1, $2
      ) RETURNING *
    `, [adminOrg.id, adminUser.id]);
    const chatbot = chatbotRes.rows[0];

    const fraudSystemRes = await client.query(`
      INSERT INTO ai_systems (
        name, description, version, status, risk_level,
        organization_id, created_by_id
      ) VALUES (
        'Fraud Detection System', 'ML system to detect financial fraud', '2.3', 
        'production', 'high', $1, $2
      ) RETURNING *
    `, [adminOrg.id, adminUser.id]);
    const fraudSystem = fraudSystemRes.rows[0];

    const hrSystemRes = await client.query(`
      INSERT INTO ai_systems (
        name, description, version, status, risk_level,
        organization_id, created_by_id
      ) VALUES (
        'HR Candidate Screening', 'AI for screening job candidates', '1.5', 
        'testing', 'medium', $1, $2
      ) RETURNING *
    `, [adminOrg.id, demoUser.id]);
    const hrSystem = hrSystemRes.rows[0];

    const tradingBotRes = await client.query(`
      INSERT INTO ai_systems (
        name, description, version, status, risk_level,
        organization_id, created_by_id
      ) VALUES (
        'Automated Trading Bot', 'AI for high-frequency trading', '3.2', 
        'production', 'critical', $1, $2
      ) RETURNING *
    `, [financeOrg.id, adminUser.id]);
    const tradingBot = tradingBotRes.rows[0];

    const recommenderRes = await client.query(`
      INSERT INTO ai_systems (
        name, description, version, status, risk_level,
        organization_id, created_by_id
      ) VALUES (
        'Product Recommender', 'ML system for product recommendations', '2.0', 
        'development', 'low', $1, $2
      ) RETURNING *
    `, [financeOrg.id, viewerUser.id]);
    const recommender = recommenderRes.rows[0];

    // Create Risk Items
    console.log('Creating risk items...');
    await client.query(`
      INSERT INTO risk_items (
        title, description, severity, status,
        ai_system_id, organization_id, created_by_id
      ) VALUES (
        'Data Privacy Risk', 'Risk of exposing customer PII through chat logs',
        'high', 'open', $1, $2, $3
      )
    `, [chatbot.id, adminOrg.id, adminUser.id]);

    await client.query(`
      INSERT INTO risk_items (
        title, description, severity, status,
        ai_system_id, organization_id, created_by_id
      ) VALUES (
        'Model Bias Risk', 'Risk of bias in fraud detection for certain demographic groups',
        'medium', 'mitigated', $1, $2, $3
      )
    `, [fraudSystem.id, adminOrg.id, adminUser.id]);

    await client.query(`
      INSERT INTO risk_items (
        title, description, severity, status,
        ai_system_id, organization_id, created_by_id
      ) VALUES (
        'Discriminatory Hiring Risk', 'Risk of discrimination in candidate screening process',
        'high', 'open', $1, $2, $3
      )
    `, [hrSystem.id, adminOrg.id, demoUser.id]);

    await client.query(`
      INSERT INTO risk_items (
        title, description, severity, status,
        ai_system_id, organization_id, created_by_id
      ) VALUES (
        'Market Manipulation Risk', 'Risk of algorithm causing market manipulation',
        'critical', 'open', $1, $2, $3
      )
    `, [tradingBot.id, financeOrg.id, adminUser.id]);

    // Create Compliance Issues
    console.log('Creating compliance issues...');
    await client.query(`
      INSERT INTO compliance_issues (
        title, description, severity, status,
        ai_system_id, organization_id, created_by_id
      ) VALUES (
        'GDPR Compliance Gap', 'Missing consent collection mechanism for chat data storage',
        'high', 'open', $1, $2, $3
      )
    `, [chatbot.id, adminOrg.id, adminUser.id]);

    await client.query(`
      INSERT INTO compliance_issues (
        title, description, severity, status,
        ai_system_id, organization_id, created_by_id
      ) VALUES (
        'Missing Model Documentation', 'Inadequate documentation of model training data and parameters',
        'medium', 'in-progress', $1, $2, $3
      )
    `, [fraudSystem.id, adminOrg.id, adminUser.id]);

    await client.query(`
      INSERT INTO compliance_issues (
        title, description, severity, status,
        ai_system_id, organization_id, created_by_id
      ) VALUES (
        'Equal Employment Issue', 'Potential violation of equal employment opportunity regulations',
        'high', 'open', $1, $2, $3
      )
    `, [hrSystem.id, adminOrg.id, demoUser.id]);

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
    await client.end();
    console.log('Database connection closed');
  }
}

// Run the seed function
seed()
  .catch(err => {
    console.error('Seed failed:', err);
    process.exit(1);
  });