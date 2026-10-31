import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/auth": "http://localhost:5000",
      "/users": "http://localhost:5000",
      "/usage": "http://localhost:5000",
      "/nlac": "http://localhost:5000",
      "/payments": "http://localhost:5000",
      "/api-docs": "http://localhost:5000",
      "/api-docs.json": "http://localhost:5000"
    }
  }
});
