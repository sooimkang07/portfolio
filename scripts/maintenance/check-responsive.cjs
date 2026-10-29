/* Exercise every canonical boundary and live resize behavior across all pages. */
const fs = require("fs");
const path = require("path");
const assert = require("assert/strict");
const ROOT = path.resolve(__dirname, "../..");
const points = require(path.join(ROOT, "data/breakpoints.json"));
const widths = Object.values(points).flatMap((n) => [n - 1, n]);
const server = require("./server.cjs")(ROOT);
const puppeteer = require(path.join(ROOT, "_docs/tools/node_modules/puppeteer-core"));
const output = path.join(ROOT, "unused/shared/verification/breakpoints");
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
const delay = (n) => new Promise((r) => setTimeout(r, n));
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
    for (const name of pages) {
      const page = await browser.newPage();
      const errors = [],
        missing = [];
      await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
      await page.setViewport({ width: 390, height: 1000 });
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
          new Promise((r) => setTimeout(r, 1500)),
        ]);
      });
      await page.addStyleTag({
        content:
          "*, *::before, *::after { transition: none !important; animation: none !important; }",
      });
      for (const width of widths) {
        await page.setViewport({ width, height: 1000 });
        await page.evaluate(() => scrollTo(0, 0));
        await delay(180);
        const state = await page.evaluate(() => {
          const css = (e) => (e ? getComputedStyle(e) : null);
          const body = css(document.body),
            root = css(document.documentElement);
          const cover = document.querySelector(".case-cover");
          const group = document.querySelector(".case-single-video");
          const meta = document.querySelector(".nt-meta");
          const hero = document.querySelector(".ab-hero");
          const burger = document.querySelector(".nav__burger");
          return {
            overflow: document.documentElement.scrollWidth > innerWidth + 1,
            coverTop: cover?.getBoundingClientRect().top,
            toc: css(document.querySelector(".nt-rail"))?.position,
            columns: css(group)?.gridTemplateColumns.split(" ").length,
            metaColumns: css(meta)?.gridTemplateColumns.split(" ").length,
            aboutColumns: css(hero)?.gridTemplateColumns.split(" ").length,
            homeIndex: css(document.querySelector(".home-work__index-shell"))?.display,
            burgerOpacity: css(burger)?.opacity,
            caption: css(document.querySelector("figcaption.case-caption"))?.marginBlockStart,
          };
        });
        const issues = [];
        if (state.overflow) issues.push("horizontal overflow");
        if (state.coverTop !== undefined) {
          if (Math.abs(state.coverTop - (width < points.tablet ? 68 : 76)) > 1)
            issues.push(`cover offset ${state.coverTop}`);
          if (state.toc !== (width < points.desktop ? "sticky" : "absolute"))
            issues.push(`TOC ${state.toc}`);
          if (state.metaColumns !== (width < points.tablet ? 2 : 4))
            issues.push(`metadata ${state.metaColumns} columns`);
        }
        if (
          state.aboutColumns !== undefined &&
          state.aboutColumns !== (width < points.wide ? 1 : 2)
        )
          issues.push(`About ${state.aboutColumns} columns`);
        if (state.homeIndex && state.homeIndex !== (width < points.desktop ? "contents" : "block"))
          issues.push(`home index ${state.homeIndex}`);
        results.push({ name, width, ...state, issues });
        if (["index", "about"].includes(name) && [759, 760, 1199, 1200, 1359, 1360].includes(width))
          await page.screenshot({ path: path.join(output, `${name}-${width}.png`) });
      }
      results.push({ name, errors, missing: [...new Set(missing)] });
      console.log(name, "12 boundaries checked");
      await page.close();
    }
    fs.writeFileSync(path.join(output, "results.json"), JSON.stringify(results, null, 2));
    const failures = results.filter(
      (r) => r.issues?.length || r.errors?.length || r.missing?.length,
    );
    assert.deepEqual(failures, []);
    console.log("Passed all 144 page/boundary combinations.");
  } finally {
    await browser.close();
    server.close();
  }
})();
