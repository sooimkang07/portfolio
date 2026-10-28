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

(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const b=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--no-sandbox']});const p=await b.newPage();await p.setViewport({width:402,height:819});for(const n of ['acuity','smart-bundles','notate','instagram-lists','neuk']){await p.goto(`http://127.0.0.1:${server.address().port}/${n}.html`,{waitUntil:'domcontentloaded'});console.log(n,await p.evaluate(()=>[...document.querySelectorAll('#solution > *,#problem > *, .nt-hero-head,.ig-decision-split,.ac-aistack .board__title,.cmp')].map(e=>({cls:e.className,tag:e.tagName,html:e.outerHTML.slice(0,1000),rows:getComputedStyle(e).gridTemplateRows}))));}await b.close();server.close()})();