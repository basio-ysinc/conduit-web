import { defineConfig } from "@playwright/test";
import { baseConfig } from "./e2e/playwright.base";

export default defineConfig({
  ...baseConfig,
  use: { ...baseConfig.use, baseURL: "http://localhost:4173" },
  webServer: {
    command: "pnpm preview",
    url: "http://localhost:4173",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
