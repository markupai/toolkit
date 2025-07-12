# Acrolinx TypeScript SDK

A TypeScript SDK for integrating with the Acrolinx API. This SDK provides a type-safe way to interact with Acrolinx services and APIs.

## Installation

```bash
npm install @acrolinx/typescript-sdk
```

## Usage

### Style Analysis

The SDK supports string content, File objects, and Buffer objects for style analysis with automatic MIME type detection for binary files:

```typescript
import { styleCheck, styleSuggestions, styleRewrite } from '@acrolinx/typescript-sdk';

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

// Perform style analysis
const result = await styleCheck(stringRequest, config);
const fileResult = await styleCheck(fileRequest, config);
const pdfResult = await styleCheck(bufferRequest, config); // Works with PDFs!
```

### Binary File Support

**Enhanced MIME Type Detection**: The SDK now automatically detects and sets proper MIME types based on file extensions:

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

## Development

### Prerequisites

- Node.js (Latest LTS version recommended)
- npm

### Setup

1. Clone the repository:

```bash
git clone https://github.com/acrolinx/typescript-sdk.git
cd typescript-sdk
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

## Support

For support, please open an issue in the GitHub repository or contact Acrolinx support.
