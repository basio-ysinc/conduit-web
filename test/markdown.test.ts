import { describe, expect, it } from "vitest";
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
});
