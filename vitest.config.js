import { defineConfig } from 'vitest/config';
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: 'src/tests/setupTests.jsx', 
    include: ['src/**/*.{test,spec}.{js,jsx,ts,tsx}'], // Ini pattern semua folder
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'html'],
    },
      alias: {
      "@": path.resolve(__dirname, "./src"), // ⬅️ penting untuk Vitest
    },
  },
});