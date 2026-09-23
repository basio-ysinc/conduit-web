/**
 * アバター画像 URL のフォールバックとサニタイズ。
 * image が null/空/不正スキームのときは既定アバター(e2e/SELECTORS.md の契約)。
 * `javascript:` や `data:` などの実行可能スキームは img の src に入れない。
 */
export const DEFAULT_AVATAR = "/default-avatar.svg";

export function avatarUrl(image: string | null | undefined): string {
  if (!image) return DEFAULT_AVATAR;
  const trimmed = image.trim();
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return trimmed;
  }
  return DEFAULT_AVATAR;
}
