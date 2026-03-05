import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  test: {
    include: ['src/**/*.{test,spec}.{ts,tsx}', 'tests/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/.vite/**', 'n8n_codebase/**', 'admin-panel/**'],
    environment: 'jsdom',
    restoreMocks: true,
    clearMocks: true,
    mockReset: true,
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
  },
});
