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
    isolate: false,
    // Vitest 4: poolOptions moved to top-level options
    singleFork: true,
    bail: 5,
    retry: 1,
    testTimeout: 10000,
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/chrome-devtools/scripts/**',
      '**/e2e/**',
      '**/.claude/**',
      '**/admin-panel/**',
      '**/n8n_codebase/**',
      '**/scripts/**',
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
