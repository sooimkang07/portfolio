// Check actual flex hierarchy, gaps, child margins, overflow and page errors.
const root = require("path").resolve(__dirname, "../.."),
  server = require(root + "/scripts/maintenance/server.cjs")(root),
  p = require(root + "/_docs/tools/node_modules/puppeteer-core");
(async () => {
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  let b;
  try {
    b = await p.launch({
      executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      headless: true,
      args: ["--no-sandbox"],
    });
    const page = await b.newPage();
    let results = [];
    for (const width of [390, 760, 1200, 1440]) {
      await page.setViewport({ width, height: 1000 });
      for (const name of [
        "yap",
        "notate",
        "instagram-lists",
        "neuk",
        "acuity",
        "smart-bundles",
        "forage",
      ]) {
        const errors = [];
        const listener = (e) => errors.push(e.message);
        page.on("pageerror", listener);
        await page.goto(`http://127.0.0.1:${server.address().port}/${name}.html`, {
          waitUntil: "domcontentloaded",
        });
        await new Promise((r) => setTimeout(r, 150));
        const state = await page.evaluate(() => {
          const css = (e) => getComputedStyle(e),
            visible = (e) => css(e).display !== "none";
          const issues = [];
          const unit = parseFloat(css(document.documentElement).fontSize);
          for (const [sel, gap] of [
            [".nt-main", `${(innerWidth >= 1200 ? 3 : 1) * unit}px`],
            [".case-cover-group", `${(innerWidth >= 760 ? 1 : 0.5) * unit}px`],
            [".nt-chapters", `${6 * unit}px`],
            [".nt-section:not(#build)", `${3 * unit}px`],
            ["#build", `${unit}px`],
            [".nt-subsection", `${unit}px`],
          ])
            for (const e of document.querySelectorAll(sel)) {
              const s = css(e);
              const paired = innerWidth >= 760 && e.matches(".nt-section:has(> .ntf-takeaway)");
              const expectedGap = sel === "#build" && ["forage", "yap"].includes(document.body.dataset.case) ? `${3 * unit}px` : gap;
              if (s.display !== "flex" || s.flexDirection !== (paired ? "row" : "column") || s.rowGap !== expectedGap)
                issues.push([sel, e.id, e.className, s.display, s.flexDirection, s.rowGap]);
              for (const c of e.children) {
                if (sel.startsWith(".nt-section") && !c.matches("section.nt-subsection, .case-subsection-stack"))
                  issues.push(["unclassified-subsection", e.id, c.tagName, c.className]);
                const cs = css(c);
                if (cs.marginBlockStart !== "0px" || cs.marginBlockEnd !== "0px")
                  issues.push([
                    "child-margin",
                    sel,
                    c.tagName,
                    c.className,
                    cs.marginBlockStart,
                    cs.marginBlockEnd,
                  ]);
              }
            }
          if (innerWidth < 1200) {
            const rail = document.querySelector(".nt-rail").getBoundingClientRect();
            const title = document.querySelector(".nt-hero h1").getBoundingClientRect();
            if (Math.abs(title.top - rail.bottom - unit) > 1)
              issues.push(["toc-title-gap", title.top - rail.bottom]);
          }
          for (const tabs of document.querySelectorAll(".yap-it__tabs, .ig-ex__tabs")) {
            if (css(tabs).alignSelf !== "flex-start")
              issues.push(["stretched-tabs", tabs.className]);
          }
          for (const cell of document.querySelectorAll(".dx-cell")) {
            if (
              css(cell).display !== "flex" ||
              css(cell).rowGap !== `${0.5 * unit}px`
            )
              issues.push(["cell-gap", css(cell).display, css(cell).rowGap]);
            for (const child of cell.children) {
              if (css(child).marginBlockStart !== "0px" || css(child).marginBlockEnd !== "0px")
                issues.push(["cell-child-margin", child.className]);
            }
          }
          for (const [selector, expected] of [
            [
              "figcaption.case-caption, .nt-meta > div, .ig-ex__notes > div, .yap-it__brief, .ig-impact-list > li, .ig-questions > header, .yap-test-pair",
              0.5,
            ],
            [
              ".case-figure-group, .yap-it__notes, .yap-bug__text, .yap-bug__text > header",
              1,
            ],
          ]) {
            for (const e of document.querySelectorAll(selector)) {
              const relatedGap = e.matches(".yap-test-pair") ? 1 : expected;
              if (css(e).rowGap !== `${relatedGap * unit}px`)
                issues.push(["related-gap", e.className, css(e).rowGap]);
            }
          }
          if (innerWidth >= 760) {
            for (const comparison of document.querySelectorAll(".ig-comparison__item")) {
              if (css(comparison).gridTemplateColumns.split(" ").length !== 2) issues.push(["comparison-not-split"]);
            }
            for (const [selector, count] of [[".sb-solution-captions", 4], [".sb-next", 3]]) {
              for (const element of document.querySelectorAll(selector)) {
                if (css(element).gridTemplateColumns.split(" ").length !== count) issues.push(["column-count", selector]);
              }
            }
          }
          const astray = [];
          for (const e of document.querySelectorAll(
            ".nt-content > *, .nt-subsection > header > *, .nt-content > header > *, .nt-content > .nt-reading > *, .nt-subsection > .nt-reading > *, figcaption.case-caption > *",
          )) {
            if (!visible(e)) continue;
            const s = css(e);
            if (s.marginBlockStart !== "0px" || s.marginBlockEnd !== "0px")
              astray.push([e.tagName, e.className, s.marginBlockStart, s.marginBlockEnd]);
          }
          return {
            overflow: document.documentElement.scrollWidth > innerWidth + 1,
            issues,
            astray,
            subsections: document.querySelectorAll(".nt-subsection").length,
            pairs: [...document.querySelectorAll(".case-single-video")].map((e) => [
              e.tagName,
              e.className,
              css(e).display,
            ]),
          };
        });
        results.push({ name, width, errors, ...state });
        page.off("pageerror", listener);
      }
    }
    const failures = results.filter(
      (r) => r.overflow || r.issues.length || r.astray.length || r.errors.length,
    );
    if (failures.length) {
      console.log(JSON.stringify(failures, null, 2));
      process.exitCode = 1;
    }
    console.log("Checked " + results.length + " page/viewport combinations.");
  } finally {
    await b?.close();
    server.close();
  }
})();
