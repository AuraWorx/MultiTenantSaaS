/**
 * Fallback seed script for local development when database schema hasn't been updated
 * This script works with both old and new schema versions
 */

import pg from 'pg';
import crypto from 'crypto';

const { Client } = pg;

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${hash}.${salt}`;
}

async function seed() {
  console.log('Starting database seed with fallback script...');
  
  const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/ai_governance';
  console.log(`Using database URL: ${dbUrl}`);
  
  const client = new Client({
    connectionString: dbUrl,
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL database');

    // Clear existing data
    console.log('Clearing existing data...');
    
    // Try to truncate all tables including Frontier Models tables if they exist
    try {
      await client.query(`
        TRUNCATE users, organizations, roles, ai_systems, risk_items, 
        frontier_models_alerts, frontier_models_alerts_config, frontier_models_list 
        CASCADE
      `);
    } catch (error) {
      // If the frontier models tables don't exist yet, fall back to the original tables
      console.log('Frontier Models tables not found, using basic truncate...');
      await client.query('TRUNCATE users, organizations, roles, ai_systems, risk_items CASCADE');
    }
    
    // Reset sequences
    console.log('Resetting sequences...');
    
    // Basic sequences
    await client.query(`
      ALTER SEQUENCE organizations_id_seq RESTART WITH 1;
      ALTER SEQUENCE roles_id_seq RESTART WITH 1;
      ALTER SEQUENCE users_id_seq RESTART WITH 1;
      ALTER SEQUENCE ai_systems_id_seq RESTART WITH 1;
      ALTER SEQUENCE risk_items_id_seq RESTART WITH 1;
    `);
    
    // Check and reset Frontier Models sequences if they exist
    try {
      await client.query(`
        ALTER SEQUENCE frontier_models_list_id_seq RESTART WITH 1;
        ALTER SEQUENCE frontier_models_alerts_config_id_seq RESTART WITH 1;
        ALTER SEQUENCE frontier_models_alerts_id_seq RESTART WITH 1;
      `);
      console.log('Reset Frontier Models sequences');
    } catch (error) {
      console.log('Frontier Models sequences not found, skipping...');
    }

    // Create roles
    console.log('Creating roles...');
    const adminRoleRes = await client.query(`
      INSERT INTO roles (name, permissions) 
      VALUES ('Administrator', ARRAY['admin', 'edit', 'view'])
      RETURNING *
    `);
    const adminRole = adminRoleRes.rows[0];

    const userRoleRes = await client.query(`
      INSERT INTO roles (name, permissions) 
      VALUES ('User', ARRAY['edit', 'view'])
      RETURNING *
    `);
    const userRole = userRoleRes.rows[0];

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
    const adminPassword = await hashPassword('adminpassword');
    const adminUserRes = await client.query(`
      INSERT INTO users (
        username, email, password, first_name, last_name, 
        avatar_url, active, organization_id, role_id
      ) VALUES (
        'admin', 'admin@auraai.com', $1, 'Admin', 'User',
        NULL, true, $2, $3
      ) RETURNING *
    `, [adminPassword, adminOrg.id, adminRole.id]);
    const adminUser = adminUserRes.rows[0];

    const demoPassword = await hashPassword('demopassword');
    const demoUserRes = await client.query(`
      INSERT INTO users (
        username, email, password, first_name, last_name, 
        avatar_url, active, organization_id, role_id
      ) VALUES (
        'demo_user', 'demo@example.com', $1, 'Demo', 'User',
        NULL, true, $2, $3
      ) RETURNING *
    `, [demoPassword, adminOrg.id, userRole.id]);
    const demoUser = demoUserRes.rows[0];

    // Create AI Systems
    console.log('Creating AI systems...');
    const chatbotRes = await client.query(`
      INSERT INTO ai_systems (
        name, description, type, location, 
        organization_id, created_by_id
      ) VALUES (
        'Customer Support Chatbot', 'AI chatbot for customer support',
        'Chatbot', 'cloud', $1, $2
      ) RETURNING *
    `, [adminOrg.id, adminUser.id]);
    const chatbot = chatbotRes.rows[0];

    const fraudSystemRes = await client.query(`
      INSERT INTO ai_systems (
        name, description, type, location, 
        organization_id, created_by_id
      ) VALUES (
        'Fraud Detection System', 'ML system for fraud detection',
        'Detection System', 'cloud', $1, $2
      ) RETURNING *
    `, [adminOrg.id, adminUser.id]);
    const fraudSystem = fraudSystemRes.rows[0];

    const hrSystemRes = await client.query(`
      INSERT INTO ai_systems (
        name, description, type, location, 
        organization_id, created_by_id
      ) VALUES (
        'HR Candidate Screening', 'AI for screening job candidates',
        'Recommendation System', 'internal', $1, $2
      ) RETURNING *
    `, [adminOrg.id, demoUser.id]);
    const hrSystem = hrSystemRes.rows[0];

    // Try to check if the enhanced schema exists
    let hasEnhancedSchema = false;
    try {
      await client.query("SELECT impact FROM risk_items LIMIT 0");
      console.log("Enhanced schema detected - using new risk_items fields");
      hasEnhancedSchema = true;
    } catch (err) {
      console.log("Basic schema detected - using original risk_items fields");
      hasEnhancedSchema = false;
    }

    // Create Risk Items - Choose approach based on schema
    console.log('Creating risk items...');
    if (hasEnhancedSchema) {
      // Enhanced schema with new fields
      console.log("Using enhanced schema for risk items");
      const privacyRisk = await client.query(`
        INSERT INTO risk_items (
          title, description, severity, impact, likelihood, category, status, system_details,
          ai_system_id, organization_id, created_by_id
        ) VALUES (
          'Data Privacy Risk', 'Risk of exposing customer PII through chat logs',
          'high', 'high', 'medium', 'privacy', 'open', 
          'Chatbot processes and stores user conversations that may contain sensitive data',
          $1, $2, $3
        ) RETURNING id
      `, [chatbot.id, adminOrg.id, adminUser.id]);

      const biasRisk = await client.query(`
        INSERT INTO risk_items (
          title, description, severity, impact, likelihood, category, status, system_details,
          ai_system_id, organization_id, created_by_id
        ) VALUES (
          'Model Bias Risk', 'Risk of bias in fraud detection for certain demographic groups',
          'medium', 'high', 'medium', 'bias', 'mitigated', 
          'Model may be biased against certain demographic groups due to training data imbalance',
          $1, $2, $3
        ) RETURNING id
      `, [fraudSystem.id, adminOrg.id, adminUser.id]);
    } else {
      // Basic schema with original fields
      console.log("Using basic schema for risk items");
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
    }

    // Create Frontier Models tables if they don't exist
    console.log('Checking for Frontier Models tables...');
    
    // Check if frontier_models_list table exists
    const frontierModelsTableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'frontier_models_list'
      );
    `);
    
    if (frontierModelsTableExists.rows[0].exists) {
      console.log('Creating and populating Frontier Models data...');
      
      // Refresh all frontier models data
      await client.query('DELETE FROM frontier_models_alerts');
      await client.query('DELETE FROM frontier_models_alerts_config');
      await client.query('DELETE FROM frontier_models_list');
      
      // Create frontier models
      const gpt4o = await client.query(`
        INSERT INTO frontier_models_list (model_id, name, provider)
        VALUES ('gpt-4o', 'GPT-4o', 'OpenAI')
        RETURNING id
      `);
      
      const claude = await client.query(`
        INSERT INTO frontier_models_list (model_id, name, provider)
        VALUES ('claude-3-sonnet', 'Claude Sonnet 3.7', 'Anthropic')
        RETURNING id
      `);
      
      const gemini = await client.query(`
        INSERT INTO frontier_models_list (model_id, name, provider)
        VALUES ('gemini-ultra-1.5', 'Gemini Ultra 1.5', 'Google')
        RETURNING id
      `);
      
      // Create alert configurations
      const gpt4oSecurityConfig = await client.query(`
        INSERT INTO frontier_models_alerts_config (model_id, organization_id, category)
        VALUES ($1, $2, 'security')
        RETURNING id
      `, [gpt4o.rows[0].id, adminOrg.id]);
      
      const claudeFeatureConfig = await client.query(`
        INSERT INTO frontier_models_alerts_config (model_id, organization_id, category)
        VALUES ($1, $2, 'feature')
        RETURNING id
      `, [claude.rows[0].id, adminOrg.id]);
      
      const geminiSecurityConfig = await client.query(`
        INSERT INTO frontier_models_alerts_config (model_id, organization_id, category)
        VALUES ($1, $2, 'security')
        RETURNING id
      `, [gemini.rows[0].id, adminOrg.id]);
      
      // Create alerts
      await client.query(`
        INSERT INTO frontier_models_alerts (alert_config_id, title, description, url, date_published, organization_id)
        VALUES ($1, 'Security Vulnerability CVE-2024-1234', 
                'Critical security issue discovered in GPT-4o that could allow prompt injection attacks',
                'https://example.com/openai-security', '2024-05-10', $2)
      `, [gpt4oSecurityConfig.rows[0].id, adminOrg.id]);
      
      await client.query(`
        INSERT INTO frontier_models_alerts (alert_config_id, title, description, url, date_published, organization_id)
        VALUES ($1, 'Claude Sonnet 3.7 New Feature Release', 
                'Enhanced multimodal capabilities with improved vision understanding and better reasoning',
                'https://example.com/anthropic-features', '2024-05-12', $2)
      `, [claudeFeatureConfig.rows[0].id, adminOrg.id]);
      
      await client.query(`
        INSERT INTO frontier_models_alerts (alert_config_id, title, description, url, date_published, organization_id)
        VALUES ($1, 'Gemini Ultra 1.5 Security Update', 
                'Important security patch addressing potential data leakage issues in latest model version',
                'https://example.com/gemini-security', '2024-05-05', $2)
      `, [geminiSecurityConfig.rows[0].id, adminOrg.id]);
    } else {
      console.log('Frontier Models tables do not exist yet. Skipping...');
    }

    console.log('Seed completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    await client.end();
    console.log('Database connection closed');
  }
}

// Execute the seed function
seed()
  .then(() => {
    console.log('🌱 Database seeded successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  });