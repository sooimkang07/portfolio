// Homepage reel checks against a Range-capable server (like GitHub Pages).
//   node site-test.cjs sources | handoff | player
const path = require('path'), fs = require('fs'), http = require('http');
const ROOT = '/Users/sooimkang/Developer/portfolio';
const OUT = path.join(__dirname, 'site-shots');
const puppeteer = require(path.join(ROOT, '_docs/tools/node_modules/puppeteer-core'));
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml',
	'.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.mp4': 'video/mp4', '.m4a': 'audio/mp4', '.woff2': 'font/woff2', '.ico': 'image/x-icon' };
const server = http.createServer((req, res) => {
	let p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0].split('#')[0]));
	try { if (fs.statSync(p).isDirectory()) p = path.join(p, 'index.html'); } catch { if (!path.extname(p) && fs.existsSync(p + '.html')) p += '.html'; }
	fs.stat(p, (err, st) => {
		if (err || !st.isFile()) { res.writeHead(404); return res.end(); }
		const type = MIME[path.extname(p).toLowerCase()] || 'application/octet-stream';
		const m = /bytes=(\d*)-(\d*)/.exec(req.headers.range || '');
		if (m) {
			const a = m[1] ? +m[1] : st.size - +m[2], b = m[1] && m[2] ? Math.min(+m[2], st.size - 1) : st.size - 1;
			res.writeHead(206, { 'Content-Type': type, 'Content-Range': `bytes ${a}-${b}/${st.size}`, 'Accept-Ranges': 'bytes', 'Content-Length': b - a + 1 });
			return fs.createReadStream(p, { start: a, end: b }).pipe(res);
		}
		res.writeHead(200, { 'Content-Type': type, 'Content-Length': st.size, 'Accept-Ranges': 'bytes' });
		fs.createReadStream(p).pipe(res);
	});
});
const sleep = ms => new Promise(r => setTimeout(r, ms));
const MODE = process.argv[2] || 'sources';

(async () => {
	await new Promise(r => server.listen(0, '127.0.0.1', r));
	const URL = `http://127.0.0.1:${server.address().port}/`;
	fs.mkdirSync(OUT, { recursive: true });
	const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new',
		args: ['--autoplay-policy=no-user-gesture-required', '--hide-scrollbars'] });
	const open = async (vp, hash = '') => {
		const page = await browser.newPage();
		await page.setViewport(vp);
		page.on('pageerror', e => console.log('  page error:', e.message));
		page.on('console', m => { if (m.type() === 'error') console.log('  console:', m.text()); });
		await page.goto(URL + hash, { waitUntil: 'domcontentloaded' });
		return page;
	};
	const reel = page => page.evaluate(() => {
		const v = document.querySelector('.home-hero__video'), m = v.closest('.home-hero__media');
		return { src: (v.currentSrc || '').replace(/^.*\/assets\//, 'assets/'), t: +v.currentTime.toFixed(2), dur: +(v.duration || 0).toFixed(2), paused: v.paused, ended: v.ended,
			w: v.videoWidth, h: v.videoHeight, player: m.classList.contains('is-player'), fit: getComputedStyle(v).objectFit, intro: !!document.querySelector('.portfolio-intro'),
			audioBytes: v.webkitAudioDecodedByteCount };
	});
	const warm = async vp => { const w = await open(vp, '#warm'); await w.evaluate(async () => { await document.fonts.load("500 40px 'Instrument Sans'"); await document.fonts.ready; }); await w.close(); };




 const report=[];
 for(const width of [390,768,1440]) {
  const page=await open({width,height:900,deviceScaleFactor:1});await sleep(4500);
  await page.screenshot({path:path.join(__dirname,`hierarchy21/home-${width}.png`)});
  for(const name of ['yap','notate','instagram-lists','neuk','acuity','smart-bundles','forage']){
   await page.goto(URL+name+'.html',{waitUntil:'domcontentloaded'});await sleep(1000);
   const data=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,sections:[...document.querySelectorAll('.nt-section')].map(e=>({id:e.id,margin:getComputedStyle(e).marginBlockStart,children:[...e.children].map(c=>({cls:c.className,margin:getComputedStyle(c).marginBlockStart}))})),subsections:[...document.querySelectorAll('.nt-step,.nt-feature,.dx-step,.nt-decision,.ig-decision,.sb-decision,.case__flow-block')].filter(e=>e.previousElementSibling).map(e=>({cls:e.className,margin:getComputedStyle(e).marginBlockStart})),logo:getComputedStyle(document.querySelector('.nav__logo')).borderRadius}));
   report.push({name,width,...data});
   console.log(name,width,'overflow',data.overflow,'subsection margins',[...new Set(data.subsections.map(e=>e.margin))]);
   if(name==='yap'){
    console.log('media heights',await page.$$eval('.yap-test-pair__cell',els=>els.map(e=>e.firstElementChild.getBoundingClientRect().height)));
    await page.$eval('.yap-test-pair',e=>e.scrollIntoView());await sleep(100);await page.screenshot({path:path.join(__dirname,`hierarchy21/yap-testing-${width}.png`)});
   }
   if(name==='notate')console.log('store cards',await page.$$eval('.nt-store-card',e=>e.length));
  }
  await page.goto(URL+'about.html',{waitUntil:'domcontentloaded'});await sleep(1500);await page.screenshot({path:path.join(__dirname,`hierarchy21/about-${width}.png`)});
  await page.close();
 }
 fs.writeFileSync(path.join(__dirname,'hierarchy21/audit.json'),JSON.stringify(report,null,2));

	await browser.close(); server.close();
})();
