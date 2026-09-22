import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// conduit-api は CORS ヘッダを返さないため、ブラウザは同一オリジンの /api に投げ、
// dev / preview サーバが API_PROXY_TARGET にプロキシする。
const proxy = { "/api": process.env.API_PROXY_TARGET ?? "http://localhost:3000" };

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy },
  preview: { proxy },
  test: {
    include: ["test/**/*.test.{ts,tsx}", "src/**/*.test.{ts,tsx}"],
    exclude: ["e2e/**"],
  },
});
