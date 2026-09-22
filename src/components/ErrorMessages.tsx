import type { Errors } from "../api/types";

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
