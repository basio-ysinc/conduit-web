import { Route, Routes } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { RequireAuth } from "./components/RequireAuth";
import { Editor } from "./pages/Editor";
import { Home } from "./pages/Home";
import { Login } from "./pages/Login";
import { Placeholder } from "./pages/Placeholder";
import { Profile } from "./pages/Profile";
import { Register } from "./pages/Register";

/** ルート定義。各画面は src/pages/ に置き、ここで差し替える。 */
export function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tag/:tag" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
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
              <Editor />
            </RequireAuth>
          }
        />
        <Route
          path="/editor/:slug"
          element={
            <RequireAuth>
              <Editor />
            </RequireAuth>
          }
        />
        <Route path="/article/:slug" element={<Placeholder name="Article" />} />
        <Route path="/profile/:username" element={<Profile />} />
        <Route path="/profile/:username/favorites" element={<Profile />} />
        <Route path="*" element={<Placeholder name="Not found" />} />
      </Routes>
    </>
  );
}
