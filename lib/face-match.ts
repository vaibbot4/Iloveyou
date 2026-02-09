/**
 * Client-side face matching (same idea as clockin-out project).
 * Fetch stored embeddings from API, compare with cosine similarity in the browser.
 */

export function cosineSimilarity(a: number[], b: number[]): number {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length || a.length === 0) return 0;
  let dot = 0, n1 = 0, n2 = 0;
  for (let i = 0; i < a.length; i++) {
    const x = a[i], y = b[i];
    if (typeof x !== 'number' || typeof y !== 'number' || isNaN(x) || isNaN(y)) return 0;
    dot += x * y;
    n1 += x * x;
    n2 += y * y;
  }
  const denom = Math.sqrt(n1) * Math.sqrt(n2);
  if (denom === 0 || !isFinite(denom)) return 0;
  return Math.max(-1, Math.min(1, dot / denom));
}

export function parseEmbedding(emb: unknown): number[] | null {
  if (Array.isArray(emb) && emb.length === 128) return emb as number[];
  if (typeof emb === 'string') {
    try {
      const arr = JSON.parse(emb);
      return Array.isArray(arr) && arr.length === 128 ? arr : null;
    } catch {
      return null;
    }
  }
  return null;
}
