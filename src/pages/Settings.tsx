import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

/** /settings。ログアウトのみ先行実装(設定フォーム本体は別チケット)。 */
export function Settings() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="settings-page">
      <div className="container page">
        <div className="row">
          <div className="col-md-6 offset-md-3 col-xs-12">
            <h1 className="text-xs-center">Your Settings</h1>
            <hr />
            <button
              className="btn btn-outline-danger"
              type="button"
              onClick={() => {
                signOut();
                navigate("/");
              }}
            >
              Or click here to logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
