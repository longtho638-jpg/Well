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
 * Extract all t('key') calls from file content
 */
function extractKeysFromContent(content, filePath) {
  const keys = [];

  // Match: t('key.path') or t("key.path")
  // Captures: t('key'), t("key"), t(`key`)
  // We need to be careful about not capturing things that look like t() but aren't
  // But for now, simple regex is usually enough for standard codebases
  const tFunctionPattern = /\bt\s*\(\s*(['"`])([^'"`]+)\1\s*\)/g;

  let match;
  while ((match = tFunctionPattern.exec(content)) !== null) {
    keys.push({
      key: match[2],
      file: filePath,
      line: content.substring(0, match.index).split('\n').length,
    });
  }

  return keys;
}

/**
 * Main extraction function
 */
export function extractAllTranslationKeys(srcDir = 'src') {
  const files = findSourceFiles(srcDir);
  const allKeys = [];

  for (const file of files) {
    const content = readFileSync(file, 'utf-8');
    const keys = extractKeysFromContent(content, file);
    allKeys.push(...keys);
  }

  // Deduplicate by key name (keep first occurrence for reference)
  // Actually, keeping all occurrences might be noisy, but keeping just one is enough for validation
  // However, if we want to show ALL usages of a missing key, we might want to keep them.
  // The plan says "Deduplicate by key name", but the check coverage might want to know where it's used.
  // Let's return unique keys but maybe strictly unique strings?
  // The plan's implementation returns unique objects based on key name.

  const uniqueKeys = [];
  const seen = new Set();

  for (const item of allKeys) {
    if (!seen.has(item.key)) {
      seen.add(item.key);
      uniqueKeys.push(item);
    }
  }

  return uniqueKeys;
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const keys = extractAllTranslationKeys();
  console.log(JSON.stringify(keys, null, 2));
  console.log(`\nTotal unique keys: ${keys.length}`);
}
