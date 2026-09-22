/** API の接続先。ブラウザは同一オリジンの `/api` を叩き、vite dev/preview のプロキシが
 *  VITE_API_URL(既定はローカルの conduit-api)へ転送する(vite.config.ts 参照)。
 *  conduit-api は CORS を返さないため、ブラウザから直接 fetch すると失敗する。 */
export const API_URL = "/api";
