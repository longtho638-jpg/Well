import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
    env: {
      NODE_ENV: 'test',
    },
    // Single-threaded test execution to prevent esbuild resource crashes on M1 16GB
    // Reference: CI/CD fix 2026-03-04 - esbuild worker crashes with parallel tests
    pool: 'forks' as const,
    maxWorkers: 1,
    fileParallelism: false,
    // Memory optimization for M1 16GB
    isolate: false, // Disable worker isolation to reduce memory overhead
    poolOptions: {
      forks: {
        singleFork: true, // Reuse same worker process
        isolate: false, // No isolation between tests
      },
    },
    // Fail fast to avoid wasting resources on cascading failures
    bail: 5, // Stop after 5 failures
    retry: 1, // Retry failed tests once (handles flaky timing issues)
    testTimeout: 10000, // 10s timeout to prevent hanging tests
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/chrome-devtools/scripts/**', // Uses Node.js test runner
      '**/e2e/**',
      '**/.claude/**', // Playwright tests - run with `npx playwright test`
      '**/.claude.bak*/**', // Backup folders - not tests
      '**/admin-panel/**', // Has its own test suite and React version
      '**/n8n_codebase/**', // Separate project with its own test suite
      '**/scripts/**', // Build/utility scripts
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/test/**',
        '**/tests/**',
        '**/__tests__/**',
        '**/chrome-devtools/**',
        '**/admin-panel/**',
        '**/.claude/**',
      ],
      thresholds: {
        lines: 25,
        functions: 21,
        branches: 18,
        statements: 24,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
