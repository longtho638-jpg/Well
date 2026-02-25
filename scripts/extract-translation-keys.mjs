import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

/**
 * Recursively find all .tsx and .ts files in src/
 */
function findSourceFiles(dir, files = []) {
  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      if (!entry.startsWith('.') && entry !== 'node_modules') {
        findSourceFiles(fullPath, files);
      }
    } else if (/\.(tsx?|jsx?)$/.test(entry)) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Extract all t('key') calls from file content.
 * Uses incremental newline counting instead of substring+split to avoid OOM.
 */
function extractKeysFromContent(content, filePath) {
  const tFunctionPattern = /\bt\s*\(\s*(['"`])([^'"`]+)\1\s*\)/g;

  const seen = new Map(); // key -> { key, file, line }
  let lastIndex = 0;
  let currentLine = 1;
  let match;

  while ((match = tFunctionPattern.exec(content)) !== null) {
    // Count newlines only in the slice since last match — O(n) total, not O(n^2)
    for (let i = lastIndex; i < match.index; i++) {
      if (content[i] === '\n') currentLine++;
    }
    lastIndex = match.index;

    const key = match[2];
    if (!seen.has(key)) {
      seen.set(key, { key, file: filePath, line: currentLine });
    }
  }

  return Array.from(seen.values());
}

/**
 * Main extraction function
 */
export function extractAllTranslationKeys(srcDir = 'src') {
  const files = findSourceFiles(srcDir);
  const globalSeen = new Map(); // deduplicate across all files

  for (const file of files) {
    const content = readFileSync(file, 'utf-8');
    const keys = extractKeysFromContent(content, file);
    for (const item of keys) {
      if (!globalSeen.has(item.key)) {
        globalSeen.set(item.key, item);
      }
    }
  }

  return Array.from(globalSeen.values());
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const keys = extractAllTranslationKeys();
  console.log(JSON.stringify(keys, null, 2));
  console.log(`\nTotal unique keys: ${keys.length}`);
}
