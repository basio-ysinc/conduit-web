import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import type { Errors } from "../api/types";
import type { UpdateUser } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { ErrorMessages, toErrors } from "../components/ErrorMessages";

/**
 * /settings。現在ユーザーの設定を更新する。
 * null になりうる bio/image は空文字としてフォームに出す("null" と表示しない)。
 */
export function Settings() {
  const { user, setUser, signOut } = useAuth();
  const navigate = useNavigate();
  const [image, setImage] = useState(user?.image ?? "");
  const [username, setUsername] = useState(user?.username ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Errors | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErrors(null);
    const patch: UpdateUser = { image, username, bio, email };
    if (password) patch.password = password;
    try {
      const updated = await api.updateCurrentUser(patch);
      setUser(updated);
      navigate(`/profile/${updated.username}`);
    } catch (err) {
      setErrors(toErrors(err));
      setBusy(false);
    }
  };

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
              <fieldset>
                <fieldset className="form-group">
                  <input
                    className="form-control"
                    type="text"
                    name="image"
                    placeholder="URL of profile picture"
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                  />
                </fieldset>
                <fieldset className="form-group">
                  <input
                    className="form-control form-control-lg"
                    type="text"
                    name="username"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </fieldset>
                <fieldset className="form-group">
                  <textarea
                    className="form-control form-control-lg"
                    name="bio"
                    rows={8}
                    placeholder="Short bio about you"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                  />
                </fieldset>
                <fieldset className="form-group">
                  <input
                    className="form-control form-control-lg"
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </fieldset>
                <fieldset className="form-group">
                  <input
                    className="form-control form-control-lg"
                    type="password"
                    name="password"
                    placeholder="New Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </fieldset>
                <button
                  className="btn btn-lg btn-primary pull-xs-right"
                  type="submit"
                  disabled={busy}
                >
                  Update Settings
                </button>
              </fieldset>
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
