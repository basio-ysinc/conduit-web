import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
import type { Article, Profile } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { FavoriteButtonLarge } from "../components/FavoriteButton";
import { FollowButton } from "../components/FollowButton";

function ArticleMeta({
  article,
  profile,
  onArticleChange,
  onProfileChange,
  onDelete,
}: {
  article: Article;
  profile: Profile | null;
  onArticleChange: (a: Article) => void;
  onProfileChange: (p: Profile) => void;
  onDelete: () => void;
}) {
  const { user } = useAuth();
  const author = article.author;
  const isOwn = user?.username === author.username;

  return (
    <div className="article-meta">
      <Link to={`/profile/${author.username}`}>
        <img src={author.image || "/default-avatar.svg"} alt={author.username} />
      </Link>
      <div className="info">
        <Link className="author" to={`/profile/${author.username}`}>
          {author.username}
        </Link>
        <span className="date">{new Date(article.createdAt).toDateString()}</span>
      </div>
      {isOwn ? (
        <>
          <Link className="btn btn-sm btn-outline-secondary" to={`/editor/${article.slug}`}>
            <i className="ion-edit" /> Edit Article
          </Link>{" "}
          <button type="button" className="btn btn-sm btn-outline-danger" onClick={onDelete}>
            <i className="ion-trash-a" /> Delete Article
          </button>
        </>
      ) : (
        <>
          {profile && <FollowButton profile={profile} onChange={onProfileChange} />}{" "}
          <FavoriteButtonLarge article={article} onChange={onArticleChange} />
        </>
      )}
    </div>
  );
}

export function ArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [article, setArticle] = useState<Article | null>(null);
  const [authorProfile, setAuthorProfile] = useState<Profile | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    api
      .getArticle(slug)
      .then(async (article) => {
        if (cancelled) return;
        setArticle(article);
        // article.author.following は API 側で常に false のことがあるため、
        // follow 状態は profiles エンドポイントから別途取る
        try {
          const p = await api.getProfile(article.author.username);
          if (!cancelled) setAuthorProfile(p);
        } catch {
          if (!cancelled) setAuthorProfile(article.author);
        }
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const onDelete = useCallback(async () => {
    if (!slug || !user) return;
    await api.deleteArticle(slug);
    navigate("/");
  }, [slug, user, navigate]);

  if (notFound) {
    return (
      <div className="container page">
        <h1>Article not found</h1>
      </div>
    );
  }
  if (!article) return null;

  return (
    <div className="article-page">
      <div className="banner">
        <div className="container">
          <h1>{article.title}</h1>
          <ArticleMeta
            article={article}
            profile={authorProfile}
            onArticleChange={setArticle}
            onProfileChange={setAuthorProfile}
            onDelete={onDelete}
          />
        </div>
      </div>
      <div className="container page">
        <div className="row article-content">
          <div className="col-md-12">
            <p>{article.body}</p>
            <ul className="tag-list">
              {article.tagList.map((tag) => (
                <li key={tag} className="tag-default tag-pill tag-outline">
                  {tag}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <hr />
      </div>
    </div>
  );
}
