import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import type { Article, Profile } from "../api/types";
import { useAuth } from "../auth/AuthContext";
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

/** Follow/Unfollow ボタン。失敗しても状態を変えずボタンは残す。 */
export function FollowButton({
  profile,
  onChange,
  onError,
}: {
  profile: Profile;
  onChange?: (profile: Profile) => void;
  onError?: (err: unknown) => void;
}) {
  const { state } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const toggle = async () => {
    if (state !== "authenticated") {
      navigate("/login");
      return;
    }
    setBusy(true);
    try {
      const updated = profile.following
        ? await api.unfollowUser(profile.username)
        : await api.followUser(profile.username);
      onChange?.(updated);
    } catch (err) {
      onError?.(err);
    } finally {
      setBusy(false);
    }
  };

  const label = profile.following ? "Unfollow" : "Follow";
  return (
    <button
      type="button"
      className={`btn btn-sm action-btn ${profile.following ? "btn-secondary" : "btn-outline-secondary"}`}
      disabled={busy}
      onClick={toggle}
    >
      <i className="ion-plus-round" />
      &nbsp;{label} {profile.username}
    </button>
  );
}

/** Favorite/Unfavorite ボタン(記事ページ用のラベルつき)。 */
export function FavoriteButton({
  article,
  onChange,
}: {
  article: Article;
  onChange?: (article: Article) => void;
}) {
  const { state } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const toggle = async () => {
    if (state !== "authenticated") {
      navigate("/login");
      return;
    }
    setBusy(true);
    try {
      const updated = article.favorited
        ? await api.unfavoriteArticle(article.slug)
        : await api.favoriteArticle(article.slug);
      onChange?.(updated);
    } catch {
      // お気に入り失敗時は状態を変えない(ボタンはそのまま残る)
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      className={`btn btn-sm ${article.favorited ? "btn-primary" : "btn-outline-primary"}`}
      disabled={busy}
      onClick={toggle}
    >
      <i className="ion-heart" />
      &nbsp;{article.favorited ? "Unfavorite" : "Favorite"} Article ({article.favoritesCount})
    </button>
  );
}
