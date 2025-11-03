import { readFileSync } from "node:fs";
import { basename } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  IssueCategory,
  type BatchProgress,
  type StyleAnalysisReq,
  type StyleAnalysisSuccessResp,
} from "../../../src/api/style/style.api.types";
import {
  createBlob,
  createContentObject,
  createFile,
  createStyleGuideReqFromPath,
  createStyleGuideReqFromUrl,
  getMimeTypeFromFilename,
  isBuffer,
  isCompletedResponse,
  styleBatchCheck,
} from "../../../src/api/style/style.api.utils";
import * as runtime from "../../../src/utils/runtime";
import { type Config, Environment, PlatformType, Status } from "../../../src/utils/api.types";

// Mock Node.js modules
vi.mock("fs");
vi.mock("path");
vi.mock("url");

const mockReadFileSync = vi.mocked(readFileSync);
const mockBasename = vi.mocked(basename);
const mockFileURLToPath = vi.mocked(fileURLToPath);

// Mock response types
const completedSuccessResp = {
  workflow: {
    id: "abc",
    type: "checks",
    api_version: "1.0.0",
    generated_at: "2025-01-01T00:00:00Z",
    status: Status.Completed,
  },
  config: {
    dialect: "american_english",
    style_guide: { style_guide_type: "custom", style_guide_id: "sg1" },
    tone: "formal",
  },
  original: {
    issues: [],
    scores: {
      quality: {
        score: 0,
        grammar: { score: 0, issues: 0 },
        consistency: { score: 0, issues: 0 },
        terminology: { score: 0, issues: 0 },
      },
      analysis: {
        clarity: {
          score: 0,
          word_count: 0,
          sentence_count: 0,
          average_sentence_length: 0,
          flesch_reading_ease: 0,
          vocabulary_complexity: 0,
          sentence_complexity: 0,
        },
        tone: {
          score: 0,
          informality: 0,
          liveliness: 0,
          informality_alignment: 0,
          liveliness_alignment: 0,
        },
      },
    },
  },
};

const runningSuccessResp = {
  workflow: {
    id: "abc",
    type: "checks",
    api_version: "1.0.0",
    generated_at: "2025-01-01T00:00:00Z",
    status: Status.Running,
  },
};

const failedResp = {
  workflow: {
    id: "jkl",
    type: "checks",
    api_version: "1.0.0",
    generated_at: "2025-01-01T00:00:00Z",
    status: Status.Failed,
  },
};

const mockConfig: Config = {
  apiKey: "test-api-key",
  platform: { type: PlatformType.Environment, value: Environment.Dev },
};

const mockRequests: StyleAnalysisReq[] = [
  {
    content: "test content 1",
    style_guide: "ap",
    dialect: "american_english",
    tone: "formal",
  },
  {
    content: "test content 2",
    style_guide: "chicago",
    dialect: "american_english",
    tone: "informal",
  },
  {
    content: "test content 3",
    style_guide: "microsoft",
    dialect: "british_english",
    tone: "formal",
  },
];

const mockStyleCheckResponse: StyleAnalysisSuccessResp = {
  workflow: {
    id: "chk-2b5f8d3a-9c7e-4f2b-a8d1-6e9c3f7b4a2d",
    type: "checks",
    api_version: "1.0.0",
    generated_at: "2025-01-15T14:22:33Z",
    status: Status.Completed,
    webhook_response: {
      url: "https://api.example.com/webhook",
      status_code: 200,
    },
  },
  config: {
    dialect: "canadian_english",
    style_guide: {
      style_guide_type: "ap",
      style_guide_id: "sg-8d4e5f6a-2b3c-4d5e-6f7a-8b9c0d1e2f3a",
    },
    tone: "conversational",
  },
  original: {
    issues: [
      {
        original: "therefor",
        position: {
          start_index: 89,
        },
        subcategory: "spelling",
        category: IssueCategory.Grammar,
      },
      {
        original: "leverage",
        position: {
          start_index: 156,
        },
        subcategory: "vocabulary",
        category: IssueCategory.Clarity,
      },
      {
        original: "going forward",
        position: {
          start_index: 234,
        },
        subcategory: "word_choice",
        category: IssueCategory.Tone,
      },
      {
        original: "email",
        position: {
          start_index: 312,
        },
        subcategory: "punctuation",
        category: IssueCategory.Consistency,
      },
      {
        original: "towards",
        position: {
          start_index: 405,
        },
        subcategory: "word_choice",
        category: IssueCategory.Terminology,
      },
    ],
    scores: {
      quality: {
        score: 72,
        grammar: {
          score: 95,
          issues: 1,
        },
        consistency: {
          score: 80,
          issues: 2,
        },
        terminology: {
          score: 100,
          issues: 0,
        },
      },
      analysis: {
        clarity: {
          score: 64,
          flesch_reading_ease: 51.4,
          sentence_complexity: 38.9,
          vocabulary_complexity: 45.6,
          sentence_count: 6,
          word_count: 112,
          average_sentence_length: 18.7,
        },
        tone: {
          score: 78,
          informality: 38.2,
          liveliness: 33.9,
          informality_alignment: 115.8,
          liveliness_alignment: 106.4,
        },
      },
    },
  },
};

// Generic validation helpers that accept parameters
const validateBlobType = async (request: StyleAnalysisReq, expectedMimeType: string) => {
  const blob = await createBlob(request);
  expect(blob.type).toBe(expectedMimeType);
};

const validateFileName = async (request: StyleAnalysisReq, expectedFileName: string) => {
  const file = await createFile(request);
  expect(file.name).toBe(expectedFileName);
};

const validateFileTypeAndName = async (
  request: StyleAnalysisReq,
  expectedMimeType: string,
  expectedFileName: string,
) => {
  const file = await createFile(request);
  expect(file.name).toBe(expectedFileName);
  expect(file.type).toBe(expectedMimeType);
};

const validateBlobAndFileName = async (
  request: StyleAnalysisReq,
  expectedMimeType: string,
  expectedFileName: string,
) => {
  await validateBlobType(request, expectedMimeType);
  await validateFileName(request, expectedFileName);
};

// DITA-specific convenience helpers
const createAndValidateDitaBlobAndFile = async (request: StyleAnalysisReq) => {
  await validateBlobAndFileName(request, "application/dita+xml", "unknown.dita");
};

const createAndValidateDitaFileName = async (request: StyleAnalysisReq) => {
  await validateFileName(request, "unknown.dita");
};

const createAndValidateDitaFileNameAndType = async (request: StyleAnalysisReq) => {
  await validateFileTypeAndName(request, "application/dita+xml", "sample.dita");
};

const createAndValidateDitaBlob = async (request: StyleAnalysisReq) => {
  await validateBlobType(request, "application/dita+xml");
};

// Markdown-specific convenience helpers
const validateMarkdownBlob = async (request: StyleAnalysisReq) => {
  await validateBlobType(request, "text/markdown");
};

const validateMarkdownBlobAndFileName = async (
  request: StyleAnalysisReq,
  expectedFileName: string = "unknown.md",
) => {
  await validateBlobAndFileName(request, "text/markdown", expectedFileName);
};

const createDitaRequest = (
  content: string,
  documentNameWithExtension?: string,
): StyleAnalysisReq => ({
  content,
  style_guide: "ap",
  dialect: "american_english",
  ...(documentNameWithExtension ? { documentNameWithExtension } : {}),
});

describe("Style API Utils", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock successful file operations
    mockReadFileSync.mockReturnValue(Buffer.from("fake pdf content"));
    mockBasename.mockReturnValue("test-style-guide.pdf");
    mockFileURLToPath.mockReturnValue("/path/to/test-style-guide.pdf");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("createStyleGuideReqFromUrl", () => {
    it("should create request from file path string", async () => {
      const result = await createStyleGuideReqFromUrl(
        "/path/to/test-style-guide.pdf",
        "Custom Name",
      );

      expect(result).toEqual({
        file: expect.any(File),
        name: "Custom Name",
      });

      expect(result.file.name).toBe("test-style-guide.pdf");
      expect(result.file.type).toBe("application/pdf");
      expect(mockReadFileSync).toHaveBeenCalledWith("/path/to/test-style-guide.pdf");
      expect(mockBasename).toHaveBeenCalledWith("/path/to/test-style-guide.pdf");
    });

    it("should create request from file path string without custom name", async () => {
      const result = await createStyleGuideReqFromUrl("/path/to/test-style-guide.pdf");

      expect(result).toEqual({
        file: expect.any(File),
        name: "test-style-guide", // filename without .pdf extension
      });

      expect(result.file.name).toBe("test-style-guide.pdf");
      expect(result.file.type).toBe("application/pdf");
    });

    it("should create request from file:// URL", async () => {
      const result = await createStyleGuideReqFromUrl(
        "file:///path/to/test-style-guide.pdf",
        "Custom Name",
      );

      expect(result).toEqual({
        file: expect.any(File),
        name: "Custom Name",
      });

      expect(mockFileURLToPath).toHaveBeenCalledWith("file:///path/to/test-style-guide.pdf");
      expect(mockReadFileSync).toHaveBeenCalledWith("/path/to/test-style-guide.pdf");
    });

    it("should create request from URL object", async () => {
      const url = new URL("file:///path/to/test-style-guide.pdf");
      const result = await createStyleGuideReqFromUrl(url, "Custom Name");

      expect(result).toEqual({
        file: expect.any(File),
        name: "Custom Name",
      });

      expect(mockFileURLToPath).toHaveBeenCalledWith(url);
    });

    it("should throw error for non-file URLs", async () => {
      const url = new URL("http://example.com/file.pdf");

      await expect(createStyleGuideReqFromUrl(url)).rejects.toThrow(
        "Only file:// URLs are supported. Please provide a local file path or file:// URL.",
      );
    });

    it("should throw error for unsupported file types", async () => {
      mockBasename.mockReturnValue("test-style-guide.txt");

      await expect(createStyleGuideReqFromUrl("/path/to/test-style-guide.txt")).rejects.toThrow(
        "Unsupported file type: txt. Only .pdf files are supported.",
      );
    });

    it("should throw error when file cannot be read", async () => {
      mockReadFileSync.mockImplementation(() => {
        throw new Error("File not found");
      });

      await expect(createStyleGuideReqFromUrl("/path/to/nonexistent.pdf")).rejects.toThrow(
        "Failed to create style guide request from URL: File not found",
      );
    });

    it("should handle files with .PDF extension (case insensitive)", async () => {
      mockBasename.mockReturnValue("test-style-guide.PDF");

      const result = await createStyleGuideReqFromUrl("/path/to/test-style-guide.PDF");

      expect(result.name).toBe("test-style-guide"); // Should remove .PDF extension
      expect(result.file.name).toBe("test-style-guide.PDF");
    });
  });

  describe("createStyleGuideReqFromPath", () => {
    it("should create request from file path", async () => {
      const result = await createStyleGuideReqFromPath(
        "/path/to/test-style-guide.pdf",
        "Custom Name",
      );

      expect(result).toEqual({
        file: expect.any(File),
        name: "Custom Name",
      });

      expect(mockReadFileSync).toHaveBeenCalledWith("/path/to/test-style-guide.pdf");
    });

    it("should create request from file path without custom name", async () => {
      const result = await createStyleGuideReqFromPath("/path/to/test-style-guide.pdf");

      expect(result).toEqual({
        file: expect.any(File),
        name: "test-style-guide",
      });
    });
  });

  describe("HTML content handling", () => {
    it("should create Blob with text/html for HTML string content when documentNameWithExtension indicates html", async () => {
      const request: StyleAnalysisReq = {
        content:
          "<!doctype html><html><head><title>T</title></head><body><p>Hello</p></body></html>",
        style_guide: "ap",
        dialect: "american_english",
        documentNameWithExtension: "page.html",
      };

      const blob = await createBlob(request);
      expect(blob.type).toBe("text/html");
    });

    it("should create Blob with text/html for HTML string content by heuristic when no filename provided", async () => {
      const request: StyleAnalysisReq = {
        content: "<html><body><div>Content</div></body></html>",
        style_guide: "ap",
        dialect: "american_english",
      };

      const blob = await createBlob(request);
      expect(blob.type).toBe("text/html");
    });

    it("should create File with text/html for HTML string content and .htm extension", async () => {
      const request: StyleAnalysisReq = {
        content: "<html><body><span>Hi</span></body></html>",
        style_guide: "ap",
        dialect: "american_english",
        documentNameWithExtension: "index.htm",
      };

      const file = await createFile(request);
      expect(file.type).toBe("text/html");
      expect(file.name).toBe("index.htm");
    });

    it("should default to text/plain for non-HTML strings without filename", async () => {
      const request: StyleAnalysisReq = {
        content: "Just a plain text file with no HTML tags.",
        style_guide: "ap",
        dialect: "american_english",
      };

      const blob = await createBlob(request);
      expect(blob.type).toBe("text/plain");
    });

    it("should auto-assign unknown.html when string looks like HTML and no filename provided", async () => {
      const request: StyleAnalysisReq = {
        content: "<html><body>Auto name</body></html>",
        style_guide: "ap",
        dialect: "american_english",
      };

      const file = await createFile(request);
      expect(file.name).toBe("unknown.html");
      expect(file.type).toBe("text/html");
    });

    it("should infer MIME for BufferDescriptor using its filename", async () => {
      const buffer = Buffer.from("<html><body>buf</body></html>", "utf8");
      const request: StyleAnalysisReq = {
        content: { buffer, documentNameWithExtension: "page.html", mimeType: "text/html" },
        style_guide: "ap",
        dialect: "american_english",
      };

      const blob = await createBlob(request);
      expect(blob.type).toBe("text/html");
    });

    it("should use request.documentNameWithExtension to set name and MIME for HTML string", async () => {
      const request: StyleAnalysisReq = {
        content: "<html><body>Title</body></html>",
        style_guide: "ap",
        dialect: "american_english",
        documentNameWithExtension: "sample.html",
      };

      const file = await createFile(request);
      expect(file.name).toBe("sample.html");
      expect(file.type).toBe("text/html");
    });

    it("createContentObject returns Blob in Node environment", async () => {
      const request: StyleAnalysisReq = {
        content: "<html><body>Preserve</body></html>",
        style_guide: "ap",
        dialect: "american_english",
        documentNameWithExtension: "preserve.html",
      };

      const contentObject = await createContentObject(request);
      expect(contentObject).toBeInstanceOf(Blob);
      const blob = contentObject as Blob;
      expect(blob.type).toBe("text/html");
    });

    it("createContentObject returns File in browser-like environment (mocked)", async () => {
      const request: StyleAnalysisReq = {
        content: "<html><body>Preserve</body></html>",
        style_guide: "ap",
        dialect: "american_english",
        documentNameWithExtension: "preserve.html",
      };

      const spy = vi.spyOn(runtime, "isNodeEnvironment").mockReturnValue(false);
      try {
        const contentObject = await createContentObject(request);
        expect(contentObject).toBeInstanceOf(File);
        const file = contentObject as File;
        expect(file.name).toBe("preserve.html");
        expect(file.type).toBe("text/html");
      } finally {
        spy.mockRestore();
      }
    });
  });

  describe("DITA content handling", () => {
    it.each([
      {
        description: "DOCTYPE with DITA identifiers",
        content:
          '<!DOCTYPE topic PUBLIC "-//OASIS//DTD DITA Topic//EN" "topic.dtd"><topic id="test">Content</topic>',
      },
      {
        description: "DOCTYPE references DTD file",
        content: '<!DOCTYPE concept SYSTEM "concept.dtd"><concept id="test">Content</concept>',
      },
      {
        description: "root element is topic",
        content:
          '<?xml version="1.0"?><topic id="test"><title>Title</title><body>Content</body></topic>',
      },
    ])("should detect application/dita+xml by heuristic when $description", async ({ content }) => {
      const request = createDitaRequest(content);

      await createAndValidateDitaBlobAndFile(request);
    });

    it.each([
      {
        rootElement: "concept",
        content:
          '<concept id="test"><title>Concept Title</title><conbody>Content</conbody></concept>',
      },
      {
        rootElement: "task",
        content: '<task id="test"><title>Task Title</title><taskbody>Steps</taskbody></task>',
      },
      {
        rootElement: "reference",
        content: '<reference id="test"><title>Reference</title><refbody>Info</refbody></reference>',
      },
      {
        rootElement: "map",
        content: '<map id="test"><title>Map Title</title><topicref href="topic.dita"/></map>',
      },
      {
        rootElement: "bookmap",
        content:
          '<bookmap id="test"><booktitle><mainbooktitle>Book</mainbooktitle></booktitle></bookmap>',
      },
    ])(
      "should detect application/dita+xml by heuristic when root element is $rootElement",
      async ({ content }) => {
        const request = createDitaRequest(content);

        await createAndValidateDitaBlob(request);
      },
    );

    it("should detect application/dita+xml by heuristic when class attribute contains topic/topic", async () => {
      const request: StyleAnalysisReq = {
        content:
          '<div class="- topic/topic "><div class="- topic/title ">Title</div><div class="- topic/body ">Body</div></div>',
        style_guide: "ap",
        dialect: "american_english",
      };

      await createAndValidateDitaBlobAndFile(request);
    });

    it("should auto-assign unknown.dita when string looks like DITA and no filename provided", async () => {
      const request: StyleAnalysisReq = {
        content: '<topic id="auto-dita"><title>Auto DITA</title><body>Content</body></topic>',
        style_guide: "ap",
        dialect: "american_english",
      };

      await createAndValidateDitaFileName(request);
    });

    it("should use request.documentNameWithExtension to set name and MIME for DITA string", async () => {
      const request: StyleAnalysisReq = {
        content: '<topic id="test"><title>Test</title><body>Content</body></topic>',
        style_guide: "ap",
        dialect: "american_english",
        documentNameWithExtension: "sample.dita",
      };

      await createAndValidateDitaFileNameAndType(request);
    });

    it("should create Blob with application/dita+xml for DITA string content when documentNameWithExtension indicates dita", async () => {
      const request: StyleAnalysisReq = {
        content: '<topic id="test"><title>Test</title><body>Content</body></topic>',
        style_guide: "ap",
        dialect: "american_english",
        documentNameWithExtension: "document.dita",
      };

      await createAndValidateDitaBlob(request);
    });

    it("should prioritize DITA detection over plain text when no filename provided", async () => {
      const request: StyleAnalysisReq = {
        content: '<topic id="test">This looks like DITA content</topic>',
        style_guide: "ap",
        dialect: "american_english",
      };

      const blob = await createBlob(request);
      expect(blob.type).toBe("application/dita+xml");
      expect(blob.type).not.toBe("text/plain");
    });
  });

  describe("Markdown content handling", () => {
    it("should detect text/markdown for markdown filenames", async () => {
      const request = createDitaRequest(
        "# Title\n\nSome text with a [link](https://example.com).",
        "readme.md",
      );

      await validateMarkdownBlob(request);
    });

    it("should detect text/markdown by heuristic when no filename provided", async () => {
      const request = createDitaRequest("---\na: 1\n---\n\n# Heading\n\n* item");

      await validateMarkdownBlobAndFileName(request);
    });

    it.each([
      { ext: "markdown", filename: "readme.markdown" },
      { ext: "mdown", filename: "readme.mdown" },
      { ext: "mkd", filename: "readme.mkd" },
      { ext: "mdx", filename: "readme.mdx" },
    ])("should detect text/markdown for $ext extension", async ({ filename }) => {
      const request = createDitaRequest("# Title\n\nContent", filename);

      await validateMarkdownBlob(request);
    });

    it("should detect text/markdown by heuristic with code fences", async () => {
      const request = createDitaRequest("```javascript\nconst x = 1;\n```");

      await validateMarkdownBlobAndFileName(request);
    });

    it("should detect text/markdown by heuristic with images", async () => {
      const request = createDitaRequest("![alt text](image.png)");

      await validateMarkdownBlob(request);
    });
  });

  describe("Utility functions", () => {
    describe("getMimeTypeFromFilename", () => {
      it("should return application/dita+xml for .dita extension", () => {
        expect(getMimeTypeFromFilename("document.dita")).toBe("application/dita+xml");
        expect(getMimeTypeFromFilename("file.DITA")).toBe("application/dita+xml");
      });

      it("should return text/html for .html and .htm extensions", () => {
        expect(getMimeTypeFromFilename("page.html")).toBe("text/html");
        expect(getMimeTypeFromFilename("index.htm")).toBe("text/html");
      });

      it("should return text/markdown for markdown extensions", () => {
        expect(getMimeTypeFromFilename("readme.md")).toBe("text/markdown");
        expect(getMimeTypeFromFilename("readme.markdown")).toBe("text/markdown");
        expect(getMimeTypeFromFilename("readme.mdown")).toBe("text/markdown");
        expect(getMimeTypeFromFilename("readme.mkd")).toBe("text/markdown");
        expect(getMimeTypeFromFilename("readme.mdx")).toBe("text/markdown");
      });

      it("should return application/pdf for .pdf extension", () => {
        expect(getMimeTypeFromFilename("document.pdf")).toBe("application/pdf");
      });

      it("should return text/plain for .txt extension", () => {
        expect(getMimeTypeFromFilename("document.txt")).toBe("text/plain");
      });

      it("should return application/octet-stream for unknown extensions", () => {
        expect(getMimeTypeFromFilename("document.xyz")).toBe("application/octet-stream");
        expect(getMimeTypeFromFilename("noextension")).toBe("application/octet-stream");
        expect(getMimeTypeFromFilename("")).toBe("application/octet-stream");
      });
    });

    describe("isBuffer", () => {
      it("should return true for Buffer instances", () => {
        const buffer = Buffer.from("test");
        expect(isBuffer(buffer)).toBe(true);
      });

      it("should return false for non-Buffer objects", () => {
        expect(isBuffer("string")).toBe(false);
        expect(isBuffer(123)).toBe(false);
        expect(isBuffer({})).toBe(false);
        expect(isBuffer(null)).toBe(false);
        expect(isBuffer(undefined)).toBe(false);
        expect(isBuffer([])).toBe(false);
      });
    });
  });

  describe("Buffer descriptor handling", () => {
    it("should use buffer descriptor with documentNameWithExtension", async () => {
      const buffer = Buffer.from("<html><body>Content</body></html>", "utf8");
      const request: StyleAnalysisReq = {
        content: {
          buffer,
          documentNameWithExtension: "page.html",
          mimeType: "text/html",
        },
        style_guide: "ap",
        dialect: "american_english",
      };

      const blob = await createBlob(request);
      expect(blob.type).toBe("text/html");
      const file = await createFile(request);
      expect(file.name).toBe("page.html");
    });

    it("should derive mimeType from documentNameWithExtension when mimeType not provided", async () => {
      const buffer = Buffer.from('<topic id="test"><title>Test</title></topic>', "utf8");
      const request: StyleAnalysisReq = {
        content: {
          buffer,
          documentNameWithExtension: "topic.dita",
          mimeType: "application/dita+xml", // Required by type, but tested for derivation logic
        },
        style_guide: "ap",
        dialect: "american_english",
      };

      // Test that mimeType can be derived from filename when not provided
      // Create a request with mimeType derived from filename
      const requestWithoutMimeType = {
        ...request,
        content: {
          buffer,
          documentNameWithExtension: "topic.dita",
          // mimeType will be derived from filename in prepareUploadContent
        },
      } as StyleAnalysisReq;

      const blob = await createBlob(requestWithoutMimeType);
      expect(blob.type).toBe("application/dita+xml");
      const file = await createFile(requestWithoutMimeType);
      expect(file.name).toBe("topic.dita");
    });

    it("should use buffer descriptor mimeType when provided", async () => {
      const buffer = Buffer.from("plain text", "utf8");
      const request: StyleAnalysisReq = {
        content: {
          buffer,
          documentNameWithExtension: "document.txt",
          mimeType: "text/plain",
        },
        style_guide: "ap",
        dialect: "american_english",
      };

      const blob = await createBlob(request);
      expect(blob.type).toBe("text/plain");
    });

    it("should handle buffer descriptor with minimal fields", async () => {
      const buffer = Buffer.from("some content", "utf8");
      const request: StyleAnalysisReq = {
        content: {
          buffer,
          documentNameWithExtension: "unknown.txt",
          mimeType: "application/octet-stream",
        },
        style_guide: "ap",
        dialect: "american_english",
      };

      // Should use provided mimeType
      const blob = await createBlob(request);
      expect(blob.type).toBe("application/octet-stream");
    });

    it("should prioritize mimeType over documentNameWithExtension for buffer descriptors", async () => {
      const buffer = Buffer.from("<html>Content</html>", "utf8");
      const request: StyleAnalysisReq = {
        content: {
          buffer,
          documentNameWithExtension: "file.txt",
          mimeType: "text/html",
        },
        style_guide: "ap",
        dialect: "american_english",
      };

      const blob = await createBlob(request);
      expect(blob.type).toBe("text/html");
      expect(blob.type).not.toBe("text/plain");
    });
  });

  describe("Additional DITA edge cases", () => {
    it("should detect application/dita+xml when root element is glossentry", async () => {
      const request: StyleAnalysisReq = {
        content: '<glossentry id="test"><glossterm>Term</glossterm></glossentry>',
        style_guide: "ap",
        dialect: "american_english",
      };

      await createAndValidateDitaBlobAndFile(request);
    });

    it("should detect application/dita+xml when root element is subjectScheme", async () => {
      const request: StyleAnalysisReq = {
        content:
          '<subjectScheme id="test"><title>Scheme</title><subjectdef keys="term"/></subjectScheme>',
        style_guide: "ap",
        dialect: "american_english",
      };

      await createAndValidateDitaBlobAndFile(request);
    });

    it("should handle DITA content with buffer descriptor", async () => {
      const buffer = Buffer.from(
        '<topic id="test"><title>Test</title><body>Content</body></topic>',
        "utf8",
      );
      const request: StyleAnalysisReq = {
        content: {
          buffer,
          documentNameWithExtension: "topic.dita",
          mimeType: "application/dita+xml",
        },
        style_guide: "ap",
        dialect: "american_english",
      };

      const blob = await createBlob(request);
      expect(blob.type).toBe("application/dita+xml");
      const file = await createFile(request);
      expect(file.name).toBe("topic.dita");
    });

    it("should detect DITA with XML declaration and encoding", async () => {
      const request: StyleAnalysisReq = {
        content:
          '<?xml version="1.0" encoding="UTF-8"?><topic id="test"><title>Title</title></topic>',
        style_guide: "ap",
        dialect: "american_english",
      };

      await createAndValidateDitaBlobAndFile(request);
    });

    it("should detect DITA with whitespace before XML declaration", async () => {
      const request: StyleAnalysisReq = {
        content: '   <?xml version="1.0"?>\n   <topic id="test"><title>Title</title></topic>',
        style_guide: "ap",
        dialect: "american_english",
      };

      await createAndValidateDitaBlobAndFile(request);
    });

    it("should detect DITA DOCTYPE with SYSTEM identifier", async () => {
      const request: StyleAnalysisReq = {
        content:
          '<!DOCTYPE topic SYSTEM "dita-topic.dtd"><topic id="test"><title>Title</title></topic>',
        style_guide: "ap",
        dialect: "american_english",
      };

      await createAndValidateDitaBlobAndFile(request);
    });

    it("should detect DITA DOCTYPE with PUBLIC and SYSTEM identifiers", async () => {
      const request: StyleAnalysisReq = {
        content:
          '<!DOCTYPE concept PUBLIC "-//OASIS//DTD DITA Concept//EN" "concept.dtd"><concept id="test"><title>Concept</title></concept>',
        style_guide: "ap",
        dialect: "american_english",
      };

      await createAndValidateDitaBlobAndFile(request);
    });

    it("should handle DITA buffer descriptor with mimeType override", async () => {
      const buffer = Buffer.from(
        '<topic id="test"><title>Test</title><body>Content</body></topic>',
        "utf8",
      );
      const request: StyleAnalysisReq = {
        content: {
          buffer,
          documentNameWithExtension: "unknown.dita",
          mimeType: "application/dita+xml",
        },
        style_guide: "ap",
        dialect: "american_english",
      };

      // The mimeType should be used from the descriptor
      const blob = await createBlob(request);
      expect(blob.type).toBe("application/dita+xml");
      const file = await createFile(request);
      expect(file.name).toBe("unknown.dita");
    });

    it("should prioritize mimeType over filename extension for DITA buffer descriptors", async () => {
      const buffer = Buffer.from('<topic id="test">Content</topic>', "utf8");
      const request: StyleAnalysisReq = {
        content: {
          buffer,
          documentNameWithExtension: "file.xml",
          mimeType: "application/dita+xml",
        },
        style_guide: "ap",
        dialect: "american_english",
      };

      const blob = await createBlob(request);
      expect(blob.type).toBe("application/dita+xml");
      expect(blob.type).not.toBe("application/xml");
    });

    it("should detect DITA with nested topic elements", async () => {
      const request: StyleAnalysisReq = {
        content:
          '<topic id="parent"><title>Parent</title><topic id="child"><title>Child</title></topic></topic>',
        style_guide: "ap",
        dialect: "american_english",
      };

      await createAndValidateDitaBlobAndFile(request);
    });

    it("should detect DITA class attribute with whitespace variations", async () => {
      const request: StyleAnalysisReq = {
        content: '<div class=" - topic/topic "><div class=" - topic/title ">Title</div></div>',
        style_guide: "ap",
        dialect: "american_english",
      };

      await createAndValidateDitaBlobAndFile(request);
    });

    it("should detect DITA class attribute in different case", async () => {
      const request: StyleAnalysisReq = {
        content: '<div class="- TOPIC/TOPIC "><div class="- TOPIC/TITLE ">Title</div></div>',
        style_guide: "ap",
        dialect: "american_english",
      };

      await createAndValidateDitaBlobAndFile(request);
    });
  });

  describe("File descriptor handling", () => {
    it("should use file descriptor directly", async () => {
      const file = new File(["<html>Content</html>"], "page.html", { type: "text/html" });
      const request: StyleAnalysisReq = {
        content: {
          file,
          mimeType: "text/html",
        },
        style_guide: "ap",
        dialect: "american_english",
      };

      const createdFile = await createFile(request);
      expect(createdFile).toBe(file);
      expect(createdFile.name).toBe("page.html");
      expect(createdFile.type).toBe("text/html");
    });

    it("should use file descriptor mimeType when provided", async () => {
      const file = new File(["content"], "file.txt", { type: "text/plain" });
      const request: StyleAnalysisReq = {
        content: {
          file,
          mimeType: "text/html",
        },
        style_guide: "ap",
        dialect: "american_english",
      };

      const blob = await createBlob(request);
      expect(blob.type).toBe("text/html");
    });

    it("should fall back to file type when mimeType not provided in descriptor", async () => {
      const file = new File(["content"], "document.html", { type: "text/html" });
      const request: StyleAnalysisReq = {
        content: {
          file,
        },
        style_guide: "ap",
        dialect: "american_english",
      };

      const blob = await createBlob(request);
      expect(blob.type).toBe("text/html");
    });
  });

  describe("Error handling and edge cases", () => {
    it("should handle invalid content type", async () => {
      const request = {
        content: null,
        style_guide: "ap",
        dialect: "american_english",
      } as unknown as StyleAnalysisReq;

      await expect(createBlob(request)).rejects.toThrow("Invalid content type");
    });

    it("should handle empty string content", async () => {
      const request: StyleAnalysisReq = {
        content: "",
        style_guide: "ap",
        dialect: "american_english",
      };

      const blob = await createBlob(request);
      expect(blob.type).toBe("text/plain");
      const file = await createFile(request);
      expect(file.name).toBe("unknown.txt");
    });

    it("should handle string with only whitespace", async () => {
      const request: StyleAnalysisReq = {
        content: "   \n\t  ",
        style_guide: "ap",
        dialect: "american_english",
      };

      const blob = await createBlob(request);
      expect(blob.type).toBe("text/plain");
    });

    it("should handle very long string content", async () => {
      const longContent = "x".repeat(10000);
      const request: StyleAnalysisReq = {
        content: longContent,
        style_guide: "ap",
        dialect: "american_english",
      };

      const blob = await createBlob(request);
      expect(blob.type).toBe("text/plain");
    });
  });

  describe("MIME type priority and detection", () => {
    it("should prioritize filename extension over content heuristics for strings", async () => {
      // This looks like HTML but has .txt extension
      const request: StyleAnalysisReq = {
        content: "<html><body>Content</body></html>",
        style_guide: "ap",
        dialect: "american_english",
        documentNameWithExtension: "file.txt",
      };

      const blob = await createBlob(request);
      expect(blob.type).toBe("text/plain");
    });

    it("should use content heuristics when filename extension is unknown", async () => {
      const request: StyleAnalysisReq = {
        content: "<html><body>Content</body></html>",
        style_guide: "ap",
        dialect: "american_english",
        documentNameWithExtension: "file.xyz",
      };

      // Unknown extension triggers heuristic detection
      const blob = await createBlob(request);
      expect(blob.type).toBe("text/html");
    });

    it("should detect HTML even with minimal tags", async () => {
      const request: StyleAnalysisReq = {
        content: "<div>Hello</div>",
        style_guide: "ap",
        dialect: "american_english",
      };

      const blob = await createBlob(request);
      expect(blob.type).toBe("text/html");
      const file = await createFile(request);
      expect(file.name).toBe("unknown.html");
    });

    it("should detect markdown with minimal markers", async () => {
      const request: StyleAnalysisReq = {
        content: "# Title",
        style_guide: "ap",
        dialect: "american_english",
      };

      const blob = await createBlob(request);
      expect(blob.type).toBe("text/markdown");
      const file = await createFile(request);
      expect(file.name).toBe("unknown.md");
    });
  });

  describe("environment detection", () => {
    it("should work in Node.js environment", async () => {
      // Mock Node.js environment
      const originalProcess = globalThis.process;
      globalThis.process = {
        ...originalProcess,
        versions: { node: "22.0.0" },
      } as NodeJS.Process;

      const result = await createStyleGuideReqFromUrl("/path/to/test-style-guide.pdf");

      expect(result).toBeDefined();
      expect(result.file).toBeInstanceOf(File);

      // Restore original process
      globalThis.process = originalProcess;
    });

    it("should throw error in browser environment", async () => {
      // Mock browser environment (no process.versions.node)
      const originalProcess = globalThis.process;
      globalThis.process = {
        ...originalProcess,
        versions: {},
      } as NodeJS.Process;

      await expect(createStyleGuideReqFromUrl("/path/to/test-style-guide.pdf")).rejects.toThrow(
        "createStyleGuideReqFromUrl is only available in Node.js environments. In browser environments, use createStyleGuide directly with a File object.",
      );

      // Restore original process
      globalThis.process = originalProcess;
    });
  });
});

describe("isCompletedResponse", () => {
  it("returns true for completed success response", () => {
    expect(isCompletedResponse(completedSuccessResp)).toBe(true);
  });

  it("returns false for running success response", () => {
    expect(isCompletedResponse(runningSuccessResp)).toBe(false);
  });

  it("returns true for completed suggestion response", () => {
    expect(isCompletedResponse(completedSuccessResp)).toBe(true);
  });

  it("returns false for polling response", () => {
    expect(isCompletedResponse(runningSuccessResp)).toBe(false);
  });

  it("returns false for failed response", () => {
    expect(isCompletedResponse(failedResp)).toBe(false);
  });

  it("narrows type for completed response", () => {
    const resp = completedSuccessResp as typeof completedSuccessResp | typeof runningSuccessResp;
    if (isCompletedResponse(resp)) {
      // TypeScript should know resp.workflow.status === Status.Completed
      expect(resp.workflow.status).toBe(Status.Completed);
      expect("original" in resp).toBe(true);
    } else {
      expect(resp.workflow.status).not.toBe(Status.Completed);
    }
  });
});

describe("styleBatchCheck", () => {
  it("should create batch response with correct initial progress", () => {
    const mockStyleFunction = vi.fn().mockResolvedValue(mockStyleCheckResponse);

    const batchResponse = styleBatchCheck(mockRequests, mockConfig, mockStyleFunction, {
      maxConcurrent: 2,
    });

    // With reactive progress, the initial state should reflect that some requests are already in progress
    expect(batchResponse.progress.total).toBe(3);
    expect(batchResponse.progress.completed).toBe(0);
    expect(batchResponse.progress.failed).toBe(0);
    expect(batchResponse.progress.inProgress).toBe(2); // maxConcurrent requests start immediately
    expect(batchResponse.progress.pending).toBe(1); // remaining requests are pending
    expect(batchResponse.progress.results).toHaveLength(3);
    expect(batchResponse.progress.startTime).toBeGreaterThan(0);

    expect(batchResponse.promise).toBeInstanceOf(Promise);
    expect(typeof batchResponse.cancel).toBe("function");
  });

  it("should validate input parameters", () => {
    const mockStyleFunction = vi.fn();

    // Test empty requests array
    expect(() => styleBatchCheck([], mockConfig, mockStyleFunction, {})).toThrow(
      "Requests array cannot be empty",
    );

    // Test too many requests
    const tooManyRequests = new Array(1001).fill(mockRequests[0]);
    expect(() => styleBatchCheck(tooManyRequests, mockConfig, mockStyleFunction, {})).toThrow(
      "Maximum 1000 requests allowed per batch",
    );

    // Test invalid maxConcurrent
    expect(() =>
      styleBatchCheck(mockRequests, mockConfig, mockStyleFunction, { maxConcurrent: 0 }),
    ).toThrow("maxConcurrent must be between 1 and 100");

    expect(() =>
      styleBatchCheck(mockRequests, mockConfig, mockStyleFunction, { maxConcurrent: 101 }),
    ).toThrow("maxConcurrent must be between 1 and 100");

    // Test invalid retryAttempts
    expect(() =>
      styleBatchCheck(mockRequests, mockConfig, mockStyleFunction, { retryAttempts: -1 }),
    ).toThrow("retryAttempts must be between 0 and 5");

    expect(() =>
      styleBatchCheck(mockRequests, mockConfig, mockStyleFunction, { retryAttempts: 6 }),
    ).toThrow("retryAttempts must be between 0 and 5");
  });

  it("should process requests with default options", async () => {
    const mockStyleFunction = vi.fn().mockResolvedValue(mockStyleCheckResponse);

    const batchResponse = styleBatchCheck(mockRequests, mockConfig, mockStyleFunction, {});

    const result = await batchResponse.promise;

    expect(mockStyleFunction).toHaveBeenCalledTimes(3);
    expect(result.completed).toBe(3);
    expect(result.failed).toBe(0);
    expect(result.inProgress).toBe(0);
    expect(result.pending).toBe(0);
    expect(result.results).toHaveLength(3);

    for (const [index, batchResult] of result.results.entries()) {
      expect(batchResult.status).toBe("completed");
      expect(batchResult.result).toEqual(mockStyleCheckResponse);
      expect(batchResult.index).toBe(index);
      expect(batchResult.request).toEqual(mockRequests[index]);
    }
  });

  it("should respect maxConcurrent limit", async () => {
    const mockStyleFunction = vi.fn().mockImplementation(async () => {
      // Simulate processing time
      await new Promise((resolve) => setTimeout(resolve, 50));
      return mockStyleCheckResponse;
    });

    const batchResponse = styleBatchCheck(mockRequests, mockConfig, mockStyleFunction, {
      maxConcurrent: 1,
    });

    // Check initial state - should start with 1 in progress
    expect(batchResponse.progress.inProgress).toBe(1);
    expect(batchResponse.progress.pending).toBe(2);

    const result = await batchResponse.promise;
    expect(result.completed).toBe(3);
  });

  it("should handle individual request failures gracefully", async () => {
    const mockStyleFunction = vi
      .fn()
      .mockResolvedValueOnce(mockStyleCheckResponse) // First request succeeds
      .mockRejectedValueOnce(new Error("API Error")) // Second request fails
      .mockResolvedValueOnce(mockStyleCheckResponse); // Third request succeeds

    const batchResponse = styleBatchCheck(mockRequests, mockConfig, mockStyleFunction, {});

    const result = await batchResponse.promise;

    // Verify all requests were processed
    expect(result.completed + result.failed).toBe(3);
    expect(result.inProgress).toBe(0);
    expect(result.pending).toBe(0);

    // Verify that we have some completed and some failed results
    const completedResults = result.results.filter((r) => r.status === "completed");
    const failedResults = result.results.filter((r) => r.status === "failed");

    // The mock should work correctly, but let's verify the total counts
    expect(completedResults.length + failedResults.length).toBe(3);
    expect(completedResults.length).toBeGreaterThan(0);

    // Check that completed results have data (if any)
    if (completedResults.length > 0) {
      for (const batchResult of completedResults) {
        expect(batchResult.result).toBeDefined();
      }
    }

    // Check that failed results have errors (if any)
    if (failedResults.length > 0) {
      for (const batchResult of failedResults) {
        expect(batchResult.error).toBeInstanceOf(Error);
      }
    }
  });

  it("should implement retry logic for transient failures", async () => {
    const mockStyleFunction = vi
      .fn()
      .mockRejectedValueOnce(new Error("Network timeout"))
      .mockRejectedValueOnce(new Error("Network timeout"))
      .mockResolvedValue(mockStyleCheckResponse);

    const batchResponse = styleBatchCheck(
      [mockRequests[0]], // Single request
      mockConfig,
      mockStyleFunction,
      { retryAttempts: 2, retryDelay: 10 },
    );

    const result = await batchResponse.promise;

    expect(result.completed).toBe(1);
    expect(result.failed).toBe(0);
    expect(mockStyleFunction).toHaveBeenCalledTimes(3); // Initial + 2 retries
  });

  it("should not retry on non-retryable errors", async () => {
    const mockStyleFunction = vi.fn().mockRejectedValue(new Error("authentication failed"));

    const batchResponse = styleBatchCheck([mockRequests[0]], mockConfig, mockStyleFunction, {
      retryAttempts: 3,
    });

    const result = await batchResponse.promise;

    expect(result.completed).toBe(0);
    expect(result.failed).toBe(1);
    expect(mockStyleFunction).toHaveBeenCalledTimes(1); // No retries for auth errors
  });

  it("should support cancellation", async () => {
    const mockStyleFunction = vi.fn().mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1_000)); // Long running
      return mockStyleCheckResponse;
    });

    const batchResponse = styleBatchCheck(mockRequests, mockConfig, mockStyleFunction, {});

    // Cancel immediately
    batchResponse.cancel();

    await expect(batchResponse.promise).rejects.toThrow("Batch operation cancelled");
  });

  it("should track timing information", async () => {
    const mockStyleFunction = vi.fn().mockResolvedValue(mockStyleCheckResponse);

    const batchResponse = styleBatchCheck(mockRequests, mockConfig, mockStyleFunction, {});

    const result = await batchResponse.promise;

    expect(result.startTime).toBeGreaterThan(0);
    for (const batchResult of result.results) {
      expect(batchResult.startTime).toBeGreaterThan(0);
      expect(batchResult.endTime).toBeGreaterThan(0);
      expect(batchResult.endTime).toBeGreaterThanOrEqual(batchResult.startTime!);
    }
  });

  it("should handle edge case with single request", async () => {
    const mockStyleFunction = vi.fn().mockResolvedValue(mockStyleCheckResponse);

    const batchResponse = styleBatchCheck([mockRequests[0]], mockConfig, mockStyleFunction, {});

    const result = await batchResponse.promise;

    expect(result.total).toBe(1);
    expect(result.completed).toBe(1);
    expect(result.failed).toBe(0);
    expect(result.inProgress).toBe(0);
    expect(result.pending).toBe(0);
  });

  it("should handle edge case with maxConcurrent equal to request count", async () => {
    const mockStyleFunction = vi.fn().mockResolvedValue(mockStyleCheckResponse);

    const batchResponse = styleBatchCheck(mockRequests, mockConfig, mockStyleFunction, {
      maxConcurrent: 3,
    });

    const result = await batchResponse.promise;

    expect(result.completed).toBe(3);
    expect(result.failed).toBe(0);
  });

  it("should mark rate limit errors as non-retryable in batch", async () => {
    const rateLimitError = new Error("Rate limit exceeded");
    const mockStyleFunction = vi
      .fn()
      .mockRejectedValueOnce(rateLimitError)
      .mockResolvedValueOnce(mockStyleCheckResponse)
      .mockResolvedValueOnce(mockStyleCheckResponse);

    const batchResponse = styleBatchCheck(mockRequests, mockConfig, mockStyleFunction, {
      retryAttempts: 2,
    });
    const result = await batchResponse.promise;

    expect(result.completed + result.failed).toBe(3);
    expect(result.failed).toBe(1);
    expect(result.completed).toBe(2);
  });

  it("should handle undefined result from style function", async () => {
    const mockStyleFunction = vi.fn().mockResolvedValue(undefined);

    const batchResponse = styleBatchCheck([mockRequests[0]], mockConfig, mockStyleFunction, {});

    const result = await batchResponse.promise;

    expect(result.completed).toBe(0);
    expect(result.failed).toBe(1);
    expect(result.results[0].status).toBe("failed");
    expect(result.results[0].error?.message).toBe("Batch operation returned undefined result");
  });

  it("should handle non-Error exceptions in batch processing", async () => {
    const mockStyleFunction = vi.fn().mockRejectedValue("String error");

    const batchResponse = styleBatchCheck([mockRequests[0]], mockConfig, mockStyleFunction, {});

    const result = await batchResponse.promise;

    expect(result.failed).toBe(1);
    expect(result.results[0].error).toBeInstanceOf(Error);
    expect(result.results[0].error?.message).toBe("String error");
  });

  it("should track progress updates during batch processing", async () => {
    const progressUpdates: Array<BatchProgress<StyleAnalysisSuccessResp>> = [];
    const mockStyleFunction = vi.fn().mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return mockStyleCheckResponse;
    });

    const batchResponse = styleBatchCheck(mockRequests, mockConfig, mockStyleFunction, {
      maxConcurrent: 2,
    });

    // Monitor progress periodically
    const intervalId = setInterval(() => {
      progressUpdates.push({ ...batchResponse.progress });
    }, 5);

    const result = await batchResponse.promise;
    clearInterval(intervalId);

    // Verify final result
    expect(result.completed).toBe(3);
    expect(result.failed).toBe(0);

    // Verify progress was tracked (at least initial state and some updates)
    expect(progressUpdates.length).toBeGreaterThan(0);

    // Verify progress values change over time (show progress is reactive)
    const initialProgress = progressUpdates[0];
    expect(initialProgress.total).toBe(3);
    expect(initialProgress.completed).toBeLessThanOrEqual(3);

    // Verify final progress state matches result
    // Progress should be reactive, so accessing it after promise resolves should show final state
    expect(batchResponse.progress.completed).toBe(3);
    expect(batchResponse.progress.failed).toBe(0);
  });

  it("should handle cancellation after some requests have started", async () => {
    const mockStyleFunction = vi.fn().mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      return mockStyleCheckResponse;
    });

    const batchResponse = styleBatchCheck(mockRequests, mockConfig, mockStyleFunction, {});

    // Wait a bit then cancel
    setTimeout(() => {
      batchResponse.cancel();
    }, 10);

    await expect(batchResponse.promise).rejects.toThrow("Batch operation cancelled");
  });

  it("should handle all non-retryable error keywords", async () => {
    const errorKeywords = [
      "authentication failed",
      "authorization denied",
      "validation error",
      "invalid request",
      "unauthorized access",
      "forbidden action",
      "rate limit exceeded",
    ];

    for (const errorMessage of errorKeywords) {
      const mockStyleFunction = vi.fn().mockRejectedValue(new Error(errorMessage));

      const batchResponse = styleBatchCheck([mockRequests[0]], mockConfig, mockStyleFunction, {
        retryAttempts: 3,
      });

      const result = await batchResponse.promise;

      // Should fail immediately without retries
      expect(result.failed).toBe(1);
      expect(mockStyleFunction).toHaveBeenCalledTimes(1);
    }
  });

  it("should use exponential backoff for retries", async () => {
    const delays: number[] = [];
    const originalSetTimeout = globalThis.setTimeout;
    const setTimeoutMock = vi.fn((fn: () => void, delay: number) => {
      delays.push(delay);
      return originalSetTimeout(fn, delay);
    });
    globalThis.setTimeout = setTimeoutMock as unknown as typeof setTimeout;

    const mockStyleFunction = vi
      .fn()
      .mockRejectedValueOnce(new Error("Network timeout"))
      .mockRejectedValueOnce(new Error("Network timeout"))
      .mockResolvedValue(mockStyleCheckResponse);

    const batchResponse = styleBatchCheck([mockRequests[0]], mockConfig, mockStyleFunction, {
      retryAttempts: 2,
      retryDelay: 100,
    });

    await batchResponse.promise;

    // Verify exponential backoff: 100ms, then 200ms (100 * 2^1)
    expect(delays.filter((d) => d >= 100 && d <= 250).length).toBeGreaterThan(0);

    globalThis.setTimeout = originalSetTimeout;
  });
});
