import { useState } from "react";
import { useNavigate } from "react-router-dom";
import * as api from "../api/client";
import type { Article } from "../api/types";
import { useAuth } from "../auth/AuthContext";

async function toggleFavorite(article: Article, token: string): Promise<Article> {
  const res = article.favorited
    ? await api.unfavoriteArticle(token, article.slug)
    : await api.favoriteArticle(token, article.slug);
  return res.article;
}

/** 記事一覧 (.article-preview) 用の件数のみ表示する小さいボタン。 */
export function FavoriteButtonSmall({
  article,
  onChange,
}: {
  article: Article;
  onChange: (article: Article) => void;
}) {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (!token) {
      navigate("/login");
      return;
    }
    setBusy(true);
    try {
      onChange(await toggleFavorite(article, token));
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
  const { token } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (!token) {
      navigate("/login");
      return;
    }
    setBusy(true);
    try {
      onChange(await toggleFavorite(article, token));
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
