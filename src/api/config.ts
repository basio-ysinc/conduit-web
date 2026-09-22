/** API の接続先。ビルド時の VITE_API_URL で切り替える(既定はローカルの conduit-api)。 */
export const API_URL: string = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";
