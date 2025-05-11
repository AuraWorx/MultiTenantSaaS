# API Reference

This document provides a comprehensive reference for the AI Governance Platform's REST API endpoints. The API follows RESTful design principles and is organized by resource.

## Base URL

All API endpoints are relative to the base URL of your deployment.

For local development: `http://localhost:5000`

## Authentication

Most API endpoints require authentication. The API uses session-based authentication.

To authenticate, send a POST request to `/api/login` with your credentials. This will establish a session, and subsequent requests will use cookies for authentication.

### Error Responses

All error responses follow a standard format:

```json
{
  "error": "Error message"
}
```

HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad request (client error)
- `401`: Unauthorized (authentication required)
- `403`: Forbidden (insufficient permissions)
- `404`: Not found
- `500`: Server error

## API Endpoints

### Authentication

#### Register a new user

```
POST /api/register
```

Request body:
```json
{
  "username": "new_user",
  "email": "user@example.com",
  "password": "secure_password",
  "firstName": "John",
  "lastName": "Doe",
  "organizationId": 1,
  "roleId": 2
}
```

Response:
```json
{
  "id": 123,
  "username": "new_user",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "avatarUrl": null,
  "active": true,
  "createdAt": "2025-05-10T14:30:00Z",
  "organization": {
    "id": 1,
    "name": "Demo Organization",
    "createdAt": "2025-01-01T00:00:00Z"
  },
  "role": {
    "id": 2,
    "name": "User",
    "permissions": ["view:dashboard", "edit:profile"]
  }
}
```

#### Login

```
POST /api/login
```

Request body:
```json
{
  "username": "demo_user",
  "password": "demopassword"
}
```

Response:
```json
{
  "id": 123,
  "username": "demo_user",
  "email": "demo@example.com",
  "firstName": "Demo",
  "lastName": "User",
  "avatarUrl": null,
  "active": true,
  "createdAt": "2025-01-01T00:00:00Z",
  "organization": {
    "id": 1,
    "name": "Demo Organization",
    "createdAt": "2025-01-01T00:00:00Z"
  },
  "role": {
    "id": 2,
    "name": "User",
    "permissions": ["view:dashboard", "edit:profile"]
  }
}
```

#### Logout

```
POST /api/logout
```

Response: `200 OK`

#### Get current user

```
GET /api/user
```

Response:
```json
{
  "id": 123,
  "username": "demo_user",
  "email": "demo@example.com",
  "firstName": "Demo",
  "lastName": "User",
  "avatarUrl": null,
  "active": true,
  "createdAt": "2025-01-01T00:00:00Z",
  "organization": {
    "id": 1,
    "name": "Demo Organization",
    "createdAt": "2025-01-01T00:00:00Z"
  },
  "role": {
    "id": 2,
    "name": "User",
    "permissions": ["view:dashboard", "edit:profile"]
  }
}
```

### Organizations

#### Get all organizations

```
GET /api/organizations
```

Response:
```json
[
  {
    "id": 1,
    "name": "Demo Organization",
    "createdAt": "2025-01-01T00:00:00Z"
  },
  {
    "id": 2,
    "name": "Test Organization",
    "createdAt": "2025-02-01T00:00:00Z"
  }
]
```

#### Create organization

```
POST /api/organizations
```

Request body:
```json
{
  "name": "New Organization"
}
```

Response:
```json
{
  "id": 3,
  "name": "New Organization",
  "createdAt": "2025-05-10T14:30:00Z"
}
```

#### Get organization by ID

```
GET /api/organizations/:id
```

Response:
```json
{
  "id": 1,
  "name": "Demo Organization",
  "createdAt": "2025-01-01T00:00:00Z"
}
```

#### Update organization

```
PUT /api/organizations/:id
```

Request body:
```json
{
  "name": "Updated Organization Name"
}
```

Response:
```json
{
  "id": 1,
  "name": "Updated Organization Name",
  "createdAt": "2025-01-01T00:00:00Z"
}
```

#### Delete organization

```
DELETE /api/organizations/:id
```

Response: `200 OK`

### Users

#### Get all users

```
GET /api/users
```

Response:
```json
[
  {
    "id": 1,
    "username": "admin_user",
    "email": "admin@example.com",
    "firstName": "Admin",
    "lastName": "User",
    "avatarUrl": null,
    "active": true,
    "createdAt": "2025-01-01T00:00:00Z",
    "organization": {
      "id": 1,
      "name": "Demo Organization"
    },
    "role": {
      "id": 1,
      "name": "Admin"
    }
  },
  {
    "id": 2,
    "username": "demo_user",
    "email": "demo@example.com",
    "firstName": "Demo",
    "lastName": "User",
    "avatarUrl": null,
    "active": true,
    "createdAt": "2025-01-01T00:00:00Z",
    "organization": {
      "id": 1,
      "name": "Demo Organization"
    },
    "role": {
      "id": 2,
      "name": "User"
    }
  }
]
```

#### Create user

```
POST /api/users
```

Request body:
```json
{
  "username": "new_user",
  "email": "new@example.com",
  "password": "secure_password",
  "firstName": "New",
  "lastName": "User",
  "organizationId": 1,
  "roleId": 2
}
```

Response:
```json
{
  "id": 3,
  "username": "new_user",
  "email": "new@example.com",
  "firstName": "New",
  "lastName": "User",
  "avatarUrl": null,
  "active": true,
  "createdAt": "2025-05-10T14:30:00Z",
  "organization": {
    "id": 1,
    "name": "Demo Organization"
  },
  "role": {
    "id": 2,
    "name": "User"
  }
}
```

#### Get user by ID

```
GET /api/users/:id
```

Response:
```json
{
  "id": 1,
  "username": "admin_user",
  "email": "admin@example.com",
  "firstName": "Admin",
  "lastName": "User",
  "avatarUrl": null,
  "active": true,
  "createdAt": "2025-01-01T00:00:00Z",
  "organization": {
    "id": 1,
    "name": "Demo Organization"
  },
  "role": {
    "id": 1,
    "name": "Admin"
  }
}
```

#### Update user

```
PUT /api/users/:id
```

Request body:
```json
{
  "firstName": "Updated",
  "lastName": "Name",
  "roleId": 3
}
```

Response:
```json
{
  "id": 1,
  "username": "admin_user",
  "email": "admin@example.com",
  "firstName": "Updated",
  "lastName": "Name",
  "avatarUrl": null,
  "active": true,
  "createdAt": "2025-01-01T00:00:00Z",
  "organization": {
    "id": 1,
    "name": "Demo Organization"
  },
  "role": {
    "id": 3,
    "name": "Viewer"
  }
}
```

#### Delete user

```
DELETE /api/users/:id
```

Response: `200 OK`

### Roles

#### Get all roles

```
GET /api/roles
```

Response:
```json
[
  {
    "id": 1,
    "name": "Admin",
    "permissions": ["admin:all", "view:all", "edit:all", "delete:all"]
  },
  {
    "id": 2,
    "name": "User",
    "permissions": ["view:dashboard", "edit:profile", "view:reports"]
  },
  {
    "id": 3,
    "name": "Viewer",
    "permissions": ["view:dashboard", "view:reports"]
  }
]
```

#### Create role

```
POST /api/roles
```

Request body:
```json
{
  "name": "Manager",
  "permissions": ["view:all", "edit:reports", "approve:changes"]
}
```

Response:
```json
{
  "id": 4,
  "name": "Manager",
  "permissions": ["view:all", "edit:reports", "approve:changes"]
}
```

#### Get role by ID

```
GET /api/roles/:id
```

Response:
```json
{
  "id": 1,
  "name": "Admin",
  "permissions": ["admin:all", "view:all", "edit:all", "delete:all"]
}
```

#### Update role

```
PUT /api/roles/:id
```

Request body:
```json
{
  "name": "Super Admin",
  "permissions": ["admin:all", "view:all", "edit:all", "delete:all", "system:settings"]
}
```

Response:
```json
{
  "id": 1,
  "name": "Super Admin",
  "permissions": ["admin:all", "view:all", "edit:all", "delete:all", "system:settings"]
}
```

#### Delete role

```
DELETE /api/roles/:id
```

Response: `200 OK`

### AI Systems

#### Get all AI systems

```
GET /api/ai-systems
```

Response:
```json
[
  {
    "id": 1,
    "name": "Customer Support Chatbot",
    "description": "AI chatbot for customer support",
    "type": "LLM",
    "status": "active",
    "organizationId": 1,
    "createdBy": 1,
    "createdAt": "2025-01-15T00:00:00Z",
    "updatedAt": "2025-03-10T00:00:00Z"
  },
  {
    "id": 2,
    "name": "Fraud Detection System",
    "description": "AI system for detecting fraudulent transactions",
    "type": "Classification",
    "status": "active",
    "organizationId": 1,
    "createdBy": 1,
    "createdAt": "2025-02-20T00:00:00Z",
    "updatedAt": "2025-04-05T00:00:00Z"
  }
]
```

Optional query parameters:
- `status`: Filter by status (e.g., `active`, `inactive`, `development`)
- `type`: Filter by type (e.g., `LLM`, `Classification`, `Regression`)

#### Create AI system

```
POST /api/ai-systems
```

Request body:
```json
{
  "name": "Recommendation Engine",
  "description": "AI system for product recommendations",
  "type": "Recommendation",
  "status": "development"
}
```

Response:
```json
{
  "id": 3,
  "name": "Recommendation Engine",
  "description": "AI system for product recommendations",
  "type": "Recommendation",
  "status": "development",
  "organizationId": 1,
  "createdBy": 2,
  "createdAt": "2025-05-10T14:30:00Z",
  "updatedAt": "2025-05-10T14:30:00Z"
}
```

#### Get AI system by ID

```
GET /api/ai-systems/:id
```

Response:
```json
{
  "id": 1,
  "name": "Customer Support Chatbot",
  "description": "AI chatbot for customer support",
  "type": "LLM",
  "status": "active",
  "organizationId": 1,
  "createdBy": 1,
  "createdAt": "2025-01-15T00:00:00Z",
  "updatedAt": "2025-03-10T00:00:00Z"
}
```

#### Update AI system

```
PUT /api/ai-systems/:id
```

Request body:
```json
{
  "name": "Enhanced Customer Support Chatbot",
  "description": "Updated AI chatbot for customer support with multilingual capabilities",
  "status": "active"
}
```

Response:
```json
{
  "id": 1,
  "name": "Enhanced Customer Support Chatbot",
  "description": "Updated AI chatbot for customer support with multilingual capabilities",
  "type": "LLM",
  "status": "active",
  "organizationId": 1,
  "createdBy": 1,
  "createdAt": "2025-01-15T00:00:00Z",
  "updatedAt": "2025-05-10T14:30:00Z"
}
```

#### Delete AI system

```
DELETE /api/ai-systems/:id
```

Response: `200 OK`

### Risk Items

#### Get all risk items

```
GET /api/risk-items
```

Response:
```json
[
  {
    "id": 1,
    "title": "Data Privacy Risk",
    "description": "Risk of exposing customer PII",
    "category": "privacy",
    "severity": "high",
    "status": "open",
    "organizationId": 1,
    "aiSystemId": 1,
    "createdBy": 1,
    "createdAt": "2025-03-15T00:00:00Z",
    "updatedAt": "2025-03-15T00:00:00Z"
  },
  {
    "id": 2,
    "title": "Model Bias Risk",
    "description": "Risk of bias in decision-making",
    "category": "ethical",
    "severity": "medium",
    "status": "mitigated",
    "organizationId": 1,
    "aiSystemId": 2,
    "createdBy": 1,
    "createdAt": "2025-04-10T00:00:00Z",
    "updatedAt": "2025-04-20T00:00:00Z"
  }
]
```

Optional query parameters:
- `aiSystemId`: Filter by AI system ID
- `category`: Filter by category (e.g., `privacy`, `security`, `ethical`)
- `severity`: Filter by severity (e.g., `high`, `medium`, `low`)
- `status`: Filter by status (e.g., `open`, `mitigated`, `accepted`)

#### Create risk item

```
POST /api/risk-items
```

Request body:
```json
{
  "title": "Security Vulnerability",
  "description": "Potential for prompt injection attacks",
  "category": "security",
  "severity": "high",
  "status": "open",
  "aiSystemId": 1
}
```

Response:
```json
{
  "id": 3,
  "title": "Security Vulnerability",
  "description": "Potential for prompt injection attacks",
  "category": "security",
  "severity": "high",
  "status": "open",
  "organizationId": 1,
  "aiSystemId": 1,
  "createdBy": 2,
  "createdAt": "2025-05-10T14:30:00Z",
  "updatedAt": "2025-05-10T14:30:00Z"
}
```

#### Get risk item by ID

```
GET /api/risk-items/:id
```

Response:
```json
{
  "id": 1,
  "title": "Data Privacy Risk",
  "description": "Risk of exposing customer PII",
  "category": "privacy",
  "severity": "high",
  "status": "open",
  "organizationId": 1,
  "aiSystemId": 1,
  "createdBy": 1,
  "createdAt": "2025-03-15T00:00:00Z",
  "updatedAt": "2025-03-15T00:00:00Z"
}
```

#### Update risk item

```
PUT /api/risk-items/:id
```

Request body:
```json
{
  "title": "Data Privacy Risk",
  "description": "Risk of exposing customer PII through chat logs",
  "severity": "critical",
  "status": "mitigated"
}
```

Response:
```json
{
  "id": 1,
  "title": "Data Privacy Risk",
  "description": "Risk of exposing customer PII through chat logs",
  "category": "privacy",
  "severity": "critical",
  "status": "mitigated",
  "organizationId": 1,
  "aiSystemId": 1,
  "createdBy": 1,
  "createdAt": "2025-03-15T00:00:00Z",
  "updatedAt": "2025-05-10T14:30:00Z"
}
```

#### Delete risk item

```
DELETE /api/risk-items/:id
```

Response: `200 OK`

### Compliance Issues

#### Get all compliance issues

```
GET /api/compliance-issues
```

Response:
```json
[
  {
    "id": 1,
    "title": "GDPR Compliance Gap",
    "description": "Missing consent collection mechanism",
    "category": "GDPR",
    "severity": "high",
    "status": "open",
    "organizationId": 1,
    "aiSystemId": 1,
    "createdBy": 1,
    "createdAt": "2025-03-20T00:00:00Z",
    "updatedAt": "2025-03-20T00:00:00Z"
  },
  {
    "id": 2,
    "title": "Documentation Gap",
    "description": "Missing model documentation required by AI Act",
    "category": "AI Act",
    "severity": "medium",
    "status": "resolved",
    "organizationId": 1,
    "aiSystemId": 2,
    "createdBy": 1,
    "createdAt": "2025-04-15T00:00:00Z",
    "updatedAt": "2025-04-25T00:00:00Z"
  }
]
```

Optional query parameters:
- `aiSystemId`: Filter by AI system ID
- `category`: Filter by category (e.g., `GDPR`, `AI Act`, `CCPA`)
- `severity`: Filter by severity (e.g., `high`, `medium`, `low`)
- `status`: Filter by status (e.g., `open`, `in-progress`, `resolved`)

#### Create compliance issue

```
POST /api/compliance-issues
```

Request body:
```json
{
  "title": "Missing Data Retention Policy",
  "description": "No clear policy for data retention periods",
  "category": "GDPR",
  "severity": "high",
  "status": "open",
  "aiSystemId": 1
}
```

Response:
```json
{
  "id": 3,
  "title": "Missing Data Retention Policy",
  "description": "No clear policy for data retention periods",
  "category": "GDPR",
  "severity": "high",
  "status": "open",
  "organizationId": 1,
  "aiSystemId": 1,
  "createdBy": 2,
  "createdAt": "2025-05-10T14:30:00Z",
  "updatedAt": "2025-05-10T14:30:00Z"
}
```

#### Get compliance issue by ID

```
GET /api/compliance-issues/:id
```

Response:
```json
{
  "id": 1,
  "title": "GDPR Compliance Gap",
  "description": "Missing consent collection mechanism",
  "category": "GDPR",
  "severity": "high",
  "status": "open",
  "organizationId": 1,
  "aiSystemId": 1,
  "createdBy": 1,
  "createdAt": "2025-03-20T00:00:00Z",
  "updatedAt": "2025-03-20T00:00:00Z"
}
```

#### Update compliance issue

```
PUT /api/compliance-issues/:id
```

Request body:
```json
{
  "title": "GDPR Compliance Gap",
  "description": "Missing consent collection mechanism for user data processing",
  "severity": "high",
  "status": "in-progress"
}
```

Response:
```json
{
  "id": 1,
  "title": "GDPR Compliance Gap",
  "description": "Missing consent collection mechanism for user data processing",
  "category": "GDPR",
  "severity": "high",
  "status": "in-progress",
  "organizationId": 1,
  "aiSystemId": 1,
  "createdBy": 1,
  "createdAt": "2025-03-20T00:00:00Z",
  "updatedAt": "2025-05-10T14:30:00Z"
}
```

#### Delete compliance issue

```
DELETE /api/compliance-issues/:id
```

Response: `200 OK`

### Dashboard

#### Get dashboard data

```
GET /api/dashboard
```

Response:
```json
{
  "stats": {
    "aiSystemsCount": 5,
    "complianceIssuesCount": 3,
    "openRisksCount": 2
  },
  "recentActivity": [
    {
      "id": 1,
      "type": "info",
      "message": "New AI system added: Recommendation Engine",
      "entity": "AI System",
      "timestamp": "2025-05-10T14:30:00Z"
    },
    {
      "id": 2,
      "type": "warning",
      "message": "Compliance issue identified: Missing Data Retention Policy",
      "entity": "Compliance",
      "timestamp": "2025-05-10T14:35:00Z"
    },
    {
      "id": 3,
      "type": "success",
      "message": "Risk mitigated: Data Privacy Risk",
      "entity": "Risk",
      "timestamp": "2025-05-10T15:00:00Z"
    }
  ]
}
```

## Authorization and Permissions

The API implements role-based access control (RBAC). Different endpoints require different permissions.

### Permission Structure

Permissions follow the format: `action:resource`

Examples:
- `view:dashboard`: Permission to view the dashboard
- `edit:ai-systems`: Permission to edit AI systems
- `delete:users`: Permission to delete users
- `admin:all`: Permission to perform any action

### Role Permissions

- **Admin**: Has all permissions (`admin:all`)
- **User**: Has limited permissions (`view:dashboard`, `view:ai-systems`, `edit:profile`, etc.)
- **Viewer**: Has read-only permissions (`view:dashboard`, `view:ai-systems`, etc.)

### User Access

Users can only access data within their organization. Cross-organization access is not permitted.