/* Format native CSS and combine adjacent identical contexts without reordering rules. */
const fs = require("fs");
const path = require("path");
const postcss = require("postcss");
const prettier = require("prettier");
const ROOT = path.resolve(__dirname, "../..");
function compact(container) {
  for (const node of container.nodes || []) if (node.nodes) compact(node);
  for (let i = 0; i < (container.nodes || []).length; i++) {
    const a = container.nodes[i];
    if (!a.nodes) continue;
    let j = i + 1;
    while (container.nodes[j]?.type === "comment") j++;
    const b = container.nodes[j];
    if (!b) continue;
    const same = a.type === "rule" && b.type === "rule" && a.selector === b.selector;
    const media =
      a.type === "atrule" &&
      b.type === "atrule" &&
      a.name === "media" &&
      b.name === a.name &&
      a.params === b.params;
    if (!same && !media) continue;
    for (const comment of container.nodes.slice(i + 1, j)) a.append(comment);
    for (const child of [...b.nodes]) a.append(child);
    b.remove();
    compact(a);
    i--;
  }
}
(async () => {
  for (const file of fs.readdirSync(path.join(ROOT, "css")).filter((x) => x.endsWith(".css"))) {
    const target = path.join(ROOT, "css", file);
    const root = postcss.parse(fs.readFileSync(target, "utf8"));
    compact(root);
    fs.writeFileSync(
      target,
      await prettier.format(root.toString(), {
        parser: "css",
        tabWidth: 2,
        printWidth: 100,
      }),
    );
  }
})();
