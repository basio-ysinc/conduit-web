import { Link, Route, Routes } from "react-router-dom";
import { Placeholder } from "./pages/Placeholder";

/** ルート定義。各画面は src/pages/ に置き、ここで差し替える。 */
export function App() {
  return (
    <>
      <nav className="navbar navbar-light">
        <div className="container">
          <Link className="navbar-brand" to="/">
            conduit
          </Link>
          <ul className="nav navbar-nav pull-xs-right">
            <li className="nav-item">
              <Link className="nav-link" to="/">
                Home
              </Link>
            </li>
          </ul>
        </div>
      </nav>
      <Routes>
        <Route path="/" element={<Placeholder name="Home" />} />
        <Route path="/login" element={<Placeholder name="Sign in" />} />
        <Route path="/register" element={<Placeholder name="Sign up" />} />
        <Route path="/settings" element={<Placeholder name="Settings" />} />
        <Route path="/editor" element={<Placeholder name="Editor" />} />
        <Route path="/editor/:slug" element={<Placeholder name="Editor" />} />
        <Route path="/article/:slug" element={<Placeholder name="Article" />} />
        <Route path="/profile/:username" element={<Placeholder name="Profile" />} />
        <Route path="/profile/:username/favorites" element={<Placeholder name="Profile" />} />
        <Route path="*" element={<Placeholder name="Not found" />} />
      </Routes>
    </>
  );
}
