import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useParams, useSearchParams } from "react-router-dom";
import { ApiError, api } from "../api/client";
import type { Article, Errors, Profile as ProfileModel } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { ARTICLES_PER_PAGE, ArticleList, Pagination } from "../components/ArticleList";
import { ErrorMessages, toErrors } from "../components/ErrorMessages";
import { DEFAULT_AVATAR } from "../components/Navbar";

/**
 * /profile/:username と /profile/:username/favorites。
 * My Articles / Favorited Articles タブで記事一覧を切り替える。
 * フォローボタンは別チケット(W6)のスコープ。
 */
export function Profile() {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const { pathname } = useLocation();
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const isFavorites = pathname.endsWith("/favorites");

  const [profile, setProfile] = useState<ProfileModel | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [profileErrors, setProfileErrors] = useState<Errors | null>(null);
  const [articles, setArticles] = useState<Article[] | null>(null);
  const [articlesCount, setArticlesCount] = useState(0);
  const [listLoading, setListLoading] = useState(true);
  const [listErrors, setListErrors] = useState<Errors | null>(null);

  useEffect(() => {
    if (!username) return;
    let cancelled = false;
    setProfile(null);
    setNotFound(false);
    setProfileErrors(null);
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
          setProfileErrors(toErrors(err));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [username]);

  useEffect(() => {
    if (!username) return;
    let cancelled = false;
    setListLoading(true);
    setListErrors(null);
    const offset = (page - 1) * ARTICLES_PER_PAGE;
    const params = isFavorites
      ? { favorited: username, limit: ARTICLES_PER_PAGE, offset }
      : { author: username, limit: ARTICLES_PER_PAGE, offset };
    api
      .getArticles(params)
      .then((res) => {
        if (cancelled) return;
        setArticles(res.articles);
        setArticlesCount(res.articlesCount);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setArticles([]);
        setListErrors(toErrors(err));
      })
      .finally(() => {
        if (!cancelled) setListLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [username, isFavorites, page]);

  const isOwn = user !== null && profile !== null && user.username === profile.username;
  const basePath = isFavorites ? `/profile/${username}/favorites` : `/profile/${username}`;

  return (
    <div className="profile-page">
      <div className="user-info">
        <div className="container">
          <div className="row">
            <div className="col-xs-12 col-md-10 offset-md-1">
              {notFound ? (
                <p>Profile not found.</p>
              ) : profileErrors && !profile ? (
                <ErrorMessages errors={profileErrors} />
              ) : !profile ? (
                <p>Loading profile...</p>
              ) : (
                <>
                  <img className="user-img" src={profile.image || DEFAULT_AVATAR} alt="" />
                  <h4>{profile.username}</h4>
                  <p>{profile.bio ?? ""}</p>
                  {isOwn && (
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

      {!notFound && !profileErrors && (
        <div className="container">
          <div className="row">
            <div className="col-xs-12 col-md-10 offset-md-1">
              <div className="articles-toggle">
                <ul className="nav nav-pills outline-active">
                  <li className="nav-item">
                    <NavLink className="nav-link" to={`/profile/${username}`} end>
                      My Articles
                    </NavLink>
                  </li>
                  <li className="nav-item">
                    <NavLink className="nav-link" to={`/profile/${username}/favorites`}>
                      Favorited Articles
                    </NavLink>
                  </li>
                </ul>
              </div>
              <ArticleList
                articles={articles}
                loading={listLoading}
                error={listErrors}
                onArticleChange={(updated) =>
                  setArticles((prev) =>
                    prev ? prev.map((a) => (a.slug === updated.slug ? updated : a)) : prev,
                  )
                }
                emptyMessage="No articles are here... yet."
              />
              <Pagination total={articlesCount} page={page} basePath={basePath} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
