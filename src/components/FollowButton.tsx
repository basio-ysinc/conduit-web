import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import type { Profile } from "../api/types";
import { useAuth } from "../auth/AuthContext";

/** Follow/Unfollow トグル。profile ページと記事の .article-meta で共用する。 */
export function FollowButton({
  profile,
  onChange,
  onError,
}: {
  profile: Profile;
  onChange: (profile: Profile) => void;
  onError?: (err: unknown) => void;
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
      const updated = profile.following
        ? await api.unfollowUser(profile.username)
        : await api.followUser(profile.username);
      onChange(updated);
    } catch (err) {
      onError?.(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      className={`btn btn-sm action-btn ${profile.following ? "btn-secondary" : "btn-outline-secondary"}`}
      onClick={toggle}
      disabled={busy}
    >
      <i className="ion-plus-round" /> {profile.following ? "Unfollow" : "Follow"}{" "}
      {profile.username}
    </button>
  );
}
