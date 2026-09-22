import { ApiError } from "../api/client";

/**
 * エラーを .error-messages の <li> 文字列配列に正規化する。
 * ApiError はフィールド名つきの各メッセージ、それ以外(ネットワーク断等)は
 * 接続エラーの定型文を返す。
 */
export function errorToMessages(err: unknown): string[] {
  if (err instanceof ApiError) {
    const items = Object.entries(err.errors).flatMap(([field, messages]) =>
      messages.map((message) => (field ? `${field} ${message}` : message)),
    );
    if (items.length > 0) return items;
    return [`Request failed with status ${err.status}`];
  }
  return ["Unable to connect to the server. Please check your connection and try again."];
}

/** エラーメッセージ一覧。.error-messages(<ul>)で描画する。 */
export function ErrorMessages({ messages }: { messages: string[] | null | undefined }) {
  if (!messages || messages.length === 0) return null;
  return (
    <ul className="error-messages">
      {messages.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
