/** API の接続先。既定は同一オリジンの /api(vite の proxy 経由)。CORS を許可する API を直接叩く場合はビルド時の VITE_API_URL で絶対 URL に切り替える。 */
export const API_URL: string = import.meta.env.VITE_API_URL ?? "/api";
