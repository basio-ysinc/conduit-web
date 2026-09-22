/** API エラーの一覧表示。SELECTORS.md の .error-messages 契約。 */
export function ErrorMessages({ errors }: { errors: string[] }) {
  if (errors.length === 0) return null;
  return (
    <ul className="error-messages">
      {errors.map((e) => (
        <li key={e}>{e}</li>
      ))}
    </ul>
  );
}
