import { type ReactNode, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import type { Article, Errors } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { avatarUrl } from "../avatar";
import { formatDate } from "./ArticleMeta";
import { ErrorMessages } from "./ErrorMessages";

export const ARTICLES_PER_PAGE = 20;

/** 記事1件のプレビューカード(.article-preview)。 */
function ArticlePreview({
  article,
  onToggleFavorite,
}: {
  article: Article;
  onToggleFavorite: (article: Article) => void;
}) {
  const { state } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const toggleFavorite = async () => {
    if (state !== "authenticated") {
      navigate("/login");
      return;
    }
    setBusy(true);
    try {
      const updated = article.favorited
        ? await api.unfavoriteArticle(article.slug)
        : await api.favoriteArticle(article.slug);
      onToggleFavorite(updated);
    } catch {
      // 失敗時は表示を変えない
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="article-preview">
      <div className="article-meta">
        <Link to={`/profile/${article.author.username}`}>
          <img src={avatarUrl(article.author.image)} alt="" />
        </Link>
        <div className="info">
          <Link className="author" to={`/profile/${article.author.username}`}>
            {article.author.username}
          </Link>
          <span className="date">{formatDate(article.createdAt)}</span>
        </div>
        <button
          type="button"
          className={`btn btn-sm pull-xs-right ${article.favorited ? "btn-primary" : "btn-outline-primary"}`}
          disabled={busy}
          onClick={toggleFavorite}
        >
          <i className="ion-heart" /> {article.favoritesCount}
        </button>
      </div>
      <Link to={`/article/${article.slug}`} className="preview-link">
        <h1>{article.title}</h1>
        <p>{article.description}</p>
        <span>Read more...</span>
        {article.tagList.length > 0 && (
          <ul className="tag-list">
            {article.tagList.map((tag) => (
              <li key={tag} className="tag-default tag-pill tag-outline">
                {tag}
              </li>
            ))}
          </ul>
        )}
      </Link>
    </div>
  );
}

/** 記事一覧。ローディング・エラー・空表示を内包する。 */
export function ArticleList({
  articles,
  loading,
  error,
  emptyMessage,
  onArticleChange,
}: {
  articles: Article[] | null;
  loading: boolean;
  error: Errors | null;
  emptyMessage: ReactNode;
  onArticleChange?: (article: Article) => void;
}) {
  if (error) {
    return (
      <div className="article-preview">
        <ErrorMessages errors={error} />
      </div>
    );
  }
  if (loading || articles === null) {
    return <div className="article-preview">Loading articles...</div>;
  }
  if (articles.length === 0) {
    return <div className="article-preview empty-feed-message">{emptyMessage}</div>;
  }
  return (
    <>
      {articles.map((article) => (
        <ArticlePreview
          key={article.slug}
          article={article}
          onToggleFavorite={(a) => onArticleChange?.(a)}
        />
      ))}
    </>
  );
}

/** .pagination。現在ページの .page-item に .active を付ける。 */
export function Pagination({
  total,
  page,
  basePath,
}: {
  total: number;
  page: number;
  basePath: string;
}) {
  const pageCount = Math.ceil(total / ARTICLES_PER_PAGE);
  if (pageCount <= 1) return null;
  const sep = basePath.includes("?") ? "&" : "?";
  return (
    <nav>
      <ul className="pagination">
        {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
          <li key={n} className={`page-item${n === page ? " active" : ""}`}>
            <Link className="page-link" to={`${basePath}${sep}page=${n}`}>
              {n}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
