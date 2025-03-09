import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "https://localhost:5001", // Your .NET server URL + port
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
