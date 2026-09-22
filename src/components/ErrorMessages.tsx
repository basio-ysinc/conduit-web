import { ApiError } from "../api/client";
import type { Errors } from "../api/types";

/**
 * 捕捉したエラーを GenericErrorModel の形に正規化する。
 * ApiError はその errors をそのまま使い、ネットワーク断等の非 HTTP エラーは
 * 接続エラーの定型文にする。レスポンスに errors が無い場合も表示できるよう
 * フォールバックを入れる。
 */
export function toErrors(err: unknown): Errors {
  if (err instanceof ApiError) {
    if (Object.keys(err.errors).length > 0) return err.errors;
    return { error: [`Request failed with status ${err.status}`] };
  }
  return {
    error: ["Unable to connect to the server. Please check your connection and try again."],
  };
}

/** API のエラー(GenericErrorModel)を .error-messages に項目ごとに表示する。 */
export function ErrorMessages({ errors }: { errors: Errors | null | undefined }) {
  if (!errors) return null;
  const items = Object.entries(errors).flatMap(([field, messages]) =>
    messages.map((message) => `${field} ${message}`),
  );
  if (items.length === 0) return null;
  return (
    <ul className="error-messages">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
