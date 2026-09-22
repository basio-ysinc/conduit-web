import { type FormEvent, useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ApiError, api } from "../api/client";
import type { Article as ArticleModel, Comment } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { avatarUrl } from "../avatar";
import { ArticleMeta, FavoriteButton, FollowButton, formatDate } from "../components/ArticleMeta";
import { ErrorMessages, errorToMessages } from "../components/ErrorMessages";
import { renderMarkdown } from "../markdown";

/**
 * /article/:slug。本文はサニタイズ済み Markdown として描画する。
 * 記事取得が失敗しても .article-page の枠は残し、404 相当の表示か
 * エラーメッセージを出す(白画面にしない)。
 */
export function Article() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { state, user } = useAuth();
  const [article, setArticle] = useState<ArticleModel | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [errors, setErrors] = useState<string[] | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentBody, setCommentBody] = useState("");
  const [commentErrors, setCommentErrors] = useState<string[] | null>(null);
  const [commentBusy, setCommentBusy] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
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
          setErrors(errorToMessages(err));
        }
      });
    api
      .getComments(slug)
      .then((list) => {
        if (!cancelled) setComments(list ?? []);
      })
      .catch(() => {
        // コメント取得失敗は記事表示を妨げない
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
      setErrors(errorToMessages(err));
    }
  }, [slug, navigate]);

  const onPostComment = async (e: FormEvent) => {
    e.preventDefault();
    if (!slug || !commentBody.trim()) return;
    setCommentBusy(true);
    setCommentErrors(null);
    try {
      const created = await api.createComment(slug, { body: commentBody });
      setComments((prev) => [created, ...prev]);
      setCommentBody("");
    } catch (err) {
      setCommentErrors(errorToMessages(err));
    } finally {
      setCommentBusy(false);
    }
  };

  const onDeleteComment = async (id: number) => {
    if (!slug) return;
    try {
      await api.deleteComment(slug, id);
      setComments((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      setCommentErrors(errorToMessages(err));
    }
  };

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
          onChange={(p) => setArticle((prev) => (prev ? { ...prev, author: p } : prev))}
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
          <ErrorMessages messages={errors} />
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

            <div className="row">
              <div className="col-xs-12 col-md-8 offset-md-2">
                <ErrorMessages messages={commentErrors} />
                {state === "authenticated" && user ? (
                  <form className="card comment-form" onSubmit={onPostComment}>
                    <div className="card-block">
                      <textarea
                        className="form-control"
                        placeholder="Write a comment..."
                        rows={3}
                        value={commentBody}
                        onChange={(e) => setCommentBody(e.target.value)}
                      />
                    </div>
                    <div className="card-footer">
                      <img className="comment-author-img" src={avatarUrl(user.image)} alt="" />
                      <button
                        className="btn btn-sm btn-primary"
                        type="submit"
                        disabled={commentBusy}
                      >
                        Post Comment
                      </button>
                    </div>
                  </form>
                ) : (
                  <p>
                    <Link to="/login">Sign in</Link> or <Link to="/register">sign up</Link> to add
                    comments on this article.
                  </p>
                )}

                {comments.map((comment) => (
                  <div className="card" key={comment.id}>
                    <div className="card-block">
                      <p className="card-text">{comment.body}</p>
                    </div>
                    <div className="card-footer">
                      <Link className="comment-author" to={`/profile/${comment.author.username}`}>
                        <img
                          className="comment-author-img"
                          src={avatarUrl(comment.author.image)}
                          alt=""
                        />
                      </Link>
                      &nbsp;
                      <Link className="comment-author" to={`/profile/${comment.author.username}`}>
                        {comment.author.username}
                      </Link>
                      <span className="date-posted">{formatDate(comment.createdAt)}</span>
                      {user?.username === comment.author.username && (
                        <span className="mod-options">
                          <i
                            className="ion-trash-a"
                            role="button"
                            tabIndex={0}
                            onClick={() => onDeleteComment(comment.id)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                onDeleteComment(comment.id);
                              }
                            }}
                          />
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
