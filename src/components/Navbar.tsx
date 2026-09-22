import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { avatarUrl } from "../avatar";

/** .navbar。ログイン状態で .nav-link を切り替える。 */
export function Navbar() {
  const { state, user } = useAuth();
  return (
    <nav className="navbar navbar-light">
      <div className="container">
        <Link className="navbar-brand" to="/">
          conduit
        </Link>
        <ul className="nav navbar-nav pull-xs-right">
          <li className="nav-item">
            <NavLink className="nav-link" to="/" end>
              Home
            </NavLink>
          </li>
          {state === "authenticated" && user ? (
            <>
              <li className="nav-item">
                <NavLink className="nav-link" to="/editor">
                  <i className="ion-compose" />
                  &nbsp;New Article
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink className="nav-link" to="/settings">
                  <i className="ion-gear-a" />
                  &nbsp;Settings
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink className="nav-link" to={`/profile/${user.username}`}>
                  <img className="user-pic" src={avatarUrl(user.image)} alt="" />
                  {user.username}
                </NavLink>
              </li>
            </>
          ) : state === "unauthenticated" ? (
            <>
              <li className="nav-item">
                <NavLink className="nav-link" to="/login">
                  Sign in
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink className="nav-link" to="/register">
                  Sign up
                </NavLink>
              </li>
            </>
          ) : null}
        </ul>
      </div>
    </nav>
  );
}
