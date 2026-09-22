/**
 * 最小限の Markdown -> HTML レンダラ。記事本文用。
 *
 * セキュリティ方針: 入力はまず全体を HTML エスケープし、その後に
 * 自分で生成するタグだけを組み立てる。ユーザーの生 HTML は常に
 * テキストとして表示され、script / on* ハンドラは DOM に現れない。
 * リンク・画像の URL は http(s)/相対パスのみ許可し、
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

/** エスケープ済み文字列中の URL を検査する。許可しないスキームは "#" に潰す。 */
function sanitizeUrl(url: string): string {
  const trimmed = url.trim();
  // エスケープ済みなので &quot; 等は含まれうるが、生の < > " ' は入らない
  if (/^(https?:|mailto:|tel:|\/|#)/i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("//")) return trimmed;
  return "#";
}

function sanitizeImageUrl(url: string): string | null {
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return trimmed;
  }
  return null;
}

/** エスケープ済みテキストに対してインライン記法を適用する。 */
function renderInline(escaped: string): string {
  // インラインコード(内容はこれ以上変換しない)
  const codes: string[] = [];
  let out = escaped.replace(/`([^`]+)`/g, (_m, code: string) => {
    codes.push(code);
    return `${codes.length - 1}`;
  });

  // 画像 ![alt](url)
  out = out.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_m, alt: string, url: string) => {
    const safe = sanitizeImageUrl(url);
    if (safe === null) return alt;
    return `<img src="${safe}" alt="${alt}" />`;
  });

  // リンク [text](url)
  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, text: string, url: string) => {
    return `<a href="${sanitizeUrl(url)}">${text}</a>`;
  });

  // 強調・斜体・取消線
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  out = out.replace(/__([^_]+)__/g, "<strong>$1</strong>");
  out = out.replace(/\b_([^_]+)_\b/g, "<em>$1</em>");
  out = out.replace(/~~([^~]+)~~/g, "<del>$1</del>");

  // インラインコードを戻す
  out = out.replace(/(\d+)/g, (_m, i: string) => `<code>${codes[Number(i)]}</code>`);
  return out;
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
    if (inCode) {
      if (/^```/.test(line.trim())) {
        blocks.push(`<pre><code>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
        codeLines = [];
        inCode = false;
      } else {
        codeLines.push(line);
      }
      continue;
    }
    const trimmed = line.trim();
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
      const level = heading[1].length;
      blocks.push(`<h${level}>${renderInline(escapeHtml(heading[2]))}</h${level}>`);
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
