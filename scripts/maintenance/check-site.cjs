/* Responsive regression inventory and local dependency checks.
   node scripts/maintenance/check-site.cjs <label> [390,768,1440]
   Uses the existing browser tooling; does not install or alter dependencies. */
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "../..");
const puppeteer = require(path.join(ROOT, "_docs/tools/node_modules/puppeteer-core"));
const label = process.argv[2] || "check";
const widths = (process.argv[3] || "390,768,1440").split(",").map(Number);
const output = path.join(ROOT, "unused/shared/verification", label);
const pages = [
  "index",
  "work",
  "about",
  "explorations",
  "password",
  "yap",
  "notate",
  "instagram-lists",
  "neuk",
  "acuity",
  "smart-bundles",
  "forage",
];
const server = require("./server.cjs")(ROOT);
(async () => {
  fs.mkdirSync(output, { recursive: true });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const browser = await puppeteer.launch({
    executablePath:
      process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: true,
    args: ["--no-sandbox"],
  });
  const results = [];
  try {
    for (const width of widths)
      for (const name of pages) {
        const page = await browser.newPage();
        const errors = [],
          missing = [];
        await page.setViewport({ width, height: 1000 });
        page.on("pageerror", (e) => errors.push(e.message));
        page.on("response", (r) => {
          if (r.url().startsWith("http://127.0.0.1:") && r.status() === 404)
            missing.push(new URL(r.url()).pathname);
        });
        await page.goto(`http://127.0.0.1:${server.address().port}/${name}.html`, {
          waitUntil: "domcontentloaded",
        });
        await page.evaluate(async () => {
          await document.fonts.ready;
          document.querySelectorAll("video").forEach((v) => {
            v.pause();
            v.autoplay = false;
            v.addEventListener("play", () => v.pause());
          });
          document.querySelectorAll("img").forEach((i) => (i.loading = "eager"));
          await Promise.race([
            Promise.all([...document.images].map((i) => i.decode().catch(() => {}))),
            new Promise((r) => setTimeout(r, 2500)),
          ]);
          await new Promise((r) => setTimeout(r, 2200));
        });
        await page.addStyleTag({
          content:
            "*, *::before, *::after { animation-play-state: paused !important; transition: none !important; }",
        });
        const state = await page.evaluate(() => {
          const seen = {};
          const data = [...document.querySelectorAll("body *")]
            .filter((e) => !e.closest("svg,script,style,iframe"))
            .map((e) => {
              const c = getComputedStyle(e),
                r = e.getBoundingClientRect();
              const base = [e.tagName, e.id, e.getAttribute("class"), e.getAttribute("src")].join(
                "|",
              );
              const n = seen[base] || 0;
              seen[base] = n + 1;
              return {
                key: base + "|" + n,
                rect: [r.x, r.y, r.width, r.height].map((x) => Math.round(x * 100) / 100),
                display: c.display,
                font: c.fontSize,
                lineHeight: c.lineHeight,
                margin: c.margin,
                padding: c.padding,
                gap: c.gap,
                radius: c.borderRadius,
              };
            });
          return {
            data,
            overflow: document.documentElement.scrollWidth > innerWidth + 1,
            brokenImages: [...document.images]
              .filter((i) => !i.complete || !i.naturalWidth)
              .map((i) => i.getAttribute("src")),
          };
        });
        if (width !== 768 && ["index", "about", "work", "neuk", "forage"].includes(name))
          await page.screenshot({
            path: path.join(output, `${name}-${width}.png`),
          });
        results.push({
          name,
          width,
          ...state,
          errors,
          missing: [...new Set(missing)],
        });
        console.log(name, width);
        await page.close();
      }
    fs.writeFileSync(path.join(output, "layout.json"), JSON.stringify(results));
  } finally {
    await browser.close();
    server.close();
  }
})();
