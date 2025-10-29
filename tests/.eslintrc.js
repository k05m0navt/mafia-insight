module.exports = {
  extends: ['../../eslint.config.js'],
  env: {
    jest: true,
    node: true,
    browser: true,
  },
  rules: {
    // Testing-specific rules
    'jest/expect-expect': 'error',
    'jest/no-disabled-tests': 'warn',
    'jest/no-focused-tests': 'error',
    'jest/no-identical-title': 'error',
    'jest/prefer-to-have-length': 'warn',
    'jest/valid-expect': 'error',

    // Allow console.log in tests
    'no-console': 'off',

    // Allow any type in tests for flexibility
    '@typescript-eslint/no-explicit-any': 'off',

    // Allow unused variables in tests
    '@typescript-eslint/no-unused-vars': 'off',
  },
  overrides: [
    {
      files: ['**/*.test.{js,ts,jsx,tsx}', '**/*.spec.{js,ts,jsx,tsx}'],
      rules: {
        // More relaxed rules for test files
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        'prefer-const': 'off',
      },
    },
  ],
};
