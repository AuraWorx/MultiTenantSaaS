# GitHub AI Usage Detection Methodology

## Overview

The AI Usage Finder scans GitHub repositories to detect AI-related libraries, frameworks, and code patterns that indicate AI/ML usage within an organization's codebase. The scanner uses a multi-method approach to provide high-confidence detection with detailed reporting.

## Detection Mechanisms

### 1. Library/Dependency Detection

The scanner looks for common AI/ML libraries in package management files:

#### Python
- **Files Scanned**: `requirements.txt`, `setup.py`, `pyproject.toml`, `Pipfile`
- **Key Libraries**: tensorflow, pytorch, scikit-learn, keras, transformers, huggingface, spacy, gensim, openai, langchain

#### JavaScript/TypeScript
- **Files Scanned**: `package.json`, `yarn.lock`, `package-lock.json`
- **Key Libraries**: tensorflow.js, brain.js, ml5.js, natural, openai, langchain, transformers.js

#### Java
- **Files Scanned**: `pom.xml`, `build.gradle`
- **Key Libraries**: deeplearning4j, weka, stanford-nlp, spark-mllib, djl (Deep Java Library)

### 2. Model File Detection

The scanner identifies model files commonly used in AI applications:

- `.h5`, `.pb`, `.pt`, `.pth`, `.onnx`, `.pkl`, `.joblib` - Common model serialization formats
- `*_model.bin`, `*_tokenizer.json` - Transformer model files
- `.tflite`, `.mlmodel` - Mobile AI model formats

### 3. Code Pattern Recognition

The scanner analyzes code files for AI-specific patterns:

- **Import statements**: `import tensorflow`, `import torch`, `from transformers import`, etc.
- **API Client Initialization**: `openai.ChatCompletion.create`, `new LangChainJS.ChatOpenAI`
- **Model Training**: `model.fit`, `model.train()`, `optimizer.step()`
- **Inference Patterns**: `model.predict`, `model.generate`, `model.inference`

### 4. Configuration Detection

The scanner identifies configuration files that typically indicate AI usage:

- `.env` files with API keys like `OPENAI_API_KEY`, `HUGGINGFACE_API_KEY`
- Configuration files for ML frameworks

## Confidence Scoring

Each detection is assigned a confidence score based on:

1. **Number of signals**: Multiple signals increase confidence
2. **Signal type**: Direct imports are higher confidence than potential matches
3. **Library popularity**: Well-known libraries have higher confidence
4. **Model files**: Presence of model artifacts is strong evidence

The final confidence score ranges from 0-100:

- **85-100**: High confidence (multiple direct signals)
- **60-84**: Medium confidence (clear signals with some confirmation)
- **30-59**: Low confidence (potential signals requiring review)
- **0-29**: Very low confidence (possible false positives)

## Detection Types

Each detection is classified by type:

1. **Library Detection**: AI libraries found in dependency files
2. **Model File**: AI model artifacts detected
3. **Code Pattern**: AI code patterns in source files
4. **API Usage**: AI API calls identified
5. **Mixed Signals**: Multiple detection types

## Risk Assessment Integration

Repositories with high-confidence AI detection can be added to the risk register with a single click. This automatically creates an entry for further review and risk assessment.

## Private Repository Access

The scanner uses the provided GitHub API key to access private repositories. The key requires the following permissions:

- `repo`: Full control of private repositories
- `read:org`: Read organization data

All API access is performed securely and API keys are stored encrypted in the database.

## Future Enhancements

Planned improvements to the detection methodology:

1. **Language Model Fingerprinting**: Detecting specific LLM usage patterns
2. **Code Comment Analysis**: Identifying AI-generated code through comment patterns
3. **Commit History Analysis**: Finding AI usage through commit messages and patterns
4. **Fine-grained Report**: File-level breakdown of AI usage
5. **Code Risk Scoring**: Evaluating risk based on how AI is used within the codebase