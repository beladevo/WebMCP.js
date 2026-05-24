import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    outDir: resolve(__dirname, "../../dist"),
    emptyOutDir: true
  },
  resolve: {
    alias: {
      "@webmcp-js/core": resolve(__dirname, "../../packages/core/src/index.ts")
    }
  }
});
