# NextGen Toolkit

A TypeScript toolkit for integrating with the NextGen API. This toolkit provides a type-safe way to interact with NextGen services including style analysis, style guide management, and batch operations.

## Installation

```bash
npm install @acrolinx/nextgen-toolkit
```

## Configuration

The toolkit requires a configuration object with your API key and platform settings:

```typescript
import { Config, Environment, PlatformType } from '@acrolinx/nextgen-toolkit';

// Using environment-based configuration
const config: Config = {
  apiKey: 'your-api-key-here',
  platform: {
    type: PlatformType.Environment,
    value: Environment.Prod, // or Environment.Stage, Environment.Dev
  },
};

// Using custom URL configuration
const configWithUrl: Config = {
  apiKey: 'your-api-key-here',
  platform: {
    type: PlatformType.Url,
    value: 'https://your-custom-acrolinx-instance.com',
  },
};
```

## Usage

### Style Analysis

The toolkit supports string content, File objects, and Buffer objects for style analysis with automatic MIME type detection for binary files:

```typescript
import {
  styleCheck,
  styleSuggestions,
  styleRewrite,
  getStyleCheck,
  getStyleSuggestion,
  getStyleRewrite,
} from '@acrolinx/nextgen-toolkit';

// Using string content
const stringRequest = {
  content: 'This is a sample text for style analysis.',
  style_guide: 'ap',
  dialect: 'american_english',
  tone: 'formal',
};

// Using File object (browser environments)
const file = new File(['This is content from a file.'], 'document.txt', { type: 'text/plain' });
const fileRequest = {
  content: file,
  style_guide: 'chicago',
  dialect: 'american_english',
  tone: 'academic',
  documentName: 'my-document.txt', // Optional custom filename
};

// Using Buffer object (Node.js environments) - BINARY FILES SUPPORTED
const fs = require('fs');
const pdfBuffer = fs.readFileSync('technical-report.pdf');
const bufferRequest = {
  content: pdfBuffer,
  style_guide: 'ap',
  dialect: 'american_english',
  tone: 'academic',
  documentName: 'technical-report.pdf', // Filename determines MIME type
};

// Perform style analysis with polling
const result = await styleCheck(stringRequest, config);
const fileResult = await styleCheck(fileRequest, config);
const pdfResult = await styleCheck(bufferRequest, config); // Works with PDFs!

// Get style suggestions
const suggestionResult = await styleSuggestions(stringRequest, config);

// Get style rewrites
const rewriteResult = await styleRewrite(stringRequest, config);
```

### Batch Operations

For processing multiple documents efficiently, the toolkit provides batch operations:

```typescript
import { styleBatchCheckRequests, styleBatchSuggestions, styleBatchRewrites } from '@acrolinx/nextgen-toolkit';

const requests = [
  { content: 'First document content', style_guide: 'ap', dialect: 'american_english', tone: 'formal' },
  { content: 'Second document content', style_guide: 'chicago', dialect: 'american_english', tone: 'academic' },
  // ... more requests
];

// Batch style checks
const batchCheck = styleBatchCheckRequests(requests, config, {
  maxConcurrent: 5,
  retryAttempts: 3,
  retryDelay: 1000,
  timeout: 30000,
});

// Monitor progress
batchCheck.progress.then((finalProgress) => {
  console.log(`Completed: ${finalProgress.completed}/${finalProgress.total}`);
  console.log(`Failed: ${finalProgress.failed}`);

  finalProgress.results.forEach((result, index) => {
    if (result.status === 'completed') {
      console.log(`Request ${index}: ${result.result?.scores.quality.score}`);
    } else if (result.status === 'failed') {
      console.log(`Request ${index} failed: ${result.error?.message}`);
    }
  });
});

// Batch suggestions
const batchSuggestions = styleBatchSuggestions(requests, config);

// Batch rewrites
const batchRewrites = styleBatchRewrites(requests, config);

// Cancel batch operations if needed
batchCheck.cancel();
```

### Response Types

The toolkit provides comprehensive response types for different operations:

```typescript
import type {
  StyleAnalysisSuccessResp,
  StyleAnalysisSuggestionResp,
  StyleAnalysisRewriteResp,
  StyleScores,
  Issue,
  IssueWithSuggestion,
} from '@acrolinx/nextgen-toolkit';

// Style check response
const checkResult: StyleAnalysisSuccessResp = await styleCheck(request, config);
console.log(`Quality score: ${checkResult.scores.quality.score}`);
console.log(`Issues found: ${checkResult.issues.length}`);

// Style suggestion response
const suggestionResult: StyleAnalysisSuggestionResp = await styleSuggestions(request, config);
suggestionResult.issues.forEach((issue) => {
  console.log(`Issue: "${issue.original}" → Suggestion: "${issue.suggestion}"`);
});

// Style rewrite response
const rewriteResult: StyleAnalysisRewriteResp = await styleRewrite(request, config);
console.log(`Rewritten content: ${rewriteResult.rewrite}`);
console.log(`Rewrite quality score: ${rewriteResult.rewrite_scores.quality.score}`);
```

## Development

### Prerequisites

- Node.js (Latest LTS version recommended)
- npm

### Setup

1. Clone the repository:

```bash
git clone https://github.com/acrolinx/nextgen-toolkit.git
cd nextgen-toolkit
```

2. Install dependencies:

```bash
npm install
```

### Building

To build the project:

```bash
npm run build
```

This will:

1. Compile TypeScript files
2. Generate type definitions
3. Create both ESM and UMD bundles

### Testing

The project uses Vitest for testing. There are two types of tests:

1. Unit Tests: Located in `test/unit/`
2. Integration Tests: Located in `test/integration/`

To run all tests:

```bash
npm test
```

To run unit tests only:

```bash
npm run test:unit
```

To run integration tests only:

```bash
npm run test:integration
```

### Code Quality

The project includes linting and formatting tools:

```bash
# Lint the code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code with Prettier
npm run format
```

## License

This project is licensed under the Apache-2.0 License - see the LICENSE file for details.
