import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { errorMessages } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { ErrorMessages } from "../components/ErrorMessages";

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    setErrors([]);
    try {
      await register(
        String(fd.get("username") ?? ""),
        String(fd.get("email") ?? ""),
        String(fd.get("password") ?? ""),
      );
      navigate("/");
    } catch (err) {
      setErrors(errorMessages(err));
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="container page">
        <div className="row">
          <div className="col-md-6 offset-md-3 col-xs-12">
            <h1 className="text-xs-center">Sign up</h1>
            <p className="text-xs-center">
              <Link to="/login">Have an account?</Link>
            </p>
            <ErrorMessages errors={errors} />
            <form onSubmit={onSubmit}>
              <fieldset className="form-group">
                <input
                  name="username"
                  type="text"
                  className="form-control form-control-lg"
                  placeholder="Username"
                  required
                />
              </fieldset>
              <fieldset className="form-group">
                <input
                  name="email"
                  type="email"
                  className="form-control form-control-lg"
                  placeholder="Email"
                  required
                />
              </fieldset>
              <fieldset className="form-group">
                <input
                  name="password"
                  type="password"
                  className="form-control form-control-lg"
                  placeholder="Password"
                  required
                />
              </fieldset>
              <button
                type="submit"
                className="btn btn-lg btn-primary pull-xs-right"
                disabled={busy}
              >
                Sign up
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
