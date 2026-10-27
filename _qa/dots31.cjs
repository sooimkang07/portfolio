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









 const exports=[];
 const slug=s=>(s||'').toLowerCase().replace(/&/g,'and').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
 for(const name of ['instagram-lists','yap','notate','neuk','acuity','smart-bundles','forage']){
 const page=await open({width:1440,height:1000,deviceScaleFactor:2});await page.goto(URL+name+'.html',{waitUntil:'domcontentloaded'});await sleep(700);
 await page.addStyleTag({content:'.nav,.nt-rail,.flow__controls,.igx__btn,.yap-rail__btn{visibility:hidden!important} [data-reveal]{opacity:1!important;transform:none!important} *{scroll-behavior:auto!important;animation-play-state:paused!important;transition:none!important}'});
 await page.evaluate(()=>{document.querySelectorAll('img[loading]').forEach(e=>e.loading='eager');document.querySelectorAll('.reveal-ready').forEach(e=>e.classList.add('is-in'))});
 const figs=await page.evaluate(()=>[...document.querySelectorAll('main figure')].filter(f=>!f.parentElement.closest('figure')&&f.getBoundingClientRect().width>0&&[f,...f.querySelectorAll('*')].some(e=>getComputedStyle(e).backgroundImage.includes('radial-gradient(rgb(214, 217, 220)'))).map((f,i)=>{f.dataset.dotExport=i;const sec=f.closest('section');return {i,cls:f.className,id:sec?.id||'overview',title:sec?.querySelector('.nt-kicker')?.textContent||''}}));
 const project=name==='instagram-lists'?'instagram':name;
 for(const f of figs){
 const base=path.join(ROOT,'assets',project);
 const aliases={features:'core-features',testing:'testing-and-debugging',system:'system-thinking',decisions:'design-decisions','overview-problem':'overview','overview-challenge':'overview'};
 const section=[slug(f.title),f.id,aliases[f.id],'overview'].find(n=>n&&fs.existsSync(path.join(base,n)));
 const dir=path.join(base,section,'figures');fs.mkdirSync(dir,{recursive:true});
 const target=await page.$(`[data-dot-export="${f.i}"]`);
 await target.evaluate(e=>e.scrollIntoView({block:'center'}));await sleep(150);
 await target.evaluate(async e=>{await Promise.race([Promise.all([...e.querySelectorAll('img')].map(i=>i.decode().catch(()=>{}))),new Promise(r=>setTimeout(r,3000))]);e.querySelectorAll('video').forEach(v=>v.pause())});
 const file=path.join(dir,`dot-grid-${String(f.i+1).padStart(2,'0')}-${slug(f.cls).slice(0,60)}.png`);
 await target.screenshot({path:file});exports.push(file);
 }
 console.log(name,'exports',figs.length);
 for(const width of [390,768,1440]){await page.setViewport({width,height:900,deviceScaleFactor:1});const sizes=await page.evaluate(()=>[...new Set([...document.querySelectorAll('main *')].filter(e=>getComputedStyle(e).backgroundImage.includes('radial-gradient(rgb(214, 217, 220)')).map(e=>getComputedStyle(e).backgroundSize))]);console.log(name,width,sizes);}
 await page.close();
 }
 fs.writeFileSync(path.join(__dirname,'dots30/exports.json'),JSON.stringify(exports,null,2));

	await browser.close(); server.close();
})();
