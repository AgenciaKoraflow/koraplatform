import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      // Unused variables — prefix with _ to intentionally suppress
      "@typescript-eslint/no-unused-vars": ["warn", {
        vars: "all",
        args: "after-used",
        ignoreRestSiblings: true,
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_",
      }],
      // Prevent debug logs leaking to production (logger.ts is exempt via its own disable comment)
      "no-console": ["warn", { allow: ["error", "warn"] }],
    },
  },
  // Logger and CLI scripts may use console freely
  {
    files: [
      "src/lib/logger.ts",
      "src/lib/supabaseHealthCheck.ts",
      "src/api/healthCheck.ts",
      "src/scripts/**/*.ts",
    ],
    rules: {
      "no-console": "off",
    },
  },
  // Error boundaries need console.error for React's error reporting
  {
    files: ["src/components/error-boundary/**/*.tsx"],
    rules: {
      "no-console": "off",
    },
  },
);
