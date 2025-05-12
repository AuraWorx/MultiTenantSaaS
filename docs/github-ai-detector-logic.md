# GitHub AI Usage Detector Logic

This document describes the logic and implementation of the GitHub AI Usage Detector feature in the AuraAI Governance Platform.

## Overview

The GitHub AI Usage Detector is designed to scan repositories within a GitHub organization to identify AI/ML usage patterns. This helps organizations maintain an inventory of AI systems and ensure proper governance.

## Detection Methods

The detector uses multiple approaches to identify AI/ML usage:

### 1. Dependency Analysis

Scans package files for AI/ML libraries and frameworks, including:

- **Python**: `requirements.txt`, `setup.py`, `pyproject.toml`
  - Libraries: tensorflow, pytorch, scikit-learn, keras, transformers, huggingface, openai, langchain, etc.

- **JavaScript/TypeScript**: `package.json`
  - Libraries: tensorflow.js, ml5.js, brain.js, @huggingface/inference, openai, langchain, etc.

- **Java/Kotlin**: `pom.xml`, `build.gradle`
  - Libraries: deeplearning4j, weka, smile, djl, etc.

### 2. Model File Detection

Searches for common model file formats:
- `.h5`, `.pb`, `.onnx`, `.pt`, `.pkl`, `.joblib`, `.safetensors`

### 3. Code Pattern Analysis

Examines code for AI/ML-related patterns:
- Import statements for AI/ML libraries
- API calls to AI services (OpenAI, AWS Bedrock, Google Vertex AI, etc.)
- Model training and inference code patterns
- Prompt engineering code patterns

### 4. Configuration File Analysis

Identifies AI-specific configuration files:
- Model cards (model-card.md)
- Hugging Face configuration files (config.json)
- MLflow files (MLproject, conda.yaml)
- AI deployment configuration files

## Confidence Scoring

Each detection is assigned a confidence score (0.0-1.0) based on:

1. Number of detections across different methods
2. Specificity of the detections
3. Repository usage patterns

## Implementation

The scanning process follows these steps:

1. **Authentication**: Authenticates with GitHub API using the provided token
2. **Repository Listing**: Fetches all repositories in the organization
3. **Content Analysis**: For each repository:
   - Fetches repository structure and content
   - Applies detection methods
   - Aggregates findings and calculates confidence scores
4. **Result Storage**: Stores results in the database
5. **Summary Generation**: Creates a summary of findings

## API Integration

The GitHub scanning feature is integrated with the GitHub API:

```typescript
// Example of how scanning is initiated
async function scanGitHubRepositories(config: typeof githubScanConfigs.$inferSelect) {
  // 1. Setup GitHub API client with authentication
  const octokit = new Octokit({
    auth: process.env.GITHUB_API_KEY,
  });

  try {
    // 2. Fetch repositories for the organization
    const { data: repos } = await octokit.rest.repos.listForOrg({
      org: config.githubOrgName,
      per_page: 100,
    });

    // 3. Process each repository
    for (const repo of repos) {
      // Analyze repository content
      const aiUsage = await detectAIUsage(octokit, config.githubOrgName, repo.name);
      
      // Store results
      // ...
    }
    
    // 4. Create summary
    // ...
    
  } catch (error) {
    console.error("Error scanning GitHub repositories:", error);
    // Handle error
  }
}
```

## Detection Result Example

```json
{
  "repositoryName": "customer-sentiment-analyzer",
  "repositoryUrl": "https://github.com/example-org/customer-sentiment-analyzer",
  "hasAiUsage": true,
  "aiLibraries": ["tensorflow", "transformers", "numpy", "pandas"],
  "aiFrameworks": ["huggingface"],
  "confidenceScore": 0.94,
  "detectionType": "Model File, Dependencies"
}
```

## Risk Assessment

Repositories identified as containing AI/ML usage can be automatically added to the risk register with:

1. Risk title based on repository name
2. Risk description including AI libraries and frameworks detected
3. Initial severity based on confidence score
4. Link to the repository for further investigation

## Security Considerations

- Repository scans are performed with minimal permissions required
- API rate limiting is respected to avoid throttling
- Private repository scanning requires appropriate GitHub API permissions
- Contents are processed securely and not stored beyond what's needed for reporting

## Future Enhancements

Planned improvements include:

1. Improved detection of embeddings and vector database usage
2. Detection of frontier model integrations (e.g., GPT-4, Claude, Gemini)
3. Identifying AI-related compliance artifacts (model cards, datasheets)
4. Security vulnerability scanning in AI dependencies
5. Integration with model registry systems