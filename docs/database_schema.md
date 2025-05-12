# Database Schema Documentation

This document outlines the database schema for the AuraAI Governance Platform, including all tables, relationships, and key fields.

## Core Tables

### Organizations
Table: `organizations`
- `id`: Serial, Primary Key
- `name`: Text, Organization name
- `created_at`: Timestamp with timezone

### Roles
Table: `roles`
- `id`: Serial, Primary Key
- `name`: Text, Role name
- `permissions`: Text array, List of permissions

### Users
Table: `users`
- `id`: Serial, Primary Key
- `username`: Text, Unique username
- `email`: Text, Unique email
- `password`: Text, Hashed password
- `first_name`: Text
- `last_name`: Text
- `avatar_url`: Text
- `active`: Boolean
- `organization_id`: Integer, Foreign Key to organizations.id
- `role_id`: Integer, Foreign Key to roles.id
- `created_at`: Timestamp with timezone

## AI Risk Management

### AI Systems
Table: `ai_systems`
- `id`: Serial, Primary Key
- `name`: Text, System name
- `description`: Text
- `status`: Text, System status
- `owner_id`: Integer, Foreign Key to users.id
- `organization_id`: Integer, Foreign Key to organizations.id
- `risk_level`: Text
- `version`: Text
- `deployed_at`: Timestamp with timezone
- `created_at`: Timestamp with timezone
- `updated_at`: Timestamp with timezone

### Risk Items
Table: `risk_items`
- `id`: Serial, Primary Key
- `title`: Text, Risk name
- `description`: Text
- `status`: Text, Risk status
- `severity`: Text
- `ai_system_id`: Integer, Foreign Key to ai_systems.id
- `owner_id`: Integer, Foreign Key to users.id
- `organization_id`: Integer, Foreign Key to organizations.id
- `created_at`: Timestamp with timezone
- `updated_at`: Timestamp with timezone

### Compliance Issues
Table: `compliance_issues`
- `id`: Serial, Primary Key
- `title`: Text, Issue name
- `description`: Text
- `status`: Text, Issue status
- `severity`: Text
- `ai_system_id`: Integer, Foreign Key to ai_systems.id
- `organization_id`: Integer, Foreign Key to organizations.id
- `created_at`: Timestamp with timezone
- `updated_at`: Timestamp with timezone

## AI Usage Detection

### GitHub Scan Configs
Table: `github_scan_configs`
- `id`: Serial, Primary Key
- `github_org_name`: Text, GitHub organization name
- `organization_id`: Integer, Foreign Key to organizations.id
- `created_at`: Timestamp with timezone
- `last_scan_at`: Timestamp with timezone, Nullable
- `status`: Text, Scan status

### GitHub Scan Results
Table: `github_scan_results`
- `id`: Serial, Primary Key
- `scan_config_id`: Integer, Foreign Key to github_scan_configs.id
- `repository_name`: Text, Repository name
- `repository_url`: Text, Repository URL
- `has_ai_usage`: Boolean
- `ai_libraries`: Text array, Detected AI libraries
- `ai_frameworks`: Text array, Detected AI frameworks
- `scan_date`: Timestamp with timezone
- `added_to_risk`: Boolean
- `confidence_score`: Float, Optional confidence score (0.0-1.0)
- `detection_type`: Text, Optional detection type

### GitHub Scan Summaries
Table: `github_scan_summaries`
- `id`: Serial, Primary Key
- `scan_config_id`: Integer, Foreign Key to github_scan_configs.id
- `total_repositories`: Integer
- `repositories_with_ai`: Integer
- `scan_date`: Timestamp with timezone

## Bias Analysis

### Bias Analysis Scans
Table: `bias_analysis_scans`
- `id`: Serial, Primary Key
- `organization_id`: Integer, Foreign Key to organizations.id
- `name`: Text, Scan name
- `description`: Text, Nullable
- `data_source`: Text, Source type ('csv', 'json', 'webhook')
- `status`: Text, Scan status ('pending', 'processing', 'completed', 'failed')
- `started_at`: Timestamp with timezone
- `completed_at`: Timestamp with timezone, Nullable
- `created_by`: Integer, Foreign Key to users.id

### Bias Analysis Results
Table: `bias_analysis_results`
- `id`: Serial, Primary Key
- `scan_id`: Integer, Foreign Key to bias_analysis_scans.id
- `organization_id`: Integer, Foreign Key to organizations.id
- `metric_name`: Text, Metric name
- `metric_description`: Text, Nullable
- `score`: Float, Bias score
- `threshold`: Float, Threshold value
- `status`: Text, Metric status ('pass', 'warning', 'fail')
- `demographic_group`: Text, Nullable, Demographic group name
- `additional_data`: Text, Nullable, JSON string with additional metrics
- `created_at`: Timestamp with timezone

## Relationships

### Organization Relations
- One organization has many users
- One organization has many AI systems
- One organization has many risk items
- One organization has many compliance issues
- One organization has many GitHub scan configs
- One organization has many bias analysis scans

### User Relations
- One user belongs to one organization
- One user has one role
- One user can own many AI systems
- One user can own many risk items
- One user can create many bias analysis scans

### AI System Relations
- One AI system belongs to one organization
- One AI system is owned by one user
- One AI system can have many risk items
- One AI system can have many compliance issues

### GitHub Scan Relations
- One GitHub scan config belongs to one organization
- One GitHub scan config can have many scan results
- One GitHub scan config can have many scan summaries

### Bias Analysis Relations
- One bias analysis scan belongs to one organization
- One bias analysis scan is created by one user
- One bias analysis scan can have many results

## Schema Creation and Updates

The schema is maintained in the `shared/schema.ts` file using Drizzle ORM. To apply schema changes:

```bash
npm run db:push
```

This will update the database structure without losing data when possible.