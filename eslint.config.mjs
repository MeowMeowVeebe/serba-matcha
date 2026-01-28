import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",


    // Project ignores:
    "coverage/**",
    "node_modules/**",

    // Ignore admin/demo + scripts to keep CI/dev focused on core app pages.
    "app/admin/**",
    "app/api/admin/**",
    "app/components-demo/**",
    "app/feature-spotlight/**",
    "app/features-demo/**",
    "scripts/**",
    "public/sw.js",
    "types/**",

  ]),
]);

export default eslintConfig;
