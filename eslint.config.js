import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';

export default [
  js.configs.recommended,
  {
    files: ['src/**/*.{js,jsx}', 'scripts/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        window: 'readonly',
        document: 'readonly',
        fetch: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        self: 'readonly',
        caches: 'readonly',
        clients: 'readonly',
        performance: 'readonly',
        requestIdleCallback: 'readonly',
        queueMicrotask: 'readonly',
        AbortController: 'readonly',
        ReadableStream: 'readonly',
        TransformStream: 'readonly',
        WritableStream: 'readonly',
        TextEncoder: 'readonly',
        TextDecoder: 'readonly',
        Headers: 'readonly',
        Request: 'readonly',
        Response: 'readonly',
        FormData: 'readonly',
        Blob: 'readonly',
        FileReader: 'readonly',
        XMLHttpRequest: 'readonly',
        IntersectionObserver: 'readonly',
        reportError: 'readonly',
        WebAssembly: 'readonly',
        Bun: 'readonly',
        Deno: 'readonly',
        ActiveXObject: 'readonly',
        Element: 'readonly',
        HTMLElement: 'readonly',
        getComputedStyle: 'readonly',
        location: 'readonly',
        btoa: 'readonly',
        importScripts: 'readonly',
        TURBOPACK_NEXT_CHUNK_URLS: 'readonly',
        TURBOPACK_WORKER_LOCATION: 'readonly',
        __REACT_DEVTOOLS_GLOBAL_HOOK__: 'readonly',
        setImmediate: 'readonly',
        React: 'readonly',
        navigator: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        NodeJS: 'readonly',
      },
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: './tsconfig.json',
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        window: 'readonly',
        document: 'readonly',
        fetch: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        self: 'readonly',
        caches: 'readonly',
        clients: 'readonly',
        performance: 'readonly',
        requestIdleCallback: 'readonly',
        queueMicrotask: 'readonly',
        AbortController: 'readonly',
        ReadableStream: 'readonly',
        TransformStream: 'readonly',
        WritableStream: 'readonly',
        TextEncoder: 'readonly',
        TextDecoder: 'readonly',
        Headers: 'readonly',
        Request: 'readonly',
        Response: 'readonly',
        FormData: 'readonly',
        Blob: 'readonly',
        FileReader: 'readonly',
        XMLHttpRequest: 'readonly',
        IntersectionObserver: 'readonly',
        reportError: 'readonly',
        WebAssembly: 'readonly',
        Bun: 'readonly',
        Deno: 'readonly',
        ActiveXObject: 'readonly',
        Element: 'readonly',
        HTMLElement: 'readonly',
        getComputedStyle: 'readonly',
        location: 'readonly',
        btoa: 'readonly',
        importScripts: 'readonly',
        TURBOPACK_NEXT_CHUNK_URLS: 'readonly',
        TURBOPACK_WORKER_LOCATION: 'readonly',
        __REACT_DEVTOOLS_GLOBAL_HOOK__: 'readonly',
        setImmediate: 'readonly',
        React: 'readonly',
        navigator: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        NodeJS: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      // Configure no-unused-vars to ignore underscore-prefixed variables
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'all',
          argsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      // Configure no-explicit-any to be more lenient
      '@typescript-eslint/no-explicit-any': [
        'warn',
        {
          ignoreRestArgs: true,
        },
      ],
    },
  },
  {
    ignores: [
      // Dependencies
      'node_modules/**',

      // Production builds
      '.next/**',
      'out/**',
      'dist/**',
      'build/**',

      // Generated files
      '*.generated.*',
      '*.d.ts',
      'next-env.d.ts',

      // Coverage
      'coverage/**',

      // Cache
      '.eslintcache',

      // Config files (except eslint.config.js)
      '*.config.mjs',
      '*.config.ts',

      // Public files
      'public/**',
      'public/sw.js',

      // Prisma
      'prisma/migrations/**',

      // Logs
      '*.log',

      // OS files
      '.DS_Store',
      'Thumbs.db',

      // Test results
      'playwright-report/**',
      'test-results/**',
    ],
  },
];
