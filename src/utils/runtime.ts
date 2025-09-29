// Cross-environment runtime helpers

/**
 * Detects if the current environment is Node.js
 */
export function isNodeEnvironment(): boolean {
  // Narrow process with a local type to avoid 'any'
  type ProcessLike = { versions?: { node?: string } };
  const proc = typeof process === 'undefined' ? undefined : (process as unknown as ProcessLike);
  return !!proc?.versions?.node;
}

/**
 * Returns a Blob constructor that works in both browser and Node.js.
 * - In browsers, returns the global Blob
 * - In Node.js, dynamically imports Blob from 'buffer' at runtime
 */
export async function getBlobCtor(): Promise<typeof Blob> {
  if (typeof Blob !== 'undefined') return Blob;
  const { Blob: NodeBlob } = (await import('node:buffer')) as typeof import('node:buffer');
  return (NodeBlob as unknown as typeof Blob) ?? Blob;
}
