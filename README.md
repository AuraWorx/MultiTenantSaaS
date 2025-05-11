# AI Governance Platform

A comprehensive multi-tenant SaaS platform for AI governance, following the "Map, Measure, Manage" framework. This platform helps organizations govern AI usage with features for discovering, assessing, and managing AI systems with built-in compliance, risk management, and analysis tools.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
  - [Frontend Architecture](#frontend-architecture)
  - [Backend Architecture](#backend-architecture)
  - [Database Schema](#database-schema)
- [Setup and Installation](#setup-and-installation)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [Development Guide](#development-guide)
- [API Documentation](#api-documentation)
- [Authentication and Authorization](#authentication-and-authorization)

## Documentation

Detailed documentation is available in the `docs` directory:

- [Architecture Overview](docs/architecture.md) - High-level architecture and design decisions
- [Database Schema](docs/database_schema.md) - Detailed database schema documentation
- [Database Setup](docs/database_setup.md) - Guide for setting up and seeding the database
- [API Reference](docs/api_reference.md) - Comprehensive API endpoint reference
- [Frontend Architecture](docs/frontend_architecture.md) - Frontend component organization and patterns
- [Development Guide](docs/development_guide.md) - Guide for local development setup
- [User Guide](docs/user_guide.md) - End-user documentation for using the platform
- [Security Guide](docs/security.md) - Security features and best practices
- [Roadmap](docs/roadmap.md) - Planned features and future enhancements

## Overview

The AI Governance Platform is designed to help organizations discover, assess, and manage their AI systems while ensuring compliance with regulatory requirements. The platform implements organization-based multi-tenancy with role-based access control, allowing teams to collaborate effectively on AI governance initiatives.

## Features

The platform is organized around three main modules:

### Map

Discover and document AI systems throughout your organization:

- **AI Usage Finder**: Discover and catalog AI systems across your organization
- **Use Case Database**: Maintain a database of AI use cases with detailed information
- **CMDB Integration**: Connect with Configuration Management Database for AI asset tracking
- **Risk Documentation**: Document and track AI-related risks and compliance requirements

### Measure

Assess and analyze AI systems for risks and compliance:

- **Compliance Rules Engine**: Define and enforce compliance rules for AI systems
- **AuraAI Wizard**: Guided compliance assessment tool for AI systems
- **PII Leak Detection**: Find sensitive data exposure in AI systems
- **Bias Analysis**: Detect and mitigate potential biases in AI models
- **Toxicity Analysis**: Detect harmful content in AI-generated outputs

### Manage

Control and govern AI systems throughout their lifecycle:

- **Frontier Model Alerts**: Receive alerts about newly deployed frontier models
- **Risk Register**: Maintain a comprehensive risk register for AI systems
- **Lifecycle Management**: Manage the complete lifecycle of AI systems

## Architecture

### Frontend Architecture

The frontend is built with React and organized as follows:

```
client/
├── src/
│   ├── components/
│   │   ├── auth/          # Authentication components
│   │   ├── dashboard/     # Dashboard components
│   │   ├── layout/        # Layout components (sidebar, navbar)
│   │   ├── map/           # Map feature components
│   │   ├── measure/       # Measure feature components
│   │   ├── manage/        # Manage feature components
│   │   └── ui/            # Reusable UI components (from shadcn/ui)
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility functions and configuration
│   ├── pages/             # Page components for each route
│   ├── types/             # TypeScript type definitions
│   ├── App.tsx            # Main application component
│   └── main.tsx           # Application entry point
```

Key technologies used:

- **React**: Frontend framework
- **TypeScript**: Type-safe JavaScript
- **Wouter**: Lightweight routing library
- **@tanstack/react-query**: Data fetching and state management
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Reusable UI component library
- **Zod**: Schema validation
- **Lucide React**: Icon library

### Backend Architecture

The backend is built with Express.js and organized as follows:

```
server/
├── auth.ts            # Authentication and authorization logic
├── db.ts              # Database connection and initialization
├── index.ts           # Server entry point
├── routes.ts          # API routes definition
├── storage.ts         # Data access layer
└── vite.ts            # Vite integration for serving the frontend
```

Key technologies used:

- **Node.js**: JavaScript runtime
- **Express**: Web server framework
- **PostgreSQL**: Relational database
- **Drizzle ORM**: Database ORM
- **Passport.js**: Authentication middleware
- **express-session**: Session management
- **scrypt**: Password hashing

### Database Schema

The application uses a PostgreSQL database with the following schema:

```
organizations
├── id (PK)
├── name
└── createdAt

roles
├── id (PK)
├── name
└── permissions (array)

users
├── id (PK)
├── username
├── email
├── password
├── firstName
├── lastName
├── avatarUrl
├── active
├── organizationId (FK to organizations)
├── roleId (FK to roles)
└── createdAt

ai_systems
├── id (PK)
├── name
├── description
├── type
├── status
├── organizationId (FK to organizations)
├── createdBy (FK to users)
├── createdAt
└── updatedAt

risk_items
├── id (PK)
├── title
├── description
├── category
├── severity
├── status
├── organizationId (FK to organizations)
├── aiSystemId (FK to ai_systems)
├── createdBy (FK to users)
├── createdAt
└── updatedAt

compliance_issues
├── id (PK)
├── title
├── description
├── category
├── severity
├── status
├── organizationId (FK to organizations)
├── aiSystemId (FK to ai_systems)
├── createdBy (FK to users)
├── createdAt
└── updatedAt
```

The database schema uses relations to connect the various entities through foreign keys. This design supports the multi-tenant architecture by associating all major entities with an organization.

## Setup and Installation

### Prerequisites

- Node.js 20.x or higher
- PostgreSQL 14.x or higher
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/ai-governance-platform.git
cd ai-governance-platform
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/ai_governance

# Session
SESSION_SECRET=your_session_secret
```

### Database Setup

1. Create a PostgreSQL database:

```bash
createdb ai_governance
```

2. Push the schema to the database:

```bash
npm run db:push
```

This will create all necessary tables and relationships in the database.

3. Seed initial data (optional):

```bash
npm run db:seed
```

This will create initial roles, an admin organization, and a demo user.

## Running the Application

### Development Mode

To run the application in development mode:

```bash
npm run dev
```

This will start the backend server and the frontend development server concurrently. The application will be available at http://localhost:5000.

### Production Mode

To build and run the application for production:

```bash
# Build the frontend
npm run build

# Start the server
npm start
```

The application will be available at http://localhost:5000.

## Development Guide

### Adding New Features

1. Define the feature interface in `shared/types.ts`
2. Create the necessary database schema in `shared/schema.ts`
3. Update the storage interface in `server/storage.ts`
4. Implement the API endpoints in `server/routes.ts`
5. Create the UI components in `client/src/components/`
6. Add the page component in `client/src/pages/`
7. Add the route in `client/src/App.tsx`

### Project Structure Best Practices

- Keep components focused on a single responsibility
- Put shared UI components in the `ui` directory
- Use React Query for data fetching and mutations
- Implement proper error handling and loading states
- Use Zod for form validation
- Follow the established styling patterns with Tailwind CSS

## API Documentation

The API follows RESTful principles and is organized by resource:

### Authentication

- `POST /api/register`: Register a new user
- `POST /api/login`: Log in a user
- `POST /api/logout`: Log out the current user
- `GET /api/user`: Get the current authenticated user

### Organizations

- `GET /api/organizations`: Get all organizations for the current user
- `POST /api/organizations`: Create a new organization
- `GET /api/organizations/:id`: Get a specific organization
- `PUT /api/organizations/:id`: Update an organization
- `DELETE /api/organizations/:id`: Delete an organization

### Users

- `GET /api/users`: Get all users in the organization
- `POST /api/users`: Create a new user
- `GET /api/users/:id`: Get a specific user
- `PUT /api/users/:id`: Update a user
- `DELETE /api/users/:id`: Delete a user

### AI Systems

- `GET /api/ai-systems`: Get all AI systems in the organization
- `POST /api/ai-systems`: Create a new AI system
- `GET /api/ai-systems/:id`: Get a specific AI system
- `PUT /api/ai-systems/:id`: Update an AI system
- `DELETE /api/ai-systems/:id`: Delete an AI system

### Risk Items

- `GET /api/risk-items`: Get all risk items in the organization
- `POST /api/risk-items`: Create a new risk item
- `GET /api/risk-items/:id`: Get a specific risk item
- `PUT /api/risk-items/:id`: Update a risk item
- `DELETE /api/risk-items/:id`: Delete a risk item

### Compliance Issues

- `GET /api/compliance-issues`: Get all compliance issues in the organization
- `POST /api/compliance-issues`: Create a new compliance issue
- `GET /api/compliance-issues/:id`: Get a specific compliance issue
- `PUT /api/compliance-issues/:id`: Update a compliance issue
- `DELETE /api/compliance-issues/:id`: Delete a compliance issue

## Authentication and Authorization

The application uses session-based authentication with Passport.js. User passwords are securely hashed using scrypt. The application implements role-based access control (RBAC) to ensure users can only access resources they are authorized to use.

Roles have associated permissions that control what actions a user can perform. The current roles include:

- **Admin**: Full access to all features and data
- **User**: Limited access to features and data
- **Viewer**: Read-only access to features and data

Users are associated with an organization, and can only access data within their organization, implementing multi-tenancy at the data level.

---

For more information or support, please contact [support@aigoveranceplatform.com](mailto:support@aigoveranceplatform.com).