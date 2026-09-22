import { defineConfig } from "@playwright/test";
import { baseConfig } from "./e2e/playwright.base";

// WEB_PORT で preview のポートを変えられる(ローカルで他の worktree と e2e が衝突するのを避ける)。
const webPort = Number(process.env.WEB_PORT ?? 4173);

export default defineConfig({
  ...baseConfig,
  use: { ...baseConfig.use, baseURL: `http://localhost:${webPort}` },
  webServer: {
    command: "pnpm preview",
    url: `http://localhost:${webPort}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
