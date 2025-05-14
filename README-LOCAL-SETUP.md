# Local Development Setup Guide

This guide provides instructions for setting up the AuraAI Multi-tenant SaaS platform on your local development environment.

## Prerequisites

- Node.js (v16.x or later)
- PostgreSQL (v13 or later)
- Git

## Database Setup

1. Create a PostgreSQL database for the application:

```bash
# Login to PostgreSQL
sudo -u postgres psql

# Create the database
CREATE DATABASE ai_governance;

# Exit psql
\q
```

2. Set up your environment variables - create a `.env` file in the root directory:

```bash
# Copy the example .env file
cp .env.example .env
```

3. Edit the `.env` file to match your PostgreSQL connection details:

```
DATABASE_URL=postgresql://username:password@localhost:5432/ai_governance
```

Replace `username` and `password` with your PostgreSQL credentials. If you're using the default PostgreSQL setup, the connection string would be:

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ai_governance
```

## Installation Steps

1. Clone the repository:

```bash
git clone https://github.com/your-org/aura-ai-governance.git
cd aura-ai-governance
```

2. Install dependencies:

```bash
npm install
```

3. Set up the database schema:

```bash
npm run db:push
```

4. Seed the database:

```bash
./seed-db.sh
```

The script will:
- Automatically detect if you're running in a local environment or on Replit
- Use the appropriate database client (standard PostgreSQL locally, Neon serverless on Replit)
- Install any missing dependencies if needed
- Create database tables and populate them with sample data

If you encounter errors about missing columns (for example, "column 'impact' does not exist"), it means your database schema needs to be updated. Run:

```bash
# Update the database schema first
npm run db:push

# Then seed the database
./seed-db.sh
```

Alternatively, you can use the fallback seed script that works with both old and new schemas:

```bash
node scripts/fallback-seed.js
```

The seed script will populate your database with:
- Organizations (Admin Organization and Finance Corp.)
- Roles (Administrator, User, Analyst, Viewer)
- Users (admin_user, demo_user, viewer_user)
- AI Systems (Customer Support Chatbot, Fraud Detection System, HR Candidate Screening, etc.)
- Risk Items with enhanced data (severity, impact, likelihood, category)
- Risk Mitigations for tracking mitigation strategies
- Compliance Issues

## Running the Application

Start the development server:

```bash
npm run dev
```

The application will be available at http://localhost:5000.

## Login Credentials

The seed script creates the following users:

**Admin User:**
- Username: admin_user
- Password: adminpassword

**Demo User:**
- Username: demo_user
- Password: demopassword

**Viewer User:**
- Username: viewer_user
- Password: viewerpassword

## Troubleshooting

### Database Connection Issues

If you encounter database connection issues, check:

1. Your PostgreSQL service is running
2. Your DATABASE_URL is correct in the `.env` file
3. The user has appropriate permissions to the database

You can run the seed script with a custom database URL:

```bash
DATABASE_URL=postgresql://custom_user:custom_pass@localhost:5432/custom_db ./seed-db.sh
```

### PostgreSQL Connection Options

#### Local PostgreSQL

For standard local PostgreSQL:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ai_governance
```

#### Remote PostgreSQL

For a remote PostgreSQL server:
```
DATABASE_URL=postgresql://username:password@remote-server-address:5432/ai_governance
```

#### PostgreSQL in Docker

If you're running PostgreSQL in a Docker container:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ai_governance
```
Make sure your Docker container is exposing port 5432 to your host machine.

#### Cloud PostgreSQL (Non-Neon)

For standard cloud PostgreSQL providers (like AWS RDS, DigitalOcean):
```
DATABASE_URL=postgresql://username:password@hostname.region.rds.amazonaws.com:5432/ai_governance
```

### Schema Changes

If you make changes to the database schema in `shared/schema.ts`:

1. Generate and apply migrations:

```bash
npm run db:push
```

2. Reseed the database if needed:

```bash
./seed-db.sh
```

### Recent Schema Updates

The database schema has been enhanced with the following features:

1. **Enhanced Risk Items**:
   - Added impact field (low, medium, high)
   - Added likelihood field (low, medium, high)
   - Added category field (security, privacy, bias, etc.)
   - Added systemDetails field for additional context

2. **Risk Mitigations Table**:
   - Tracks mitigation strategies for risk items
   - Includes status tracking (planned, in-progress, completed, rejected)
   - Stores mitigation notes and descriptions
   - Links to risk items via foreign key

3. **Frontier Models Alerts**:
   - `frontier_models_list` table for tracking available AI models
   - `frontier_models_alerts_config` table for alert configurations
   - `frontier_models_alerts` table for storing model alerts
   - Dashboard widget showing recent frontier model alerts
   - Color-coded alerts by category (security, feature, compliance, ethics)
   - Integration with the Manage page for full alert history and configuration

4. **Infrastructure Map**:
   - `infra_inventory` table for tracking IT infrastructure 
   - Visual representation of infrastructure components with AuraAI scanner at the center
   - Interactive canvas with draggable nodes
   - Color-coded categories (on-premises, cloud, source control)
   - Count indicators for each infrastructure category
   - Reset layout functionality with animation effects

After cloning or pulling the latest code, ensure you run:

```bash
npm run db:push && ./seed-db.sh
```

This will update your schema and seed the database with sample data that includes these enhanced fields and Frontier Models data.

## Documentation

For detailed feature documentation, see:

- [User Guide](./docs/user_guide.md) - Complete user documentation
- [Database Schema](./docs/database_schema.md) - Database structure and relationships
- [Frontier Models Guide](./docs/frontier_models_guide.md) - Detailed guide for the Frontier Models feature
- [Risk Register Guide](./docs/risk_register_guide.md) - Information on using the Risk Register
- [Infrastructure Map Guide](./docs/infrastructure_map_guide.md) - Guide for the Infrastructure Map visualization