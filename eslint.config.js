import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import nextPlugin from '@next/eslint-plugin-next';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx,ts,tsx,mjs}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        console: 'readonly',
        fetch: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        Blob: 'readonly',
        Response: 'readonly',
        Request: 'readonly',
        RequestInit: 'readonly',
        AbortController: 'readonly',
        AbortSignal: 'readonly',
        ReadableStream: 'readonly',
        TextEncoder: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        performance: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        MediaQueryList: 'readonly',
        HTMLInputElement: 'readonly',
        HTMLDivElement: 'readonly',
        HTMLButtonElement: 'readonly',
        HTMLAnchorElement: 'readonly',
        HTMLElement: 'readonly',
        Element: 'readonly',
        KeyboardEvent: 'readonly',
        FocusEvent: 'readonly',
        React: 'readonly',
        // Node.js globals
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        global: 'readonly',
        // Service Worker globals
        self: 'readonly',
        caches: 'readonly',
        clients: 'readonly',
        // Test globals
        vi: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        test: 'readonly',
        jest: 'readonly',
        // Playwright globals
        Locator: 'readonly',
        chromium: 'readonly',
        config: 'readonly',
        // Other globals
        NodeJS: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
      '@next/next': nextPlugin,
      'react-hooks': reactHooks,
    },
    rules: {
      ...typescript.configs.recommended.rules,
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-require-imports': 'off',
      'prefer-const': 'error',
      'no-var': 'error',
      'no-case-declarations': 'error',
      'no-undef': 'off', // Turn off since we're using TypeScript
    },
  },
  {
    ignores: [
      // Dependencies
      'node_modules/',

      // Production builds
      '.next/',
      'out/',
      'dist/',
      'build/',

      // Generated files
      '*.generated.*',
      '*.d.ts',
      'next-env.d.ts',

      // Coverage
      'coverage/',
      '.nyc_output/',

      // Cache
      '.eslintcache',

      // Package lock files
      'package-lock.json',
      'yarn.lock',
      'pnpm-lock.yaml',

      // Config files
      '*.config.mjs',
      '*.config.ts',

      // Public files
      'public/',

      // Prisma
      'prisma/migrations/',

      // Logs
      '*.log',

      // OS files
      '.DS_Store',
      'Thumbs.db',

      // Test results
      'playwright-report/',
      'test-results/',
      'test-results.json',
      'test-results.xml',

      // IDE
      '.vscode/',
      '.idea/',

      // Temporary files
      '*.tmp',
      '*.swp',
      '*~',

      // Testing framework specific
      'tests/fixtures/anonymized/',
      'tests/fixtures/production/',
      'tests/artifacts/',
      'tests/reports/',
      'tests/logs/',
      'tests/screenshots/',
      'tests/videos/',

      // Performance test results
      'tests/performance/results/',
      'tests/performance/artifacts/',

      // Security test results
      'tests/security/results/',
      'tests/security/artifacts/',

      // Artillery results
      'artillery-report.html',
      'artillery-report.json',

      // Lighthouse results
      'lighthouse-results/',
      'lighthouse-report.html',

      // OWASP ZAP results
      'zap-results/',
      'zap-report.html',
      'zap-report.json',

      // Test database
      '*.test.db',
      '*.test.sqlite',
      '*.test.sqlite3',

      // Test environment files
      '.env.test',
      '.env.test.local',
      '.env.testing',

      // Minified files
      '*.min.js',
      '*.min.css',

      // Source maps
      '*.map',

      // Test files (keep these for now but can be removed if needed)
      'tests/e2e/**/*.spec.ts',
      'tests/integration/**/*.test.ts',
      'tests/unit/**/*.test.ts',
      'tests/components/**/*.test.tsx',
      'vitest.config.ts',
      'playwright.config.ts',
      'playwright.quick.config.ts',
      'scripts/**/*.js',
      'public/sw.js',
      'prisma/seed.ts',
    ],
  },
];
