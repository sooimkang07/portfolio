const fs = require("fs");
const path = require("path");
const assert = require("assert/strict");
const ROOT = path.resolve(__dirname, "../..");
const server = require("./server.cjs")(ROOT);
const puppeteer = require(path.join(ROOT, "_docs/tools/node_modules/puppeteer-core"));
const delay = (n) => new Promise((r) => setTimeout(r, n));
(async () => {
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const browser = await puppeteer.launch({
    executablePath:
      process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: true,
    args: ["--no-sandbox"],
  });
  const checks = [];
  try {
    for (const width of [390, 1440]) {
      const p = await browser.newPage();
      await p.setViewport({ width, height: 1000 });
      await p.goto(`http://127.0.0.1:${server.address().port}/`, { waitUntil: "domcontentloaded" });
      await p.waitForFunction(() => !document.querySelector(".portfolio-intro"), { timeout: 8000 });
      await delay(300);
      await p.screenshot({
        path: path.join(ROOT, "unused/shared/verification", `static-home-${width}.png`),
      });
      assert.equal(
        await p.$eval(".home-hero video", (v) => v.muted && v.loop && v.readyState >= 2),
        true,
      );
      checks.push(`Showreel muted loop loaded at ${width}`);
      if (width === 390) {
        await p.click(".nav__burger");
        await delay(500);
        assert.equal(await p.$eval(".nav__burger", (b) => b.getAttribute("aria-expanded")), "true");
        await p.click(".nav__burger");
        await delay(500);
        assert.equal(
          await p.$eval(".nav__burger", (b) => b.getAttribute("aria-expanded")),
          "false",
        );
        checks.push("Mobile navigation opens and closes");
      }
      await p.$eval("[data-ref-showreel-video]", (e) => e.click());
      await delay(500);
      assert.equal(
        await p.evaluate(() => document.body.classList.contains("is-showreel-open")),
        true,
      );
      await p.keyboard.press("Escape");
      await delay(500);
      assert.equal(
        await p.evaluate(() => document.body.classList.contains("is-showreel-open")),
        false,
      );
      checks.push(`Showreel opens and Escape closes at ${width}`);
      await p.evaluate(() => scrollTo(0, 200));
      await delay(300);
      const expanded = await p.$eval(".home-hero", (e) =>
        Number(getComputedStyle(e).getPropertyValue("--reel-expand")),
      );
      assert.ok(expanded > 0);
      checks.push(`Reel expands on scroll at ${width}`);
      await p.close();
    }
    const p = await browser.newPage();
    await p.setViewport({ width: 390, height: 1000 });
    await p.goto(`http://127.0.0.1:${server.address().port}/smart-bundles.html`, {
      waitUntil: "domcontentloaded",
    });
    assert.equal(
      await p.$eval("[data-card-carousel]", (e) => getComputedStyle(e).scrollPaddingInlineStart),
      "12px",
    );
    checks.push("Carousel resolves relative token to a measured inset");
    for (const name of ["notate-demo/", "yap-demo/", "forage-demo/", "reel/", "resume.html"]) {
      const r = await p.goto(`http://127.0.0.1:${server.address().port}/${name}`, {
        waitUntil: "domcontentloaded",
      });
      assert.ok(r.status() < 400);
      checks.push(`${name} entry loads`);
    }
    for (const width of [320, 390, 1440]) {
      await p.setViewport({ width, height: 1000 });
      await p.goto(`http://127.0.0.1:${server.address().port}/password.html`, {
        waitUntil: "domcontentloaded",
      });
      assert.equal(
        await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
        false,
      );
      await p.type("#gate-password", "incorrect");
      await p.click("form button");
      await p.waitForFunction(
        () => document.querySelector('[role="alert"]').textContent.length > 0,
      );
      checks.push(`Password gate fits and validates at ${width}`);
      if (width === 320)
        await p.screenshot({
          path: path.join(ROOT, "unused/shared/verification/password-320.png"),
        });
    }
    await p.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
    for (const name of ["index", "about", "yap"]) {
      await p.setViewport({ width: 390, height: 1000 });
      await p.goto(`http://127.0.0.1:${server.address().port}/${name}.html`, {
        waitUntil: "domcontentloaded",
      });
      await p.evaluate(() => {
        document.documentElement.style.fontSize = "125%";
      });
      await delay(250);
      assert.equal(
        await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
        false,
      );
      checks.push(`${name} fits a phone at 125% root text size with reduced motion`);
    }
    await p.close();
    fs.writeFileSync(
      path.join(ROOT, "unused/shared/verification/interactions.json"),
      JSON.stringify(checks, null, 2),
    );
    console.log(checks.join("\n"));
  } finally {
    await browser.close();
    server.close();
  }
})();
