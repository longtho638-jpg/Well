#!/usr/bin/env node

/**
 * validate-file-sizes-for-build-enforcement.mjs
 *
 * Scans src/**\/*.{ts,tsx} for files exceeding MAX_LINES (200).
 *
 * Line counting mirrors ESLint's max-lines rule:
 *   - Blank lines (whitespace-only) are NOT counted
 *   - Single-line comments (//) are NOT counted
 *   - Block comment lines (/* ... * /) are NOT counted
 *
 * Default mode (informational): prints violations, exits 0.
 * Strict mode (--strict flag): exits 1 if any violations found.
 *
 * Skips:
 *   - src/locales/**
 *   - src/__tests__/**
 *   - *.test.ts, *.test.tsx, *.spec.ts, *.spec.tsx
 *   - App.tsx (intentionally large entry point)
 *
 * Usage:
 *   node scripts/validate-file-sizes-for-build-enforcement.mjs
 *   node scripts/validate-file-sizes-for-build-enforcement.mjs --strict
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

const MAX_LINES = 200;
const SRC_DIR = 'src';
const STRICT = process.argv.includes('--strict');

const SKIP_DIRS = new Set(['locales', '__tests__', 'node_modules']);
const SKIP_FILES = new Set(['App.tsx']);
const SKIP_SUFFIXES = ['.test.ts', '.test.tsx', '.spec.ts', '.spec.tsx'];

// ─── Line counting (ESLint max-lines compatible) ───────────────────────────────

/**
 * Count meaningful lines in a TypeScript/TSX source file.
 * Excludes blank lines and comment-only lines (// and block comments).
 */
function countMeaningfulLines(content) {
  const rawLines = content.split('\n');
  let count = 0;
  let inBlockComment = false;

  for (const rawLine of rawLines) {
    const line = rawLine.trim();

    // Skip blank lines
    if (line === '') continue;

    if (inBlockComment) {
      // Check if block comment ends on this line
      if (line.includes('*/')) {
        inBlockComment = false;
      }
      // Block comment lines (including the closing line) don't count
      continue;
    }

    // Check if block comment starts on this line
    if (line.startsWith('/*') || line.startsWith('/**')) {
      inBlockComment = !line.includes('*/') || line.indexOf('*/') === line.lastIndexOf('*/') && line.startsWith('/*') && line.endsWith('*/') && line.length > 4
        ? true
        : false;
      // Single-line block comment (/** ... */) — don't count
      if (line.startsWith('/*') && line.includes('*/')) {
        // Inline block comment only — skip
        continue;
      }
      inBlockComment = true;
      continue;
    }

    // Skip single-line comments
    if (line.startsWith('//')) continue;

    count++;
  }

  return count;
}

// ─── File discovery ────────────────────────────────────────────────────────────

function findSourceFiles(dir, files = []) {
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      if (!entry.startsWith('.') && !SKIP_DIRS.has(entry)) {
        findSourceFiles(fullPath, files);
      }
    } else if (/\.(tsx?|jsx?)$/.test(entry)) {
      if (SKIP_FILES.has(entry)) continue;
      if (SKIP_SUFFIXES.some(suffix => entry.endsWith(suffix))) continue;
      files.push(fullPath);
    }
  }
  return files;
}

// ─── Scan ─────────────────────────────────────────────────────────────────────

const files = findSourceFiles(SRC_DIR);
const violations = [];

for (const filePath of files) {
  const content = readFileSync(filePath, 'utf-8');
  const rawLines = content.split('\n').length;
  const meaningfulLines = countMeaningfulLines(content);

  if (meaningfulLines > MAX_LINES) {
    violations.push({
      file: relative(process.cwd(), filePath),
      lines: meaningfulLines,
      rawLines,
    });
  }
}

// ─── Report ───────────────────────────────────────────────────────────────────

const mode = STRICT ? '[STRICT]' : '[INFO]';

if (violations.length === 0) {
  console.log(`${mode} File size check passed — all ${files.length} files are within ${MAX_LINES} meaningful lines\n`);
  process.exit(0);
}

console.log(`${mode} Files exceeding ${MAX_LINES} meaningful lines (${violations.length} violation(s)):\n`);

violations
  .sort((a, b) => b.lines - a.lines)
  .forEach(({ file, lines, rawLines }) => {
    const overage = lines - MAX_LINES;
    console.log(`  ${file}`);
    console.log(`    ${lines} meaningful lines (+${overage} over limit) [${rawLines} raw lines]\n`);
  });

if (STRICT) {
  console.error(`File size validation FAILED — ${violations.length} file(s) exceed ${MAX_LINES} meaningful lines\n`);
  console.error('Refactor large files before committing (--strict mode).\n');
  process.exit(1);
} else {
  console.log(`${violations.length} file(s) exceed ${MAX_LINES} meaningful lines — refactor when possible (informational only)\n`);
  console.log('Run with --strict to enforce as a hard gate.\n');
  process.exit(0);
}
