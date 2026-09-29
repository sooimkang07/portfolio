/* ============================================================
   SOOIM KANG — SHOWREEL ’26 · engine
   Every frame is a pure function of t, so the preview and the
   frame-exact render always agree. 128 BPM: 32 bars = 60s.
   ============================================================ */

const W = 1920, H = 1080, DUR = 60;
const BPM = 128, BEAT = 60 / BPM, BAR = BEAT * 4;
const bt = n => n * BEAT;
const Q = new URLSearchParams(location.search);
const RENDER = Q.get('render') === '1';
const FPS = +(Q.get('fps') || 60);

const COL = {
	ink: '#0c0c0d',
	ink2: '#151516',
	white: '#f2efe9',
	cream: '#e9e4da',
	orange: '#ff5a1f',
	glow: 'rgba(255,90,31,.55)',
};
const rgba = (hex, a) => {
	const n = parseInt(hex.slice(1), 16);
	return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
};
const FONT = {
	sans: "'Instrument Sans'",
	serif: "'Instrument Serif'",
	mono: "'JetBrains Mono'",
};

/* ── math ─────────────────────────────────────── */
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, p) => a + (b - a) * p;
const mix = (a, b, p) => Array.isArray(a) ? a.map((v, i) => lerp(v, b[i], p)) : lerp(a, b, p);
const TAU = Math.PI * 2;

const E = {
	lin: p => p,
	i2: p => p * p,
	o2: p => 1 - (1 - p) * (1 - p),
	i3: p => p * p * p,
	o3: p => 1 - Math.pow(1 - p, 3),
	io3: p => p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2,
	io4: p => p < .5 ? 8 * p * p * p * p : 1 - Math.pow(-2 * p + 2, 4) / 2,
	o4: p => 1 - Math.pow(1 - p, 4),
	o5: p => 1 - Math.pow(1 - p, 5),
	oE: p => p >= 1 ? 1 : 1 - Math.pow(2, -10 * p),
	iE: p => p <= 0 ? 0 : Math.pow(2, 10 * p - 10),
	ioE: p => p <= 0 ? 0 : p >= 1 ? 1 : p < .5 ? Math.pow(2, 20 * p - 10) / 2 : (2 - Math.pow(2, -20 * p + 10)) / 2,
	oB: p => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2); },
	oB2: p => { const c1 = 2.4, c3 = c1 + 1; return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2); },
	oEl: p => p <= 0 ? 0 : p >= 1 ? 1 : Math.pow(2, -10 * p) * Math.sin((p * 10 - .75) * TAU / 3) + 1,
};
/* eased progress of t through [a, b] */
const P = (t, a, b, e = 'lin') => E[e](clamp((t - a) / (b - a)));
/* keyframes [[t, v, ease], ...] — ease shapes the segment arriving at a key */
function kf(t, keys) {
	if (t <= keys[0][0]) return keys[0][1];
	for (let i = 1; i < keys.length; i++) {
		const [t1, v1, e] = keys[i];
		if (t <= t1) {
			const [t0, v0] = keys[i - 1];
			return mix(v0, v1, E[e || 'io3']((t - t0) / (t1 - t0 || 1)));
		}
	}
	return keys[keys.length - 1][1];
}
/* CSS-style cubic-bezier timing function */
function bezier(x1, y1, x2, y2) {
	const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
	const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
	const sx = s => ((ax * s + bx) * s + cx) * s;
	const sy = s => ((ay * s + by) * s + cy) * s;
	const dx = s => (3 * ax * s + 2 * bx) * s + cx;
	return x => {
		if (x <= 0) return 0; if (x >= 1) return 1;
		let s = x;
		for (let i = 0; i < 8; i++) {
			const e = sx(s) - x, d = dx(s);
			if (Math.abs(e) < 1e-6) return sy(s);
			if (Math.abs(d) < 1e-6) break;
			s -= e / d;
		}
		let lo = 0, hi = 1; s = x;
		for (let i = 0; i < 30; i++) { const v = sx(s); if (Math.abs(v - x) < 1e-6) break; if (v < x) lo = s; else hi = s; s = (lo + hi) / 2; }
		return sy(s);
	};
}
/* damped spring step response, t in seconds since release */
function spring(t, freq = 2.2, damp = .38) {
	if (t <= 0) return 0;
	const w = TAU * freq, wd = w * Math.sqrt(1 - damp * damp);
	return 1 - Math.exp(-damp * w * t) * (Math.cos(wd * t) + (damp * w / wd) * Math.sin(wd * t));
}
/* chain of springs: value moves through [[t, v], ...] with spring settling */
function springs(t, keys, freq = 2.2, damp = .38) {
	let v = keys[0][1];
	for (let i = 1; i < keys.length; i++) v += (keys[i][1] - keys[i - 1][1]) * spring(t - keys[i][0], freq, damp);
	return v;
}
/* decaying pulse after each beat time */
const pulse = (t, times, k = 8) => times.reduce((s, tb) => s + (t >= tb ? Math.exp(-(t - tb) * k) : 0), 0);

/* deterministic random */
function rng(seed) {
	let a = seed >>> 0;
	return () => {
		a |= 0; a = a + 0x6D2B79F5 | 0;
		let t = Math.imul(a ^ a >>> 15, 1 | a);
		t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
		return ((t ^ t >>> 14) >>> 0) / 4294967296;
	};
}
const hash = (i, s = 1) => { const x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return x - Math.floor(x); };

/* ── canvases ─────────────────────────────────── */
const CV = {
	bg: document.getElementById('bg').getContext('2d'),
	fx: document.getElementById('fx').getContext('2d'),
	grain: document.getElementById('grain').getContext('2d'),
	hud: document.getElementById('hud').getContext('2d'),
};
function setFont(ctx, { fam = 'sans', w = 700, size = 100, style = 'normal', stretch = 'normal', ls = 0 } = {}) {
	ctx.font = `${style} ${w} ${size}px ${FONT[fam]}`;
	ctx.fontStretch = stretch;
	ctx.letterSpacing = ls + 'px';
}
/* glyph x-offsets including kerning, for per-letter animation */
function glyphs(ctx, str) {
	const out = [];
	for (let i = 0; i < str.length; i++) {
		const x = ctx.measureText(str.slice(0, i)).width;
		const w = ctx.measureText(str.slice(0, i + 1)).width - x;
		out.push({ ch: str[i], x, w });
	}
	out.width = ctx.measureText(str).width;
	return out;
}
function dot(ctx, x, y, r, color, glow = 0) {
	ctx.save();
	if (glow) { ctx.shadowColor = COL.glow; ctx.shadowBlur = glow; }
	ctx.fillStyle = color;
	ctx.beginPath(); ctx.arc(x, y, Math.max(0, r), 0, TAU); ctx.fill();
	ctx.restore();
}
/* ellipse for squash & stretch: sx along `ang`, sy across */
function blob(ctx, x, y, r, sx, sy, ang, color, glow = 0) {
	ctx.save();
	if (glow) { ctx.shadowColor = COL.glow; ctx.shadowBlur = glow; }
	ctx.translate(x, y); ctx.rotate(ang);
	ctx.fillStyle = color;
	ctx.beginPath(); ctx.ellipse(0, 0, Math.max(0, r * sx), Math.max(0, r * sy), 0, 0, TAU); ctx.fill();
	ctx.restore();
}
function line(ctx, x1, y1, x2, y2, color, w = 1, dash = null) {
	ctx.save();
	ctx.strokeStyle = color; ctx.lineWidth = w;
	if (dash) ctx.setLineDash(dash);
	ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
	ctx.restore();
}
function diamond(ctx, x, y, s, fill, stroke, lw = 1.5) {
	ctx.save();
	ctx.translate(x, y); ctx.rotate(Math.PI / 4);
	if (fill) { ctx.fillStyle = fill; ctx.fillRect(-s / 2, -s / 2, s, s); }
	if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.strokeRect(-s / 2, -s / 2, s, s); }
	ctx.restore();
}
function label(ctx, txt, x, y, color, { size = 14, align = 'left', w = 500, ls = 1.4 } = {}) {
	setFont(ctx, { fam: 'mono', w, size, ls });
	ctx.textAlign = align; ctx.textBaseline = 'alphabetic';
	ctx.fillStyle = color;
	ctx.fillText(txt.toUpperCase(), x, y);
	ctx.letterSpacing = '0px';
}
function fillBG(color) { CV.bg.fillStyle = color; CV.bg.fillRect(0, 0, W, H); }
/* dark stage with a soft centre lift */
function darkBG(lift = 1, cx = W / 2, cy = H / 2) {
	const g = CV.bg;
	g.fillStyle = COL.ink; g.fillRect(0, 0, W, H);
	const rg = g.createRadialGradient(cx, cy, 0, cx, cy, 1100);
	rg.addColorStop(0, `rgba(40,40,42,${.9 * lift})`);
	rg.addColorStop(1, 'rgba(12,12,13,0)');
	g.fillStyle = rg; g.fillRect(0, 0, W, H);
}
function lightBG(color = COL.cream) {
	const g = CV.bg;
	g.fillStyle = color; g.fillRect(0, 0, W, H);
	const rg = g.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, 1200);
	rg.addColorStop(0, 'rgba(255,255,255,.35)');
	rg.addColorStop(1, 'rgba(0,0,0,.06)');
	g.fillStyle = rg; g.fillRect(0, 0, W, H);
}

/* ── DOM ──────────────────────────────────────── */
const L0 = document.getElementById('dom0'), L1 = document.getElementById('dom1');
function el(tag, cls, parent, css, html) {
	const e = document.createElement(tag);
	if (cls) e.className = cls;
	if (css) Object.assign(e.style, css);
	if (html != null) e.innerHTML = html;
	if (parent) parent.appendChild(e);
	return e;
}
/* place an element's centre at (x, y) */
function T(e, { x = W / 2, y = H / 2, s = 1, sx = 1, sy = 1, r = 0, op } = {}) {
	e.style.transform = `translate(${x}px,${y}px) translate(-50%,-50%) rotate(${r}deg) scale(${s * sx},${s * sy})`;
	if (op !== undefined) e.style.opacity = op;
}
const vis = (e, on) => { e.style.visibility = on ? 'visible' : 'hidden'; };

/* ── video clips (DOM) ────────────────────────── */
const CLIPS = [];
function clip(name, parent, css) {
	const box = el('div', 'vbox', parent, css);
	const v = el('video', null, box);
	v.muted = true; v.playsInline = true; v.preload = 'auto';
	const c = { name, box, v, want: null, rate: 1 };
	CLIPS.push(c);
	return c;
}
/* ask for a clip frame this tick; clamps to the clip's length */
function at(c, time, rate = 1) { c.want = Math.max(0, time); c.rate = rate; }

/* ── scenes ───────────────────────────────────── */
const SCENES = [];
/* def: { init(s), dom(t, s), draw(t, s) } — roots are shown only while active */
function scene(a, b, def) {
	const s = Object.assign({ a, b }, def);
	s.r0 = el('div', 'root', L0);
	s.r1 = el('div', 'root', L1);
	SCENES.push(s);
	return s;
}

/* per-frame HUD state that scenes may override */
const HUD = { dark: false, hidden: false };
