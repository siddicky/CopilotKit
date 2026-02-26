import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    vue(),
    react({
      // Only apply React transform to .tsx/.jsx files to avoid
      // conflicting with Vue SFC compilation
      include: /\.(tsx|jsx)$/,
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      "/api/copilotkit": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
});
