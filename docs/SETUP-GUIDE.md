# AuraAI Governance Platform - Setup Guide

This document provides detailed instructions for setting up and running the AuraAI Multi-tenant SaaS platform for AI governance.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Database Setup](#database-setup)
3. [Environment Variables](#environment-variables)
4. [Installation Steps](#installation-steps)
5. [Database Schema Updates](#database-schema-updates)
6. [External API Integration](#external-api-integration)
7. [Running the Application](#running-the-application)
8. [Testing Features](#testing-features)
9. [Troubleshooting](#troubleshooting)

## Prerequisites

- Node.js (v16.x or later)
- PostgreSQL (v13 or later)
- Git
- GitHub API key (for AI Usage Finder functionality)
- OpenAI API key (for ChatGPT-PiiDetect and Bias Analysis functionality)

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

## Environment Variables

The application requires the following environment variables:

```
# Database connection (PostgreSQL)
DATABASE_URL=postgresql://postgres:password@localhost:5432/ai_governance

# Session configuration
SESSION_SECRET=your-secure-session-secret

# Application configuration
NODE_ENV=development
PORT=5000

# External API keys
GITHUB_API_KEY=your-github-personal-access-token
OPENAI_API_KEY=your-openai-api-key
```

### Required API Keys

- **GitHub API Key**: To scan private repositories, you need a personal access token with appropriate repository access permissions.
- **OpenAI API Key**: For AI-powered features like Bias Analysis and PII detection.

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

## Database Schema Updates

The latest version includes several new database tables to support enhanced functionality:

### GitHub Scan Configuration
- Table: `github_scan_configs`
- Purpose: Stores GitHub organization scanning configurations
- Related tables: `github_scan_results`, `github_scan_summaries`

### Bias Analysis
- Table: `bias_analysis_scans`
- Purpose: Stores scan configurations for bias detection in data sources
- Table: `bias_analysis_results`
- Purpose: Stores detailed analysis results by metric and demographic group

To apply these schema updates:

```bash
npm run db:push
```

## External API Integration

### GitHub API Integration

The AI Usage Finder now supports scanning both public and private repositories to detect AI/ML usage patterns. It requires:

1. A GitHub Personal Access Token with appropriate permissions
2. Configure in `.env` file: `GITHUB_API_KEY=your-github-token`

### OpenAI API Integration

Several features use OpenAI's API:

1. **ChatGPT-PiiDetect**: Detects PII in text data using GPT models
2. **Bias Analysis**: Uses AI for advanced data bias detection

Configuration:
1. Obtain an OpenAI API key from [OpenAI Platform](https://platform.openai.com/)
2. Add to `.env` file: `OPENAI_API_KEY=your-openai-key`

## Running the Application

Start the development server:

```bash
npm run dev
```

The application will be available at http://localhost:5000.

## Testing Features

### AI Usage Finder

1. Navigate to the Map > AI Usage Finder section
2. Enter a GitHub organization name
3. Click "Start Scan"
4. View detected AI/ML usage in repositories

### Bias Analysis

1. Navigate to the Measure > Bias Analysis section
2. Create a new analysis with:
   - Name and description
   - Data source (CSV, JSON, or webhook)
   - Upload sample data file
3. Click "Start Analysis"
4. View detailed bias metrics and scores

## Troubleshooting

### Database Connection Issues

If you encounter database connection issues, check:

1. Your PostgreSQL service is running
2. Your DATABASE_URL is correct in the `.env` file
3. The user has appropriate permissions to the database

### API Key Issues

For GitHub scanning failures:
1. Verify your GitHub API key has appropriate repository access permissions
2. Check rate limiting on the GitHub API

For OpenAI features:
1. Ensure your OpenAI API key is valid and has sufficient credits
2. Check for proper request formatting in the API calls

### File Upload Issues

If file uploads fail in the Bias Analysis:
1. Check file format (CSV, JSON supported)
2. Ensure file size is under 5MB
3. Verify file contains valid data with proper headers

### Local Development vs Production

When running locally:
- Use localhost connection URLs in environment variables
- Set `NODE_ENV=development` to enable detailed logging
- Consider using a dedicated development database