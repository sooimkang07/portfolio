// Screen-records the real Notate extension for notate.html (Core flows, Design decisions and its annotated figure):
// the shipped extension (~/notate-extension, loaded unpacked) on live sites in headless Chrome, so every hover, note,
// jump, tab switch and the WebGL paper stick are the extension's own.
// Chrome can't screencast its own side panel, so the panel page (index.html) runs in a second window that treats the
// site's window as its own (as Chrome scopes a side panel to its window). Every tab and the panel are captured in real
// time and composited into the notate-demo Chrome frame used by the onboarding walkthrough: its tab strip follows the
// real tabs, the side panel slides in and out as it opens and closes, and the cursor is the one each page asks for
// (Notate's pencil while picking an element).
//   node scripts/notate/record-live.cjs annotate organize return anchoring folders revisit deletion figure    (or: all)
//   node scripts/notate/record-live.cjs reel    (the homepage showreel's take: reel/preferred-clips/notate/notate-copy-folder.mp4)
// Writes <clip>-laptop.mp4 and <clip>-laptop-poster.png (1920×1244, the laptop frame's screen) into
// assets/notate/core-flows (annotate, organize, return) or assets/notate/design-decisions (anchoring, folders, revisit, deletion);
// `figure` writes the still assets/notate/design-decisions/anatomy-amplemarket-laptop.png (2880×1866) and prints where
// its callouts point. Set NOTATE_OUT=<dir> to write test takes elsewhere.
// riotters.com's cookie notice is hidden, not answered. Notes on the sites a take visits are made through the extension
// before it starts; notes on other sites (only listed in the panel) go through the extension's own storage writer.
const fs = require('fs'), os = require('os'), path = require('path'), http = require('http'), { spawn } = require('child_process');
const deps = process.env.NOTATE_RENDER_DEPS || path.join(os.homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules');
const { chromium } = require(path.join(deps, 'playwright'));
const sharp = require(path.join(deps, 'sharp'));
const ffmpeg = process.env.FFMPEG || '/opt/homebrew/bin/ffmpeg';
const root = path.resolve(__dirname, '../..');
const EXTENSION = process.env.NOTATE_EXTENSION || path.join(os.homedir(), 'notate-extension');
const SITE = 'https://riotters.com/';
const STRIPE = 'https://stripe.com/', WISE = 'https://wise.com/', AMPLE = 'https://www.amplemarket.com/';
const POST = 'https://x.com/dravenip/status/2104402058963026288';
const W = 1440, H = 933, K = 2, FPS = 30, OUT_W = 1920, OUT_H = 1244;
const CURSOR = 1.15; // cursors a little larger than life: the clip shows at about 60%
const SLIDE = .25; // side panel open/close
const sleep = ms => new Promise(r => setTimeout(r, ms));
const now = () => Date.now() / 1000;
const ease = t => (t < .5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
const last = (list, t) => { let found = list[0]; for (const e of list) { if (e.t <= t) found = e; else break; } return found; };
const center = r => [r.x + r.width / 2, r.y + r.height / 2];

// The Chrome frame is the notate-demo shell, served from the repo.
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
	const file = path.join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname));
	if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end(); }
	res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
	fs.createReadStream(file).pipe(res);
});

// Runs in every page; acts only in the side panel page. Chrome scopes a side panel to its window, so "the current
// window" (and where it opens tabs) is the site's window, and Notate counts as pinned because the frame shows it pinned.
const panelScope = () => {
	if (location.protocol !== 'chrome-extension:' || !location.pathname.endsWith('/index.html')) return;
	const query = chrome.tabs.query.bind(chrome.tabs), create = chrome.tabs.create.bind(chrome.tabs);
	const siteWindow = async () => {
		const self = await chrome.tabs.getCurrent();
		return (await chrome.windows.getAll({ windowTypes: ['normal'] })).find(w => w.id !== self?.windowId);
	};
	chrome.tabs.query = async (info = {}) => {
		if (!info.currentWindow) return query(info);
		const { currentWindow, ...rest } = info;
		return query({ ...rest, windowId: (await siteWindow()).id });
	};
	chrome.tabs.create = async (props = {}) => create({ windowId: (await siteWindow()).id, ...props });
	chrome.action.getUserSettings = async () => ({ isOnToolbar: true });
};
// riotters.com: hide the cookie notice without answering it.
const hideCookieNotice = () => {
	if (location.hostname !== 'riotters.com') return;
	const hide = () => {
		for (const el of document.querySelectorAll('div.fixed')) if (/guessed it/i.test(el.textContent)) el.style.setProperty('display', 'none', 'important');
	};
	new MutationObserver(hide).observe(document, { childList: true, subtree: true });
};

// Cursors, drawn like the onboarding walkthrough's (dark arrow, macOS-style hands and I-beam). [svg, hotspot x, y]
const ink = '#1c1f24';
const CURSORS = {
	default: [`<svg xmlns="http://www.w3.org/2000/svg" width="25" height="30" viewBox="0 0 25 30"><path d="M3 2v23l6-6 5 9 4-2-5-9h9Z" fill="#000" opacity=".18" transform="translate(.6 1)"/><path d="M3 2v23l6-6 5 9 4-2-5-9h9Z" fill="${ink}" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/></svg>`, 3, 2],
	pointer: [`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="28" viewBox="0 0 24 28"><path d="M8.5 2c1.1 0 2 .9 2 2v7l.1-.5c.2-.8.9-1.4 1.8-1.4 1 0 1.8.8 1.8 1.8v.6c.2-.8 1-1.4 1.8-1.4 1 0 1.8.8 1.8 1.8v.9c.3-.6.9-1 1.6-1 1 0 1.8.8 1.8 1.8v5.9c0 4-3.2 7.3-7.2 7.3h-1.7c-2.3 0-4.4-1.1-5.7-3L2 16.6c-.6-.8-.4-2 .4-2.6.8-.6 1.9-.5 2.6.2l1.5 1.6V4c0-1.1.9-2 2-2Z" fill="#fff" stroke="${ink}" stroke-width="1.3" stroke-linejoin="round"/><path d="M10.5 11.5v5M14.2 11.8v4.7M17.8 13v3.5" stroke="${ink}" stroke-width="1.2" stroke-linecap="round"/></svg>`, 8.5, 2.5],
	grab: [`<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 26 26"><path d="M8 12V6a1.6 1.6 0 0 1 3.2 0v5V4.6a1.6 1.6 0 0 1 3.2 0V11V5.6a1.6 1.6 0 0 1 3.2 0v6V8.2a1.6 1.6 0 0 1 3.2 0V17c0 4.3-3.2 7.6-7.3 7.6h-1.4c-2.2 0-4.1-1-5.4-2.8l-3.6-5.3c-.5-.8-.3-1.8.4-2.2.7-.5 1.7-.4 2.3.3L8 16Z" fill="#fff" stroke="${ink}" stroke-width="1.3" stroke-linejoin="round"/></svg>`, 13, 13],
	grabbing: [`<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 26 26"><path d="M7.4 12.6a1.6 1.6 0 0 1 3.2 0V11a1.6 1.6 0 0 1 3.2 0v-.4a1.6 1.6 0 0 1 3.2 0v.6a1.6 1.6 0 0 1 3.2 0V17c0 3.9-3 7-6.7 7h-1.4c-2.1 0-4-1-5.2-2.7l-2.6-3.8c-.5-.8-.3-1.7.4-2.2.7-.4 1.6-.3 2.1.3l.6.7Z" fill="#fff" stroke="${ink}" stroke-width="1.3" stroke-linejoin="round"/></svg>`, 13, 13],
	text: [`<svg xmlns="http://www.w3.org/2000/svg" width="14" height="24" viewBox="0 0 14 24"><path d="M3.5 2.5c1.8 0 2.8.6 3.5 1.6.7-1 1.7-1.6 3.5-1.6M3.5 21.5c1.8 0 2.8-.6 3.5-1.6.7 1 1.7 1.6 3.5 1.6M7 4v16M5 12h4" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round"/><path d="M3.5 2.5c1.8 0 2.8.6 3.5 1.6.7-1 1.7-1.6 3.5-1.6M3.5 21.5c1.8 0 2.8-.6 3.5-1.6.7 1 1.7 1.6 3.5 1.6M7 4v16M5 12h4" fill="none" stroke="${ink}" stroke-width="1.4" stroke-linecap="round"/></svg>`, 7, 12],
};

// The Chrome window around the recording: tabs, address bar, Notate pinned, and the side panel open or closed.
async function chromeFrame(browser, base, { tabs, address, panel }) {
	const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: K });
	await page.goto(`${base}/notate-demo/index.html`, { waitUntil: 'load' });
	const layout = await page.evaluate(({ tabs, address, panel }) => {
		const $ = s => document.querySelector(s);
		document.querySelectorAll('.tab').forEach(tab => tab.remove());
		const strip = $('.tabs'), room = strip.getBoundingClientRect().right - $('.dots').getBoundingClientRect().right - 64;
		const squeeze = tabs.length * 238 > room, width = squeeze ? Math.floor(room / tabs.length) : 0;
		if (squeeze) strip.style.gap = '0px';
		tabs.forEach((tab, i) => {
			const el = document.createElement('span');
			el.className = `tab${tab.active ? ' is-active' : ''}`;
			if (tab.icon) { const img = document.createElement('img'); img.src = tab.icon; img.alt = ''; el.append(img); }
			el.append(tab.title);
			// like Chrome: narrow tabs, a short divider between inactive neighbours
			if (squeeze) Object.assign(el.style, { width: `${width}px`, padding: '0 9px', gap: '6px', background: tab.active ? '' : (tabs[i + 1]?.active ? 'none' : 'linear-gradient(#d6d9dc, #d6d9dc) right center / 1px 16px no-repeat') });
			$('.tab-plus').before(el);
		});
		$('[data-address]').textContent = address;
		$('[data-pinned]').hidden = false;
		document.querySelectorAll('[data-page]').forEach(p => { p.hidden = true; });
		$('[data-panel]').hidden = !panel;
		$('[data-panel]').style.animation = 'none';
		const box = el => { const r = el.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) }; };
		return { site: box($('.page')), nav: box($('.nav')), pinned: box($('[data-pinned]')), ...(panel ? { panel: box($('[data-panel-frame]')), region: box($('[data-panel]')), close: box($('[data-close-panel]')) } : {}) };
	}, { tabs, address, panel });
	await page.evaluate(() => Promise.all([...document.images].map(i => (i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; })))));
	const png = await page.screenshot();
	await page.close();
	return { png, ...layout };
}

class Take {
	// tabs: [{ key, url }] in the site's window, the first one active.
	static async open(base, frameBrowser, { tabs = [{ key: 'site', url: SITE }] } = {}) {
		const take = new Take();
		take.base = base; take.frameBrowser = frameBrowser;
		take.profile = fs.mkdtempSync(path.join(os.tmpdir(), 'notate-take-'));
		// Chrome's own pages (New Tab) follow the Mac's appearance; keep this profile in Light to match the frame.
		fs.mkdirSync(path.join(take.profile, 'Default'));
		fs.writeFileSync(path.join(take.profile, 'Default/Preferences'), JSON.stringify({ browser: { theme: { color_scheme: 1, color_scheme2: 1 } } }));
		const dummy = [{ title: 'Tab', active: true }];
		take.geo = { open: await chromeFrame(frameBrowser, base, { tabs: dummy, address: '', panel: true }), closed: await chromeFrame(frameBrowser, base, { tabs: dummy, address: '', panel: false }) };
		// Headless Chrome names itself in its user agent, and some sites (x.com) refuse it.
		const probe = await frameBrowser.newPage();
		const userAgent = (await probe.evaluate(() => navigator.userAgent)).replace('HeadlessChrome', 'Chrome');
		await probe.close();
		// Screencasts follow the real device scale, so force it rather than emulating it; page sizes are set per page (size()).
		const ctx = take.ctx = await chromium.launchPersistentContext(take.profile, {
			channel: 'chrome', headless: true, viewport: null,
			// browser-wide, so tabs the extension opens (before Playwright attaches) send it too
			ignoreDefaultArgs: ['--disable-extensions'], args: ['--enable-unsafe-extension-debugging', `--force-device-scale-factor=${K}`, `--user-agent=${userAgent}`],
		});
		await ctx.addInitScript(panelScope);
		await ctx.addInitScript(hideCookieNotice);
		// Branded Chrome ignores --load-extension; load it unpacked over the DevTools protocol instead.
		const cdp = await ctx.browser().newBrowserCDPSession();
		await cdp.send('Extensions.loadUnpacked', { path: EXTENSION });
		take.sw = ctx.serviceWorkers()[0] || await ctx.waitForEvent('serviceworker');
		await sleep(1200);
		const before = new Set(ctx.pages());
		take.cdp = new Map(); take.tabs = []; take.info = {}; take.streams = {};
		take.panelOpen = true;
		take.siteWindow = await take.sw.evaluate(async url => (await chrome.windows.create({ url, focused: true })).id, tabs[0].url);
		const first = await take.pageWhere(p => !before.has(p) && !p.url().startsWith('chrome-extension:'));
		await take.sw.evaluate(async () => { await chrome.windows.create({ url: chrome.runtime.getURL('index.html') }); });
		take.panel = await take.pageWhere(p => p.url().endsWith('/index.html'));
		for (const p of before) await p.close().catch(() => {});
		for (const p of ctx.pages()) if (p.url().endsWith('/welcome.html')) await p.close().catch(() => {});
		await take.size(take.panel, take.geo.open.panel);
		await take.register(tabs[0].key, first, tabs[0].quick);
		for (const tab of tabs.slice(1)) await take.openTab(tab.key, tab.url, { active: false, quick: tab.quick });
		take.moves = []; take.clicks = []; take.keys = []; take.panelEvents = []; take.layouts = [];
		take.cx = take.geo.open.site.x + take.geo.open.site.width * .62; take.cy = take.geo.open.site.y + take.geo.open.site.height * .7;
		take.kind = 'default';
		return take;
	}

	// A page's CSS size, matching its slot in the frame (windows can't be narrower than 500px, so the panel is emulated).
	async session(page) {
		if (!this.cdp.has(page)) this.cdp.set(page, await this.ctx.newCDPSession(page));
		return this.cdp.get(page);
	}
	async size(page, { width, height }) {
		const cdp = await this.session(page);
		await cdp.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 0, mobile: false });
		await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'light' }] });
	}
	siteRect() { return (this.panelOpen ? this.geo.open : this.geo.closed).site; }
	entry(key = this.active) { return this.tabs.find(t => t.key === key); }
	get page() { return this.entry()?.page; }

	async pageWhere(test, tries = 150) {
		for (let i = 0; i < tries; i++) {
			const page = this.ctx.pages().find(test);
			if (page) return page;
			await sleep(100);
		}
		throw Error('page did not open');
	}
	// What the tab strip and address bar show for a tab.
	async describe(key) {
		const { page } = this.entry(key), url = page.url();
		if (url.startsWith('chrome://')) { this.info[key] = { title: 'New Tab', icon: null, address: '' }; return; }
		const { title, icon } = await page.evaluate(() => ({ title: document.title, icon: document.querySelector('link[rel~="icon"]')?.href || `${location.origin}/favicon.ico` })).catch(() => ({ title: url, icon: null }));
		const u = new URL(url);
		this.info[key] = { title: title || u.hostname.replace(/^www\./, ''), icon, address: u.hostname.replace(/^www\./, '') + (u.pathname === '/' ? '' : u.pathname) };
	}
	async register(key, page, quick = false) {
		this.tabs.push({ key, page });
		this.active = key;
		await this.size(page, this.siteRect());
		await page.waitForLoadState(quick ? 'domcontentloaded' : 'load', { timeout: quick ? 15000 : 45000 }).catch(() => {});
		await this.describe(key);
	}
	async openTab(key, url, { active = true, quick = false } = {}) {
		const known = new Set(this.ctx.pages()), was = this.active;
		const id = await this.sw.evaluate(async ([win, url, active]) => (await chrome.tabs.create({ windowId: win, url, active })).id, [this.siteWindow, url, active]);
		let page;
		try { page = await this.pageWhere(p => !known.has(p), quick ? 400 : 150); } catch (error) {
			if (!quick) throw error;
			// one of the background tabs never attached: close it, so the tab strip only shows real tabs
			await this.sw.evaluate(tab => chrome.tabs.remove(tab), id).catch(() => {});
			console.warn(`skipped ${url}`);
			return;
		}
		await this.register(key, page, quick);
		if (!active) this.active = was;
		// a background tab in a crowded window: once its title and icon are known, let Chrome discard it, as Memory
		// Saver does, so the window stays light (it stays in the tab strip)
		if (quick && !active) {
			this.entry(key).discarded = true;
			await this.sw.evaluate(tab => chrome.tabs.discard(tab), id).catch(() => {});
		}
	}
	async closeTab(key) {
		const entry = this.entry(key);
		this.tabs = this.tabs.filter(t => t !== entry);
		await entry.page.close();
	}
	async activate(key) {
		this.active = key;
		await this.page.bringToFront();
		await this.size(this.page, this.siteRect());
	}
	async setPanel(open) { this.panelOpen = open; await this.size(this.page, this.siteRect()); }
	scrollTop(y, page = this.page) { return page.evaluate(top => window.scrollTo({ top, behavior: 'instant' }), y); }
	// Scroll through once so a page's lazy media has loaded, as it would have for someone browsing it.
	async warm(page = this.page) {
		const height = await page.evaluate(() => document.documentElement.scrollHeight);
		for (let y = 0; y < height; y += 600) { await this.scrollTop(y, page); await sleep(250); }
		await this.scrollTop(0, page);
		await sleep(1200);
	}

	// Setup through the extension's own storage writer (scripts/storage-writer.js in the service worker).
	commit(operation) { return this.sw.evaluate(op => notateCommit({ requestId: crypto.randomUUID(), operation: op }), operation); }
	folder(name, color) { return this.commit({ type: 'folder-create', name, color }); }
	async seedNote({ url, title, text, group = '', color = 'yellow', selector = 'main', minutesAgo = 60, pagePosition }) {
		const id = await this.sw.evaluate(() => crypto.randomUUID());
		await this.commit({ type: 'create', url, title, id, note: { id, selector, text, group, color, createdAt: Date.now() - minutesAgo * 60000, ...(pagePosition ? { pagePosition } : {}) }, newFolder: false });
	}
	// Make notes on the active tab through the extension (before a take starts). Each: { target, text, folder, at }.
	async notes(list, { stay = false } = {}) {
		const page = this.page;
		await this.panel.click(NEW);
		await sleep(700);
		for (const n of list) {
			const loc = page.locator(n.target).first();
			await loc.scrollIntoViewIfNeeded().catch(() => {});
			await sleep(400);
			await loc.click({ force: true, ...(n.at ? { position: n.at } : {}) });
			await sleep(500);
			await page.keyboard.type(n.text);
			if (n.folder) await page.click(`${MODAL} [data-group-choice="${n.folder}"]`);
			await page.click(`${MODAL} button[value="save"]`);
			await sleep(900);
		}
		if (!stay) { await page.keyboard.press('Escape'); await sleep(200); await page.keyboard.press('Escape'); await sleep(400); }
	}

	// Window coordinates of an element in the active tab or the panel (fx, fy: where inside it).
	async spot(page, target, fx = .5, fy = .5) {
		const loc = typeof target === 'string' ? page.locator(target).first() : target;
		let box = await loc.boundingBox();
		// the extension redraws its notes when a mode starts; an element caught mid-redraw has no box yet
		for (let i = 0; i < 20 && !box; i++) { await sleep(150); box = await loc.boundingBox(); }
		if (!box) throw Error(`not on screen: ${target}`);
		const r = page === this.panel ? this.geo.open.panel : this.siteRect();
		return [r.x + box.x + box.width * fx, r.y + box.y + box.height * fy];
	}
	region(x, y) {
		const slots = [[this.page, this.siteRect()], ...(this.panelOpen ? [[this.panel, this.geo.open.panel]] : [])];
		for (const [page, r] of slots) if (x >= r.x && x < r.x + r.width && y >= r.y && y < r.y + r.height) return { page, x: x - r.x, y: y - r.y };
		return null;
	}
	// Move the real mouse in whichever page is under the cursor, and note the cursor that page shows there.
	async pointer(x, y, look = true) {
		const at = this.region(x, y);
		if (at?.page !== this.hover) {
			if (this.hover) await this.hover.mouse.move(-40, -40).catch(() => {});
			this.hover = at?.page || null;
		}
		if (at) await at.page.mouse.move(at.x, at.y);
		if (look) this.kind = at ? await at.page.evaluate(([px, py]) => {
			const el = document.elementFromPoint(px, py);
			if (!el) return 'default';
			const cursor = getComputedStyle(el).cursor;
			if (cursor !== 'auto') return cursor;
			return el.matches('input:not([type=radio]):not([type=checkbox]), textarea, [contenteditable]') ? 'text' : 'default';
		}, [at.x, at.y]).catch(() => this.kind) : 'default';
		this.cx = x; this.cy = y;
		this.moves.push({ t: now(), x, y, kind: this.kind });
	}
	async glide(x, y, ms = 650) {
		const n = Math.max(8, Math.round(ms / 16)), sx = this.cx, sy = this.cy, t0 = Date.now();
		for (let i = 1; i <= n; i++) {
			const e = ease(i / n);
			await this.pointer(sx + (x - sx) * e, sy + (y - sy) * e, i % 3 === 0 || i === n);
			const wait = t0 + (ms * i) / n - Date.now();
			if (wait > 0) await sleep(wait);
		}
	}
	async click([x, y], ms = 650, button = 'left') {
		await this.glide(x, y, ms);
		await sleep(140);
		const at = this.region(x, y); // null on the frame's own toolbar; the script performs those clicks
		this.clicks.push({ t: now(), x, y });
		if (at) await at.page.mouse.click(at.x, at.y, { button, delay: 80 });
		await this.pointer(x, y);
	}
	// Notate's confirmation dialog lives in a closed shadow root: find its red confirm button on screen instead.
	async confirmButton(page) {
		const r = page === this.panel ? this.geo.open.panel : this.siteRect();
		const { data, info } = await sharp(await page.screenshot()).raw().toBuffer({ resolveWithObject: true });
		let x0 = Infinity, y0 = Infinity, x1 = -1, y1 = -1;
		for (let y = 0; y < info.height; y += 2) for (let x = 0; x < info.width; x += 2) {
			const i = (y * info.width + x) * info.channels;
			if (Math.abs(data[i] - 163) < 16 && Math.abs(data[i + 1] - 54) < 16 && Math.abs(data[i + 2] - 50) < 16) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
		}
		if (x1 < 0) throw Error('no confirmation dialog on screen');
		const scale = info.width / r.width;
		return [r.x + (x0 + x1) / 2 / scale, r.y + (y0 + y1) / 2 / scale];
	}
	async drag([x, y], ms = 900) {
		const at = this.region(this.cx, this.cy);
		await at.page.mouse.down();
		await this.pointer(this.cx, this.cy);
		await sleep(160);
		await this.glide(x, y, ms);
		await sleep(120);
		await at.page.mouse.up();
		await this.pointer(x, y);
	}
	async type(text, delay = 40) { await this.page.keyboard.type(text, { delay }); }
	// The keycap shows a beat before the press, so it reads as the key being hit.
	async key(name, label) { this.keys.push({ t: now() + .35, label }); await sleep(350); await this.page.keyboard.press(name); }
	async scroll(dy, ms = 900) {
		const steps = Math.round(ms / 50);
		for (let i = 0; i < steps; i++) { await this.page.mouse.wheel(0, dy / steps); await sleep(50); this.moves.push({ t: now(), x: this.cx, y: this.cy, kind: this.kind }); }
	}
	async hold(ms) { const end = Date.now() + ms; while (Date.now() < end) { await sleep(100); this.moves.push({ t: now(), x: this.cx, y: this.cy, kind: this.kind }); } }

	snapshot() { return { tabs: this.tabs.map(t => t.key), active: this.active, panel: this.panelOpen }; }
	layout(t) { this.layouts.push({ t, ...this.snapshot() }); }
	fits(frame, rect) { return frame.width === rect.width && frame.height === rect.height; }
	// Re-apply the active tab's size (after the panel opens or closes, or the tab comes back to the front; Chrome drops
	// it then) and return the time of its first frame at that size.
	async resized(key = this.active) {
		const frames = this.streams[key] || [], from = frames.length, rect = this.siteRect();
		await this.size(this.entry(key).page, rect);
		for (let i = 0; i < 150; i++) { const f = frames.slice(from).find(f => this.fits(f, rect)); if (f) return f.t; await sleep(20); }
		return now();
	}
	// Notate's toolbar button opens the side panel: it slides in, loads fresh, and the page narrows beside it.
	async openPanel() {
		await this.click(center(this.geo.closed.pinned), 900);
		const t = now();
		this.panelEvents.push({ t, open: true });
		this.panel.reload().catch(() => {});
		await sleep(SLIDE * 1000 + 20);
		this.panelOpen = true;
		this.layout(Math.max(await this.resized(), t + SLIDE));
	}
	// The panel's × closes it; the page widens to the full window and the panel slides away over it.
	async closePanel() {
		await this.click(center(this.geo.open.close), 800);
		this.panelOpen = false;
		const t = await this.resized();
		this.layout(t);
		this.panelEvents.push({ t, open: false });
	}
	// Show the tab Chrome makes active in the site's window (opening a note can switch tabs, or open one).
	async follow(key, match) {
		for (let i = 0; ; i++) {
			const url = await this.sw.evaluate(async id => (await chrome.tabs.query({ active: true, windowId: id }))[0]?.url || (await chrome.tabs.query({ active: true, windowId: id }))[0]?.pendingUrl, this.siteWindow);
			if (url && match(url)) break;
			if (i > 200) throw Error(`${key} never became active`);
			await sleep(40);
		}
		if (!this.entry(key)) {
			const page = await this.pageWhere(p => p !== this.panel && !this.tabs.some(t => t.page === p));
			this.tabs.push({ key, page });
			await this.capture(page, key);
		}
		this.active = key;
		this.layout(await this.resized(key));
		this.page.waitForLoadState('load').then(() => this.describe(key)).catch(() => {});
	}

	async capture(page, key) {
		const cdp = await this.session(page);
		const frames = this.streams[key] = this.streams[key] || [];
		cdp.on('Page.screencastFrame', ({ data, metadata, sessionId }) => {
			frames.push({ t: metadata.timestamp, data, width: metadata.deviceWidth, height: metadata.deviceHeight });
			cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
		});
		await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: 4096, maxHeight: 4096, everyNthFrame: 1 });
		(this.casts = this.casts || []).push(cdp);
	}
	async begin() {
		for (const t of this.tabs) if (!t.discarded) await this.capture(t.page, t.key);
		await this.capture(this.panel, 'panel');
		await sleep(700);
		await this.pointer(this.cx, this.cy);
		this.t0 = now();
		this.layout(this.t0);
	}
	async end(holdMs = 1800) {
		await this.hold(holdMs);
		this.t1 = now();
		for (const t of this.tabs) if (!t.discarded) await this.describe(t.key).catch(() => {});
		for (const cdp of this.casts) await cdp.send('Page.stopScreencast').catch(() => {});
		await this.ctx.close();
		fs.rmSync(this.profile, { recursive: true, force: true });
	}

	// ── Compositing ──
	async frameFor(L) {
		const config = { tabs: L.tabs.map(k => ({ title: this.info[k]?.title || '', icon: this.info[k]?.icon, active: k === L.active })), address: this.info[L.active]?.address || '', panel: L.panel };
		const key = JSON.stringify(config);
		this.framePngs = this.framePngs || new Map();
		if (!this.framePngs.has(key)) this.framePngs.set(key, await sharp((await chromeFrame(this.frameBrowser, this.base, config)).png).removeAlpha().raw().toBuffer());
		return this.framePngs.get(key);
	}
	// The latest frame of a stream at T, sized for its slot (since: ignore frames from before a reload).
	async decoded(key, T, rect, since = 0) {
		const list = this.streams[key];
		if (!list?.length) return null;
		let i = -1;
		for (let j = 0; j < list.length && list[j].t <= T; j++) i = j;
		if (i < 0) i = 0;
		if (list[i].t < since) return null;
		let use = i;
		for (let j = i; j >= Math.max(0, i - 30); j--) if (this.fits(list[j], rect)) { use = j; break; }
		const frame = list[use];
		this.cache = this.cache || {};
		const ck = `${key}:${rect.width}x${rect.height}`;
		if (this.cache[ck]?.frame !== frame) {
			const w = rect.width * K, h = rect.height * K, fw = (frame.width || rect.width) * K, fh = (frame.height || rect.height) * K, jpeg = Buffer.from(frame.data, 'base64');
			let data;
			if (fw === w && fh === h) data = await sharp(jpeg).resize(w, h, { fit: 'fill' }).removeAlpha().raw().toBuffer();
			else {
				// a frame from before a resize: draw it at its own size, as the page looked, cropped or padded to the slot
				const cw = Math.min(fw, w), ch = Math.min(fh, h);
				data = await sharp(jpeg).resize(fw, fh, { fit: 'fill' }).extract({ left: 0, top: 0, width: cw, height: ch })
					.extend({ right: w - cw, bottom: h - ch, background: '#ffffff' }).removeAlpha().raw().toBuffer();
			}
			this.cache[ck] = { frame, data, width: w, height: h };
		}
		return this.cache[ck];
	}
	// The side panel as one layer (its header from the frame, its page from the panel stream), for sliding.
	async panelLayer(T, since) {
		const g = this.geo.open, R = g.region;
		const layers = [];
		const panel = await this.decoded('panel', T, g.panel, since);
		if (panel) layers.push({ input: panel.data, raw: { width: panel.width, height: panel.height, channels: 3 }, left: (g.panel.x - R.x) * K, top: (g.panel.y - R.y) * K });
		this.regionPng = this.regionPng || await sharp(g.png).extract({ left: R.x * K, top: R.y * K, width: R.width * K, height: R.height * K }).removeAlpha().png().toBuffer();
		return sharp(this.regionPng).composite(layers).removeAlpha().png().toBuffer();
	}
	async cursorImage(kind) {
		this.cursors = this.cursors || {};
		if (!this.cursors[kind]) {
			let svg, hx, hy;
			const url = /url\("data:image\/svg\+xml,([^"]+)"\)\s*([\d.]+)?\s*([\d.]+)?/.exec(kind);
			if (url) [svg, hx, hy] = [decodeURIComponent(url[1]), +url[2] || 0, +url[3] || 0];
			else [svg, hx, hy] = CURSORS[kind] || CURSORS.default;
			const s = K * CURSOR;
			this.cursors[kind] = { input: await sharp(Buffer.from(svg), { density: 72 * s }).png().toBuffer(), hx: hx * s, hy: hy * s };
		}
		return this.cursors[kind];
	}
	async ring(step) {
		this.rings = this.rings || [];
		if (!this.rings[step]) {
			const p = step / 12, d = 40 * K, r = (d / 2) * (.5 + .9 * p) - 2;
			this.rings[step] = await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${d * 1.5}" height="${d * 1.5}"><circle cx="${d * .75}" cy="${d * .75}" r="${r}" fill="none" stroke="${ink}" stroke-opacity="${.4 * (1 - p)}" stroke-width="${2 * K}"/></svg>`)).png().toBuffer();
		}
		return this.rings[step];
	}
	// A keycap in the middle of the page when a key is hit (keystrokes don't show in a screen recording): it rises in,
	// presses down, and fades.
	async keycap(label, opacity, pressed) {
		this.caps = this.caps || {};
		const key = `${label}${opacity}${pressed}`;
		if (!this.caps[key]) {
			const w = 132 * K, h = 84 * K, depth = 6 * K, pad = 24 * K, down = pressed ? depth - K : 0;
			this.caps[key] = await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w + pad * 2}" height="${h + depth + pad * 2}"><defs><filter id="s" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur in="SourceAlpha" stdDeviation="${(pressed ? 5 : 9) * K}"/><feOffset dy="${(pressed ? 2 : 6) * K}"/><feComponentTransfer><feFuncA type="linear" slope=".22"/></feComponentTransfer><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><g opacity="${opacity}"><rect x="${pad}" y="${pad + depth}" width="${w}" height="${h}" rx="${16 * K}" fill="#c7cbd0" filter="url(#s)"/><rect x="${pad}" y="${pad + down}" width="${w}" height="${h}" rx="${16 * K}" fill="${pressed ? '#f1f3f5' : '#ffffff'}" stroke="#d6d9dc" stroke-width="${K}"/><text x="${pad + w / 2}" y="${pad + down + h / 2 + 11 * K}" text-anchor="middle" font-family="Helvetica Neue, Helvetica, Arial" font-size="${32 * K}" font-weight="500" fill="${ink}">${label}</text></g></svg>`)).png().toBuffer();
		}
		return this.caps[key];
	}
	async compose(T, { cursor = true } = {}) {
		const L = last(this.layouts, T);
		const g = L.panel ? this.geo.open : this.geo.closed;
		const layers = [];
		const site = await this.decoded(L.active, T, g.site);
		if (site) layers.push({ input: site.data, raw: { width: site.width, height: site.height, channels: 3 }, left: g.site.x * K, top: g.site.y * K });
		if (L.panel) {
			const panel = await this.decoded('panel', T, g.panel);
			if (panel) layers.push({ input: panel.data, raw: { width: panel.width, height: panel.height, channels: 3 }, left: g.panel.x * K, top: g.panel.y * K });
		}
		// the side panel sliding in (until the layout makes room for it) or out
		const e = this.panelEvents.filter(p => p.t <= T).at(-1);
		if (e && !L.panel && (e.open || T - e.t < SLIDE)) {
			const p = Math.min(1, (T - e.t) / SLIDE), shift = e.open ? 1 - ease(p) : ease(p);
			const R = this.geo.open.region, full = R.width * K, x = Math.round(R.x * K + shift * full), visible = W * K - x;
			if (visible > 0) {
				const img = await this.panelLayer(T, e.open ? e.t : 0);
				layers.push({ input: await sharp(img).extract({ left: 0, top: 0, width: Math.min(full, visible), height: R.height * K }).png().toBuffer(), left: x, top: R.y * K });
			}
		}
		const rect = L.panel ? this.geo.open.site : this.geo.closed.site;
		for (const k of this.keys) {
			const dt = T - k.t;
			if (dt < -.35 || dt > 1.2) continue;
			const o = Math.round(10 * Math.max(0, Math.min(1, (dt + .35) / .15, (1.2 - dt) / .3))) / 10;
			if (!o) continue;
			const cap = await this.keycap(k.label, o, dt >= 0 && dt < .16), m = await sharp(cap).metadata();
			layers.push({ input: cap, left: Math.round((rect.x + rect.width / 2) * K - m.width / 2), top: Math.round((rect.y + rect.height / 2) * K - m.height / 2) });
		}
		for (const c of this.clicks) {
			const dt = T - c.t;
			if (dt < 0 || dt > .42) continue;
			const d = 40 * K * 1.5;
			layers.push({ input: await this.ring(Math.round((dt / .42) * 12)), left: Math.round(c.x * K - d / 2), top: Math.round(c.y * K - d / 2) });
		}
		if (cursor) {
			const move = last(this.moves, T);
			const cur = await this.cursorImage(move.kind);
			layers.push({ input: cur.input, left: Math.round(move.x * K - cur.hx), top: Math.round(move.y * K - cur.hy) });
		}
		const full = await sharp(await this.frameFor(L), { raw: { width: W * K, height: H * K, channels: 3 } }).composite(layers).removeAlpha().raw().toBuffer();
		return sharp(full, { raw: { width: W * K, height: H * K, channels: 3 } });
	}
	async render(dir, name, posterAt) {
		fs.mkdirSync(dir, { recursive: true });
		const mp4 = path.join(dir, `${name}.mp4`);
		const proc = spawn(ffmpeg, ['-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', `${OUT_W}x${OUT_H}`, '-r', String(FPS), '-i', 'pipe:0', '-an', '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', mp4]);
		let errors = ''; proc.stderr.on('data', d => { errors += d; });
		const done = new Promise((resolve, reject) => { proc.on('exit', c => (c === 0 ? resolve() : reject(Error(errors)))); proc.on('error', reject); });
		this.layouts.sort((a, b) => a.t - b.t);
		const count = Math.floor((this.t1 - this.t0) * FPS);
		for (let i = 0; i < count; i++) {
			const raw = await (await this.compose(this.t0 + i / FPS)).resize(OUT_W, OUT_H, { kernel: 'lanczos3' }).raw().toBuffer();
			if (!proc.stdin.write(raw)) await new Promise(r => proc.stdin.once('drain', r));
		}
		proc.stdin.end();
		await done;
		const T = posterAt < 0 ? this.t1 + posterAt : this.t0 + posterAt;
		this.cache = {};
		await (await this.compose(T)).resize(OUT_W, OUT_H, { kernel: 'lanczos3' }).png({ compressionLevel: 9 }).toFile(path.join(dir, `${name}-poster.png`));
		console.log(`${name}.mp4: ${OUT_W}×${OUT_H}, ${(count / FPS).toFixed(1)}s (${Object.entries(this.streams).map(([k, f]) => `${k} ${f.length}`).join(', ')} frames)`);
	}
	// A still at full capture size, without the cursor.
	async still(dir, name) {
		fs.mkdirSync(dir, { recursive: true });
		this.layouts.sort((a, b) => a.t - b.t);
		this.cache = {};
		await (await this.compose(this.t1 - .2, { cursor: false })).png({ compressionLevel: 9 }).toFile(path.join(dir, `${name}.png`));
		console.log(`${name}.png: ${W * K}×${H * K}`);
	}
}

const NEW = '[data-action="start-annotating"]';
const MODAL = '#notate-modal';
const ROW = name => `.popup-page-item:has(.popup-page-title:has-text("${name}"))`;
const ITEM = text => `.popup-annotation-item:has-text("${text}")`;
// riotters.com
const HEADLINE = 'h1 >> nth=0';
const SERVICES = 'text=3D. Motion. Branding';
const REEL = 'video >> nth=0';
const LOGOS = 'text=Currently working with';
const EYEBOU = 'h4:has-text("Eyebou")';
const BAND = 'h3:has-text("Most agencies pick a lane")';
const CTA = 'h2:has-text("Wanna accelerate")';
const TAGLINE = 'Ask copy team about new tagline.';

// Folders the design decisions share (the core flows keep their own: Research, Inspiration, and a new Design).
async function folders(take) {
	await take.folder('Design', 'peach');
	await take.folder('Build', 'lilac');
	await take.folder('Research', 'sky');
	await take.folder('Inspiration', 'mint');
}
// Notes on other sites, only listed in the panel (saved through the extension's storage writer).
async function otherSites(take, skip = []) {
	const sites = {
		stripe: [{ url: STRIPE, title: 'Stripe | Financial Infrastructure to Grow Your Revenue', text: 'Gradient sweep behind the hero. Check how it animates.', group: 'Build', minutesAgo: 400 },
			{ url: STRIPE, title: 'Stripe | Financial Infrastructure to Grow Your Revenue', text: 'Product cards in mixed sizes. Use for our feature grid.', group: 'Design', minutesAgo: 390 }],
		wise: [{ url: WISE, title: 'Wise: The international account | Money without borders | Wise United States', text: 'Fee breakdown is the clearest I’ve seen. Borrow for pricing.', group: 'Research', minutesAgo: 300 }],
		ample: [{ url: AMPLE, title: 'Amplemarket: All-in-one sales platform for teams & AI agents', text: 'Two-line promise: agents first, then your team.', group: 'Design', minutesAgo: 200 },
			{ url: AMPLE, title: 'Amplemarket: All-in-one sales platform for teams & AI agents', text: 'Show live agent activity like this in our demo.', group: 'Inspiration', minutesAgo: 190 }],
	};
	for (const [name, notes] of Object.entries(sites)) if (!skip.includes(name)) for (const n of notes) await take.seedNote(n);
}

const clips = {
	// Core flows · Annotate: open the side panel, New, pick the headline, write, save, close the panel.
	async annotate(take) {
		await take.warm();
		await take.setPanel(false);
		take.cx = take.geo.closed.site.x + take.geo.closed.site.width * .55; take.cy = take.geo.closed.site.y + take.geo.closed.site.height * .72;
		await take.begin();
		await take.hold(700);
		await take.openPanel();
		await take.hold(800);
		await take.click(await take.spot(take.panel, NEW), 900);
		await take.hold(450);
		const [sx, sy] = await take.spot(take.page, SERVICES, .45, .5);
		await take.glide(sx, sy, 750);
		await take.hold(400);
		await take.click(await take.spot(take.page, HEADLINE, .55, .5), 650);
		await take.hold(550);
		await take.type(TAGLINE, 46);
		await take.hold(450);
		await take.click(await take.spot(take.page, `${MODAL} button[value="save"]`), 700);
		await take.hold(1500);
		await take.closePanel();
		await take.hold(500);
		await take.glide(take.geo.closed.site.x + take.geo.closed.site.width * .62, take.geo.closed.site.y + take.geo.closed.site.height * .78, 900);
		await take.end(1800);
		return { dir: 'core-flows', posterAt: -.5 };
	},
	// Core flows · Organize: a note on the case grid filed into a new Build folder, then the earlier headline note moved
	// into a new Copy folder; the panel then shows it under Copy.
	async organize(take) {
		await take.folder('Research', 'sky');
		await take.folder('Inspiration', 'mint');
		await take.warm();
		await take.notes([{ target: HEADLINE, text: TAGLINE }]);
		const folder = async (name, color) => {
			await take.click(await take.spot(take.page, `${MODAL} [data-action="choose-group"]`), 650);
			await take.hold(300);
			await take.type(name, 70);
			await take.hold(300);
			await take.click(await take.spot(take.page, `${MODAL} label[data-color="${color}"]`), 550);
			await take.hold(400);
			await take.click(await take.spot(take.page, `${MODAL} [data-action="confirm-group"]`), 550);
			await take.hold(450);
			await take.click(await take.spot(take.page, `${MODAL} button[value="save"]`), 600);
		};
		await take.begin();
		await take.hold(600);
		await take.click(await take.spot(take.panel, NEW), 900);
		await take.hold(400);
		// down to the case grid, framed as on the page
		const down = await take.page.evaluate(() => [...document.querySelectorAll('h4')].find(h => /4th Moment/.test(h.textContent)).getBoundingClientRect().top - 420);
		await take.scroll(down, 1400);
		await take.hold(700);
		const grid = await take.spot(take.page, 'h4:has-text("4th Moment")', 0, 1);
		await take.click([grid[0] + 70, grid[1] + 150], 850);
		await take.hold(450);
		await take.type('Fix responsiveness, broken grid on mobile.', 40);
		await take.hold(350);
		await folder('Build', 'lilac');
		await take.hold(1300);
		// back up to the headline note, and file it under a new Copy folder
		await take.scroll(-down - 200, 1400);
		await take.hold(700);
		await take.click(await take.spot(take.page, '#notate-layer .notate-note:has-text("Ask copy team")', .45, .45), 850);
		await take.hold(500);
		await folder('Copy', 'rose');
		await take.hold(1100);
		await take.click(await take.spot(take.panel, '#group-tabs button:has-text("Copy")'), 950);
		await take.hold(450);
		await take.click(await take.spot(take.panel, `${ROW('Riotters')} .popup-page-toggle`), 650);
		await take.end(2200);
		return { dir: 'core-flows', posterAt: -.5 };
	},
	// Core flows · Return: from a new tab, open a saved note; Notate switches back to its page and scrolls to it.
	async return(take) {
		await take.folder('Research', 'sky');
		await take.folder('Inspiration', 'mint');
		await take.warm();
		await take.notes([{ target: HEADLINE, text: TAGLINE }, { target: CTA, text: 'Straight to the point. Use this tone for our CTA.', folder: 'Research' }]);
		await take.scrollTop(0);
		await take.seedNote({ url: 'https://stripe.com/payments', title: 'Stripe Payments', text: 'Pricing table: how they compare plans.', group: 'Research', minutesAgo: 300 });
		await take.seedNote({ url: 'https://linear.app/method', title: 'The Linear Method', text: 'Good line on writing issues, not user stories.', group: 'Research', minutesAgo: 240 });
		await take.seedNote({ url: 'https://www.apple.com/macbook-air/', title: 'MacBook Air - Apple', text: 'Scroll-driven product reveal.', group: 'Inspiration', minutesAgo: 180 });
		await take.openTab('newtab', 'chrome://newtab/');
		await sleep(1500);
		await take.begin();
		await take.hold(800);
		await take.click(await take.spot(take.panel, `${ROW('Riotters')} .popup-page-toggle`), 1000);
		await take.hold(700);
		await take.click(await take.spot(take.panel, ITEM('Straight to the point'), .35), 700);
		await Promise.all([take.follow('site', url => url.startsWith(SITE)), take.glide(take.geo.open.site.x + take.geo.open.site.width * .8, take.geo.open.site.y + take.geo.open.site.height * .84, 1300)]);
		await take.end(3400);
		return { dir: 'core-flows', posterAt: -.5 };
	},
	// Decision 01 · Element-level anchoring: a window full of tabs, and a blank tab in front. Open Notate; click a site
	// that's already open to switch to it; drag a note off the content; pick another of its notes to scroll to it; then
	// open a note from a site that isn't open, which opens a new tab.
	async anchoring(take) {
		await folders(take);
		await take.activate('stripe');
		await take.warm();
		await take.notes([
			{ target: 'h1 >> nth=0', text: 'Gradient sweep behind the hero. Check how it animates.', folder: 'Build' },
			{ target: 'h2:has-text("Flexible solutions")', text: 'Product cards in mixed sizes. Use for our feature grid.', folder: 'Design' },
			{ target: 'h2:has-text("The backbone of global commerce")', text: 'Live stats over the globe. Try this for our metrics.', folder: 'Research' },
		]);
		await take.openTab('wise', WISE);
		await take.notes([
			{ target: 'h1 >> nth=0', text: 'Bold all-caps display type. Strong brand moment.', folder: 'Inspiration' },
			{ target: 'h2:has-text("transparent pricing")', text: 'Fee breakdown is the clearest I’ve seen. Borrow for pricing.', folder: 'Research' },
		]);
		await take.closeTab('wise');
		await take.openTab('ample', AMPLE);
		await take.notes([{ target: 'h1 >> nth=0', text: 'Two-line promise: agents first, then your team.', folder: 'Design' }]);
		await take.closeTab('ample');
		await take.activate('stripe');
		await take.scrollTop(0);
		await take.openTab('newtab', 'chrome://newtab/');
		await take.setPanel(false);
		await sleep(1500);
		take.cx = take.geo.closed.site.x + take.geo.closed.site.width * .5; take.cy = take.geo.closed.site.y + take.geo.closed.site.height * .62;
		await take.begin();
		await take.hold(1100);
		await take.openPanel();
		await take.hold(1000);
		await take.click(await take.spot(take.panel, `${ROW('Stripe')} .popup-page-button`, .3), 900);
		await take.follow('stripe', url => url.startsWith(STRIPE));
		await take.hold(1300);
		// the hero note covers the headline: drag it aside
		const [nx, ny] = await take.spot(take.page, '#notate-layer .notate-note:has-text("Gradient sweep")', .5, .5);
		await take.glide(nx, ny, 800);
		await take.hold(300);
		await take.drag([Math.min(nx + 360, take.geo.open.site.x + take.geo.open.site.width - 150), ny - 160], 1000);
		await take.hold(900);
		await take.click(await take.spot(take.panel, `${ROW('Stripe')} .popup-page-toggle`), 900);
		await take.hold(600);
		await take.click(await take.spot(take.panel, ITEM('Live stats over the globe'), .35), 700);
		await take.hold(2800);
		await take.click(await take.spot(take.panel, `${ROW('Wise')} .popup-page-toggle`), 900);
		await take.hold(600);
		await take.click(await take.spot(take.panel, ITEM('Fee breakdown'), .35), 700);
		await Promise.all([take.follow('wise', url => url.startsWith(WISE)), take.glide(take.geo.open.site.x + take.geo.open.site.width * .82, take.geo.open.site.y + take.geo.open.site.height * .86, 1300)]);
		await take.end(3400);
		return { dir: 'design-decisions', posterAt: -.5 };
	},
	// Decision 02 · Note-level organization: several notes on one page, further down it too, each in its own folder;
	// then the panel filtered by folder, where they sit with notes from other sites.
	async folders(take) {
		await folders(take);
		await otherSites(take);
		await take.warm();
		await take.notes([{ target: HEADLINE, text: TAGLINE }]);
		await take.begin();
		await take.hold(600);
		await take.click(await take.spot(take.panel, NEW), 950);
		await take.hold(400);
		const add = async (point, text, folder) => {
			await take.click(point, 700);
			await take.hold(300);
			await take.type(text, 30);
			await take.hold(200);
			await take.click(await take.spot(take.page, `${MODAL} [data-group-choice="${folder}"]`), 550);
			await take.hold(300);
			await take.click(await take.spot(take.page, `${MODAL} button[value="save"]`), 550);
			await take.hold(750);
		};
		await add(await take.spot(take.page, REEL, .5, .4), 'Autoplay reels. Check how they lazy-load.', 'Build');
		await take.scroll(520, 900);
		await take.hold(300);
		await add(await take.spot(take.page, LOGOS, .3, .5), 'Ask sales which logos we can show.', 'Research');
		await take.scroll(560, 900);
		await take.hold(300);
		await add(await take.spot(take.page, EYEBOU, .5, -2.4), 'Mixed tile sizes keep the grid lively.', 'Design');
		await take.click(await take.spot(take.panel, '#group-tabs button:has-text("Design")'), 900);
		await take.hold(400);
		await take.click(await take.spot(take.panel, `${ROW('Riotters')} .popup-page-toggle`), 650);
		await take.hold(300);
		const [hx, hy] = await take.spot(take.panel, ITEM('Mixed tile sizes'), .4);
		await take.glide(hx, hy, 600);
		await take.hold(1300);
		for (const folder of ['Research', 'All']) {
			await take.click(await take.spot(take.panel, `#group-tabs button:has-text("${folder}")`), 650);
			await take.hold(1100);
		}
		await take.end(900);
		return { dir: 'design-decisions', posterAt: -7.2 };
	},
	// Decision 03 · Non-intrusive revisiting: annotating with every note on the page; close the panel; Esc to preview
	// and read down the page; Esc to close. Later, a note on an X post whose section is gone is flagged, not misplaced.
	async revisit(take) {
		await folders(take);
		await otherSites(take, ['ample']);
		// The X post: X shows logged-out visitors only the article's opening, so a note on a later section can't find it.
		await take.seedNote({ url: POST, title: 'draven on X: "https://t.co/ekWOSQOOZH" / X', text: 'Reference this for prompts.', group: 'Research', minutesAgo: 60 * 24 * 12,
			selector: 'main > div > div > div > div:nth-of-type(1) > div > section > div > div > div:nth-of-type(1) > div > div > article > div > div > div:nth-of-type(3) > div:nth-of-type(2) > div > div > section:nth-of-type(8) > h2',
			pagePosition: { left: 380, top: 560 } });
		await take.warm();
		await take.notes([
			{ target: HEADLINE, text: TAGLINE },
			{ target: REEL, text: 'Reels autoplay muted. Check lazy-loading.', folder: 'Build' },
			{ target: LOGOS, text: 'Ask sales which logos we can show.', folder: 'Research' },
			{ target: EYEBOU, text: 'Mixed tile sizes keep the grid lively.', folder: 'Inspiration' },
			{ target: BAND, text: 'Dark band resets the pace mid-page.', folder: 'Design' },
			{ target: CTA, text: 'One CTA, one line of reassurance.', folder: 'Research' },
		], { stay: true });
		await take.scrollTop(0);
		await sleep(1200);
		await take.begin();
		await take.hold(700);
		for (const [fx, fy] of [[.3, .62], [.72, .66]]) {
			await take.glide(take.geo.open.site.x + take.geo.open.site.width * fx, take.geo.open.site.y + take.geo.open.site.height * fy, 700);
			await take.hold(400);
		}
		await take.closePanel();
		await take.hold(900);
		await take.key('Escape', 'esc');
		await take.hold(700);
		await take.glide(take.geo.closed.site.x + take.geo.closed.site.width * .25, take.geo.closed.site.y + take.geo.closed.site.height * .66, 700);
		await take.hold(500);
		for (let i = 0; i < 6; i++) { await take.scroll(820, 1000); await take.hold(450); }
		await take.key('Escape', 'esc');
		await take.hold(1300);
		await take.openPanel();
		await take.hold(1000);
		await take.click(await take.spot(take.panel, `${ROW('draven')} .popup-page-toggle`), 900);
		await take.hold(600);
		await take.click(await take.spot(take.panel, ITEM('Reference this for prompts'), .35), 700);
		await take.follow('post', url => url.startsWith('https://x.com/'));
		await take.hold(3000);
		const [wx, wy] = await take.spot(take.page, '#notate-layer [data-missing-note-warning]', .5, .5);
		await take.glide(wx, wy, 900);
		await take.end(2200);
		return { dir: 'design-decisions', posterAt: -.4 };
	},
	// Decision 04 · Scoped deletion: a note's × peels it off; a note in the side panel is deleted without opening its
	// page (after confirming); Clear all in the page toolbar removes the page's notes (after confirming).
	async deletion(take) {
		await folders(take);
		await otherSites(take);
		await take.warm();
		await take.notes([
			{ target: HEADLINE, text: TAGLINE },
			{ target: REEL, text: 'Reels autoplay muted. Check lazy-loading.', folder: 'Build' },
			{ target: 'text=Explore Case Studies', text: 'Reads like a label. Make it a button.', folder: 'Design' },
		], { stay: true });
		await take.page.keyboard.press('Escape'); // browsing the notes
		await take.scrollTop(0);
		await sleep(1000);
		await take.begin();
		await take.hold(700);
		const reel = '#notate-layer .notate-note:has-text("Reels autoplay")';
		await take.glide(...await take.spot(take.page, reel, .5, .55), 850);
		await take.hold(450);
		await take.click(await take.spot(take.page, `${reel} .notate-delete`), 500);
		await take.hold(1500);
		await take.click(await take.spot(take.panel, `${ROW('Wise')} .popup-page-toggle`), 900);
		await take.hold(500);
		await take.click(await take.spot(take.panel, ITEM('Fee breakdown'), .35), 700, 'right');
		await take.hold(550);
		await take.click(await take.spot(take.panel, '#annotation-context-menu button'), 450);
		await take.hold(700);
		await take.click(await take.confirmButton(take.panel), 600);
		await take.hold(1300);
		await take.click(await take.spot(take.page, '#notate-toolbar [data-action="clear"]'), 1100);
		await take.hold(700);
		const posterAt = now() - take.t0;
		await take.click(await take.confirmButton(take.page), 650);
		await take.hold(1200);
		await take.glide(take.geo.open.site.x + take.geo.open.site.width * .6, take.geo.open.site.y + take.geo.open.site.height * .7, 900);
		await take.end(1600);
		return { dir: 'design-decisions', posterAt };
	},
	// For the homepage showreel (not the case study): the headline note saved into a new Copy folder, then found under
	// Copy in the side panel. The reel cuts 1.3–18s of it: re-cut the reel if this take changes.
	async reel(take) {
		await take.folder('Research', 'sky');
		await take.folder('Inspiration', 'mint');
		await take.warm();
		await take.begin();
		await take.hold(600);
		await take.click(await take.spot(take.panel, NEW), 900);
		await take.hold(450);
		const [sx, sy] = await take.spot(take.page, SERVICES, .45, .5);
		await take.glide(sx, sy, 700);
		await take.hold(350);
		await take.click(await take.spot(take.page, HEADLINE, .55, .5), 650);
		await take.hold(500);
		await take.type(TAGLINE, 44);
		await take.hold(400);
		await take.click(await take.spot(take.page, `${MODAL} [data-action="choose-group"]`), 700);
		await take.hold(300);
		await take.type('Copy', 70);
		await take.hold(300);
		await take.click(await take.spot(take.page, `${MODAL} label[data-color="lilac"]`), 600);
		await take.hold(400);
		await take.click(await take.spot(take.page, `${MODAL} [data-action="confirm-group"]`), 600);
		await take.hold(500);
		await take.click(await take.spot(take.page, `${MODAL} button[value="save"]`), 650);
		await take.hold(1100);
		await take.click(await take.spot(take.panel, '#group-tabs button:has-text("Copy")'), 950);
		await take.hold(450);
		await take.click(await take.spot(take.panel, `${ROW('Riotters')} .popup-page-toggle`), 650);
		await take.hold(700);
		// open the note from the list: Notate goes to it on the page and highlights its element
		await take.click(await take.spot(take.panel, ITEM('Ask copy team'), .4), 700);
		await take.end(2300); // the highlight starts about half a second after the click: hold through one pulse
		return { out: path.join(root, 'reel/preferred-clips/notate'), file: 'notate-copy-folder', posterAt: -.5 };
	},
	// The Design decisions figure: Notate on amplemarket.com, one note hovered so its element shows selected.
	async figure(take) {
		await folders(take);
		await otherSites(take, ['ample']);
		await take.seedNote({ url: SITE, title: 'Riotters – Explain your product value in a heartbeat ', text: TAGLINE, minutesAgo: 30 });
		// enough saved pages that the list reaches the Side panel callout
		await take.seedNote({ url: 'https://linear.app/method', title: 'The Linear Method', text: 'Good line on writing issues, not user stories.', group: 'Research', minutesAgo: 900 });
		await take.seedNote({ url: 'https://www.apple.com/macbook-air/', title: 'MacBook Air - Apple', text: 'Scroll-driven product reveal.', group: 'Inspiration', minutesAgo: 1000 });
		await take.seedNote({ url: 'https://www.figma.com/blog/design-systems-102/', title: 'Design Systems 102 | Figma Blog', text: 'Token naming worth borrowing.', group: 'Design', minutesAgo: 1100 });
		await take.warm();
		await take.notes([
			{ target: 'h1 >> nth=0', text: 'Two-line promise: agents first, then your team.', folder: 'Design' },
			{ target: 'text=Recently added', text: 'Show live agent activity like this in our demo.', folder: 'Inspiration' },
		], { stay: true });
		await take.page.keyboard.press('Escape');
		await take.scrollTop(0);
		await sleep(800);
		await take.panel.click(`${ROW('Amplemarket')} .popup-page-toggle`);
		await sleep(900);
		const note = take.page.locator('#notate-layer .notate-note').first();
		await take.begin();
		const [nx, ny] = await take.spot(take.page, note, .5, .5);
		await take.pointer(nx, ny);
		await take.hold(1500);
		const box = async (page, sel) => { const b = await page.locator(sel).first().boundingBox(); const r = page === take.panel ? take.geo.open.panel : take.siteRect(); return { x: r.x + b.x, y: r.y + b.y, width: b.width, height: b.height }; };
		const marks = { note: await box(take.page, '#notate-layer .notate-note:has-text("agent activity")'), element: await box(take.page, 'h1'), folders: await box(take.panel, '#group-tabs'),
			rows: await take.panel.evaluate(() => [...document.querySelectorAll('.popup-page-row')].map(r => { const b = r.getBoundingClientRect(); return [r.textContent.trim().slice(0, 18), Math.round(b.y + b.height / 2)]; })) };
		await take.end(300);
		console.log('figure marks (window px, 1440×933):', JSON.stringify(marks));
		return { dir: 'design-decisions', still: 'anatomy-amplemarket-laptop' };
	},
};

// Decision 01's window: Stripe among a pile of everyday tabs, as when you can't find anything.
const PILE = ['https://www.figma.com/', 'https://www.notion.com/', 'https://github.com/', 'https://linear.app/', 'https://vercel.com/', 'https://www.framer.com/',
	'https://dribbble.com/', 'https://www.behance.net/', 'https://www.awwwards.com/', 'https://www.youtube.com/', 'https://www.apple.com/', 'https://www.airbnb.com/',
	'https://medium.com/', 'https://www.producthunt.com/', 'https://www.wikipedia.org/', 'https://news.ycombinator.com/', 'https://mobbin.com/', 'https://www.canva.com/',
	'https://webflow.com/', 'https://www.shopify.com/', 'https://slack.com/', 'https://miro.com/', 'https://www.loom.com/', 'https://www.theverge.com/', 'https://arc.net/', 'https://www.spotify.com/'];
const pile = PILE.map((url, i) => ({ key: `tab${i}`, url, quick: true }));
const CLIP_TABS = { anchoring: [...pile.slice(0, 12), { key: 'stripe', url: STRIPE }, ...pile.slice(12)], figure: [{ key: 'ample', url: AMPLE }] };
const FILES = { annotate: 'annotate-laptop', organize: 'organize-laptop', return: 'return-laptop', anchoring: 'anchoring-laptop', folders: 'folders-laptop', revisit: 'revisit-laptop', deletion: 'deletion-laptop' };

module.exports = { Take, clips, folders, otherSites, SITE, STRIPE, WISE, AMPLE, POST };
if (require.main === module) (async () => {
	const names = process.argv.slice(2);
	const run = names.includes('all') ? Object.keys(clips).filter(n => n !== 'reel') : names; // 'all' = the case study's
	if (!run.length || run.some(n => !clips[n])) throw Error(`clips: ${Object.keys(clips).join(' ')} | all`);
	await new Promise(r => server.listen(0, '127.0.0.1', r));
	const base = `http://127.0.0.1:${server.address().port}`;
	const frameBrowser = await chromium.launch({ channel: 'chrome' });
	for (const name of run) {
		const take = await Take.open(base, frameBrowser, { tabs: CLIP_TABS[name] });
		const { dir, posterAt, still, ...to } = await clips[name](take).catch(async error => {
			// leave a picture of where it stopped
			const shot = path.join(os.tmpdir(), `notate-${name}-failed.png`);
			await take.page?.screenshot({ path: shot }).catch(() => {});
			const state = await take.page?.evaluate(() => ({ url: location.href, mode: document.documentElement.className, notes: [...document.querySelectorAll('.notate-note')].map(n => n.textContent.trim().slice(2, 40)) })).catch(e => e.message);
			const panel = await take.panel.evaluate(() => ({ url: location.href, rows: [...document.querySelectorAll('.popup-page-title')].map(t => t.textContent.slice(0, 24)), body: document.body.innerText.slice(0, 160) })).catch(e => e.message);
			console.error(`${name} stopped (active ${take.active}):`, JSON.stringify(state), JSON.stringify(panel), shot);
			throw error;
		});
		const out = process.env.NOTATE_OUT || to.out || path.join(root, 'assets/notate', dir);
		if (still) await take.still(out, still);
		else await take.render(out, to.file || FILES[name], posterAt);
	}
	await frameBrowser.close();
	server.close();
})().catch(e => { console.error(e); server.close(); process.exit(1); });
