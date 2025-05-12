# Getting Started with AuraAI Governance Platform

This guide provides a quick start for developers to set up and run the AuraAI Governance Platform locally.

## Prerequisites

Before you begin, ensure you have the following installed on your development machine:

- **Node.js**: Version 16.x or later
- **PostgreSQL**: Version 13 or later
- **Git**: For cloning the repository

## Setup Steps

### 1. Clone the Repository

```bash
git clone <repository-url>
cd aura-ai-governance
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit the `.env` file and update the values:

```
# Database connection (PostgreSQL)
DATABASE_URL=postgresql://postgres:your-password@localhost:5432/ai_governance

# Session configuration
SESSION_SECRET=your-secure-session-secret

# Application configuration
NODE_ENV=development
PORT=5000

# External API keys
# Required for scanning private GitHub repositories
GITHUB_API_KEY=your-github-personal-access-token

# Required for ChatGPT-PiiDetect and Bias Analysis features
OPENAI_API_KEY=your-openai-api-key
```

### 4. Create the Database

```bash
# Login to PostgreSQL
sudo -u postgres psql

# Create the database
CREATE DATABASE ai_governance;

# Exit psql
\q
```

### 5. Set Up the Database Schema

```bash
npm run db:push
```

### 6. Seed the Database

```bash
./seed-db.sh
```

### 7. Start the Development Server

```bash
npm run dev
```

The application will be available at http://localhost:5000.

## Login Credentials

After seeding the database, you can use the following credentials to log in:

**Admin User:**
- Username: admin_user
- Password: adminpassword

**Demo User:**
- Username: demo_user
- Password: demopassword

## Key Features to Try

### AI Usage Finder

1. Navigate to: Map > AI Usage Finder
2. Enter a GitHub organization name
3. Click "Start Scan" to detect AI/ML usage in repositories

### Bias Analysis

1. Navigate to: Measure > Bias Analysis
2. Create a new analysis with a name and description
3. Select a data source (CSV or JSON)
4. Upload a data file or provide a webhook URL
5. Click "Start Analysis" to analyze the data for bias

### Risk Register

1. Navigate to: Manage > Risk Register
2. View existing risks or add new ones
3. Associate risks with AI systems

## Folder Structure

```
├── client/           # Frontend React application
│   ├── src/          # Source code
│   │   ├── components/   # UI components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── lib/          # Utility functions
│   │   ├── pages/        # Page components
│   │   └── types/        # TypeScript type definitions
├── docs/             # Documentation
├── scripts/          # Utility scripts
├── server/           # Backend Express application
│   ├── auth.ts       # Authentication logic
│   ├── db.ts         # Database connection
│   ├── index.ts      # Entry point
│   ├── routes.ts     # API routes
│   ├── storage.ts    # Data storage interface
│   └── vite.ts       # Vite configuration
├── shared/           # Shared code between client and server
│   └── schema.ts     # Database schema
```

## Adding External API Keys

### GitHub API Key

To scan private repositories, you'll need a GitHub Personal Access Token:

1. Go to GitHub > Settings > Developer Settings > Personal Access Tokens
2. Generate a new token with `repo` scope
3. Add the token to your `.env` file as `GITHUB_API_KEY`

### OpenAI API Key

For AI-powered features like Bias Analysis and PII detection:

1. Go to [platform.openai.com](https://platform.openai.com/)
2. Create an account or sign in
3. Navigate to API Keys and create a new secret key
4. Add the key to your `.env` file as `OPENAI_API_KEY`

## Additional Resources

For more detailed information, refer to these documentation files:

- [Database Schema Documentation](./database_schema.md)
- [API Reference](./api_reference.md)
- [GitHub AI Detector Logic](./github-ai-detector-logic.md)
- [Setup Guide](./SETUP-GUIDE.md)