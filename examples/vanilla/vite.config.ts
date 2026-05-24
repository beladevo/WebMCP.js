import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
  resolve: {
    alias: {
      "@webmcp-js/core": resolve(__dirname, "../../packages/core/src/index.ts")
    }
  }
});
 