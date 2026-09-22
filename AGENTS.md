# conduit-web

RealWorld(Conduit)のフロントエンド(Vite + React + react-router)。契約は conduit-spec の `api/openapi.yml` と `e2e/SELECTORS.md`(取り込み済み: `e2e/`)。

## 構成

- `src/App.tsx`: ルート定義。画面は `src/pages/<Name>.tsx` に置き、`Placeholder` を差し替える
- `src/api/`: API クライアント(`config.ts` の `API_URL` を使う。`fetch` を直接各画面に書かない)
- `src/components/`: 共通コンポーネント(エラー表示 `.error-messages` など)
- `public/theme.css`: 公式テーマ。変更しない
- `e2e/`: 公式 E2E テスト(Playwright)。改変しない。`e2e/enabled.txt` に列挙した spec が `pnpm verify` で回る

## ルール

- `e2e/SELECTORS.md` のクラス名・`name` 属性・ボタン文言を厳守する(テストはこれで要素を探す)
- チケットで対応した spec ファイルは `e2e/enabled.txt` に追加する。追加した spec が通ることが完了条件
- E2E は conduit-api を起動して回る。conduit-api の checkout は `CONDUIT_API_DIR`、無ければ orca-loop が verify に渡す `ORCA_LOOP_RELATED_API`、それも無ければ `../conduit-api` の順で探す(worker の spec に書かれている related のパスを `CONDUIT_API_DIR` に指定すればよい)。`TEST_MODE=fullstack` で動かす(外部 API とシードユーザーを前提にしない)
- `pnpm verify`(typecheck / lint / vitest / e2e)が緑であること。個別に回すなら `pnpm test:e2e auth.spec.ts`
- 依存の追加は最小限に(状態管理ライブラリは入れない。React の context と hooks で足りる)

## コマンド

```
pnpm install
pnpm exec playwright install chromium   # 初回のみ
pnpm dev                                # http://localhost:5173(VITE_API_URL で API を切り替え)
pnpm test
pnpm test:e2e [file.spec.ts ...]
pnpm verify
```
