/**
 * 最小限の Markdown -> HTML レンダラ。記事本文用。
 *
 * セキュリティ方針: 入力は先に HTML エスケープし、自分で生成するタグだけを
 * 組み立てる。ユーザーの生 HTML は常にテキストとして表示される。
 * リンク・画像の URL は http(s)/mailto/tel/相対パスのみ許可し、
 * javascript: や data: は無効化する。
 */

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** 許可しないスキームの URL は "#" に潰す。 */
function sanitizeUrl(url: string): string {
  const trimmed = url.trim();
  if (/^(https?:|mailto:|tel:|\/|#)/i.test(trimmed) || trimmed.startsWith("//")) return trimmed;
  return "#";
}

function sanitizeImageUrl(url: string): string | null {
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return trimmed;
  }
  return null;
}

/** コードスパン以外の部分にインライン記法を適用する。 */
function renderText(escaped: string): string {
  return escaped
    .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_m, alt: string, url: string) => {
      const safe = sanitizeImageUrl(url);
      return safe === null ? alt : `<img src="${safe}" alt="${alt}" />`;
    })
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, text: string, url: string) => {
      return `<a href="${sanitizeUrl(url)}">${text}</a>`;
    })
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/__([^_]+)__/g, "<strong>$1</strong>")
    .replace(/\b_([^_]+)_\b/g, "<em>$1</em>")
    .replace(/~~([^~]+)~~/g, "<del>$1</del>");
}

/** エスケープ済みテキストに対してインライン記法を適用する。 */
function renderInline(escaped: string): string {
  // バッククォートで分割し、コードスパンの中身はこれ以上変換しない
  return escaped
    .split(/(`[^`]+`)/g)
    .map((part) =>
      part.length > 1 && part.startsWith("`") && part.endsWith("`")
        ? `<code>${part.slice(1, -1)}</code>`
        : renderText(part),
    )
    .join("");
}

/** Markdown 文字列をサニタイズ済み HTML に変換する。 */
export function renderMarkdown(source: string): string {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: string[] = [];
  let paragraph: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let quote: string[] = [];
  let inCode = false;
  let codeLines: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length > 0) {
      blocks.push(`<p>${renderInline(paragraph.map(escapeHtml).join("\n"))}</p>`);
      paragraph = [];
    }
  };
  const flushList = () => {
    if (list) {
      const tag = list.ordered ? "ol" : "ul";
      blocks.push(
        `<${tag}>${list.items.map((i) => `<li>${renderInline(escapeHtml(i))}</li>`).join("")}</${tag}>`,
      );
      list = null;
    }
  };
  const flushQuote = () => {
    if (quote.length > 0) {
      blocks.push(`<blockquote>${renderInline(quote.map(escapeHtml).join("\n"))}</blockquote>`);
      quote = [];
    }
  };
  const flushAll = () => {
    flushParagraph();
    flushList();
    flushQuote();
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (inCode) {
      if (/^```/.test(trimmed)) {
        blocks.push(`<pre><code>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
        codeLines = [];
        inCode = false;
      } else {
        codeLines.push(line);
      }
      continue;
    }
    if (/^```/.test(trimmed)) {
      flushAll();
      inCode = true;
      continue;
    }
    if (trimmed === "") {
      flushAll();
      continue;
    }
    const heading = /^(#{1,6})\s+(.*)$/.exec(trimmed);
    if (heading) {
      flushAll();
      blocks.push(
        `<h${heading[1].length}>${renderInline(escapeHtml(heading[2]))}</h${heading[1].length}>`,
      );
      continue;
    }
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      flushAll();
      blocks.push("<hr />");
      continue;
    }
    const unordered = /^[-*+]\s+(.*)$/.exec(trimmed);
    if (unordered) {
      flushParagraph();
      flushQuote();
      if (!list || list.ordered) {
        flushList();
        list = { ordered: false, items: [] };
      }
      list.items.push(unordered[1]);
      continue;
    }
    const ordered = /^\d+[.)]\s+(.*)$/.exec(trimmed);
    if (ordered) {
      flushParagraph();
      flushQuote();
      if (!list || !list.ordered) {
        flushList();
        list = { ordered: true, items: [] };
      }
      list.items.push(ordered[1]);
      continue;
    }
    if (trimmed.startsWith(">")) {
      flushParagraph();
      flushList();
      quote.push(trimmed.replace(/^>\s?/, ""));
      continue;
    }
    flushList();
    flushQuote();
    paragraph.push(line);
  }
  if (inCode) {
    blocks.push(`<pre><code>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
  }
  flushAll();
  return blocks.join("\n");
}
