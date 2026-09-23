import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";
import { AuthProvider } from "./auth/AuthContext";

const root = document.getElementById("root");
if (!root) throw new Error("#root not found");
createRoot(root).render(
  <StrictMode>
    {/* useTransitions=false: 遷移を transition レーンで遅延させず即時コミットする。
        デフォルト(startTransition)では遷移コミットが他の更新に割り込まれて
        飢餓し、最大5秒遅れるケースがあった */}
    <BrowserRouter useTransitions={false}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
