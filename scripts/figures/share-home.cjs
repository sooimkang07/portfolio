// Capture the homepage as the link preview image.
// Serve the site first, then: node scripts/figures/share-home.cjs http://127.0.0.1:8799/ [output.jpg]
// The same-origin referrer makes the page skip its intro, as it does on internal returns.
// Three changes apply to this capture only, not to the site: the nav is hidden, the space
// around the greeting closes up so the reel shows, and a sharp frame from the reel's opening sits over the video.
const path = require('path');
const root = path.resolve(__dirname, '../..');
const puppeteer = require(path.join(root, '_docs/tools/node_modules/puppeteer-core'));

const url = process.argv[2];
const output = process.argv[3] || path.join(root, 'assets/share/home.jpg');
const FRAME = 'assets/share/reel-frame.jpg'; // 3.5s into the reel

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: 'new',
    args: ['--hide-scrollbars'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 2 });
  await page.goto(url, { referer: new URL('work', url).href, waitUntil: 'networkidle2', timeout: 60000 });
  await page.addStyleTag({
    content: `#main-nav {
      display: none !important;
    }
    .home-greeting {
      min-block-size: 0 !important;
      block-size: auto !important;
      margin-block-start: 0 !important;
      padding-block: calc(var(--s-11) + var(--s-6)) !important;
    }`,
  });
  await page.evaluate(async (frame) => {
    const video = document.querySelector('.home-hero__video');
    video.pause();
    const image = new Image();
    image.src = frame;
    await image.decode();
    image.style.cssText = 'position:absolute;inset:0;inline-size:100%;block-size:100%;object-fit:cover;z-index:1;transform:translateY(-1.5rem)';
    video.after(image);
    await document.fonts.ready;
  }, FRAME);
  await new Promise((resolve) => setTimeout(resolve, 1500));
  await page.screenshot({ path: output, type: 'jpeg', quality: 88 });
  await browser.close();
})();
