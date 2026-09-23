import { useEffect, useState } from "react";
import { Link, Navigate, useParams, useSearchParams } from "react-router-dom";
import { api } from "../api/client";
import type { Article, Errors } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { ARTICLES_PER_PAGE, ArticleList, Pagination } from "../components/ArticleList";
import { toErrors } from "../components/ErrorMessages";

/**
 * / と /tag/:tag。Global Feed / Your Feed / タグ絞り込みを表示する。
 * ?feed=following はログイン必須で、未ログインなら /login へリダイレクトする。
 * ページ送りは ?page=N(1 ページ 10 件)。
 */
export function Home() {
  const { state } = useAuth();
  const { tag } = useParams<{ tag: string }>();
  const [searchParams] = useSearchParams();
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const isYourFeed = !tag && searchParams.get("feed") === "following";

  const [articles, setArticles] = useState<Article[] | null>(null);
  const [articlesCount, setArticlesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Errors | null>(null);
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    // Your Feed は認証状態が確定するまで取得しない(未ログインはリダイレクト)
    if (isYourFeed && state !== "authenticated") return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    const offset = (page - 1) * ARTICLES_PER_PAGE;
    const promise = isYourFeed
      ? api.getArticlesFeed({ limit: ARTICLES_PER_PAGE, offset })
      : api.getArticles({ tag, limit: ARTICLES_PER_PAGE, offset });
    promise
      .then((res) => {
        if (cancelled) return;
        setArticles(res.articles);
        setArticlesCount(res.articlesCount);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setArticles([]);
        setError(toErrors(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tag, page, isYourFeed, state]);

  useEffect(() => {
    let cancelled = false;
    api
      .getTags()
      .then((list) => {
        if (!cancelled) setTags(list);
      })
      .catch(() => {
        // タグ取得の失敗は画面を壊さない。サイドバーが空になるだけ
        if (!cancelled) setTags([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // 認証状態の復元中はリダイレクトせず、確定後に未ログインなら /login へ
  if (isYourFeed && state !== "loading" && state !== "authenticated") {
    return <Navigate to="/login" replace />;
  }

  const listBase = isYourFeed ? "/?feed=following" : tag ? `/tag/${encodeURIComponent(tag)}` : "/";

  return (
    <div className="home-page">
      {!tag && (
        <div className="banner">
          <div className="container">
            <h1 className="logo-font">conduit</h1>
            <p>A place to share your knowledge.</p>
          </div>
        </div>
      )}
      <div className="container page">
        <div className="row">
          <div className="col-md-9">
            <div className="feed-toggle">
              <ul className="nav nav-pills outline-active">
                {state === "authenticated" && (
                  <li className="nav-item">
                    <Link
                      className={`nav-link${isYourFeed ? " active" : ""}`}
                      to="/?feed=following"
                    >
                      Your Feed
                    </Link>
                  </li>
                )}
                <li className="nav-item">
                  <Link className={`nav-link${!isYourFeed && !tag ? " active" : ""}`} to="/">
                    Global Feed
                  </Link>
                </li>
                {tag && (
                  <li className="nav-item">
                    <Link className="nav-link active" to={`/tag/${encodeURIComponent(tag)}`}>
                      <i className="ion-pound" /> {tag}
                    </Link>
                  </li>
                )}
              </ul>
            </div>
            <ArticleList
              articles={articles}
              loading={loading}
              error={error}
              onArticleChange={(updated) =>
                setArticles((prev) =>
                  prev ? prev.map((a) => (a.slug === updated.slug ? updated : a)) : prev,
                )
              }
              emptyMessage={
                isYourFeed ? (
                  <>
                    Your feed is empty. Follow users to see their articles here, or check the{" "}
                    <Link to="/">Global Feed</Link>.
                  </>
                ) : (
                  "No articles are here... yet."
                )
              }
            />
            <Pagination total={articlesCount} page={page} basePath={listBase} />
          </div>
          <div className="col-md-3">
            <div className="sidebar">
              <p>Popular Tags</p>
              <div className="tag-list">
                {tags.map((t) => (
                  <Link
                    key={t}
                    className="tag-pill tag-default"
                    to={`/tag/${encodeURIComponent(t)}`}
                  >
                    {t}
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
