// Cross-environment runtime helpers

/**
 * Detects if the current environment is Node.js
 */
export function isNodeEnvironment(): boolean {
  return typeof process !== 'undefined' && !!(process as any)?.versions?.node;
}

/**
 * Returns a Blob constructor that works in both browser and Node.js.
 * - In browsers, returns the global Blob
 * - In Node.js, dynamically imports Blob from 'buffer' at runtime
 */
export async function getBlobCtor(): Promise<typeof Blob> {
  if (typeof Blob !== 'undefined') return Blob;
  const { Blob: NodeBlob } = (await import('buffer')) as typeof import('buffer');
  return (NodeBlob as unknown as typeof Blob) ?? Blob;
}
