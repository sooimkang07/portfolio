/* ============================================================
   main — HUD, film grain, frame loop, preview + render hooks
   ============================================================ */

const CHAPTERS = [
	[0, bt(4), '', ''],
	[bt(4), bt(8), '00', 'Intro'],
	[bt(8), bt(24), '01', 'Easing'],
	[bt(24), bt(40), '02', 'Typography'],
	[bt(40), bt(56), '03', 'Interface'],
	[bt(56), bt(72), '04', 'Camera'],
	[bt(72), bt(88), '05', 'Shape'],
	[bt(88), bt(104), '06', 'Dimension'],
	[bt(104), bt(116), '07', 'Particles'],
	[bt(116), 61, '08', 'End'],
];

function drawHUD(t) {
	const g = CV.hud;
	g.clearRect(0, 0, W, H);
	// vignette sits under the HUD so type stays crisp
	const vg = g.createRadialGradient(W / 2, H / 2, 420, W / 2, H / 2, 1250);
	vg.addColorStop(0, 'rgba(0,0,0,0)');
	vg.addColorStop(1, HUD.dark ? 'rgba(40,30,20,.16)' : 'rgba(0,0,0,.5)');
	g.fillStyle = vg; g.fillRect(0, 0, W, H);
	if (HUD.hidden) return;

	const fade = P(t, bt(4), bt(4) + .3, 'o3');
	const base = HUD.dark ? '17,17,17' : '242,239,233';
	const c = a => `rgba(${base},${a * fade})`;
	const ch = CHAPTERS.find(k => t >= k[0] && t < k[1]) || CHAPTERS[CHAPTERS.length - 1];

	// crop marks
	const m = 38, arm = 24;
	g.strokeStyle = c(.7); g.lineWidth = 1.5;
	[[m, m, 1, 1], [W - m, m, -1, 1], [m, H - m, 1, -1], [W - m, H - m, -1, -1]].forEach(([x, y, dx, dy]) => {
		g.beginPath(); g.moveTo(x, y + dy * arm); g.lineTo(x, y); g.lineTo(x + dx * arm, y); g.stroke();
	});

	// chapter index, rolling in on each change
	const since = t - ch[0];
	const roll = kf(since, [[0, 14], [.35, 0, 'oE']]);
	g.save();
	g.beginPath(); g.rect(60, 44, 700, 30); g.clip();
	g.globalAlpha = fade;
	dot(g, 80, 60 + roll, 4, COL.orange);
	label(g, ch[2], 94, 65 + roll, COL.orange, { w: 600 });
	label(g, ch[3], 130, 65 + roll, c(.62));
	g.restore();
	label(g, 'Sooim Kang — Showreel ’26', W - 80, 65, c(.62), { align: 'right' });

	// timecode + transport
	const f = Math.floor(t * FPS + 1e-6);
	const tc = `00:00:${String(Math.floor(t)).padStart(2, '0')}:${String(f % FPS).padStart(2, '0')}`;
	label(g, tc, 80, 1022, c(.62));
	label(g, `${FPS} fps · 1920×1080`, 248, 1022, c(.32));
	const beat = Math.floor(t / BEAT + 1e-6);
	const bar = Math.min(32, Math.floor(beat / 4) + 1);
	label(g, `bar ${String(bar).padStart(2, '0')}/32`, W - 80, 1022, c(.62), { align: 'right' });
	for (let i = 0; i < 4; i++) {
		const on = beat % 4 === i;
		g.fillStyle = on ? COL.orange : c(.25);
		g.fillRect(W - 262 + i * 13, 1011, 8, 8);
	}
	label(g, '128 bpm', W - 282, 1022, c(.32), { align: 'right' });

	// timeline rail with chapter ticks
	const x0 = 80, x1 = W - 80, y = 992;
	g.fillStyle = c(.16); g.fillRect(x0, y, x1 - x0, 1);
	g.fillStyle = c(.6); g.fillRect(x0, y, (x1 - x0) * clamp(t / DUR), 1);
	CHAPTERS.slice(1).forEach(k => {
		const x = x0 + (x1 - x0) * (k[0] / DUR);
		g.fillStyle = t >= k[0] ? c(.6) : c(.22);
		g.fillRect(x, y - 5, 1, 6);
	});
	g.save(); g.globalAlpha = fade;
	diamond(g, x0 + (x1 - x0) * clamp(t / DUR), y + .5, 7, COL.orange);
	g.restore();
}

/* film grain: a few pre-baked noise tiles, stepped per frame */
const GRAIN = (() => {
	const r = rng(7), tiles = [];
	for (let k = 0; k < 6; k++) {
		const c = document.createElement('canvas'); c.width = c.height = 256;
		const g = c.getContext('2d'), d = g.createImageData(256, 256);
		for (let i = 0; i < d.data.length; i += 4) {
			const v = 128 + (r() + r() + r() - 1.5) * 70;
			d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255;
		}
		g.putImageData(d, 0, 0); tiles.push(c);
	}
	return tiles;
})();
function drawGrain(t) {
	const g = CV.grain, f = Math.floor(t * 24);
	const tile = GRAIN[f % GRAIN.length];
	const ox = (hash(f, 3) * 256) | 0, oy = (hash(f, 5) * 256) | 0;
	g.fillStyle = g.createPattern(tile, 'repeat');
	g.save(); g.translate(-ox, -oy); g.fillRect(ox, oy, W, H); g.restore();
}

/* ── frame ───────────────────────────────────── */
let INITED = false;
function frame(t) {
	CLIPS.forEach(c => { c.want = null; });
	HUD.dark = false; HUD.hidden = false;
	CV.bg.clearRect(0, 0, W, H);
	CV.fx.clearRect(0, 0, W, H);
	fillBG(COL.ink);
	for (const s of SCENES) {
		const on = t >= s.a && t < s.b;
		s.r0.classList.toggle('on', on);
		s.r1.classList.toggle('on', on);
		if (!on) continue;
		CV.fx.save();
		if (s.dom) s.dom(t, s);
		if (s.draw) s.draw(t, s);
		CV.fx.restore();
	}
	drawGrain(t);
	drawHUD(t);
}

/* preview: keep clips roughly in sync while playing */
let playing = !RENDER;
function syncPlay() {
	for (const c of CLIPS) {
		const v = c.v;
		if (c.want == null) { if (!v.paused) v.pause(); continue; }
		const want = Math.min(c.want, (v.duration || 99) - .05);
		if (v.playbackRate !== c.rate) v.playbackRate = c.rate;
		if (v.paused) { v.currentTime = want; if (playing) v.play().catch(() => {}); }
		else if (Math.abs(v.currentTime - want) > .2) v.currentTime = want;
		if (!playing && Math.abs(v.currentTime - want) > .02) v.currentTime = want;
	}
}
/* render: exact seek of every requested clip */
function seekAll() {
	const jobs = [];
	for (const c of CLIPS) {
		const v = c.v;
		if (!v.paused) v.pause();
		if (c.want == null) continue;
		const want = Math.min(c.want, (v.duration || 99) - .04);
		if (Math.abs(v.currentTime - want) < .001 && v.readyState >= 2) continue;
		jobs.push(new Promise(res => {
			const done = () => { v.removeEventListener('seeked', done); res(); };
			v.addEventListener('seeked', done);
			v.currentTime = want;
			setTimeout(done, 4000);
		}));
	}
	return Promise.all(jobs);
}
const raf2 = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

async function loadClips() {
	const urls = {};
	await Promise.all([...new Set(CLIPS.map(c => c.name))].map(async n => {
		const b = await (await fetch(`clips/${n}.mp4`)).blob();
		urls[n] = URL.createObjectURL(b);
	}));
	CLIPS.forEach(c => { c.v.src = urls[c.name]; });
	await Promise.all(CLIPS.map(c => c.v.readyState >= 1 ? 0 : new Promise(r => {
		c.v.addEventListener('loadedmetadata', r, { once: true });
		c.v.addEventListener('error', r, { once: true });
	})));
}
async function ready() {
	await document.fonts.ready;
	await Promise.all([
		'700 100px "Instrument Sans"', '400 100px "Instrument Sans"', '600 100px "Instrument Sans"',
		'italic 400 100px "Instrument Serif"', '500 20px "JetBrains Mono"', '700 20px "JetBrains Mono"',
	].map(f => document.fonts.load(f)));
	SCENES.forEach(s => s.init && s.init(s));
	INITED = true;
	await loadClips();
}

const ui = { play: document.getElementById('play'), scrub: document.getElementById('scrub'), clock: document.getElementById('clock') };
function fitStage() {
	const vp = document.getElementById('viewport').getBoundingClientRect();
	const k = Math.min(vp.width / W, vp.height / H);
	document.getElementById('stage').style.transform = `translate(${-W * k / 2}px, ${-H * k / 2}px) scale(${k})`;
}

if (RENDER) {
	document.body.classList.add('render');
	window.__ready = ready().then(() => true);
	window.__frame = async t => { frame(t); await seekAll(); await raf2(); return true; };
} else {
	fitStage();
	addEventListener('resize', fitStage);
	let clockT = parseFloat(Q.get('t') || '0'), last = 0;
	ui.play.onclick = () => { playing = !playing; ui.play.textContent = playing ? 'Pause' : 'Play'; };
	ui.scrub.oninput = () => { clockT = +ui.scrub.value; };
	addEventListener('keydown', e => {
		if (e.code === 'Space') { e.preventDefault(); ui.play.click(); }
		if (e.code === 'ArrowRight') clockT = Math.min(DUR, clockT + (e.shiftKey ? BAR : 1 / FPS));
		if (e.code === 'ArrowLeft') clockT = Math.max(0, clockT - (e.shiftKey ? BAR : 1 / FPS));
	});
	ready().then(() => {
		last = performance.now();
		const loop = now => {
			const dt = Math.min(.1, (now - last) / 1000); last = now;
			if (playing) { clockT += dt; if (clockT >= DUR) clockT = 0; }
			frame(clockT); syncPlay();
			ui.scrub.value = clockT; ui.clock.textContent = clockT.toFixed(2);
			requestAnimationFrame(loop);
		};
		requestAnimationFrame(loop);
	});
}
