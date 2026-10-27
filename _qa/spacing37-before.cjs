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
 for(const width of [390,768,1440]){
 const page=await open({width,height:900,deviceScaleFactor:1});
 for(const name of ['yap','notate','instagram-lists','neuk','acuity','smart-bundles','forage']){
 await page.goto(URL+name+'.html',{waitUntil:'domcontentloaded'});await page.evaluate(async()=>{await document.fonts.ready;document.querySelectorAll('main img').forEach(i=>i.loading='eager');await Promise.race([Promise.all([...document.querySelectorAll('main img')].map(i=>i.decode().catch(()=>{}))),new Promise(r=>setTimeout(r,3000))])});
 const data=await page.evaluate(()=>{
 const vis=e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return r.width>0&&r.height>0&&s.position!=='absolute'&&s.position!=='fixed'&&s.display!=='none'};
 const type=e=>{if(e.matches('.case-caption'))return 'caption';if(e.matches('.media-caption__title'))return 'cap-title';if(e.matches('.media-caption__body'))return 'cap-body';if(e.matches('.nt-step-label,.nt-kicker'))return 'label';if(e.matches('h1,h2,h3,h4'))return 'heading';if(e.matches('p,ul,ol,blockquote'))return 'text';if(e.matches('figure,video,img,svg'))return 'media';if(e.matches('.nt-step,.nt-feature,.nt-decision,.ig-decision,.sb-decision,.dx-step'))return 'subsection';if(e.querySelector('img,video,svg,.fig'))return e.querySelector('h3,p:not(.media-caption__body):not(.nt-kicker):not(.nt-step-label)')?'mixed':'media-group';if(e.querySelector('.media-caption__title'))return 'caption';return 'copy'};
 const ident=e=>e.tagName.toLowerCase()+(e.id?'#'+e.id:'')+'.'+String(e.className).replace(/ /g,'.');
 const rows=[];
 for(const p of document.querySelectorAll('main *')){
 if(p.closest('.fig,.screen-rail,.yap-rail,.flow__controls,.ig-ex,.yap-it,.fg-carousel,.nt-browser'))continue;
 const outer=p.closest('figure');
 if(outer && !p.matches('.dx-cell,.yap-problem__cell,.yap-test-pair__cell,.yap-call') && !p.querySelector(':scope > .media-caption__title'))continue;
 const kids=[...p.children].filter(vis).filter(e=>!e.matches('button,script,style,audio,source'));
 for(let i=1;i<kids.length;i++){
 const a=kids[i-1],b=kids[i],ar=a.getBoundingClientRect(),br=b.getBoundingClientRect();
 const overlap=Math.min(ar.right,br.right)-Math.max(ar.left,br.left);if(overlap<Math.min(ar.width,br.width)*.7||br.top<ar.bottom-1)continue;
 const at=type(a),bt=type(b);let expected=null;
 if(a.matches('.nt-hero,.nt-section')||b.matches('.nt-hero,.nt-section'))expected=null;
 else if(getComputedStyle(p).display==='contents')expected=null;
 else if(at==='cap-title'&&bt==='cap-body')expected=8;
 else if(bt==='caption'&&b.matches('.nt-reading:not(.case-caption)'))expected=null;
 else if(at==='caption'&&bt==='caption')expected=innerWidth<=700?32:48;
 else if(bt==='caption'||bt==='cap-title'&&at==='media')expected=12;
 else if((at==='media'||at==='media-group')&&(bt==='media'||bt==='media-group'))expected=12;
 else if(bt==='subsection'&&!p.matches('.nt-feature-heading'))expected=innerWidth<=700?32:48;
 else if((at==='copy'||at==='text')&&(bt==='media'||bt==='media-group'))expected=innerWidth<=700?16:24;
 else if(['label','heading','text'].includes(at)&&['heading','text'].includes(bt))expected=12;
 const gap=Math.round((br.top-ar.bottom)*100)/100;
 rows.push({parent:ident(p),a:ident(a),b:ident(b),at,bt,gap,expected,margin:getComputedStyle(b).marginTop,parentGap:getComputedStyle(p).rowGap,section:p.closest('.nt-section')?.id,excerpt:b.textContent.trim().slice(0,65)});
 }
 }
 return {rows,overflow:document.documentElement.scrollWidth>innerWidth};
 });
 report.push({name,width,...data});console.log(name,width,'rows',data.rows.length,'suspects',data.rows.filter(r=>r.expected!==null&&Math.abs(r.gap-r.expected)>1).length);
 }
 await page.close();
 }
 fs.writeFileSync(path.join(__dirname,'spacing37/before.json'),JSON.stringify(report,null,2));

	await browser.close(); server.close();
})();
