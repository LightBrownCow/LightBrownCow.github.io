// eslint.config.mjs
import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import reactPlugin from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import { defineConfig } from "eslint/config";

export default defineConfig([
  /* ---------- ignore patterns (no .eslintignore in v9) ---------- */
  {
    ignores: [
      "node_modules/**",
      ".husky/**",
      "commitlint.config.cjs",
      "dist/**",
    ],
  },

  /* ---------- base JS rules ------------------------------------- */
  js.configs.recommended,

  /* ---------- TypeScript (parser + rules) ----------------------- */
  tseslint.configs.recommended,

  /* ---------- React Hooks & React-Refresh ----------------------- */
  reactHooks.configs["recommended-latest"],
  reactRefresh.configs.vite,

  /* ---------- browser globals / modern ECMAScript -------------- */
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },

  /* ---------- Node/tooling files -------------------------------- */
  {
    files: ["*.config.*", "*.cjs", "*.mjs"],
    languageOptions: { globals: globals.node },
  },

  /* ---------- React core rules ---------------------------------- */
  {
    plugins: { react: reactPlugin },
    settings: { react: { version: "detect" } },
    rules: reactPlugin.configs.flat.recommended.rules,
  },

  reactPlugin.configs.flat["jsx-runtime"],
]);
