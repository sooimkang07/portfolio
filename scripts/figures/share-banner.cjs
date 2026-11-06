// Export the link preview banner: node scripts/figures/share-banner.cjs [output.png]
// Uses puppeteer-core from _docs/tools and the installed Google Chrome.
const path = require('path');
const root = path.resolve(__dirname, '../..');
const puppeteer = require(path.join(root, '_docs/tools/node_modules/puppeteer-core'));

const output = process.argv[2] || path.join(root, 'assets/share/banner.png');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: 'new',
    args: ['--allow-file-access-from-files', '--hide-scrollbars'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 2 });
  await page.goto('file://' + path.join(__dirname, 'share-banner.html'), { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: output });
  await browser.close();
})();
