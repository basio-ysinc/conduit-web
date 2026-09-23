import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api/client";
import type { Article } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { ArticleList } from "../components/ArticleList";

/** / と /tag/:tag。グローバルフィードと人気タグを表示する。 */
export function Home() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const feed = searchParams.get("feed") === "following" && user ? "following" : "global";
  const [articles, setArticles] = useState<Article[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const promise =
      feed === "following" && user
        ? api.getArticlesFeed({ limit: 50 })
        : api.getArticles({ limit: 50 });
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
  }, [feed, user]);

  useEffect(() => {
    api
      .getTags()
      .then(setTags)
      .catch(() => setTags([]));
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
            <ArticleList articles={articles} loading={loading} />
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
