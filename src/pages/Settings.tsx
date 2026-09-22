import { type FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as api from "../api/client";
import { errorMessages } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { ErrorMessages } from "../components/ErrorMessages";

export function Settings() {
  const { user, token, status, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const [image, setImage] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") navigate("/login");
  }, [status, navigate]);

  useEffect(() => {
    if (!user) return;
    setImage(user.image ?? "");
    setUsername(user.username);
    setBio(user.bio ?? "");
    setEmail(user.email);
  }, [user]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setBusy(true);
    setErrors([]);
    try {
      const res = await api.updateUser(token, {
        image,
        username,
        bio,
        email,
        ...(password ? { password } : {}),
      });
      setUser(res.user);
      navigate(`/profile/${res.user.username}`);
    } catch (err) {
      setErrors(errorMessages(err));
      setBusy(false);
    }
  }

  function onLogout() {
    logout();
    navigate("/");
  }

  if (!user) return null;

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
                    name="image"
                    type="text"
                    className="form-control"
                    placeholder="URL of profile picture"
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                  />
                </fieldset>
                <fieldset className="form-group">
                  <input
                    name="username"
                    type="text"
                    className="form-control form-control-lg"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </fieldset>
                <fieldset className="form-group">
                  <textarea
                    name="bio"
                    className="form-control form-control-lg"
                    rows={8}
                    placeholder="Short bio about you"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                  />
                </fieldset>
                <fieldset className="form-group">
                  <input
                    name="email"
                    type="email"
                    className="form-control form-control-lg"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </fieldset>
                <fieldset className="form-group">
                  <input
                    name="password"
                    type="password"
                    className="form-control form-control-lg"
                    placeholder="New Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </fieldset>
                <button
                  type="submit"
                  className="btn btn-lg btn-primary pull-xs-right"
                  disabled={busy}
                >
                  Update Settings
                </button>
              </fieldset>
            </form>
            <hr />
            <button type="button" className="btn btn-outline-danger" onClick={onLogout}>
              Or click here to logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
