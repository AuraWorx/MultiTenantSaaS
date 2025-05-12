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
    await client.query('DELETE FROM bias_analysis_results');
    await client.query('DELETE FROM bias_analysis_scans');
    await client.query('DELETE FROM github_scan_results');
    await client.query('DELETE FROM github_scan_summaries');
    await client.query('DELETE FROM github_scan_configs');
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
    await client.query('ALTER SEQUENCE github_scan_configs_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE github_scan_results_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE github_scan_summaries_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE bias_analysis_scans_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE bias_analysis_results_id_seq RESTART WITH 1');

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

    const techOrgRes = await client.query(`
      INSERT INTO organizations (name) 
      VALUES ('TechCorp Inc.')
      RETURNING *
    `);
    const techOrg = techOrgRes.rows[0];

    // Create users
    console.log('Creating users...');
    const adminUserRes = await client.query(`
      INSERT INTO users (
        username, email, password, first_name, last_name, 
        organization_id, role_id, active
      ) VALUES (
        'admin', 'admin@auraai.com', $1, 'Admin', 'User', 
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
    `, [await hashPassword('viewerpassword'), adminOrg.id, viewerRole.id]);
    const viewerUser = viewerUserRes.rows[0];

    // Create Tech Corp admin user
    const techAdminRes = await client.query(`
      INSERT INTO users (
        username, email, password, first_name, last_name, 
        organization_id, role_id, active
      ) VALUES (
        'tech_admin', 'admin@techcorp.com', $1, 'Tech', 'Admin', 
        $2, $3, true
      ) RETURNING *
    `, [await hashPassword('techpassword'), techOrg.id, adminRole.id]);
    const techAdmin = techAdminRes.rows[0];

    // Create AI Systems
    console.log('Creating AI systems...');
    const chatbotRes = await client.query(`
      INSERT INTO ai_systems (
        name, description, type, location,
        organization_id, created_by_id
      ) VALUES (
        'Customer Support Chatbot', 'AI assistant for customer support', 
        'Conversational AI', 'cloud', $1, $2
      ) RETURNING *
    `, [adminOrg.id, adminUser.id]);
    const chatbot = chatbotRes.rows[0];

    const fraudSystemRes = await client.query(`
      INSERT INTO ai_systems (
        name, description, type, location,
        organization_id, created_by_id
      ) VALUES (
        'Fraud Detection System', 'ML system to detect financial fraud', 
        'Machine Learning', 'on-premise', $1, $2
      ) RETURNING *
    `, [adminOrg.id, adminUser.id]);
    const fraudSystem = fraudSystemRes.rows[0];

    const hrSystemRes = await client.query(`
      INSERT INTO ai_systems (
        name, description, type, location,
        organization_id, created_by_id
      ) VALUES (
        'HR Candidate Screening', 'AI for screening job candidates', 
        'Machine Learning', 'cloud', $1, $2
      ) RETURNING *
    `, [adminOrg.id, demoUser.id]);
    const hrSystem = hrSystemRes.rows[0];

    const tradingBotRes = await client.query(`
      INSERT INTO ai_systems (
        name, description, type, location,
        organization_id, created_by_id
      ) VALUES (
        'Automated Trading Bot', 'AI for high-frequency trading', 
        'Decision System', 'hybrid', $1, $2
      ) RETURNING *
    `, [financeOrg.id, adminUser.id]);
    const tradingBot = tradingBotRes.rows[0];

    const recommenderRes = await client.query(`
      INSERT INTO ai_systems (
        name, description, type, location,
        organization_id, created_by_id
      ) VALUES (
        'Product Recommender', 'ML system for product recommendations', 
        'Recommendation Engine', 'cloud', $1, $2
      ) RETURNING *
    `, [techOrg.id, techAdmin.id]);
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

    // Create GitHub Scan Configs
    console.log('Creating GitHub scan configs...');
    const auraWorxConfigRes = await client.query(`
      INSERT INTO github_scan_configs (
        github_org_name, organization_id, created_by_id, 
        last_scan_at, status
      ) VALUES (
        'AuraWorx', $1, $2, $3, 'completed'
      ) RETURNING *
    `, [adminOrg.id, adminUser.id, new Date()]);
    const auraWorxConfig = auraWorxConfigRes.rows[0];

    const techCorpConfigRes = await client.query(`
      INSERT INTO github_scan_configs (
        github_org_name, organization_id, created_by_id, 
        last_scan_at, status
      ) VALUES (
        'TechCorp', $1, $2, $3, 'completed'
      ) RETURNING *
    `, [techOrg.id, techAdmin.id, new Date()]);
    const techCorpConfig = techCorpConfigRes.rows[0];

    const financeCorpConfigRes = await client.query(`
      INSERT INTO github_scan_configs (
        github_org_name, organization_id, created_by_id, 
        status
      ) VALUES (
        'FinanceCorp', $1, $2, 'pending'
      ) RETURNING *
    `, [financeOrg.id, adminUser.id]);
    const financeCorpConfig = financeCorpConfigRes.rows[0];

    // Create GitHub Scan Results
    console.log('Creating GitHub scan results...');
    await client.query(`
      INSERT INTO github_scan_results (
        scan_config_id, repository_name, repository_url, 
        has_ai_usage, ai_libraries, ai_frameworks, 
        scan_date, added_to_risk, confidence_score, detection_type
      ) VALUES (
        $1, 'llm-anthropic', 'https://github.com/AuraWorx/llm-anthropic',
        true, ARRAY['anthropic'], ARRAY['anthropic>=0.48.0'],
        $2, false, 100, 'Dependency File'
      )
    `, [auraWorxConfig.id, new Date()]);

    await client.query(`
      INSERT INTO github_scan_results (
        scan_config_id, repository_name, repository_url, 
        has_ai_usage, ai_libraries, ai_frameworks, 
        scan_date, added_to_risk, confidence_score, detection_type
      ) VALUES (
        $1, 'MultiTenantSaaS', 'https://github.com/AuraWorx/MultiTenantSaaS',
        true, ARRAY['openai'], ARRAY['openai@^4.98.0'],
        $2, true, 100, 'Dependency File'
      )
    `, [auraWorxConfig.id, new Date()]);

    await client.query(`
      INSERT INTO github_scan_results (
        scan_config_id, repository_name, repository_url, 
        has_ai_usage, ai_libraries, ai_frameworks, 
        scan_date, added_to_risk, confidence_score, detection_type
      ) VALUES (
        $1, 'SmartGlasses', 'https://github.com/AuraWorx/SmartGlasses',
        false, ARRAY[]::text[], ARRAY[]::text[],
        $2, false, 0, ''
      )
    `, [auraWorxConfig.id, new Date()]);

    await client.query(`
      INSERT INTO github_scan_results (
        scan_config_id, repository_name, repository_url, 
        has_ai_usage, ai_libraries, ai_frameworks, 
        scan_date, added_to_risk, confidence_score, detection_type
      ) VALUES (
        $1, 'ai-assistant', 'https://github.com/TechCorp/ai-assistant',
        true, ARRAY['langchain', 'openai'], ARRAY['langchain@^0.0.200', 'openai@^4.2.0'],
        $2, true, 100, 'Dependency File'
      )
    `, [techCorpConfig.id, new Date()]);

    // Create GitHub Scan Summaries
    console.log('Creating GitHub scan summaries...');
    await client.query(`
      INSERT INTO github_scan_summaries (
        scan_config_id, total_repositories, repositories_with_ai,
        scan_date, organization_id
      ) VALUES (
        $1, 3, 2, $2, $3
      )
    `, [auraWorxConfig.id, new Date(), adminOrg.id]);

    await client.query(`
      INSERT INTO github_scan_summaries (
        scan_config_id, total_repositories, repositories_with_ai,
        scan_date, organization_id
      ) VALUES (
        $1, 1, 1, $2, $3
      )
    `, [techCorpConfig.id, new Date(), techOrg.id]);

    // Create Bias Analysis Scans
    console.log('Creating bias analysis scans...');
    const hiringBiasScanRes = await client.query(`
      INSERT INTO bias_analysis_scans (
        name, description, status, data_source,
        ai_system_id, organization_id, created_by_id
      ) VALUES (
        'Hiring Data Bias Analysis', 'Analysis of potential bias in HR hiring data',
        'completed', 'CSV Upload', $1, $2, $3
      ) RETURNING *
    `, [hrSystem.id, adminOrg.id, demoUser.id]);
    const hiringBiasScan = hiringBiasScanRes.rows[0];

    const lendingBiasScanRes = await client.query(`
      INSERT INTO bias_analysis_scans (
        name, description, status, data_source,
        ai_system_id, organization_id, created_by_id
      ) VALUES (
        'Lending Algorithm Bias Check', 'Analysis of potential bias in lending decisions',
        'completed', 'API Webhook', $1, $2, $3
      ) RETURNING *
    `, [fraudSystem.id, adminOrg.id, adminUser.id]);
    const lendingBiasScan = lendingBiasScanRes.rows[0];

    // Create Bias Analysis Results
    console.log('Creating bias analysis results...');
    await client.query(`
      INSERT INTO bias_analysis_results (
        scan_id, bias_type, bias_score, description,
        attribute_contributions, recommended_actions, organization_id
      ) VALUES (
        $1, 'gender', 0.78, 'Significant gender bias detected in hiring data',
        '{"education": 0.35, "previous_roles": 0.28, "age": 0.15}',
        'Review and adjust model weights for education and previous roles attributes',
        $2
      )
    `, [hiringBiasScan.id, adminOrg.id]);

    await client.query(`
      INSERT INTO bias_analysis_results (
        scan_id, bias_type, bias_score, description,
        attribute_contributions, recommended_actions, organization_id
      ) VALUES (
        $1, 'racial', 0.42, 'Moderate racial bias detected in lending decisions',
        '{"zip_code": 0.45, "income": 0.22, "credit_history_length": 0.18}',
        'Remove zip code as a factor in lending decisions',
        $2
      )
    `, [lendingBiasScan.id, adminOrg.id]);

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