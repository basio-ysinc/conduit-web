// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { renderMarkdown } from "../src/markdown";

/** 生成 HTML を DOM に流し、on* 属性や script 要素が存在しないことを検査する。 */
function parse(html: string): HTMLElement {
  const el = document.createElement("div");
  el.innerHTML = html;
  return el;
}

function injectedAttrNames(el: HTMLElement): string[] {
  const names: string[] = [];
  for (const node of el.querySelectorAll("*")) {
    for (const attr of node.attributes) {
      if (attr.name.startsWith("on")) names.push(`${node.tagName}.${attr.name}`);
    }
  }
  return names;
}

describe("renderMarkdown (XSS)", () => {
  it("does not let link syntax reopen a preceding image's alt attribute", () => {
    // 画像置換が作った alt="..." の内側からリンク置換が始まり、
    // <a href=" の引用符で alt を閉じて onerror 属性を生やす攻撃の回帰。
    const el = parse(renderMarkdown("![[x](/nope.png) ](/x/onerror=window.pwned=1//)"));

    const img = el.querySelector("img");
    expect(img?.getAttribute("src")).toBe("/nope.png");
    expect(img?.hasAttribute("onerror")).toBe(false);
    expect(el.querySelector("a")).toBeNull();
    expect(injectedAttrNames(el)).toEqual([]);
  });

  it("does not inject attributes into generated tags via nested brackets", () => {
    const el = parse(renderMarkdown("![[x](/a.png) ](/x/onclick=alert(1)//) [![y](/b.png)](/ok)"));

    for (const img of el.querySelectorAll("img")) {
      expect(img.hasAttribute("onerror")).toBe(false);
      expect(img.hasAttribute("onclick")).toBe(false);
    }
    expect(injectedAttrNames(el)).toEqual([]);
  });
});

describe("renderMarkdown (rendering)", () => {
  it("renders paragraphs, headings and inline formats", () => {
    expect(renderMarkdown("hello")).toBe("<p>hello</p>");
    expect(renderMarkdown("# Title")).toBe("<h1>Title</h1>");
    expect(renderMarkdown("### Sub")).toBe("<h3>Sub</h3>");
    expect(renderMarkdown("**b** *i* __B__ ~~d~~")).toBe(
      "<p><strong>b</strong> <em>i</em> <strong>B</strong> <del>d</del></p>",
    );
    expect(renderMarkdown("`x<y>`")).toBe("<p><code>x&lt;y&gt;</code></p>");
  });

  it("renders links and images with allowed schemes", () => {
    expect(renderMarkdown("[t](https://ex.com)")).toBe('<p><a href="https://ex.com">t</a></p>');
    expect(renderMarkdown("[t](/rel)")).toBe('<p><a href="/rel">t</a></p>');
    expect(renderMarkdown("![a](/i.png)")).toBe('<p><img src="/i.png" alt="a" /></p>');
  });

  it("renders an image nested inside a link", () => {
    expect(renderMarkdown("[![alt](/img.png)](https://ex.com)")).toBe(
      '<p><a href="https://ex.com"><img src="/img.png" alt="alt" /></a></p>',
    );
  });

  it("applies emphasis inside link text", () => {
    expect(renderMarkdown("[*em* **b**](https://ex.com)")).toBe(
      '<p><a href="https://ex.com"><em>em</em> <strong>b</strong></a></p>',
    );
  });

  it("does not swallow digits next to inline code", () => {
    expect(renderMarkdown("`x` costs 100")).toBe("<p><code>x</code> costs 100</p>");
  });

  it("renders lists, quotes, code blocks and hr", () => {
    expect(renderMarkdown("- a\n- b")).toBe("<ul><li>a</li><li>b</li></ul>");
    expect(renderMarkdown("1. a\n2. b")).toBe("<ol><li>a</li><li>b</li></ol>");
    expect(renderMarkdown("> q")).toBe("<blockquote>q</blockquote>");
    expect(renderMarkdown("```\nx<y>\n```")).toBe("<pre><code>x&lt;y&gt;</code></pre>");
    expect(renderMarkdown("---")).toBe("<hr />");
  });
});

describe("renderMarkdown (sanitization)", () => {
  /** パース後の DOM に on* 属性・危険な要素・危険な URL が残らないこと。 */
  function expectSafeDom(el: HTMLElement) {
    expect(el.querySelector("script, iframe, object, embed, svg, form, input")).toBeNull();
    for (const node of el.querySelectorAll("*")) {
      for (const attr of node.attributes) {
        expect(attr.name.startsWith("on")).toBe(false);
      }
      const href = node.getAttribute("href");
      if (href) expect(href.trim().toLowerCase().startsWith("javascript:")).toBe(false);
      const src = node.getAttribute("src");
      if (src) expect(/^\s*(javascript|data|vbscript):/i.test(src)).toBe(false);
    }
  }

  it("escapes raw HTML including script and event handlers", () => {
    const el = parse(renderMarkdown("<script>alert(1)</script>\n\n<img src=x onerror=alert(1)>"));

    expect(el.querySelector("script")).toBeNull();
    expect(el.querySelector("img")).toBeNull();
    expect(el.textContent).toContain("alert(1)");
    expectSafeDom(el);
  });

  it.each([
    "[x](javascript:alert(1))",
    "[x](JaVaScRiPt:alert(1))",
    "[x](data:text/html,<script>alert(1)</script>)",
    "[x](vbscript:msgbox(1))",
  ])("neutralizes dangerous link url: %s", (md) => {
    const el = parse(renderMarkdown(md));

    const a = el.querySelector("a");
    expect(a?.getAttribute("href")).toBe("#");
    expectSafeDom(el);
  });

  it.each(["![x](javascript:alert(1))", "![x](data:image/png;base64,AAAA)", "![x](vbscript:e)"])(
    "drops images with disallowed schemes: %s",
    (md) => {
      const el = parse(renderMarkdown(md));
      expect(el.querySelector("img")).toBeNull();
      expectSafeDom(el);
    },
  );

  it("keeps dangerous schemes inert across a payload battery", () => {
    const payloads = [
      "![[x](/nope.png) ](/x/onerror=window.pwned=1//)",
      "[click](javascript:alert(document.cookie))",
      "![i](javascript:alert(1)) [x](javascript:alert(1))",
      "<a href=javascript:alert(1)>x</a>",
      "`*x*` [y](https://ok) ![z](/ok.png)",
      "&#106;avascript:alert(1)",
      "[x](&#106;avascript:alert(1))",
    ];
    for (const md of payloads) {
      expectSafeDom(parse(renderMarkdown(md)));
    }
  });
});
