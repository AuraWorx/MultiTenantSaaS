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
```

### 2. Configure Environment Variables

Create or update your `.env` file with the PostgreSQL connection details:

```
DATABASE_URL=postgresql://username:password@localhost:5432/ai_governance
SESSION_SECRET=your_secure_session_secret
```

Replace `username`, `password`, and `ai_governance` with your PostgreSQL credentials.

### 3. Push Database Schema

Run the following command to push the schema to your PostgreSQL database:

```bash
npm run db:push
```

This will create all the necessary tables based on the schema definitions in `shared/schema.ts`.

## Seeding the Database

We've provided a seed script to populate your database with initial data for testing.

### Running the Seed Script

To run the seed script:

```bash
# From the project root directory
tsx scripts/seed.ts
```

If you're using the Replit environment, you can run:

```bash
npx tsx scripts/seed.ts
```

### What the Seed Script Does

The seed script will:

1. Clear existing data from all tables (if any)
2. Create sample organizations
   - Admin Organization
   - TechCorp Inc.
   - Finance Global
3. Create user roles with appropriate permissions
   - Admin: Full access to all features
   - User: Standard access to most features
   - Viewer: Read-only access to dashboards and reports
4. Create sample users
   - Admin user
   - Demo user
   - Viewer user
   - Tech user
5. Create sample AI systems
   - Customer Support Chatbot
   - Fraud Detection System
   - HR Candidate Screening
   - Product Recommendation Engine
   - Automated Trading System
6. Create sample risk items
7. Create sample compliance issues

### Sample Login Credentials

After running the seed script, you can use the following credentials to log in:

| Role  | Username    | Password      |
|-------|-------------|---------------|
| Admin | admin_user  | adminpassword |
| User  | demo_user   | demopassword  |
| Viewer| viewer_user | viewerpassword|

## Database Schema Updates

If you make changes to the schema in `shared/schema.ts`, you'll need to update the database:

```bash
npm run db:push
```

## Troubleshooting

### Connection Issues

If you encounter connection issues:

1. Verify PostgreSQL is running
```bash
sudo systemctl status postgresql
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