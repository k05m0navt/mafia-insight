import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
    teardownTimeout: 30000,
    mockReset: true,
    restoreMocks: true,
    include: [
      'tests/unit/**/*.test.{ts,tsx}',
      'tests/unit/**/*.spec.{ts,tsx}',
      'tests/integration/**/*.test.{ts,tsx}',
      'tests/integration/**/*.spec.{ts,tsx}',
      'tests/components/**/*.test.tsx'
    ],
    exclude: ['tests/e2e/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: [
        'src/**/*.{ts,tsx}',
        '!src/**/*.d.ts',
        '!src/**/*.stories.{ts,tsx}',
        '!src/**/*.test.{ts,tsx}',
        '!src/**/*.spec.{ts,tsx}',
      ],
      exclude: [
        'node_modules/',
        'coverage/',
        'dist/',
        '.next/',
        'build/',
        'tests/',
        '**/*.config.{js,ts}',
        '**/*.setup.{js,ts}',
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
        // Specific thresholds for critical components
        'src/components/auth/': {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90,
        },
        'src/hooks/': {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85,
        },
        'src/services/': {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85,
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  define: {
    'import.meta.vitest': 'undefined',
  },
  esbuild: {
    target: 'node14',
  },
});
