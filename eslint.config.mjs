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
    // Vendored/minified third-party scripts (ej. el worker de pdfjs-dist
    // copiado a public/ para el Revisor de Reporte de Crédito) — no son
    // código propio y lintearlos solo genera ruido (1600+ warnings de un
    // solo archivo minificado).
    "public/**/*.min.js",
    "public/**/*.min.mjs",
  ]),
]);

export default eslintConfig;
