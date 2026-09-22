import { Route, Routes } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { RequireAuth } from "./components/RequireAuth";
import { Placeholder } from "./pages/Placeholder";

/** ルート定義。各画面は src/pages/ に置き、ここで差し替える。 */
export function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Placeholder name="Home" />} />
        <Route path="/tag/:tag" element={<Placeholder name="Home" />} />
        <Route path="/login" element={<Placeholder name="Sign in" />} />
        <Route path="/register" element={<Placeholder name="Sign up" />} />
        <Route
          path="/settings"
          element={
            <RequireAuth>
              <Placeholder name="Settings" />
            </RequireAuth>
          }
        />
        <Route
          path="/editor"
          element={
            <RequireAuth>
              <Placeholder name="Editor" />
            </RequireAuth>
          }
        />
        <Route
          path="/editor/:slug"
          element={
            <RequireAuth>
              <Placeholder name="Editor" />
            </RequireAuth>
          }
        />
        <Route path="/article/:slug" element={<Placeholder name="Article" />} />
        <Route path="/profile/:username" element={<Placeholder name="Profile" />} />
        <Route path="/profile/:username/favorites" element={<Placeholder name="Profile" />} />
        <Route path="*" element={<Placeholder name="Not found" />} />
      </Routes>
    </>
  );
}
