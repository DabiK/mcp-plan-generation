import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import path from "node:path";

export default defineConfig({
  plugins: [viteSingleFile()],
  build: {
    outDir: path.resolve(__dirname, "../../dist/apps/plan-review"),
    emptyOutDir: true,
    cssCodeSplit: false,
    rollupOptions: {
      input: process.env.INPUT,
    },
  },
});
