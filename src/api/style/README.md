# Style API

This module provides functionality for managing style guides and performing style analysis operations.

## Functions

### Core Functions

- `listStyleGuides(apiKey)` - List all available style guides
- `getStyleGuide(styleGuideId, apiKey)` - Get a specific style guide by ID
- `createStyleGuide(request, apiKey)` - Create a new style guide from a PDF file
- `updateStyleGuide(styleGuideId, updates, apiKey)` - Update an existing style guide
- `styleCheck(request, apiKey)` - Perform style checking with polling
- `styleSuggestions(request, apiKey)` - Get style suggestions with polling
- `styleRewrite(request, apiKey)` - Get style rewrites with polling

### Utility Functions (Node.js Only)

- `createStyleGuideReqFromUrl(fileUrl, name?)` - Create request from file URL or path
- `createStyleGuideReqFromPath(filePath, name?)` - Create request from file path

## Usage Examples

### Browser Environment

```typescript
import { createStyleGuide } from './style.api';

// Create a style guide from a File object (e.g., from file input)
const fileInput = document.getElementById('file-input') as HTMLInputElement;
const file = fileInput.files[0];

const request = {
  file: file,
  name: 'My Style Guide',
};

const styleGuide = await createStyleGuide(request, apiKey);
console.log('Created style guide:', styleGuide);
```

### Node.js Environment

```typescript
import { createStyleGuide, createStyleGuideReqFromUrl, createStyleGuideReqFromPath } from './style.api';

// Method 1: Using file path
const request1 = await createStyleGuideReqFromPath('/path/to/style-guide.pdf', 'Custom Name');
const styleGuide1 = await createStyleGuide(request1, apiKey);

// Method 2: Using file URL
const request2 = await createStyleGuideReqFromUrl('file:///path/to/style-guide.pdf');
const styleGuide2 = await createStyleGuide(request2, apiKey);

// Method 3: Using URL object
const url = new URL('file:///path/to/style-guide.pdf');
const request3 = await createStyleGuideReqFromUrl(url, 'Another Style Guide');
const styleGuide3 = await createStyleGuide(request3, apiKey);
```

## File Requirements

- **File Type**: Only PDF files are supported
- **File Extension**: Must have `.pdf` extension (case-insensitive)
- **File Size**: Check API documentation for size limits

## Error Handling

The utility functions provide clear error messages for common issues:

- **Browser Environment**: Throws error if utility functions are used in browser
- **Unsupported File Type**: Throws error for non-PDF files
- **File Not Found**: Throws error if file cannot be read
- **Invalid URL**: Throws error for non-file URLs

## Type Definitions

```typescript
interface CreateStyleGuideReq {
  file: File;
  name: string;
}

interface StyleGuideCreateResp {
  id: string;
  name: string;
  created_at: string;
  created_by: string;
  status: string;
  updated_at: string | null;
  updated_by: string | null;
}
```
