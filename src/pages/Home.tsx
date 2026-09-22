import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import * as api from "../api/client";
import type { Article } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { ArticleList } from "../components/ArticleList";

export function Home() {
  const { user, token } = useAuth();
  const [searchParams] = useSearchParams();
  const feed = searchParams.get("feed") === "following" && user ? "following" : "global";
  const [articles, setArticles] = useState<Article[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const promise =
      feed === "following" && token
        ? api.getFeed(token, { limit: 50 })
        : api.listArticles({ limit: 50 }, token ?? undefined);
    promise
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
  }, [feed, token]);

  useEffect(() => {
    api
      .getTags()
      .then((res) => setTags(res.tags))
      .catch(() => setTags([]));
  }, []);

  const onArticleChange = useCallback((updated: Article) => {
    setArticles((prev) => prev.map((a) => (a.slug === updated.slug ? updated : a)));
  }, []);

  return (
    <div className="home-page">
      <div className="banner">
        <div className="container">
          <h1 className="logo-font">conduit</h1>
          <p>A place to share your knowledge.</p>
        </div>
      </div>
      <div className="container page">
        <div className="row">
          <div className="col-md-9">
            <div className="feed-toggle">
              <ul className="nav nav-pills outline-active">
                {user && (
                  <li className="nav-item">
                    <Link
                      className={`nav-link${feed === "following" ? " active" : ""}`}
                      to="/?feed=following"
                    >
                      Your Feed
                    </Link>
                  </li>
                )}
                <li className="nav-item">
                  <Link className={`nav-link${feed === "global" ? " active" : ""}`} to="/">
                    Global Feed
                  </Link>
                </li>
              </ul>
            </div>
            <ArticleList articles={articles} loading={loading} onChange={onArticleChange} />
          </div>
          <div className="col-md-3">
            <div className="sidebar">
              <p>Popular Tags</p>
              <div className="tag-list">
                {tags.map((tag) => (
                  <Link key={tag} className="tag-pill tag-default" to={`/tag/${tag}`}>
                    {tag}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
