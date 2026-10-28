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

(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--no-sandbox']});const config={neuk:['.fig.nk-land'],acuity:['.fig.board:has(.cmp)','.fig.ac-aistack','.fig.ac-vstack'],'instagram-lists':['.fig.ig-privacy-figure'],'smart-bundles':['.phones-fig--bundles','.fig.board:has(.cmp)']};for(const [name,sels] of Object.entries(config)){const p=await b.newPage();await p.setViewport({width:1440,height:1000,deviceScaleFactor:2});await p.goto(`http://127.0.0.1:${server.address().port}/${name}.html`,{waitUntil:'domcontentloaded'});await p.addStyleTag({content:'[data-reveal],.reveal-ready{opacity:1!important;transform:none!important}*{transition:none!important;animation:none!important}'});await p.evaluate(()=>{document.querySelectorAll('img').forEach(i=>i.loading='eager')});await p.evaluate(()=>Promise.all([...document.images].map(i=>i.decode().catch(()=>{}))));for(const [n,sel] of sels.entries()){const el=await p.$(sel);if(!el)continue;const meta=await el.evaluate(e=>({section:e.closest('section')?.id||'research',project:document.body.dataset.case}));const dir=path.join(ROOT,'assets',meta.project,({architecture:'build',decisions:'design-decisions'}[meta.section]||meta.section),'figures');fs.mkdirSync(dir,{recursive:true});await el.evaluate(e=>e.scrollIntoView({block:'center'}));await sleep(150);await el.screenshot({path:path.join(dir,`mobile-polish-${n+1}.png`)});console.log(name,sel,meta);}
 if(name==='smart-bundles'){await p.setViewport({width:390,height:900,deviceScaleFactor:1});console.log('screens',await p.$$eval('.sb-solution-phones img',es=>es.map(e=>({src:e.src,complete:e.complete,w:e.naturalWidth,h:e.naturalHeight,rect:e.getBoundingClientRect().toJSON(),style:getComputedStyle(e).objectFit}))));const el=await p.$('.phones-fig--bundles');await el.screenshot({path:path.join(ROOT,'_qa/mobile42/smart-final.png')});}await p.close();}await b.close();server.close()})();