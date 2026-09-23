import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import type { Errors, UpdateUser } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { ErrorMessages, toErrors } from "../components/ErrorMessages";

/**
 * /settings。プロフィール設定の更新(PUT /user)とログアウト。
 * null になりうる bio/image は空文字としてフォームに出す("null" と表示しない)。
 */
export function Settings() {
  const { user, setUser, signOut } = useAuth();
  const navigate = useNavigate();
  const [errors, setErrors] = useState<Errors | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!user) return null;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setErrors(null);
    setSubmitting(true);
    // password は空のまま送ると 422 になるので、入力されたときだけ更新対象に含める
    const update: UpdateUser = {
      image: String(data.get("image") ?? ""),
      username: String(data.get("username") ?? ""),
      bio: String(data.get("bio") ?? ""),
      email: String(data.get("email") ?? ""),
    };
    const password = String(data.get("password") ?? "");
    if (password) update.password = password;
    try {
      const updated = await api.updateCurrentUser(update);
      setUser(updated);
      navigate(`/profile/${updated.username}`);
    } catch (err) {
      setErrors(toErrors(err));
    } finally {
      setSubmitting(false);
    }
  }

  const logout = () => {
    signOut();
    navigate("/");
  };

  return (
    <div className="settings-page">
      <div className="container page">
        <div className="row">
          <div className="col-md-6 offset-md-3 col-xs-12">
            <h1 className="text-xs-center">Your Settings</h1>
            <ErrorMessages errors={errors} />
            <form onSubmit={onSubmit}>
              <fieldset className="form-group">
                <input
                  className="form-control"
                  type="text"
                  name="image"
                  placeholder="URL of profile picture"
                  defaultValue={user.image ?? ""}
                />
              </fieldset>
              <fieldset className="form-group">
                <input
                  className="form-control form-control-lg"
                  type="text"
                  name="username"
                  placeholder="Username"
                  defaultValue={user.username}
                />
              </fieldset>
              <fieldset className="form-group">
                <textarea
                  className="form-control form-control-lg"
                  rows={8}
                  name="bio"
                  placeholder="Short bio about you"
                  defaultValue={user.bio ?? ""}
                />
              </fieldset>
              <fieldset className="form-group">
                <input
                  className="form-control form-control-lg"
                  type="email"
                  name="email"
                  placeholder="Email"
                  defaultValue={user.email}
                />
              </fieldset>
              <fieldset className="form-group">
                <input
                  className="form-control form-control-lg"
                  type="password"
                  name="password"
                  placeholder="New Password"
                />
              </fieldset>
              <button
                className="btn btn-lg btn-primary pull-xs-right"
                type="submit"
                disabled={submitting}
              >
                Update Settings
              </button>
            </form>
            <hr />
            <button className="btn btn-outline-danger" type="button" onClick={logout}>
              Or click here to logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
