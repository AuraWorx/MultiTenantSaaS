# Database Setup Guide

This guide provides instructions for setting up and seeding the database for the AI Governance Platform.

## Database Setup

### 1. Setting Up PostgreSQL

Ensure you have PostgreSQL installed and running on your system:

```bash
# Ubuntu
sudo apt-get update
sudo apt-get install -y postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# macOS (using Homebrew)
brew install postgresql
brew services start postgresql
```

### 2. Configure Environment Variables

Create or update your `.env` file with the PostgreSQL connection details:

```
DATABASE_URL=postgresql://username:password@localhost:5432/ai_governance
SESSION_SECRET=your_secure_session_secret
GITHUB_API_KEY=your_github_personal_access_token
```

Replace `username`, `password`, and `ai_governance` with your PostgreSQL credentials.

### 3. Create the Database

Create a PostgreSQL database:

```bash
# Linux
sudo -u postgres createdb ai_governance

# macOS or if you're using a different user
createdb ai_governance
```

### 4. Push Database Schema

Run the following command to push the schema to your PostgreSQL database:

```bash
npm run db:push
```

This will create all the necessary tables based on the schema definitions in `shared/schema.ts`.

## Seeding the Database

We've provided a seed script to populate your database with initial data for testing.

### Running the Seed Script

The simplest way to seed the database is to use the provided shell script:

```bash
# Make sure the script is executable
chmod +x seed-db.sh

# Run the script
./seed-db.sh
```

This script automatically detects whether you're in a local or Replit environment and uses the appropriate seeding method.

### What the Seed Script Does

The seed script will:

1. Clear existing data from all tables (if any)
2. Create sample roles with appropriate permissions:
   - Administrator: `['admin', 'manage_users', 'manage_organizations', 'view_all', 'edit_all']`
   - User: `['view_own', 'edit_own']`
   - Analyst: `['view_all', 'edit_own']`
   - Viewer: `['view_own']`
3. Create sample organizations:
   - Admin Organization
   - Finance Corp.
   - TechCorp Inc.
4. Create sample users:
   - Admin user (Administrator role)
   - Demo user (User role)
   - Viewer user (Viewer role)
   - Tech admin (Administrator role in TechCorp)
5. Create sample AI systems:
   - Customer Support Chatbot
   - Fraud Detection System
   - HR Candidate Screening
   - Automated Trading Bot
   - Product Recommender
6. Create sample risk items
7. Create sample compliance issues
8. Create GitHub scan configurations and results:
   - AuraWorx GitHub organization scan results
   - TechCorp GitHub organization scan results
   - FinanceCorp GitHub organization scan configuration (pending)
9. Create bias analysis scans and results:
   - Hiring Data Bias Analysis
   - Lending Algorithm Bias Check

### Sample Login Credentials

After running the seed script, you can use the following credentials to log in:

| Role          | Username    | Password      | Organization       |
|---------------|-------------|---------------|-------------------|
| Administrator | admin       | adminpassword | Admin Organization |
| User          | demo_user   | demopassword  | Admin Organization |
| Viewer        | viewer_user | viewerpassword| Admin Organization |
| Administrator | tech_admin  | techpassword  | TechCorp Inc.     |

## Database Schema Updates

If you make changes to the schema in `shared/schema.ts`, you'll need to update the database:

```bash
npm run db:push
```

This command uses Drizzle Kit to automatically update your database schema based on the changes in your code.

## Working with GitHub Scan Data

The AI Usage Finder feature scans GitHub repositories for AI/ML library usage. The seed script creates sample scan results, but to perform actual scans:

1. Ensure you have a GitHub API key in your `.env` file:
   ```
   GITHUB_API_KEY=your_github_personal_access_token
   ```

2. Create a scan configuration for a GitHub organization through the UI or API
3. Start the scan process from the AI Usage Finder interface

## Working with Bias Analysis Data

The Bias Analysis feature analyzes data for potential biases. The seed script creates sample bias analysis results, but to perform actual analysis:

1. Navigate to the Bias Analysis feature in the Measure section
2. Create a new bias analysis scan with a CSV upload, JSON input, or webhook configuration
3. Start the analysis process from the interface

## Troubleshooting

### Connection Issues

If you encounter connection issues:

1. Verify PostgreSQL is running
```bash
# Linux
sudo systemctl status postgresql

# macOS
brew services list | grep postgresql
```

2. Check your connection string in `.env`
3. Ensure the database exists
```bash
sudo -u postgres psql -c "CREATE DATABASE ai_governance;"
```

4. Ensure your user has appropriate permissions
```bash
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ai_governance TO your_username;"
```

### Schema Errors

If you encounter schema errors during `db:push`:

1. Check for syntax errors in `shared/schema.ts`
2. If tables already exist and you're making incompatible changes, you may need to drop the tables first:
```sql
DROP TABLE IF EXISTS bias_analysis_results;
DROP TABLE IF EXISTS bias_analysis_scans;
DROP TABLE IF EXISTS github_scan_results;
DROP TABLE IF EXISTS github_scan_summaries;
DROP TABLE IF EXISTS github_scan_configs;
DROP TABLE IF EXISTS compliance_issues;
DROP TABLE IF EXISTS risk_items;
DROP TABLE IF EXISTS ai_systems;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS roles;
DROP TABLE IF EXISTS organizations;
```

### Seed Script Errors

If the seed script fails:

1. Check for database connection issues
2. Ensure the schema has been pushed using `npm run db:push`
3. Look for error messages in the console output for specific issues
4. Ensure all required tables exist in the database