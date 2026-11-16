module.exports = {
  root: true,
  extends: ['eslint:recommended'],
  parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
  env: { browser: true, es2022: true },
  globals: { AndroidBridge: 'readonly' },
  rules: {
    'no-empty': ['error', { allowEmptyCatch: true }],
    'no-unused-vars': ['warn', { args: 'none', caughtErrors: 'none', varsIgnorePattern: '^_' }],
    'no-inner-declarations': 'off',
    'no-prototype-builtins': 'off',
  },
  overrides: [
    { files: ['scripts/**', 'tests/**', '*.config.js', '.eslintrc.cjs'], env: { node: true, browser: true } },
  ],
};
