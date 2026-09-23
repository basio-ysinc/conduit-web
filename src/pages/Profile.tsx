import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { ApiError, api } from "../api/client";
import type { Article, Errors, Profile as ProfileType } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { ArticleList } from "../components/ArticleList";
import { ErrorMessages } from "../components/ErrorMessages";
import { FollowButton } from "../components/FollowButton";
import { DEFAULT_AVATAR } from "../components/Navbar";

export function Profile() {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const location = useLocation();
  const favorited = location.pathname.endsWith("/favorites");
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    if (!username) return;
    let cancelled = false;
    setLoading(true);
    api
      .getArticles(favorited ? { favorited: username, limit: 50 } : { author: username, limit: 50 })
      .then((res) => {
        if (!cancelled) setArticles(res.articles);
      })
      .catch(() => {
        if (!cancelled) setArticles([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [username, favorited]);

  const isOwn = profile != null && user?.username === profile.username;

  const onArticleChange = useCallback(
    (updated: Article) => {
      setArticles((prev) =>
        favorited && isOwn && !updated.favorited
          ? prev.filter((a) => a.slug !== updated.slug)
          : prev.map((a) => (a.slug === updated.slug ? updated : a)),
      );
    },
    [favorited, isOwn],
  );

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
                  <img
                    className="user-img"
                    src={profile.image || DEFAULT_AVATAR}
                    alt={profile.username}
                  />
                  <h4>{profile.username}</h4>
                  <p>{profile.bio}</p>
                  {isOwn ? (
                    <Link className="btn btn-sm btn-outline-secondary action-btn" to="/settings">
                      <i className="ion-gear-a" /> Edit Profile Settings
                    </Link>
                  ) : (
                    <FollowButton profile={profile} onChange={setProfile} />
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="container">
        <div className="row">
          <div className="col-xs-12 col-md-10 offset-md-1">
            <div className="articles-toggle">
              <ul className="nav nav-pills outline-active">
                <li className="nav-item">
                  <Link
                    className={`nav-link${favorited ? "" : " active"}`}
                    to={`/profile/${username}`}
                  >
                    My Articles
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    className={`nav-link${favorited ? " active" : ""}`}
                    to={`/profile/${username}/favorites`}
                  >
                    Favorited
                  </Link>
                </li>
              </ul>
            </div>
            <ArticleList articles={articles} loading={loading} onChange={onArticleChange} />
          </div>
        </div>
      </div>
    </div>
  );
}
