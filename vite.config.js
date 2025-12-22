import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],   // <--- WAJIB! pastikan ini benar-benar ada
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "src/tests/setupTests.jsx",
    include: ["src/**/*.{test,spec}.{js,jsx,ts,tsx}"],
    coverage: {
      provider: "istanbul",
      reporter: ["text", "html"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "src": path.resolve(__dirname, "./src"), // <--- tambah ini
    },
  },
});
