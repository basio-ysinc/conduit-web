import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// ブラウザは同一オリジンの /api を叩き、vite dev/preview が VITE_API_URL へプロキシする。
// conduit-api は CORS ヘッダを返さないため、ブラウザから直接叩くと preflight で失敗する。
const apiUrl = new URL(process.env.VITE_API_URL ?? "http://localhost:3000/api");
const apiPrefix = apiUrl.pathname.replace(/\/$/, "") || "/api";

const apiProxy = {
  "/api": {
    target: apiUrl.origin,
    changeOrigin: true,
    rewrite: (path: string) => path.replace(/^\/api/, apiPrefix),
  },
};

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: apiProxy },
  preview: { proxy: apiProxy },
  test: { include: ["test/**/*.test.ts", "src/**/*.test.ts"], exclude: ["e2e/**"] },
});
