import js from '@eslint/js';
import globals from 'globals';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import reactPlugin from 'eslint-plugin-react';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  /* ------------- files ESLint should ignore ------------ */
  {
    ignores: [
      'node_modules/**',
      '.husky/**',
      'commitlint.config.cjs',
      // add any other paths you had in .eslintignore
    ],
  },
  /* ------------- base JS rules ------------- */
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    plugins: { js },
    extends: ['js/recommended'],
  },
  /* ------------- browser code -------------- */
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    languageOptions: { globals: globals.browser },
  },
  /* ------------- Node / tool files --------- */
  {
    files: ['*.config.*', '*.cjs', '*.mjs'],
    languageOptions: { globals: globals.node },
  },
  /* ------------- TypeScript ---------------- */
  {
    files: ['**/*.{ts,tsx,mts,cts}'],
    languageOptions: { parser: tsParser },
    plugins: { '@typescript-eslint': tsPlugin },
    ...tsPlugin.configs.recommended,
  },
  /* ------------- React --------------------- */
  {
    plugins: { react: reactPlugin },
    settings: { react: { version: 'detect' } },
    ...reactPlugin.configs.flat.recommended,
  },
]);
