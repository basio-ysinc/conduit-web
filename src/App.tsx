import { Route, Routes } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { RequireAuth } from "./components/RequireAuth";
import { Article } from "./pages/Article";
import { Editor } from "./pages/Editor";
import { Home } from "./pages/Home";
import { Login } from "./pages/Login";
import { Placeholder } from "./pages/Placeholder";
import { Register } from "./pages/Register";
import { Settings } from "./pages/Settings";

/** ルート定義。各画面は src/pages/ に置き、ここで差し替える。 */
export function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tag/:tag" element={<Placeholder name="Home" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/settings"
          element={
            <RequireAuth>
              <Settings />
            </RequireAuth>
          }
        />
        <Route
          path="/editor"
          element={
            <RequireAuth>
              <Editor />
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
        <Route path="/article/:slug" element={<Article />} />
        <Route path="/profile/:username" element={<Placeholder name="Profile" />} />
        <Route path="/profile/:username/favorites" element={<Placeholder name="Profile" />} />
        <Route path="*" element={<Placeholder name="Not found" />} />
      </Routes>
    </>
  );
}
