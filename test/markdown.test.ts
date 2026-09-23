import { describe, expect, it } from "vitest";
import { DEFAULT_AVATAR, avatarUrl } from "../src/avatar";
import { renderMarkdown } from "../src/markdown";

describe("renderMarkdown", () => {
  it("renders paragraphs", () => {
    expect(renderMarkdown("hello world")).toBe("<p>hello world</p>");
  });

  it("renders headings, lists and code blocks", () => {
    expect(renderMarkdown("# Title")).toBe("<h1>Title</h1>");
    expect(renderMarkdown("- a\n- b")).toBe("<ul><li>a</li><li>b</li></ul>");
    expect(renderMarkdown("1. a\n2. b")).toBe("<ol><li>a</li><li>b</li></ol>");
    expect(renderMarkdown("```\n<x>\n```")).toBe("<pre><code>&lt;x&gt;</code></pre>");
  });

  it("renders inline emphasis and code", () => {
    expect(renderMarkdown("a **b** *c* `d`")).toBe(
      "<p>a <strong>b</strong> <em>c</em> <code>d</code></p>",
    );
  });

  it("does not swallow digits next to inline code", () => {
    expect(renderMarkdown("`x` costs 100")).toBe("<p><code>x</code> costs 100</p>");
  });

  it("escapes raw HTML instead of emitting it", () => {
    const html = renderMarkdown("Before <script>alert(1)</script> After");
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("escapes event-handler payloads", () => {
    for (const payload of [
      '<img src=x onerror="alert(1)">',
      '<svg onload="alert(1)">',
      '<iframe srcdoc="<script>alert(1)</script>">',
      '<div onmouseover="alert(1)">hover</div>',
    ]) {
      const html = renderMarkdown(payload);
      // 生の要素タグが生成されない(テキストとしてエスケープされる)
      expect(html).not.toMatch(/<img|<svg|<iframe|<div/);
      // 属性として解釈される文脈にも置かれない
      expect(html).not.toMatch(/on\w+="/);
    }
  });

  it("neutralizes javascript: links", () => {
    const html = renderMarkdown("[click](javascript:alert(1))");
    expect(html).not.toContain("javascript:");
    expect(html).toContain('href="#"');
  });

  it("keeps https links", () => {
    expect(renderMarkdown("[site](https://example.com)")).toContain(
      '<a href="https://example.com">site</a>',
    );
  });

  it("renders inline markdown", () => {
    const html = renderMarkdown("**bold** and *em* and `code`");
    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain("<em>em</em>");
    expect(html).toContain("<code>code</code>");
  });

  it("leaves digits in plain text untouched", () => {
    expect(renderMarkdown("I have 3 cats")).toBe("<p>I have 3 cats</p>");
  });

  it("keeps links whose URLs contain digits", () => {
    const html = renderMarkdown("[a](https://ex.com/p?a=1&b=2)");
    expect(html).toContain('<a href="https://ex.com/p?a=1&amp;b=2">a</a>');
    expect(html).not.toContain("<code>");
  });

  it("restores inline code without eating surrounding digits", () => {
    const html = renderMarkdown("Use `x` in 2024");
    expect(html).toContain("<code>x</code>");
    expect(html).toContain("in 2024");
    expect(html).not.toContain("undefined");
  });
});

describe("avatarUrl", () => {
  it("falls back to the default avatar for null/empty", () => {
    expect(avatarUrl(null)).toBe(DEFAULT_AVATAR);
    expect(avatarUrl("")).toBe(DEFAULT_AVATAR);
    expect(avatarUrl(undefined)).toBe(DEFAULT_AVATAR);
  });

  it("rejects non-http schemes", () => {
    expect(avatarUrl("javascript:alert(1)")).toBe(DEFAULT_AVATAR);
    expect(avatarUrl("data:text/html,<script>alert(1)</script>")).toBe(DEFAULT_AVATAR);
  });

  it("keeps http(s) and relative URLs", () => {
    expect(avatarUrl("https://example.com/a.png")).toBe("https://example.com/a.png");
    expect(avatarUrl("/a.png")).toBe("/a.png");
  });
});
