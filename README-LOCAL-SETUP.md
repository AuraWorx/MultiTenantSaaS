# Local Development Setup Guide

This guide provides instructions for setting up the AuraAI Multi-tenant SaaS platform on your local development environment.

## Prerequisites

- Node.js (v16.x or later)
- PostgreSQL (v13 or later)
- Git

## Database Setup

1. Create a PostgreSQL database for the application.

2. Set up your environment variables - create a `.env` file in the root directory with the following:

```
DATABASE_URL=postgresql://username:password@localhost:5432/yourdatabase
```

Replace `username`, `password`, and `yourdatabase` with your PostgreSQL connection details.

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

The seed script will populate your database with:
- Organizations (Admin Organization and demo_org)
- Roles (Administrator, User, Analyst, Viewer)
- Users (admin_user, demo_user, viewer_user)
- AI Systems (Customer Support Chatbot, Fraud Detection System, HR Candidate Screening, etc.)
- Risk Items and Compliance Issues

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