/**
 * API の接続先。ブラウザは同一オリジンの `/api` を叩き、vite dev/preview の
 * プロキシが VITE_API_URL(既定はローカルの conduit-api)へ転送する
 * (vite.config.ts 参照)。conduit-api は CORS を返さないため、ブラウザから
 * 別ポートへ直接 fetch すると preflight で失敗する。
 */
export const API_URL = "/api";
