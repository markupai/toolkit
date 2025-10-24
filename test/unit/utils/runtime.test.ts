import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { isNodeEnvironment, getBlobCtor } from "../../../src/utils/runtime";

describe("Runtime Utilities Unit Tests", () => {
  describe("isNodeEnvironment", () => {
    let originalProcess: NodeJS.Process | undefined;

    beforeEach(() => {
      // Save the original process object
      originalProcess = globalThis.process;
    });

    afterEach(() => {
      // Restore the original process object
      if (originalProcess) {
        globalThis.process = originalProcess;
      }
    });

    it("should return true in Node.js environment", () => {
      // In the test environment, we're running in Node.js
      const result = isNodeEnvironment();
      expect(result).toBe(true);
    });

    it("should return true when process.versions.node exists", () => {
      // Mock process with node version
      globalThis.process = {
        versions: {
          node: "18.0.0",
        },
      } as NodeJS.Process;

      const result = isNodeEnvironment();
      expect(result).toBe(true);
    });

    it("should return false when process is undefined", () => {
      // Mock undefined process (browser environment)
      globalThis.process = undefined as unknown as NodeJS.Process;

      const result = isNodeEnvironment();
      expect(result).toBe(false);
    });

    it("should return false when process.versions is undefined", () => {
      // Mock process without versions
      globalThis.process = {} as NodeJS.Process;

      const result = isNodeEnvironment();
      expect(result).toBe(false);
    });

    it("should return false when process.versions.node is undefined", () => {
      // Mock process with versions but no node property
      globalThis.process = {
        versions: {},
      } as NodeJS.Process;

      const result = isNodeEnvironment();
      expect(result).toBe(false);
    });

    it("should return false when process.versions.node is empty string", () => {
      // Mock process with empty node version
      globalThis.process = {
        versions: {
          node: "",
        },
      } as NodeJS.Process;

      const result = isNodeEnvironment();
      expect(result).toBe(false);
    });
  });

  describe("getBlobCtor", () => {
    it("should return Blob constructor in Node.js environment", async () => {
      const BlobCtor = await getBlobCtor();
      expect(BlobCtor).toBeDefined();
      expect(typeof BlobCtor).toBe("function");
    });

    it("should return a constructor that can create Blob instances", async () => {
      const BlobCtor = await getBlobCtor();
      const blob = new BlobCtor(["test content"], { type: "text/plain" });

      expect(blob).toBeInstanceOf(BlobCtor);
      expect(blob.type).toBe("text/plain");
      expect(blob.size).toBeGreaterThan(0);
    });

    it("should handle Blob creation with multiple parts", async () => {
      const BlobCtor = await getBlobCtor();
      const part1 = "Hello ";
      const part2 = "World";
      const blob = new BlobCtor([part1, part2], { type: "text/plain" });

      expect(blob.size).toBe(part1.length + part2.length);
    });

    it("should handle Blob creation with ArrayBuffer", async () => {
      const BlobCtor = await getBlobCtor();
      const buffer = new ArrayBuffer(8);
      const view = new Uint8Array(buffer);
      view[0] = 65; // 'A'
      view[1] = 66; // 'B'

      const blob = new BlobCtor([buffer], { type: "application/octet-stream" });
      expect(blob.size).toBe(8);
      expect(blob.type).toBe("application/octet-stream");
    });

    it("should handle Blob creation with Uint8Array", async () => {
      const BlobCtor = await getBlobCtor();
      const uint8Array = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
      const blob = new BlobCtor([uint8Array], { type: "application/octet-stream" });

      expect(blob.size).toBe(5);
    });

    it("should handle empty Blob creation", async () => {
      const BlobCtor = await getBlobCtor();
      const blob = new BlobCtor([], { type: "text/plain" });

      expect(blob.size).toBe(0);
      expect(blob.type).toBe("text/plain");
    });

    it("should create Blob without type option", async () => {
      const BlobCtor = await getBlobCtor();
      const blob = new BlobCtor(["test"]);

      expect(blob).toBeInstanceOf(BlobCtor);
      expect(blob.size).toBeGreaterThan(0);
    });

    it("should support text method on created Blob", async () => {
      const BlobCtor = await getBlobCtor();
      const testContent = "Hello, World!";
      const blob = new BlobCtor([testContent], { type: "text/plain" });

      if (blob.text) {
        const text = await blob.text();
        expect(text).toBe(testContent);
      }
    });

    it("should support arrayBuffer method on created Blob", async () => {
      const BlobCtor = await getBlobCtor();
      const testContent = "Test";
      const blob = new BlobCtor([testContent], { type: "text/plain" });

      if (blob.arrayBuffer) {
        const arrayBuffer = await blob.arrayBuffer();
        expect(arrayBuffer).toBeInstanceOf(ArrayBuffer);
        expect(arrayBuffer.byteLength).toBeGreaterThan(0);
      }
    });

    it("should support slice method on created Blob", async () => {
      const BlobCtor = await getBlobCtor();
      const testContent = "Hello, World!";
      const blob = new BlobCtor([testContent], { type: "text/plain" });

      if (blob.slice) {
        const slicedBlob = blob.slice(0, 5);
        expect(slicedBlob).toBeInstanceOf(BlobCtor);
        expect(slicedBlob.size).toBe(5);

        if (slicedBlob.text) {
          const text = await slicedBlob.text();
          expect(text).toBe("Hello");
        }
      }
    });

    it("should cache the Blob constructor on subsequent calls", async () => {
      // Call getBlobCtor multiple times
      const BlobCtor1 = await getBlobCtor();
      const BlobCtor2 = await getBlobCtor();
      const BlobCtor3 = await getBlobCtor();

      // All should return the same constructor
      expect(BlobCtor1).toBe(BlobCtor2);
      expect(BlobCtor2).toBe(BlobCtor3);
    });

    it("should handle different MIME types correctly", async () => {
      const BlobCtor = await getBlobCtor();

      const mimeTypes = [
        "text/plain",
        "application/json",
        "application/pdf",
        "image/png",
        "text/html",
        "application/octet-stream",
      ];

      for (const mimeType of mimeTypes) {
        const blob = new BlobCtor(["content"], { type: mimeType });
        expect(blob.type).toBe(mimeType);
      }
    });
  });

  describe("Integration: isNodeEnvironment and getBlobCtor", () => {
    it("should successfully get Blob constructor when in Node environment", async () => {
      const isNode = isNodeEnvironment();
      const BlobCtor = await getBlobCtor();

      if (isNode) {
        expect(BlobCtor).toBeDefined();
        expect(typeof BlobCtor).toBe("function");

        // Should be able to create a blob
        const blob = new BlobCtor(["test"], { type: "text/plain" });
        expect(blob).toBeInstanceOf(BlobCtor);
      }
    });

    it("should handle Blob operations in detected environment", async () => {
      const isNode = isNodeEnvironment();

      if (isNode) {
        const BlobCtor = await getBlobCtor();
        const blob = new BlobCtor(["Integration test content"], {
          type: "text/plain",
        });

        expect(blob.size).toBeGreaterThan(0);
        expect(blob.type).toBe("text/plain");

        if (blob.text) {
          const text = await blob.text();
          expect(text).toContain("Integration test");
        }
      }
    });
  });
});
