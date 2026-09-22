import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  // e2e では run-e2e.sh が VITE_API_URL=/api でビルドするため、ブラウザの API 呼び出しは
  // preview サーバの同一オリジンに向く。ここで conduit-api にプロキシして CORS を回避する。
  preview: {
    proxy: {
      "/api": {
        target: process.env.API_PROXY_TARGET ?? "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
  test: {
    include: ["test/**/*.test.{ts,tsx}", "src/**/*.test.{ts,tsx}"],
    exclude: ["e2e/**"],
  },
});
