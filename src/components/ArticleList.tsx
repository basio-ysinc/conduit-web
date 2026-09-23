import { Link } from "react-router-dom";
import type { Article } from "../api/types";
import { DEFAULT_AVATAR } from "./Navbar";

function ArticlePreview({ article }: { article: Article }) {
  const author = article.author;
  return (
    <div className="article-preview">
      <div className="article-meta">
        <Link to={`/profile/${author.username}`}>
          <img src={author.image || DEFAULT_AVATAR} alt={author.username} />
        </Link>
        <div className="info">
          <Link className="author" to={`/profile/${author.username}`}>
            {author.username}
          </Link>
          <span className="date">{new Date(article.createdAt).toDateString()}</span>
        </div>
      </div>
      <Link className="preview-link" to={`/article/${article.slug}`}>
        <h1>{article.title}</h1>
        <p>{article.description}</p>
        <span>Read more...</span>
        <ul className="tag-list">
          {article.tagList.map((tag) => (
            <li key={tag} className="tag-default tag-pill tag-outline">
              {tag}
            </li>
          ))}
        </ul>
      </Link>
    </div>
  );
}

export function ArticleList({ articles, loading }: { articles: Article[]; loading: boolean }) {
  if (loading) return <div className="article-preview">Loading articles...</div>;
  if (articles.length === 0) {
    return <div className="empty-feed-message">No articles are here... yet.</div>;
  }
  return (
    <>
      {articles.map((a) => (
        <ArticlePreview key={a.slug} article={a} />
      ))}
    </>
  );
}
