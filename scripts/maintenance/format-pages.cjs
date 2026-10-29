// Format every maintained HTML file; verify browser-parsed structure before writing.
const fs = require("fs"),
  path = require("path");
const root = path.resolve(__dirname, "../..");
const prettier = require(path.join(root, "scripts/maintenance/node_modules/prettier"));
const skip = new Set([
  "node_modules",
  ".git",
  "unused",
  "_docs",
  "_restore",
  "Claude outputs",
  "assets",
  "favicon",
]);
function walk(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((e) =>
      skip.has(e.name)
        ? []
        : e.isDirectory()
          ? walk(path.join(dir, e.name))
          : e.name.endsWith(".html")
            ? [path.join(dir, e.name)]
            : [],
    );
}
(async () => {
  const { parse, serialize } = await import(
    path.join(root, "scripts/maintenance/node_modules/parse5/dist/index.js")
  );
  function tree(n, raw = false) {
    raw = raw || ["pre", "textarea", "script", "style"].includes(n.tagName);
    if (n.nodeName === "#text") {
      let v = raw ? n.value : n.value.replace(/\s+/g, " ").trim();
      return v ? ["text", v] : null;
    }
    return [
      n.nodeName,
      n.name || "",
      n.attrs?.map((a) => [a.namespace || "", a.name, a.value]).sort(),
      (n.content?.childNodes || n.childNodes || []).map((c) => tree(c, raw)).filter(Boolean),
    ];
  }
  let changed = [];
  const files = walk(root);
  for (const file of files) {
    const before = fs.readFileSync(file, "utf8");
    const options = {
      parser: "html",
      tabWidth: 2,
      printWidth: 100,
      htmlWhitespaceSensitivity: [
        "yap.html",
        "notate.html",
        "instagram-lists.html",
        "neuk.html",
        "acuity.html",
        "smart-bundles.html",
        "forage.html",
      ].includes(path.relative(root, file))
        ? "ignore"
        : "css",
      embeddedLanguageFormatting: "off",
    };
    let after;
    try {
      after = await prettier.format(before, options);
    } catch (e) {
      console.log("Repair browser-implied nesting:", path.relative(root, file));
      after = await prettier.format(serialize(parse(before)), options);
    }
    // SVG is inline by default, so Prettier otherwise hugs adjacent SVG tags.
    // Canvas shapes have no whitespace-sensitive text; format their hierarchy explicitly.
    after = after.replace(/<svg\b[\s\S]*?<\/svg\s*>/gi, (svg, offset) => {
      if (/<(?:text|tspan|foreignObject)\b/i.test(svg)) return svg;
      const base = after.slice(0, offset).split("\n").at(-1).match(/^ */)[0];
      let depth = 0;
      return [...svg.matchAll(/<[^>]+>|[^<]+/g)]
        .flatMap(([token]) => {
          if (!token.trim()) return [];
          const closing = /^<\//.test(token);
          if (closing) depth--;
          const line = "  ".repeat(Math.max(0, depth)) + token.replace(/\s+/g, " ").trim();
          if (/^<[^!/?]/.test(token) && !/\/\s*>$/.test(token)) depth++;
          return [line];
        })
        .join("\n" + base);
    });
    // Keep mixed inline text exactly: added whitespace changes punctuation and labels.
    function mixedGroups(html) {
      const groups = new Map();
      function visit(node, key) {
        if (
          ["p", "h1", "h2", "h3", "h4", "a", "code"].includes(node.tagName) &&
          node.childNodes?.some((child) => child.tagName) &&
          node.childNodes?.some((child) => child.nodeName === "#text" && child.value.trim())
        ) {
          groups.set(key, node.sourceCodeLocation);
          return;
        }
        (node.content?.childNodes || node.childNodes || [])
          .filter((child) => !["#text", "#comment"].includes(child.nodeName))
          .forEach((child, index) => visit(child, key + "/" + index));
      }
      visit(parse(html, { sourceCodeLocationInfo: true }), "");
      return groups;
    }
    const originalGroups = mixedGroups(before);
    const edits = [];
    for (const [key, location] of mixedGroups(after)) {
      const original = originalGroups.get(key);
      if (original?.endTag && location?.endTag)
        edits.push([
          location.startTag.endOffset,
          location.endTag.startOffset,
          before.slice(original.startTag.endOffset, original.endTag.startOffset),
        ]);
    }
    for (const [start, end, content] of edits.sort((a, b) => b[0] - a[0])) {
      after = after.slice(0, start) + content + after.slice(end);
    }
    // Disabled markup is still source code people need to read.
    const commentEdits = [];
    for (const match of after.matchAll(/<!--([\s\S]*?)-->/g)) {
      if (!/^\s*<(?:div|section|figure|header|aside|nav)\b/i.test(match[1])) continue;
      try {
        const content = await prettier.format(match[1].trim(), {
          ...options,
          htmlWhitespaceSensitivity: "ignore",
        });
        const indent = after.slice(0, match.index).split("\n").at(-1).match(/^ */)[0];
        commentEdits.push([
          match.index,
          match.index + match[0].length,
          "<!--\n" +
            content
              .trimEnd()
              .split("\n")
              .map((line) => indent + "  " + line)
              .join("\n") +
            "\n" +
            indent +
            "-->",
        ]);
      } catch {
        /* Leave non-HTML notes and incomplete examples intact. */
      }
    }
    for (const [start, end, content] of commentEdits.reverse())
      after = after.slice(0, start) + content + after.slice(end);
    // Enforce actual parent-relative indentation, including inline-default containers.
    const indentEdits = [];
    function indentTag(offset, depth) {
      const lineStart = after.lastIndexOf("\n", offset - 1) + 1;
      const prefix = after.slice(lineStart, offset);
      indentEdits.push([
        /^ *$/.test(prefix) ? lineStart : offset,
        offset,
        (/^ *$/.test(prefix) ? "" : "\n") + "  ".repeat(depth),
      ]);
    }
    function indentNode(node, depth, inProse = false) {
      const location = node.sourceCodeLocation;
      if (node.tagName && location && !inProse) {
        indentTag(location.startTag.startOffset, depth);
        if (
          location.endTag &&
          node.childNodes?.some((child) => child.tagName) &&
          !["p", "h1", "h2", "h3", "h4", "a", "code"].includes(node.tagName)
        ) {
          indentTag(location.endTag.startOffset, depth);
        }
      }
      const protectedText =
        inProse ||
        [
          "p",
          "h1",
          "h2",
          "h3",
          "h4",
          "a",
          "code",
          "script",
          "style",
          "pre",
          "textarea",
          "text",
          "tspan",
        ].includes(node.tagName);
      for (const child of node.content?.childNodes || node.childNodes || []) {
        indentNode(child, depth + (node.tagName ? 1 : 0), protectedText);
      }
    }
    indentNode(parse(after, { sourceCodeLocationInfo: true }), 0);
    for (const [start, end, content] of indentEdits.sort((a, b) => b[0] - a[0])) {
      after = after.slice(0, start) + content + after.slice(end);
    }
    const raw = [...before.matchAll(/<(script|style)\b[^>]*>([\s\S]*?)<\/\1>/gi)].map((m) => m[2]);
    let rawIndex = 0;
    after = after.replace(
      /(<(script|style)\b[^>]*>)[\s\S]*?(<\/\2>)/gi,
      (_, open, tag, close) => open + raw[rawIndex++] + close,
    );
    let oldErrors = [],
      newErrors = [];
    const a = parse(before, { onParseError: (e) => oldErrors.push(e.code) }),
      b = parse(after, { onParseError: (e) => newErrors.push(e.code) });
    if (JSON.stringify(tree(a)) !== JSON.stringify(tree(b)))
      throw Error("Content/structure changed: " + file);
    if (newErrors.length > oldErrors.length) throw Error("New parse errors: " + file);
    if (before !== after) {
      const backup = path.join(
        require("os").tmpdir(),
        "portfolio-html-before",
        path.relative(root, file),
      );
      fs.mkdirSync(path.dirname(backup), { recursive: true });
      if (!fs.existsSync(backup)) fs.writeFileSync(backup, before);
      fs.writeFileSync(file, after);
      changed.push(path.relative(root, file));
    }
  }
  console.log(JSON.stringify({ checked: files.length, changed }, null, 2));
})();
