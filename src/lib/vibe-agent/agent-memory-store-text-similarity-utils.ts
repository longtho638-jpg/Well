/**
 * Agent Memory Store — Text Similarity Utilities (Mem0 pattern)
 *
 * Extracted from agent-memory-store-mem0-pattern.ts.
 * Pure functions: tokenize, computeRelevance, computeSimilarity.
 * Used for keyword-based dedup and search ranking (simplified TF / Jaccard).
 */

/** Tokenize text into lowercase terms (Mem0: preprocessing) */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

/** Compute keyword relevance score (0-1) for search ranking */
export function computeRelevance(queryTerms: string[], content: string): number {
  const contentLower = content.toLowerCase();
  let matches = 0;

  for (const term of queryTerms) {
    if (contentLower.includes(term)) matches++;
  }

  return queryTerms.length > 0 ? matches / queryTerms.length : 0;
}

/** Compute Jaccard similarity between two texts (0-1) */
export function computeSimilarity(a: string, b: string): number {
  const tokensA = new Set(tokenize(a));
  const tokensB = new Set(tokenize(b));

  if (tokensA.size === 0 && tokensB.size === 0) return 1;
  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  let intersection = 0;
  for (const t of tokensA) {
    if (tokensB.has(t)) intersection++;
  }

  const union = tokensA.size + tokensB.size - intersection;
  return union > 0 ? intersection / union : 0;
}
