import { Link } from "react-router-dom";
import type { Article } from "../api/types";
import { avatarUrl } from "../avatar";

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toDateString();
}

/** 記事メタ情報(著者アバター・名前・日付)とアクションボタン。 */
export function ArticleMeta({
  article,
  actions,
}: {
  article: Article;
  actions?: React.ReactNode;
}) {
  return (
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
      {actions}
    </div>
  );
}
