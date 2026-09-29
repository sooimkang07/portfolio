/* ============================================================
   parts — project worlds, the icon swap, media frames
   Each project blooms out of its own app icon into its own
   colour world, clipped by a shape from its brand, then folds
   back into the icon. The swap between icons is the homepage's
   rotating-logo motion (js/intro.js).
   ============================================================ */

const ICON = 220, ICON_R = 50;
const ICONS = '../project-app-icons/icon-';

/* order matches the homepage's rotating logo tile */
const PROJECTS = [
	{ id: 'yap', bg: 'linear-gradient(180deg,#fdf1e5 0%,#f2f0f1 50%,#e7effd 100%)', shape: 'circle' },
	{ id: 'notate', bg: '#fff5d2', shape: 'rect' },
	{ id: 'instagram', bg: 'linear-gradient(125deg,#fdc830 0%,#f77737 22%,#e1306c 48%,#c13584 68%,#833ab4 100%)', shape: 'rect' },
	{ id: 'amazon', bg: '#067d62', shape: 'smile' },
	{ id: 'neuk', bg: 'linear-gradient(180deg,#2f4452 0%,#22292f 100%)', shape: 'slash' },
	{ id: 'forage', bg: '#f8f4ff', shape: 'blob' },
	{ id: 'acuity', bg: '#ffffff', shape: 'triangle' },
];
const SEG = k => 4 + 12 * k;           // first beat of project k

/* smooth closed path through points (Catmull-Rom → cubic Bézier) */
function smoothPath(pts) {
	const n = pts.length;
	let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
	for (let i = 0; i < n; i++) {
		const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
		const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
		const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
		d += `C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
	}
	return d + 'Z';
}
/* Forage's five-lobed blob; `amp` 0 is a circle */
function blobPts(cx, cy, R, amp, rot = 0, n = 40, wob = 0) {
	const pts = [];
	for (let i = 0; i < n; i++) {
		const a = rot + i / n * TAU;
		const r = R * (1 + amp * Math.cos(5 * (a - rot)) + wob * Math.sin(3 * a + wob * 9));
		pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
	}
	return pts;
}

/* the world's clip at expansion e (0 = icon, 1 = full frame) */
function expandClip(shape, e) {
	const cx = W / 2, cy = H / 2;
	switch (shape) {
		case 'circle': return `circle(${lerp(ICON / 2, 1110, e).toFixed(1)}px at 50% 50%)`;
		case 'smile': return `ellipse(${lerp(78, 1500, e).toFixed(1)}px ${lerp(34, 1150, e).toFixed(1)}px at 50% ${lerp(56, 50, e)}%)`;
		case 'triangle': {
			const R = lerp(62, 2600, e), yc = cy + lerp(8, 0, e);
			const p = [[cx, yc - R], [cx + R * .866, yc + R * .5], [cx - R * .866, yc + R * .5]];
			return `polygon(${p.map(q => `${q[0].toFixed(1)}px ${q[1].toFixed(1)}px`).join(',')})`;
		}
		case 'slash': {
			const a = -56 * Math.PI / 180, hw = lerp(14, 1500, e), hl = lerp(70, 1600, e);
			const ux = Math.cos(a), uy = Math.sin(a), vx = -uy, vy = ux;
			const p = [[-hl, -hw], [hl, -hw], [hl, hw], [-hl, hw]].map(([u, v]) => [cx + ux * u + vx * v, cy + uy * u + vy * v]);
			return `polygon(${p.map(q => `${q[0].toFixed(1)}px ${q[1].toFixed(1)}px`).join(',')})`;
		}
		case 'blob': {
			const R = lerp(70, 1250, e);
			return `path('${smoothPath(blobPts(cx, cy, R, lerp(.2, 0, e), -Math.PI / 2 + e * .6))}')`;
		}
		default: {
			const x = (W / 2 - ICON / 2) * (1 - e), y = (H / 2 - ICON / 2) * (1 - e);
			return `inset(${y.toFixed(1)}px ${x.toFixed(1)}px round ${lerp(ICON_R, 0, e).toFixed(1)}px)`;
		}
	}
}
/* folding back into the icon (c 0 = full frame, 1 = icon) */
function contractClip(c) {
	const x = (W / 2 - ICON / 2) * c, y = (H / 2 - ICON / 2) * c;
	return `inset(${y.toFixed(1)}px ${x.toFixed(1)}px round ${lerp(0, ICON_R, c).toFixed(1)}px)`;
}

/* a world: coloured field + camera container for the project's content */
function makeWorld(s, k) {
	const p = PROJECTS[k];
	s.k = k; s.S = SEG(k);
	s.world = el('div', 'world', s.r0, { background: p.bg });
	s.cam = el('div', 'world__cam', s.world);
}
/* returns local beat L plus expand/contract progress; applies the clip */
function updateWorld(t, s) {
	const L = t / BEAT - s.S;
	const e = P(L, .7, 1.7, 'ease');
	const c = P(L, 9.9, 10.6, 'inout');
	s.world.style.clipPath = c > 0 ? contractClip(c) : expandClip(PROJECTS[s.k].shape, e);
	const cs = c > 0 ? lerp(1, .24, c) : lerp(.9, 1, e);
	s.cam.style.transform = `scale(${cs})`;
	return { L, e, c };
}

/* ── the icon swap (homepage logo tile) ───────── */
/* spring in: translateX(-140%) rotate(-24deg) scale(.6) → rest, 760ms --ease-spring */
function iconIn(t, t0) {
	const p = EZ.spring(clamp((t - t0) / .76));
	return { dx: lerp(-1.4 * ICON, 0, p), r: lerp(-24, 0, p), s: lerp(.6, 1, p), op: clamp(p * 1.4) };
}
/* wind up and fling: 0 → -8% / -4deg / 1.04 → 140% / 24deg / .6, 560ms */
function iconOut(t, t0) {
	const q = EZ.fling(clamp((t - t0) / .56));
	return { dx: track(q, [[0, 0], [.3, -.08 * ICON], [1, 1.4 * ICON]]), r: track(q, [[0, 0], [.3, -4], [1, 24]]), s: track(q, [[0, 1], [.3, 1.04], [1, .6]]), op: track(q, [[0, 1], [.3, 1], [1, 0]]) };
}
function iconEl(parent, id) {
	const e = el('div', 'icon', parent);
	e._w = e._h = ICON;
	el('img', null, e).src = `${ICONS}${id}.png`;
	return e;
}

/* ── media frames ─────────────────────────────── */
function card(parent, name, w, h, r = 24) {
	const e = el('div', 'card', parent, { width: w + 'px', height: h + 'px', borderRadius: r + 'px' });
	e._w = w; e._h = h;
	return { el: e, c: clip(name, e) };
}
function phone(parent, name, h = 860) {
	const w = Math.round(h * .462);
	const e = el('div', 'phone', parent, { width: w + 'px', height: h + 'px' });
	e._w = w; e._h = h;
	const sc = el('div', 'phone__screen', e);
	return { el: e, c: clip(name, sc) };
}
function full(parent, name) {
	return clip(name, parent, { left: 0, top: 0, width: W + 'px', height: H + 'px' });
}
