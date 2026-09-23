import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ApiError, api } from "../api/client";
import type { Article as ArticleModel, Errors } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { ArticleMeta, FavoriteButton, FollowButton } from "../components/ArticleMeta";
import { ErrorMessages, toErrors } from "../components/ErrorMessages";
import { renderMarkdown } from "../markdown";

/**
 * /article/:slug。本文はサニタイズ済み Markdown として描画する。
 * 記事取得が失敗しても .article-page の枠は残し、404 相当の表示か
 * エラーメッセージを出す(白画面にしない)。
 */
export function Article() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [article, setArticle] = useState<ArticleModel | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [errors, setErrors] = useState<Errors | null>(null);
  const [actionErrors, setActionErrors] = useState<Errors | null>(null);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setActionErrors(null);
    api
      .getArticle(slug)
      .then((a) => {
        if (!cancelled) setArticle(a);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) {
          setNotFound(true);
        } else {
          setErrors(toErrors(err));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const onDeleteArticle = useCallback(async () => {
    if (!slug) return;
    try {
      await api.deleteArticle(slug);
      navigate("/");
    } catch (err) {
      setActionErrors(toErrors(err));
    }
  }, [slug, navigate]);

  const isAuthor = user !== null && article !== null && user.username === article.author.username;

  const articleActions =
    article &&
    (isAuthor ? (
      <>
        <Link className="btn btn-outline-secondary btn-sm" to={`/editor/${article.slug}`}>
          <i className="ion-edit" /> Edit Article
        </Link>
        <button type="button" className="btn btn-outline-danger btn-sm" onClick={onDeleteArticle}>
          <i className="ion-trash-a" /> Delete Article
        </button>
      </>
    ) : (
      <>
        <FollowButton
          profile={article.author}
          onChange={(p) => {
            setActionErrors(null);
            setArticle((prev) => (prev ? { ...prev, author: p } : prev));
          }}
          onError={(err) => setActionErrors(toErrors(err))}
        />
        <FavoriteButton article={article} onChange={setArticle} />
      </>
    ));

  return (
    <div className="article-page">
      {notFound ? (
        <div className="container page">
          <h1>Article not found</h1>
          <p>The article you are looking for does not exist.</p>
          <Link to="/">Go to home</Link>
        </div>
      ) : errors && !article ? (
        <div className="container page">
          <ErrorMessages errors={errors} />
        </div>
      ) : !article ? (
        <div className="container page">Loading article...</div>
      ) : (
        <>
          <div className="banner">
            <div className="container">
              <h1>{article.title}</h1>
              <ArticleMeta article={article} actions={articleActions} />
            </div>
          </div>

          <div className="container page">
            <ErrorMessages errors={actionErrors} />
            <div className="row article-content">
              <div className="col-md-12">
                <div
                  // biome-ignore lint/security/noDangerouslySetInnerHtml: renderMarkdown がエスケープ済み HTML を生成する
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(article.body ?? "") }}
                />
                {article.tagList.length > 0 && (
                  <ul className="tag-list">
                    {article.tagList.map((tag) => (
                      <li key={tag} className="tag-default tag-pill tag-outline">
                        {tag}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <hr />
            <div className="article-actions">
              <ArticleMeta article={article} actions={articleActions} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
