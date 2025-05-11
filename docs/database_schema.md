# Database Schema Documentation

This document describes the database schema used by the AI Governance Platform. The platform uses PostgreSQL as its relational database and Drizzle ORM for database operations.

## Overview

The database schema is designed to support a multi-tenant SaaS application with organization-based access control. Each record is associated with an organization, implementing data isolation at the database level.

## Table Structure

### Organizations

Stores information about organizations in the platform.

```sql
CREATE TABLE organizations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

| Column | Type | Description |
| ------ | ---- | ----------- |
| id | SERIAL | Primary key, unique identifier for the organization |
| name | VARCHAR(255) | Name of the organization |
| created_at | TIMESTAMP | When the organization was created |

### Roles

Defines user roles within the platform.

```sql
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  permissions TEXT[] NOT NULL
);
```

| Column | Type | Description |
| ------ | ---- | ----------- |
| id | SERIAL | Primary key, unique identifier for the role |
| name | VARCHAR(255) | Name of the role (e.g., Admin, User, Viewer) |
| permissions | TEXT[] | Array of permission strings granted to the role |

### Users

Stores user accounts and their authentication information.

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  avatar_url TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  organization_id INTEGER NOT NULL REFERENCES organizations(id),
  role_id INTEGER NOT NULL REFERENCES roles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

| Column | Type | Description |
| ------ | ---- | ----------- |
| id | SERIAL | Primary key, unique identifier for the user |
| username | VARCHAR(255) | Username for authentication (unique) |
| email | VARCHAR(255) | User's email address (unique) |
| password | VARCHAR(255) | Hashed password |
| first_name | VARCHAR(255) | User's first name (optional) |
| last_name | VARCHAR(255) | User's last name (optional) |
| avatar_url | TEXT | URL to user's avatar image (optional) |
| active | BOOLEAN | Whether the user account is active |
| organization_id | INTEGER | Foreign key to organizations table |
| role_id | INTEGER | Foreign key to roles table |
| created_at | TIMESTAMP | When the user was created |

### AI Systems

Stores information about AI systems managed in the platform.

```sql
CREATE TABLE ai_systems (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL,
  organization_id INTEGER NOT NULL REFERENCES organizations(id),
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

| Column | Type | Description |
| ------ | ---- | ----------- |
| id | SERIAL | Primary key, unique identifier for the AI system |
| name | VARCHAR(255) | Name of the AI system |
| description | TEXT | Description of the AI system |
| type | VARCHAR(255) | Type of AI system (e.g., LLM, Classification, etc.) |
| status | VARCHAR(50) | Current status (e.g., Active, Development, Retired) |
| organization_id | INTEGER | Foreign key to organizations table |
| created_by | INTEGER | Foreign key to users table (creator) |
| created_at | TIMESTAMP | When the record was created |
| updated_at | TIMESTAMP | When the record was last updated |

### Risk Items

Stores risk items associated with AI systems.

```sql
CREATE TABLE risk_items (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  severity VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL,
  organization_id INTEGER NOT NULL REFERENCES organizations(id),
  ai_system_id INTEGER REFERENCES ai_systems(id),
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

| Column | Type | Description |
| ------ | ---- | ----------- |
| id | SERIAL | Primary key, unique identifier for the risk item |
| title | VARCHAR(255) | Title of the risk |
| description | TEXT | Detailed description of the risk |
| category | VARCHAR(100) | Risk category (e.g., Privacy, Security, Ethical) |
| severity | VARCHAR(50) | Risk severity level (e.g., High, Medium, Low) |
| status | VARCHAR(50) | Current status (e.g., Open, Mitigated, Accepted) |
| organization_id | INTEGER | Foreign key to organizations table |
| ai_system_id | INTEGER | Foreign key to ai_systems table (optional) |
| created_by | INTEGER | Foreign key to users table (creator) |
| created_at | TIMESTAMP | When the record was created |
| updated_at | TIMESTAMP | When the record was last updated |

### Compliance Issues

Stores compliance issues associated with AI systems.

```sql
CREATE TABLE compliance_issues (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  severity VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL,
  organization_id INTEGER NOT NULL REFERENCES organizations(id),
  ai_system_id INTEGER REFERENCES ai_systems(id),
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

| Column | Type | Description |
| ------ | ---- | ----------- |
| id | SERIAL | Primary key, unique identifier for the compliance issue |
| title | VARCHAR(255) | Title of the compliance issue |
| description | TEXT | Detailed description of the compliance issue |
| category | VARCHAR(100) | Category (e.g., GDPR, CCPA, Ethics) |
| severity | VARCHAR(50) | Severity level (e.g., High, Medium, Low) |
| status | VARCHAR(50) | Current status (e.g., Open, Resolved, In Progress) |
| organization_id | INTEGER | Foreign key to organizations table |
| ai_system_id | INTEGER | Foreign key to ai_systems table (optional) |
| created_by | INTEGER | Foreign key to users table (creator) |
| created_at | TIMESTAMP | When the record was created |
| updated_at | TIMESTAMP | When the record was last updated |

## Database Relationships

### Entity Relationship Diagram

```
┌────────────────┐     ┌──────────────┐     ┌──────────────┐
│  Organizations │1─┐  │     Users    │  ┌─1│    Roles     │
├────────────────┤  └─*├──────────────┤  │  ├──────────────┤
│ id             │     │ id           │  │  │ id           │
│ name           │     │ username     │  │  │ name         │
│ created_at     │     │ email        │  │  │ permissions  │
└────────────────┘     │ password     │  │  └──────────────┘
        │1             │ first_name   │  │
        │              │ last_name    │  │
        │              │ avatar_url   │*─┘
        │              │ active       │
        │              │ organization_id │
        │              │ role_id      │
        │              │ created_at   │
        │              └──────────────┘
        │                     │1
        │                     │
        │                     │
        │               ┌─────┴────┐
┌───────┼───────────┐   │          │
│       │           │   │          │
│1      │1          │   │1         │
┌──────────────┐   ┌────────────┐ ┌────────────────┐
│  AI Systems  │   │ Risk Items │ │Compliance Issues│
├──────────────┤   ├────────────┤ ├────────────────┤
│ id           │1┌─┤ id         │ │ id             │
│ name         │ │ │ title      │ │ title          │
│ description  │ │ │ description│ │ description    │
│ type         │ │ │ category   │ │ category       │
│ status       │ │ │ severity   │ │ severity       │
│ organization_id │ │ status     │ │ status         │
│ created_by   │ │ │ organization_id │ organization_id │
│ created_at   │ │ │ ai_system_id │ │ ai_system_id   │
│ updated_at   │ │ │ created_by  │ │ created_by     │
└──────────────┘ │ │ created_at  │ │ created_at     │
                 │ │ updated_at  │ │ updated_at     │
                 │ └────────────┘ └────────────────┘
                 │        │1              │1
                 │        │               │
                 └───────┘               │
                           └──────────────┘
```

### Key Relationships

1. **Organizations to Users**: One-to-many. Each organization can have multiple users, but each user belongs to exactly one organization.

2. **Roles to Users**: One-to-many. Each role can be assigned to multiple users, but each user has exactly one role.

3. **Organizations to AI Systems**: One-to-many. Each organization can have multiple AI systems, but each AI system belongs to exactly one organization.

4. **Users to AI Systems**: One-to-many. Each user can create multiple AI systems, and each AI system has exactly one creator.

5. **AI Systems to Risk Items**: One-to-many. Each AI system can have multiple risk items, but each risk item is associated with at most one AI system.

6. **AI Systems to Compliance Issues**: One-to-many. Each AI system can have multiple compliance issues, but each compliance issue is associated with at most one AI system.

7. **Organizations to Risk Items**: One-to-many. Each organization can have multiple risk items, and each risk item belongs to exactly one organization.

8. **Organizations to Compliance Issues**: One-to-many. Each organization can have multiple compliance issues, and each compliance issue belongs to exactly one organization.

## Indexing

To optimize query performance, the following indexes are recommended:

```sql
-- Users table indexes
CREATE INDEX idx_users_organization_id ON users(organization_id);
CREATE INDEX idx_users_role_id ON users(role_id);

-- AI Systems table indexes
CREATE INDEX idx_ai_systems_organization_id ON ai_systems(organization_id);
CREATE INDEX idx_ai_systems_created_by ON ai_systems(created_by);
CREATE INDEX idx_ai_systems_status ON ai_systems(status);

-- Risk Items table indexes
CREATE INDEX idx_risk_items_organization_id ON risk_items(organization_id);
CREATE INDEX idx_risk_items_ai_system_id ON risk_items(ai_system_id);
CREATE INDEX idx_risk_items_status ON risk_items(status);
CREATE INDEX idx_risk_items_severity ON risk_items(severity);

-- Compliance Issues table indexes
CREATE INDEX idx_compliance_issues_organization_id ON compliance_issues(organization_id);
CREATE INDEX idx_compliance_issues_ai_system_id ON compliance_issues(ai_system_id);
CREATE INDEX idx_compliance_issues_status ON compliance_issues(status);
CREATE INDEX idx_compliance_issues_severity ON compliance_issues(severity);
```

## Multi-Tenancy Implementation

The database schema implements multi-tenancy through data isolation at the database level:

1. Each record (AI system, risk item, compliance issue) is associated with an organization via a foreign key.
2. Users are associated with exactly one organization.
3. All queries include organization filtering to ensure users can only access data within their organization.

This approach ensures robust data isolation between organizations while using a single database instance.

## Schema Evolution

When updating the database schema:

1. Use Drizzle ORM's schema migration tools (`npm run db:generate` and `npm run db:push`)
2. Avoid direct SQL manipulation in production
3. Ensure backward compatibility when possible
4. Update related application code to accommodate schema changes

---

The database schema is defined in `shared/schema.ts` using Drizzle ORM's schema definition syntax.