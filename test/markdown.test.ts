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
