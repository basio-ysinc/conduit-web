import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { Article } from "../api/types";
import { DEFAULT_AVATAR } from "./Navbar";

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toDateString();
}

/** 記事の著者情報(アバター・名前・日付)とアクションボタンの枠。 */
export function ArticleMeta({ article, actions }: { article: Article; actions?: ReactNode }) {
  return (
    <div className="article-meta">
      <Link to={`/profile/${article.author.username}`}>
        <img src={article.author.image || DEFAULT_AVATAR} alt="" />
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
