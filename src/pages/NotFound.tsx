import { Link } from "react-router-dom";

/** 未定義ルートの 404 相当画面。 */
export function NotFound() {
  return (
    <div className="container page">
      <h1>404 Not Found</h1>
      <p>The page you are looking for does not exist.</p>
      <Link to="/">Go to home</Link>
    </div>
  );
}
