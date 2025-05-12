# GitHub AI Usage Detection Logic

This document explains the approach used by AI Governance Platform to detect AI/ML usage in GitHub repositories.

## Overview

The GitHub AI Usage Finder component scans repositories within a GitHub organization to identify potential AI and machine learning usage based on various signals and indicators. The scanning process is designed to be minimally invasive while providing meaningful insights into AI adoption across the organization's codebase.

## Detection Methods

The scanner uses multiple methods to identify AI usage:

1. **Dependency Analysis**
   - Searches for AI/ML libraries in package management files (package.json, requirements.txt)
   - Identifies common frameworks like TensorFlow, PyTorch, OpenAI, LangChain, Hugging Face, etc.

2. **Code Pattern Recognition**
   - Scans code for imports and references to AI libraries
   - Looks for AI-specific coding patterns and class usages

3. **Repository Structure Analysis**
   - Identifies model files with specific extensions (.h5, .pkl, .pt, .onnx, etc.)
   - Looks for directories like "models/", "ai/", "ml/", that suggest AI-related work

4. **Repository Metadata**
   - Examines repository names and descriptions for AI/ML keywords

## AI Libraries and Keywords

The scanner detects the following AI/ML libraries and keywords:

```
tensorflow, pytorch, keras, scikit-learn, huggingface, transformers,
openai, langchain, llama, gpt, bert, dalle, stable-diffusion,
anthropic, claude, whisper, gemini, palm, llama-index, rag,
machine-learning, deep-learning, neural-network, ml-agents, ai4j,
autodl, autogpt, mlflow, fastai, spacy, nltk, gensim
```

## Confidence Scoring

Each detection is assigned a confidence score based on the type of signal:

- **High Confidence (0.8-1.0)**
  - Direct imports of AI libraries
  - Package dependencies specifically listing AI frameworks
  - Model files in dedicated AI directories

- **Medium Confidence (0.5-0.7)**
  - Code patterns that might indicate AI usage
  - Directories with AI-related names
  - References to AI concepts or techniques

- **Low Confidence (0.3-0.4)**
  - Repository names or descriptions with AI keywords
  - General terms that could be AI-related

## Implementation Details

The scanner operates in these steps:

1. **Configuration**: User provides GitHub organization and API key
2. **Repository Discovery**: System fetches all accessible repositories
3. **Scanning**: Each repository is analyzed using the methods above
4. **Result Storage**: Findings are stored in the database with metadata
5. **Risk Assessment**: Repositories with confirmed AI usage can be added to risk register

## API Usage Considerations

The scanner is designed to be mindful of GitHub API rate limits by:
- Scanning repositories sequentially
- Limiting the depth of directory traversal
- Using conditional requests where possible
- Prioritizing high-signal files for deeper analysis

## Privacy and Security

- GitHub API tokens are securely stored and never exposed in logs or UI
- Only metadata and detection results are stored, not actual code
- Users can review findings before adding to risk register

## Technical Implementation

The scanner is implemented using:
- Node.js backend API
- GitHub's REST API via axios
- PostgreSQL database for results storage
- React frontend for configuration and visualization

This AI detection approach was adapted from various open-source AI detection tools and customized for the AI Governance platform's specific needs.