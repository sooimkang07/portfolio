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
  const page=await open({width,height:900,deviceScaleFactor:1});await sleep(4000);
  for(const name of ['yap','notate','instagram-lists','neuk','acuity','smart-bundles','forage']){
   await page.goto(URL+name+'.html',{waitUntil:'domcontentloaded'});await sleep(1000);
   const data=await page.evaluate(()=>{
    const sub='.nt-step,.dx-step,.nt-feature,.nt-decision,.ig-decision,.sb-decision,.case__flow-block,.fg-pair-step,.nt-reading,.yap-figtitle,.case__subhead,.nk-rooms-section,.yap-hmw,.ig-hmw';
    const sections=[...document.querySelectorAll('.nt-section')];
    return {overflow:document.documentElement.scrollWidth>innerWidth,mediaGap:getComputedStyle(document.body).getPropertyValue('--sp-media').trim(),sections:sections.map(e=>({id:e.id,gap:getComputedStyle(e).marginBlockStart,children:[...e.children].map(c=>({cls:c.className,margin:getComputedStyle(c).marginBlockStart}))})),subsections:sections.flatMap(e=>[...e.children].filter(c=>c.previousElementSibling&&c.matches(sub)).map(c=>({section:e.id,cls:c.className,gap:parseFloat(getComputedStyle(c).marginBlockStart)})))};
   });
   const expected=width<=700?32:48;
   const errors=data.subsections.filter(e=>e.gap!==expected);
   report.push({name,width,...data,errors});console.log(name,width,'media',data.mediaGap,'subsection errors',errors.length,'overflow',data.overflow);if(errors.length)console.log(errors);
   if(width!==768){
    const section=await page.$('#research') || await page.$('#build') || await page.$('.nt-section');
    await section.evaluate(e=>e.scrollIntoView());await sleep(800);
    await page.screenshot({path:path.join(__dirname,`flow26/${name}-${width}.png`)});
   }
  }
  await page.close();
 }
 fs.writeFileSync(path.join(__dirname,'flow26/audit.json'),JSON.stringify(report,null,2));

	await browser.close(); server.close();
})();
