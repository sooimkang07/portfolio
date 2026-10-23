// Records the onboarding walkthrough for notate.html (Core flows → Onboarding) as a screen recording:
// install from the Chrome Web Store, the welcome page, open the side panel, pin, then Get started, which opens
// the live site (sooimkang.com/about) for a first note. Recorded at 1920×1200 so the welcome page keeps its
// desktop layout with the side panel open. It drives notate-demo/ (the extension's real welcome page and side panel inside a
// Chrome stand-in) with a drawn cursor, and captures it in real time with Chrome's screencast.
//   node scripts/notate/record-onboarding.cjs
// Writes assets/notate/core-flows/onboarding-walkthrough.mp4 and onboarding-walkthrough-poster.jpg.
const fs = require('fs'), os = require('os'), path = require('path'), http = require('http'), { spawn } = require('child_process');
const deps = process.env.NOTATE_RENDER_DEPS || path.join(os.homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules');
const { chromium } = require(path.join(deps, 'playwright'));
const sharp = require(path.join(deps, 'sharp'));
const ffmpeg = process.env.FFMPEG || '/opt/homebrew/bin/ffmpeg';
const root = path.resolve(__dirname, '../..');
const out = path.join(root, 'assets/notate/core-flows');
const W = 1920, H = 1200, DPR = 1.5, FPS = 30, OUT_W = 1920, OUT_H = 1200;
const NOTE = 'Love how this frames the human side of design.';

// The demo talks over BroadcastChannel, which needs a real origin: serve the repo locally.
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.webm': 'video/webm', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.json': 'application/json', '.mp3': 'audio/mpeg' };
const server = http.createServer((req, res) => {
	let file = path.join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname));
	if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
	if (!fs.existsSync(file) && fs.existsSync(file + '.html')) file += '.html';
	if (!file.startsWith(root) || !fs.existsSync(file)) { res.writeHead(404); return res.end(); }
	res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
	fs.createReadStream(file).pipe(res);
});

const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
	await new Promise(r => server.listen(0, '127.0.0.1', r));
	const base = `http://127.0.0.1:${server.address().port}`;
	const browser = await chromium.launch({ channel: 'chrome' });
	const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: DPR });
	await page.goto(`${base}/notate-demo/index.html?record`, { waitUntil: 'load' });
	await sleep(800);

	// Real-time capture: Chrome sends a frame whenever the screen changes.
	const cdp = await page.context().newCDPSession(page);
	const frames = [];
	cdp.on('Page.screencastFrame', ({ data, metadata, sessionId }) => {
		frames.push({ t: metadata.timestamp, data: Buffer.from(data, 'base64') });
		cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
	});
	await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: W * DPR, maxHeight: H * DPR, everyNthFrame: 1 });

	// The drawn cursor moves with the real mouse, so hover states in the pages respond as it passes.
	let cx = 1140, cy = 760;
	const at = (x, y) => page.evaluate(([a, b]) => window.notateRec.at(a, b), [x, y]);
	const mode = name => page.evaluate(n => window.notateRec.mode(n), name);
	const glide = async (x, y, ms = 650) => {
		const n = Math.max(10, Math.round(ms / 16)), sx = cx, sy = cy;
		for (let i = 1; i <= n; i++) {
			const t = i / n, e = t < .5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
			const px = sx + (x - sx) * e, py = sy + (y - sy) * e;
			await page.mouse.move(px, py);
			await at(px, py);
			await sleep(Math.max(0, ms / n - 6));
		}
		cx = x; cy = y;
	};
	const center = async locator => { const b = await locator.boundingBox(); return [b.x + b.width / 2, b.y + b.height / 2]; };
	const click = async (locator, ms) => {
		const [x, y] = await center(locator);
		await glide(x, y, ms);
		await sleep(120);
		await page.evaluate(([a, b]) => window.notateRec.click(a, b), [x, y]);
		await page.mouse.down(); await sleep(80); await page.mouse.up();
	};
	await at(cx, cy);
	await sleep(900);

	// 1 · Install from the Chrome Web Store
	await click(page.locator('[data-add]'), 900);
	await sleep(900);
	await click(page.locator('[data-install-add]'), 700);
	await sleep(2600);

	// 2 · Welcome page: open the side panel
	const welcome = page.frameLocator('[data-page="welcome"]');
	await click(welcome.locator('#open-sidebar'), 800);
	await sleep(1700);

	// 3 · Pin Notate from the Extensions menu
	await click(page.locator('[data-extensions]'), 800);
	await sleep(600);
	await click(page.locator('[data-pin]'), 500);
	await sleep(900);
	await click(welcome.locator('h1'), 700); // click away to close the menu
	await sleep(1500);

	// 4 · Get started: sooimkang.com opens beside the side panel
	await click(welcome.locator('#get-started'), 800);
	await sleep(2800);

	// 5 · First note: New, pick the headline, write, save
	const panel = page.frameLocator('[data-panel-frame]');
	const practice = page.frameLocator('[data-page="practice"]');
	await click(panel.locator('[data-action="start-annotating"]'), 900);
	await sleep(300);
	await mode('pencil');
	const [px, py] = await center(practice.locator('main p').first());
	await glide(px - 120, py, 700);
	await sleep(350);
	await click(practice.locator('main h1').first(), 600);
	await mode('arrow');
	await sleep(500);
	await page.keyboard.type(NOTE, { delay: 42 });
	await sleep(600);
	await click(practice.locator('#notate-modal button[value="save"]'), 700);
	// End on the live site: the note on its element, and in the side panel.
	await glide(cx + 160, cy + 140, 800);
	await sleep(2800);

	await cdp.send('Page.stopScreencast');
	const posterFrame = frames.at(-1);
	await browser.close();
	server.close();

	// Constant 30 fps from the timestamped frames (static stretches repeat the last frame).
	const start = frames[0].t, end = posterFrame.t + .4;
	fs.mkdirSync(out, { recursive: true });
	const mp4 = path.join(out, 'onboarding-walkthrough.mp4');
	const proc = spawn(ffmpeg, ['-y', '-f', 'image2pipe', '-vcodec', 'mjpeg', '-framerate', String(FPS), '-i', 'pipe:0', '-an', '-vf', `scale=${OUT_W}:${OUT_H}:flags=lanczos`, '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', mp4]);
	let errors = ''; proc.stderr.on('data', d => { errors += d; });
	const done = new Promise((resolve, reject) => { proc.on('exit', c => (c === 0 ? resolve() : reject(Error(errors)))); proc.on('error', reject); });
	let k = 0;
	for (let t = start; t <= end; t += 1 / FPS) {
		while (k + 1 < frames.length && frames[k + 1].t <= t) k++;
		if (!proc.stdin.write(frames[k].data)) await new Promise(r => proc.stdin.once('drain', r));
	}
	proc.stdin.end();
	await done;
	await sharp(posterFrame.data).resize(OUT_W, OUT_H).jpeg({ quality: 86 }).toFile(path.join(out, 'onboarding-walkthrough-poster.jpg'));
	console.log(`onboarding-walkthrough.mp4: ${OUT_W}×${OUT_H}, ${(end - start).toFixed(1)}s, ${frames.length} captured frames`);
})().catch(e => { console.error(e); server.close(); process.exit(1); });
