import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ApiError, api } from "../api/client";
import type { Errors, Profile as ProfileModel } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { ErrorMessages } from "../components/ErrorMessages";
import { DEFAULT_AVATAR } from "../components/Navbar";

/**
 * /profile/:username。ユーザー情報(.user-info)の表示。
 * 記事一覧・follow などの本実装は別チケットのスコープ。
 */
export function Profile() {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileModel | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [errors, setErrors] = useState<Errors | null>(null);

  useEffect(() => {
    if (!username) return;
    let cancelled = false;
    setProfile(null);
    setNotFound(false);
    setErrors(null);
    api
      .getProfile(username)
      .then((p) => {
        if (!cancelled) setProfile(p);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) {
          setNotFound(true);
        } else {
          setErrors(
            err instanceof ApiError ? err.errors : { body: ["An unexpected error occurred"] },
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [username]);

  return (
    <div className="profile-page">
      <div className="user-info">
        <div className="container">
          <div className="row">
            <div className="col-xs-12 col-md-10 offset-md-1">
              <ErrorMessages errors={errors} />
              {notFound && <p>Profile not found.</p>}
              {profile && (
                <>
                  <img className="user-img" src={profile.image || DEFAULT_AVATAR} alt="" />
                  <h4>{profile.username}</h4>
                  <p>{profile.bio}</p>
                  {user?.username === profile.username && (
                    <Link className="btn btn-sm btn-outline-secondary action-btn" to="/settings">
                      <i className="ion-gear-a" /> Edit Profile Settings
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
