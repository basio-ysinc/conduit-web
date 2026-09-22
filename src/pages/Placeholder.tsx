/** 未実装画面の仮表示。各チケットで本実装に置き換える。 */
export function Placeholder({ name }: { name: string }) {
  return (
    <div className="container page">
      <h1>{name}</h1>
      <p>Not implemented yet.</p>
    </div>
  );
}
