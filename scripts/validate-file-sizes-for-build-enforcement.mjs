#!/usr/bin/env node

/**
 * validate-file-sizes-for-build-enforcement.mjs
 *
 * Scans src/**\/*.{ts,tsx} for files exceeding MAX_LINES (200).
 *
 * Default mode (informational): prints violations, exits 0.
 * Strict mode (--strict flag): exits 1 if any violations found.
 *
 * Skips:
 *   - src/locales/**
 *   - src/__tests__/**
 *   - *.test.ts, *.test.tsx
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

// ─── File discovery ───────────────────────────────────────────────────────────

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
  const lineCount = content.split('\n').length;

  if (lineCount > MAX_LINES) {
    violations.push({ file: relative(process.cwd(), filePath), lines: lineCount });
  }
}

// ─── Report ───────────────────────────────────────────────────────────────────

const mode = STRICT ? '[STRICT]' : '[INFO]';

if (violations.length === 0) {
  console.log(`${mode} File size check passed — all ${files.length} files are within ${MAX_LINES} lines\n`);
  process.exit(0);
}

console.log(`${mode} Files exceeding ${MAX_LINES} lines (${violations.length} violation(s)):\n`);

violations
  .sort((a, b) => b.lines - a.lines)
  .forEach(({ file, lines }) => {
    const overage = lines - MAX_LINES;
    console.log(`  ${file}`);
    console.log(`    ${lines} lines (+${overage} over limit)\n`);
  });

if (STRICT) {
  console.error(`File size validation FAILED — ${violations.length} file(s) exceed ${MAX_LINES} lines\n`);
  console.error('Refactor large files before committing (--strict mode).\n');
  process.exit(1);
} else {
  console.log(`${violations.length} file(s) exceed ${MAX_LINES} lines — refactor when possible (informational only)\n`);
  console.log('Run with --strict to enforce as a hard gate.\n');
  process.exit(0);
}
