import { defineConfig } from "@playwright/test";
import { baseConfig } from "./e2e/playwright.base";

// run-e2e.sh が空きポートを PREVIEW_PORT に入れる。既存の preview を使い回すと
// 別の API に proxy された古いサーバに当たるので、常に自分で起動する。
const port = process.env.PREVIEW_PORT ?? "4173";

export default defineConfig({
  ...baseConfig,
  use: { ...baseConfig.use, baseURL: `http://localhost:${port}` },
  webServer: {
    command: `pnpm preview --port ${port}`,
    url: `http://localhost:${port}`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
