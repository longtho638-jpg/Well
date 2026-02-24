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
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/chrome-devtools/scripts/**', // Uses Node.js test runner
      '**/e2e/**',
      '**/.claude/**', // Playwright tests - run with `npx playwright test`
      '**/admin-panel/**', // Has its own test suite and React version
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
        lines: 20,
        functions: 15,
        branches: 20,
        statements: 20,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
