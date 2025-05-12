# API Reference

This document provides detailed information about all API endpoints available in the AuraAI Governance Platform.

## Authentication

### Login
- **URL**: `/api/login`
- **Method**: `POST`
- **Body**: 
  ```json
  {
    "username": "string",
    "password": "string"
  }
  ```
- **Response**: 
  ```json
  {
    "id": "number",
    "username": "string",
    "email": "string",
    "firstName": "string",
    "lastName": "string",
    "avatarUrl": "string",
    "active": "boolean",
    "organizationId": "number",
    "roleId": "number",
    "createdAt": "date",
    "organization": {
      "id": "number",
      "name": "string",
      "createdAt": "date"
    },
    "role": {
      "id": "number",
      "name": "string",
      "permissions": ["string"]
    }
  }
  ```

### Register
- **URL**: `/api/register`
- **Method**: `POST`
- **Body**: 
  ```json
  {
    "username": "string",
    "email": "string",
    "password": "string",
    "firstName": "string",
    "lastName": "string",
    "avatarUrl": "string",
    "organizationId": "number",
    "roleId": "number"
  }
  ```
- **Response**: Same as login response

### Logout
- **URL**: `/api/logout`
- **Method**: `POST`
- **Response**: HTTP 200 OK

### Get Current User
- **URL**: `/api/user`
- **Method**: `GET`
- **Response**: Same as login response or HTTP 401 if not authenticated

## Organizations

### Get All Organizations
- **URL**: `/api/organizations`
- **Method**: `GET`
- **Response**: 
  ```json
  [
    {
      "id": "number",
      "name": "string",
      "createdAt": "date"
    }
  ]
  ```

## Dashboard

### Get Dashboard Stats
- **URL**: `/api/dashboard`
- **Method**: `GET`
- **Response**: 
  ```json
  {
    "stats": {
      "aiSystemsCount": "number",
      "complianceIssuesCount": "number",
      "openRisksCount": "number"
    },
    "recentActivity": [
      {
        "id": "number",
        "type": "string",
        "message": "string",
        "entity": "string",
        "timestamp": "date"
      }
    ]
  }
  ```

## AI Usage Finder

### Get GitHub Scan Configs
- **URL**: `/api/github-scan-configs`
- **Method**: `GET`
- **Response**: 
  ```json
  [
    {
      "id": "number",
      "githubOrgName": "string",
      "createdAt": "date",
      "lastScanAt": "date",
      "status": "string"
    }
  ]
  ```

### Create GitHub Scan Config
- **URL**: `/api/github-scan-configs`
- **Method**: `POST`
- **Body**: 
  ```json
  {
    "githubOrgName": "string"
  }
  ```
- **Response**: 
  ```json
  {
    "id": "number",
    "githubOrgName": "string",
    "createdAt": "date",
    "lastScanAt": null,
    "status": "pending"
  }
  ```

### Start GitHub Scan
- **URL**: `/api/github-scan-configs/:id/scan`
- **Method**: `POST`
- **Response**: 
  ```json
  {
    "status": "processing",
    "message": "Scan started successfully"
  }
  ```

### Get GitHub Scan Results
- **URL**: `/api/github-scan-results?configId=:configId`
- **Method**: `GET`
- **Response**: 
  ```json
  [
    {
      "id": "number",
      "scanConfigId": "number",
      "repositoryName": "string",
      "repositoryUrl": "string",
      "hasAiUsage": "boolean",
      "aiLibraries": ["string"],
      "aiFrameworks": ["string"],
      "scanDate": "date",
      "addedToRisk": "boolean",
      "confidenceScore": "number",
      "detectionType": "string"
    }
  ]
  ```

### Add Repository to Risk Register
- **URL**: `/api/github-scan-results/:id/add-to-risk`
- **Method**: `POST`
- **Response**: 
  ```json
  {
    "status": "success",
    "message": "Added to risk register",
    "riskItem": {
      "id": "number",
      "title": "string",
      "description": "string",
      "status": "string",
      "severity": "string",
      "aiSystemId": "number",
      "ownerId": "number",
      "organizationId": "number",
      "createdAt": "date",
      "updatedAt": "date"
    }
  }
  ```

### Get GitHub Scan Summary
- **URL**: `/api/github-scan-summaries?configId=:configId`
- **Method**: `GET`
- **Response**: 
  ```json
  [
    {
      "id": "number",
      "scanConfigId": "number",
      "totalRepositories": "number",
      "repositoriesWithAi": "number",
      "scanDate": "date"
    }
  ]
  ```

## Bias Analysis

### Get Bias Analysis Scans
- **URL**: `/api/bias-analysis/scans`
- **Method**: `GET`
- **Response**: 
  ```json
  [
    {
      "id": "number",
      "organizationId": "number",
      "name": "string",
      "description": "string",
      "dataSource": "string",
      "status": "string",
      "startedAt": "date",
      "completedAt": "date",
      "createdBy": "number"
    }
  ]
  ```

### Create Bias Analysis Scan
- **URL**: `/api/bias-analysis/scans`
- **Method**: `POST`
- **Body**: 
  ```json
  {
    "name": "string",
    "description": "string",
    "dataSource": "string"
  }
  ```
- **Response**: 
  ```json
  {
    "id": "number",
    "organizationId": "number",
    "name": "string",
    "description": "string",
    "dataSource": "string",
    "status": "pending",
    "startedAt": "date",
    "completedAt": null,
    "createdBy": "number"
  }
  ```

### Process Bias Analysis Data
- **URL**: `/api/bias-analysis/scans/:id/process`
- **Method**: `POST`
- **Body**: For file upload (multipart/form-data) or for webhook:
  ```json
  {
    "dataUrl": "string"
  }
  ```
- **Response**: 
  ```json
  {
    "status": "processing",
    "message": "Analysis started successfully"
  }
  ```

### Get Bias Analysis Results
- **URL**: `/api/bias-analysis/scans/:id/results`
- **Method**: `GET`
- **Response**: 
  ```json
  {
    "scan": {
      "id": "number",
      "name": "string",
      "description": "string",
      "status": "string",
      "completedAt": "date"
    },
    "resultsByGroup": {
      "overall": [
        {
          "id": "number",
          "metricName": "string",
          "metricDescription": "string",
          "score": "number",
          "threshold": "number",
          "status": "string",
          "demographicGroup": null,
          "createdAt": "date"
        }
      ],
      "gender": [
        {
          "id": "number",
          "metricName": "string",
          "metricDescription": "string",
          "score": "number",
          "threshold": "number",
          "status": "string",
          "demographicGroup": "string",
          "createdAt": "date"
        }
      ]
    }
  }
  ```

## Error Responses

All API endpoints can return the following error responses:

### 400 Bad Request
```json
{
  "error": "Bad Request",
  "message": "Description of the validation error"
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden",
  "message": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "error": "Not Found",
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

## Authentication Requirements

All API endpoints except for `/api/login` and `/api/register` require authentication. Requests to these endpoints should include a valid session cookie that is set after successful login.

## Organization-Based Authorization

Most endpoints enforce organization-based authorization, ensuring users can only access data within their organization. This is handled automatically by the backend based on the authenticated user's organization.