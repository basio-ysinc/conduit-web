import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import type { Article } from "../api/types";
import { useAuth } from "../auth/AuthContext";

async function toggleFavorite(article: Article): Promise<Article> {
  return article.favorited
    ? await api.unfavoriteArticle(article.slug)
    : await api.favoriteArticle(article.slug);
}

/** 記事一覧 (.article-preview) 用の件数のみ表示する小さいボタン。 */
export function FavoriteButtonSmall({
  article,
  onChange,
}: {
  article: Article;
  onChange: (article: Article) => void;
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (!user) {
      navigate("/login");
      return;
    }
    setBusy(true);
    try {
      onChange(await toggleFavorite(article));
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      className={`btn btn-sm pull-xs-right ${article.favorited ? "btn-primary" : "btn-outline-primary"}`}
      onClick={toggle}
      disabled={busy}
    >
      <i className="ion-heart" /> {article.favoritesCount}
    </button>
  );
}

/** 記事ページ (.article-meta) 用のラベルつきボタン。 */
export function FavoriteButtonLarge({
  article,
  onChange,
}: {
  article: Article;
  onChange: (article: Article) => void;
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (!user) {
      navigate("/login");
      return;
    }
    setBusy(true);
    try {
      onChange(await toggleFavorite(article));
    } catch {
      // お気に入り失敗時は状態を変えない(ボタンはそのまま残る)
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      className={`btn btn-sm action-btn ${article.favorited ? "btn-primary" : "btn-outline-primary"}`}
      onClick={toggle}
      disabled={busy}
    >
      <i className="ion-heart" /> {article.favorited ? "Unfavorite" : "Favorite"} Article{" "}
      <span className="counter">({article.favoritesCount})</span>
    </button>
  );
}
