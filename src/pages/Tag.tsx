import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client";
import type { Article } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { ArticleList } from "../components/ArticleList";

export function Tag() {
  const { tag } = useParams<{ tag: string }>();
  const { user } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tag) return;
    let cancelled = false;
    setLoading(true);
    api
      .getArticles({ tag, limit: 50 })
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
  }, [tag]);

  const onArticleChange = useCallback((updated: Article) => {
    setArticles((prev) => prev.map((a) => (a.slug === updated.slug ? updated : a)));
  }, []);

  return (
    <div className="home-page">
      <div className="container page">
        <div className="row">
          <div className="col-md-9">
            <div className="feed-toggle">
              <ul className="nav nav-pills outline-active">
                {user && (
                  <li className="nav-item">
                    <Link className="nav-link" to="/?feed=following">
                      Your Feed
                    </Link>
                  </li>
                )}
                <li className="nav-item">
                  <Link className="nav-link" to="/">
                    Global Feed
                  </Link>
                </li>
                <li className="nav-item">
                  <span className="nav-link active">
                    <i className="ion-pound" /> {tag}
                  </span>
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
