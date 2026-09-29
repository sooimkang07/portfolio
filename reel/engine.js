/* ============================================================
   SOOIM KANG — SHOWREEL · engine
   Every frame is a pure function of t, so the live preview and
   the frame-exact render agree. 128 BPM: 32 bars = 60s.
   Motion uses the portfolio's own curves (css/base.css).
   ============================================================ */

const W = 1920, H = 1080;
const BPM = 128, BEAT = 60 / BPM, DUR = 64 * BEAT;
const bt = n => n * BEAT;
const Q = new URLSearchParams(location.search);
const RENDER = Q.get('render') === '1';
const FPS = +(Q.get('fps') || 60);

/* ── math ─────────────────────────────────────── */
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, p) => a + (b - a) * p;
const TAU = Math.PI * 2;

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

/* the portfolio's motion curves */
const EZ = {
	lin: p => p,
	ease: bezier(.22, 1, .36, 1),      // --ease: hovers, flips, reveals
	inout: bezier(.65, 0, .35, 1),     // --ease-inout: page-level moves
	spring: bezier(.34, 1.56, .64, 1), // --ease-spring
	intro: bezier(.2, .75, .2, 1),     // greeting line entrance (js/intro.js)
	strip: bezier(.76, 0, .24, 1),     // greeting settling into the strip
	fling: bezier(.5, 0, .75, 0),      // logo tile wind-up and fling
	glass: bezier(.25, 1, .5, 1),      // --glass-ease
	out3: p => 1 - Math.pow(1 - p, 3),
	in2: p => p * p,
};
/* eased progress of t through [a, b] */
const P = (t, a, b, e = 'lin') => EZ[e](clamp((t - a) / (b - a || 1e-9)));
/* keyframes [[t, v, ease], ...] — ease shapes the segment arriving at that key */
function kf(t, keys) {
	if (t <= keys[0][0]) return keys[0][1];
	for (let i = 1; i < keys.length; i++) {
		const [t1, v1, e] = keys[i];
		if (t <= t1) {
			const [t0, v0] = keys[i - 1];
			return lerp(v0, v1, EZ[e || 'inout']((t - t0) / (t1 - t0 || 1)));
		}
	}
	return keys[keys.length - 1][1];
}
/* piecewise-linear keyframe track driven by an already-eased progress p */
function track(p, stops) {
	if (p <= stops[0][0]) return stops[0][1];
	for (let i = 1; i < stops.length; i++) {
		if (p <= stops[i][0]) {
			const [p0, v0] = stops[i - 1], [p1, v1] = stops[i];
			const q = (p - p0) / (p1 - p0);
			return Array.isArray(v0) ? v0.map((v, j) => lerp(v, v1[j], q)) : lerp(v0, v1, q);
		}
	}
	return stops[stops.length - 1][1];
}
/* damped spring step response, t in seconds since release */
function spring(t, freq = 2, damp = .45) {
	if (t <= 0) return 0;
	const w = TAU * freq, wd = w * Math.sqrt(1 - damp * damp);
	return 1 - Math.exp(-damp * w * t) * (Math.cos(wd * t) + (damp * w / wd) * Math.sin(wd * t));
}
const hash = (i, s = 1) => { const x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return x - Math.floor(x); };

/* ── DOM ──────────────────────────────────────── */
const L0 = document.getElementById('L0'), L1 = document.getElementById('L1');
function el(tag, cls, parent, css, html) {
	const e = document.createElement(tag);
	if (cls) e.className = cls;
	if (css) Object.assign(e.style, css);
	if (html != null) e.innerHTML = html;
	if (parent) parent.appendChild(e);
	return e;
}
/* place an element (left/top 0) so its centre sits at (x, y) */
function place(e, { x = W / 2, y = H / 2, w, h, s = 1, r = 0, rx = 0, ry = 0, op, z = 0, blur } = {}) {
	if (w != null) e.style.width = w + 'px';
	if (h != null) e.style.height = h + 'px';
	const ww = w ?? e._w ?? e.offsetWidth, hh = h ?? e._h ?? e.offsetHeight;
	e.style.transform = `translate3d(${x - ww / 2}px,${y - hh / 2}px,${z}px) rotateX(${rx}deg) rotateY(${ry}deg) rotate(${r}deg) scale(${s})`;
	if (op !== undefined) e.style.opacity = op;
	if (blur !== undefined) e.style.filter = blur > .05 ? `blur(${blur}px)` : 'none';
}
const vis = (e, on) => { e.style.display = on ? '' : 'none'; };

/* ── video clips ──────────────────────────────── */
const CLIPS = [];
function clip(name, parent, css) {
	const box = el('div', 'vbox', parent, css);
	const v = el('video', null, box);
	v.muted = true; v.playsInline = true; v.preload = 'auto';
	const c = { name, box, v, want: null, rate: 1 };
	CLIPS.push(c);
	return c;
}
/* request a clip frame this tick */
function at(c, time, rate = 1) { c.want = Math.max(0, time); c.rate = rate; }

/* ── scenes ───────────────────────────────────── */
const SCENES = [];
function scene(a, b, def) {
	const s = Object.assign({ a, b }, def);
	s.r0 = el('div', 'root', L0);
	s.r1 = el('div', 'root', L1);
	SCENES.push(s);
	return s;
}
