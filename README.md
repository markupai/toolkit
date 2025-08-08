# Acrolinx NextGen Toolkit

A TypeScript SDK for integrating with the Acrolinx NextGen API. This SDK provides a type-safe way to interact with Acrolinx services including style analysis, style guide management, and batch operations.

## Installation

```bash
npm install @acrolinx/nextgen-toolkit
```

## Configuration

The SDK requires a configuration object with your API key and platform settings:

```typescript
import { Config, Environment, PlatformType } from '@acrolinx/nextgen-toolkit';

// Using environment-based configuration
const config: Config = {
  apiKey: 'your-api-key-here',
  platform: {
    type: PlatformType.Environment,
    value: Environment.Prod // or Environment.Stage, Environment.Dev
  }
};

// Using custom URL configuration
const configWithUrl: Config = {
  apiKey: 'your-api-key-here',
  platform: {
    type: PlatformType.Url,
    value: 'https://your-custom-acrolinx-instance.com'
  }
};
```

## Usage

### Style Analysis

The SDK supports string content, File objects, and Buffer objects for style analysis with automatic MIME type detection for binary files:

```typescript
import { 
  styleCheck, 
  styleSuggestions, 
  styleRewrite,
  getStyleCheck,
  getStyleSuggestion,
  getStyleRewrite 
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

### Binary File Support

**Enhanced MIME Type Detection**: The SDK automatically detects and sets proper MIME types based on file extensions:

- **PDF Files**: `.pdf` → `application/pdf`
- **Word Documents**: `.docx` → `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- **Legacy Word**: `.doc` → `application/msword`
- **Text Files**: `.txt` → `text/plain`
- **Markdown**: `.md` → `text/markdown`
- **HTML**: `.html` → `text/html`
- **Other**: `.xyz` → `application/octet-stream`

**Automatic Processing**: When using Buffer objects with binary files:

1. SDK reads the `documentName` parameter
2. Extracts file extension (e.g., `.pdf`)
3. Automatically sets correct MIME type (`application/pdf`)
4. Sends binary content with proper content-type headers
5. Server processes binary files correctly

### Asynchronous Processing

For long-running operations, you can submit requests and retrieve results later:

```typescript
import { 
  submitStyleCheck, 
  submitStyleSuggestion, 
  submitStyleRewrite,
  getStyleCheck,
  getStyleSuggestion,
  getStyleRewrite 
} from '@acrolinx/nextgen-toolkit';

// Submit a style check request
const submitResponse = await submitStyleCheck(stringRequest, config);
const workflowId = submitResponse.workflow_id;

// Later, retrieve the results
const result = await getStyleCheck(workflowId, config);

// Submit style suggestions
const suggestionSubmit = await submitStyleSuggestion(stringRequest, config);
const suggestionResult = await getStyleSuggestion(suggestionSubmit.workflow_id, config);

// Submit style rewrites
const rewriteSubmit = await submitStyleRewrite(stringRequest, config);
const rewriteResult = await getStyleRewrite(rewriteSubmit.workflow_id, config);
```

### Style Guide Management

The SDK provides comprehensive style guide management capabilities:

```typescript
import { 
  listStyleGuides,
  getStyleGuide,
  createStyleGuide,
  updateStyleGuide,
  deleteStyleGuide,
  validateToken
} from '@acrolinx/nextgen-toolkit';

// List all available style guides
const styleGuides = await listStyleGuides(config);

// Get a specific style guide
const styleGuide = await getStyleGuide('style-guide-id', config);

// Create a new style guide from a PDF file
const file = new File(['PDF content'], 'style-guide.pdf', { type: 'application/pdf' });
const newStyleGuide = await createStyleGuide({
  file: file,
  name: 'My Custom Style Guide'
}, config);

// Update a style guide
const updatedStyleGuide = await updateStyleGuide('style-guide-id', {
  name: 'Updated Style Guide Name'
}, config);

// Delete a style guide
await deleteStyleGuide('style-guide-id', config);

// Validate your API token
const isValid = await validateToken(config);
```

### Batch Operations

For processing multiple documents efficiently, the SDK provides batch operations:

```typescript
import { 
  styleBatchCheckRequests,
  styleBatchSuggestions,
  styleBatchRewrites
} from '@acrolinx/nextgen-toolkit';

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
  timeout: 30000
});

// Monitor progress
batchCheck.progress.then(finalProgress => {
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

### Content Support

The SDK supports multiple content types:

- **String**: Plain text content
- **File**: File objects (browser environments)
- **Buffer**: Buffer objects (Node.js environments) - **Full binary file support**

**Binary File Processing**:

- **Before**: Binary files failed with "Workflow execution failed"
- **After**: Binary files process successfully with proper MIME types
- **PDF Example**: 674KB PDF processes in ~15 seconds with full analysis results
- **Auto-Detection**: File type automatically detected from `documentName` extension
- **All Operations**: Style checks, suggestions, and rewrites support binary files

**Usage Notes**:

- Set `documentName` parameter with correct file extension for binary files
- The SDK handles MIME type detection automatically
- All style analysis operations (check, suggestions, rewrite) support all content types
- Integration tests validate PDF, DOCX, and other binary file processing

### Response Types

The SDK provides comprehensive response types for different operations:

```typescript
import type { 
  StyleAnalysisSuccessResp,
  StyleAnalysisSuggestionResp,
  StyleAnalysisRewriteResp,
  StyleScores,
  Issue,
  IssueWithSuggestion
} from '@acrolinx/nextgen-toolkit';

// Style check response
const checkResult: StyleAnalysisSuccessResp = await styleCheck(request, config);
console.log(`Quality score: ${checkResult.scores.quality.score}`);
console.log(`Issues found: ${checkResult.issues.length}`);

// Style suggestion response
const suggestionResult: StyleAnalysisSuggestionResp = await styleSuggestions(request, config);
suggestionResult.issues.forEach(issue => {
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

## Changelog

All notable changes to this SDK are documented in [CHANGELOG.md](./CHANGELOG.md).

## Support

For support, please open an issue in the GitHub repository or contact Acrolinx support.
