// eslint.config.mjs
import js from "@eslint/js";
import globals from "globals";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import reactPlugin from "eslint-plugin-react";
import { defineConfig } from "eslint/config";

export default defineConfig([
  /* ---------- ignore patterns (no .eslintignore in v9) ---------- */
  {
    ignores: ["node_modules/**", ".husky/**", "commitlint.config.cjs"],
  },

  /* ---------- base JS rules (spread, not extends) --------------- */
  js.configs.recommended,

  /* ---------- browser globals ----------------------------------- */
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    languageOptions: { globals: globals.browser },
  },

  /* ---------- Node/tooling files -------------------------------- */
  {
    files: ["*.config.*", "*.cjs", "*.mjs"],
    languageOptions: { globals: globals.node },
  },

  /* ---------- TypeScript ---------------------------------------- */
  {
    files: ["**/*.{ts,tsx,mts,cts}"],
    languageOptions: { parser: tsParser },
    plugins: { "@typescript-eslint": tsPlugin },
    rules: tsPlugin.configs.recommended.rules,
  },

  /* ---------- React --------------------------------------------- */
  {
    plugins: { react: reactPlugin },
    settings: { react: { version: "detect" } },
    rules: reactPlugin.configs.flat.recommended.rules,
  },
]);
