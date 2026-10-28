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

(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--no-sandbox']});const out=path.join(ROOT,'_qa/mobile42');fs.mkdirSync(out,{recursive:true});let results=[];
 for(const width of [390,768,1440])for(const name of ['index','about','yap','notate','instagram-lists','neuk','acuity','smart-bundles','forage']){
 const p=await b.newPage();await p.setViewport({width,height:900,deviceScaleFactor:1});await p.goto(`http://127.0.0.1:${server.address().port}/${name}.html`,{waitUntil:'domcontentloaded'});await p.evaluate(()=>{document.querySelector('.portfolio-intro')?.remove();document.documentElement.style.overflow='';document.querySelectorAll('img[loading="lazy"]').forEach(i=>i.loading='eager')});await sleep(350);
 const info=await p.evaluate(()=>{const rect=e=>{if(!e)return null;const r=e.getBoundingClientRect(),c=getComputedStyle(e);return {x:r.x,y:r.y,w:r.width,h:r.height,mt:c.marginTop,pt:c.paddingTop,pb:c.paddingBottom,gap:c.gap,cols:c.gridTemplateColumns}};return{overflow:document.documentElement.scrollWidth>innerWidth,hero:rect(document.querySelector('.home-greeting')),logoName:document.querySelector('.nav__logo-name')?getComputedStyle(document.querySelector('.nav__logo-name')).display:null,about:[...document.querySelectorAll('.ab-h1,.ab-actions,.ab-reel')].map(e=>({cls:e.className,...rect(e)})),pairs:[...document.querySelectorAll('.yap-test-pair,.ig-comparison,.phones-fig--bundles,.yap-catch-up .dx-grid,.nt-hero-head')].map(e=>({cls:e.className,...rect(e)})),tables:[...document.querySelectorAll('.cmp')].map(e=>({headerBottom:Math.max(...[...e.querySelectorAll('.cmp__h')].map(x=>x.getBoundingClientRect().bottom)),rowStart:e.querySelector('.cmp__r')?.getBoundingClientRect().top,highlight:rect(e.querySelector('.cmp__hi')),table:rect(e)})),reel:document.querySelector('.home-hero__video')?{t:document.querySelector('.home-hero__video').currentTime,paused:document.querySelector('.home-hero__video').paused,loop:document.querySelector('.home-hero__video').loop}:null}});results.push({name,width,...info});
 if(width===390||name==='about'&&width===1440){await p.screenshot({path:path.join(out,`${name}-${width}.png`)});for(const [i,sel] of ['.ab-hero','.ig-problems','.ig-comparison','.nk-land','.ac-aistack','.phones-fig--bundles','.yap-test-pair','.fig.board:has(.cmp)'].entries()){const el=await p.$(sel);if(el){await el.evaluate(e=>e.scrollIntoView({block:'center'}));await sleep(100);await el.screenshot({path:path.join(out,`${name}-${width}-${i}.png`)}).catch(()=>{})}}}
 await p.close();}fs.writeFileSync(path.join(out,'metrics.json'),JSON.stringify(results,null,2));console.log(JSON.stringify(results.filter(x=>x.overflow||x.tables.some(t=>t.headerBottom>t.rowStart+1))));await b.close();server.close();})();