// @ts-check

import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ["eslint.config.js", "test/**/*", "*.config.ts"],
    ...tseslint.configs.disableTypeChecked,
  },
  {
    ignores: ["coverage", "dist"],
  },
];
