/* The shared inventory is a contract for native CSS and JS, not a runtime dependency. */
const fs = require("fs");
const path = require("path");
const assert = require("assert/strict");
const postcss = require("postcss");
const ROOT = path.resolve(__dirname, "../..");
const points = require(path.join(ROOT, "data/breakpoints.json"));
const allowed = new Set(Object.values(points));
let count = 0;
function check(query, file) {
  if (!/(?:min-|max-)?width\b/.test(query)) return;
  const clauses = [...query.matchAll(/\([^()]*\bwidth\b[^()]*\)/g)].map((m) => m[0]);
  for (const clause of clauses) {
    const match = /^\(width (>=|<) (\d+)px\)$/.exec(clause);
    assert.ok(
      match && allowed.has(Number(match[2])),
      `${file}: non-system viewport query ${clause}`,
    );
    count++;
  }
}
for (const file of fs.readdirSync(path.join(ROOT, "css")).filter((x) => x.endsWith(".css"))) {
  postcss
    .parse(fs.readFileSync(path.join(ROOT, "css", file), "utf8"))
    .walkAtRules("media", (rule) => check(rule.params, file));
}
for (const file of fs.readdirSync(path.join(ROOT, "js")).filter((x) => x.endsWith(".js"))) {
  const source = fs.readFileSync(path.join(ROOT, "js", file), "utf8");
  for (const match of source.matchAll(/matchMedia\(\s*(['"])([^'"]+)\1/g)) check(match[2], file);
  for (const match of source.matchAll(/\b(?:vw|innerWidth|clientWidth)\s*([<>]=?)\s*(\d+)\b/g)) {
    assert.ok(
      ["<", ">="].includes(match[1]) && allowed.has(Number(match[2])),
      `${file}: non-system viewport comparison ${match[0]}`,
    );
  }
}
console.log(
  `${count} viewport queries conform to ${Object.entries(points)
    .map(([name, value]) => `${name}=${value}px`)
    .join(", ")}.`,
);
