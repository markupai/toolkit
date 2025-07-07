# Acrolinx TypeScript SDK

A TypeScript SDK for integrating with the Acrolinx API. This SDK provides a type-safe way to interact with Acrolinx services and APIs.

## Installation

```bash
npm install @acrolinx/typescript-sdk
```

## Usage

### Style Analysis

The SDK supports both string content and File objects for style analysis:

```typescript
import { styleCheck, styleSuggestions, styleRewrite } from '@acrolinx/typescript-sdk';

// Using string content
const stringRequest = {
  content: 'This is a sample text for style analysis.',
  style_guide: 'ap',
  dialect: 'american_english',
  tone: 'formal',
};

// Using File object
const file = new File(['This is content from a file.'], 'document.txt', { type: 'text/plain' });
const fileRequest = {
  content: file,
  style_guide: 'chicago',
  dialect: 'american_english',
  tone: 'academic',
  documentName: 'my-document.txt', // Optional custom filename
};

// Perform style analysis
const result = await styleCheck(stringRequest, config);
const fileResult = await styleCheck(fileRequest, config);
```

### File Content Support

The SDK now supports both string and File objects for content. When using File objects:

- The file is sent directly to the API without conversion
- You can optionally specify a custom `documentName`
- All style analysis operations (check, suggestions, rewrite) support File content
- Integration tests demonstrate usage with PDF files

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
