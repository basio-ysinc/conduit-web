import { Route, Routes, useParams } from "react-router-dom";
import { useAuth } from "./auth/AuthContext";
import { Navbar } from "./components/Navbar";
import { RequireAuth } from "./components/RequireAuth";
import { Article } from "./pages/Article";
import { Editor } from "./pages/Editor";
import { Home } from "./pages/Home";
import { Login } from "./pages/Login";
import { NotFound } from "./pages/NotFound";
import { Profile } from "./pages/Profile";
import { Register } from "./pages/Register";
import { Settings } from "./pages/Settings";

/**
 * slug ごとに Editor を別インスタンスにする。
 * /editor/:slug から /editor への遷移では同じ位置に同じ要素が描かれて
 * アンマウントされないため、key で切り替えてフォームを初期化する。
 */
function EditorPage() {
  const { slug } = useParams<{ slug: string }>();
  return <Editor key={slug ?? "new"} />;
}

/**
 * ルート定義。画面は src/pages/ に置く。
 * サーバ一時障害(unavailable)時は "Connecting" インジケータを常時出す。
 */
export function App() {
  const { state } = useAuth();
  return (
    <>
      <Navbar />
      {state === "unavailable" && (
        <div className="container">
          <p className="text-xs-center">
            Connecting to the server...{" "}
            <button
              type="button"
              className="btn btn-sm btn-outline-primary"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </p>
        </div>
      )}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tag/:tag" element={<Home />} />
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
              <EditorPage />
            </RequireAuth>
          }
        />
        <Route
          path="/editor/:slug"
          element={
            <RequireAuth>
              <EditorPage />
            </RequireAuth>
          }
        />
        <Route path="/article/:slug" element={<Article />} />
        <Route path="/profile/:username" element={<Profile />} />
        <Route path="/profile/:username/favorites" element={<Profile />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
