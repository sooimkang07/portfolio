const fs = require("fs");
const path = require("path");
const assert = require("assert/strict");
const postcss = require("postcss");
const ROOT = path.resolve(__dirname, "../..");
(async () => {
  const { parse } = await import("parse5");
  const errors = [];
  let comparedPages = 0;
  let declarations = 0,
    nestedRules = 0;
  for (const file of fs.readdirSync(path.join(ROOT, "css")).filter((x) => x.endsWith(".css"))) {
    const css = postcss.parse(fs.readFileSync(path.join(ROOT, "css", file), "utf8"));
    css.walkDecls((d) => {
      declarations++;
      if (/^(?:(?:min|max)-)?(?:width|height)$/.test(d.prop))
        errors.push(`${file}: physical dimension ${d.prop}`);
      if (/^(margin|padding)-(top|bottom|left|right)$/.test(d.prop))
        errors.push(`${file}: physical spacing ${d.prop}`);
      const opaqueFree = d.value.replace(
        /url\((?:[^)(]|\([^)]*\))*\)|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g,
        "",
      );
      if (/\dpx\b/.test(opaqueFree))
        errors.push(`${file}: pixel length outside a query: ${d.prop}`);
    });
    css.walkRules((r) => {
      if (r.parent.type === "rule") nestedRules++;
    });
  }
  function inspect(html) {
    const doc = parse(html);
    const text = [],
      references = [],
      inlineStyles = [];
    function walk(n, skip = false) {
      skip = skip || ["script", "style"].includes(n.tagName);
      if (n.nodeName === "#text" && !skip) text.push(n.value);
      for (const a of n.attrs || [])
        if (["src", "href", "poster", "data-src"].includes(a.name))
          references.push([a.name, a.value.replace(/\?v=[^#]*/, "")]);
      for (const a of n.attrs || []) if (a.name === "style") inlineStyles.push(a.value);
      for (const c of n.childNodes || []) walk(c, skip);
    }
    walk(doc);
    return { text: text.join(" ").replace(/\s+/g, " ").trim(), references, inlineStyles };
  }
  for (const file of fs.readdirSync(ROOT).filter((x) => x.endsWith(".html"))) {
    const before = path.join(ROOT, "unused/shared/refactor-source/html", file);
    if (!fs.existsSync(before)) continue;
    const a = inspect(fs.readFileSync(before, "utf8")),
      b = inspect(fs.readFileSync(path.join(ROOT, file), "utf8"));
    comparedPages++;
    for (const value of b.inlineStyles) {
      const fragment = postcss.parse(`x { ${value} }`);
      fragment.walkDecls((d) => {
        assert.ok(
          !/^(?:(?:min|max)-)?(?:width|height)$/.test(d.prop),
          `${file}: physical inline dimension`,
        );
      });
    }
    assert.equal(b.text, a.text, `${file}: visible copy changed`);
    const oldMedia = a.references.filter(([key]) => ["src", "poster", "data-src"].includes(key));
    assert.deepEqual(
      b.references.filter(([key]) => ["src", "poster", "data-src"].includes(key)),
      oldMedia,
      `${file}: media references changed`,
    );
  }
  assert.deepEqual(errors, []);
  console.log(
    `${declarations} declarations checked; ${nestedRules} nested rules; copy and media compared on ${comparedPages} root pages.`,
  );
})();
