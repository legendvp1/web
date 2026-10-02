import js from '@eslint/js';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    files: ['src/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'script',
      globals: globals.browser,
    },
  },
  {
    files: ['src/js/theme-init.js'],
    languageOptions: { sourceType: 'script' },
  },
];
