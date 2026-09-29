/* ============================================================
   SOOIM KANG — REEL
   A deterministic 60s timeline: every frame is a pure function
   of t. Preview plays in real time; ?render=1 exposes
   window.__frame(t) so a headless browser can step it exactly.
   Grid: 120 BPM → 1 beat = 0.5s, 1 bar = 2s.
   ============================================================ */

const W = 1920, H = 1080, DUR = 60, FPS = 30;
const RENDER = /[?&]render=1/.test(location.search);
const stage = document.getElementById('stage');

const C = {
	ink: '#0c0d0c', paper: '#fafcfd', cobalt: '#2a3cff',
	lilac: '#b9a7ff', peach: '#ffc9a8', mint: '#bff0d8',
	cream: '#fff8dc', note: '#f7d84a',
	igY: '#ffc400', igO: '#ff7a00', igP: '#a100d8', igK: '#e0006b',
	mist: '#edf0f3',
	navy: '#1f2a36', neon: '#5bb0f0',
	amz: '#0f8a5f', amzMint: '#e6f6ed',
	lime: '#d4ff3f',
	wall: '#e4572e',
};

/* ── math ───────────────────────────────────── */
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, p) => Array.isArray(a) ? a.map((v, i) => lerp(v, b[i], p)) : a + (b - a) * p;
const E = {
	lin: p => p,
	o2: p => 1 - (1 - p) * (1 - p),
	i3: p => p * p * p,
	o3: p => 1 - Math.pow(1 - p, 3),
	io3: p => p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2,
	o4: p => 1 - Math.pow(1 - p, 4),
	oE: p => p === 1 ? 1 : 1 - Math.pow(2, -10 * p),
	iE: p => p === 0 ? 0 : Math.pow(2, 10 * p - 10),
	ioE: p => p === 0 ? 0 : p === 1 ? 1 : p < .5 ? Math.pow(2, 20 * p - 10) / 2 : (2 - Math.pow(2, -20 * p + 10)) / 2,
	oB: p => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2); },
	oB2: p => { const c1 = 2.6, c3 = c1 + 1; return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2); },
	oEl: p => p === 0 ? 0 : p === 1 ? 1 : Math.pow(2, -10 * p) * Math.sin((p * 10 - .75) * (2 * Math.PI) / 3) + 1,
};
/* progress of t through [a,b], eased */
const P = (t, a, b, e = 'lin') => E[e](clamp((t - a) / (b - a)));
/* keyframes: [[time, value, ease], ...] — ease shapes the segment arriving at that key */
function kf(t, keys) {
	if (t <= keys[0][0]) return keys[0][1];
	for (let i = 1; i < keys.length; i++) {
		const [t1, v1, e] = keys[i];
		if (t <= t1) {
			const [t0, v0] = keys[i - 1];
			return lerp(v0, v1, E[e || 'io3']((t - t0) / (t1 - t0 || 1)));
		}
	}
	return keys[keys.length - 1][1];
}
/* deterministic pseudo-random */
const rnd = (i, s = 1) => { const x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return x - Math.floor(x); };

/* ── dom ────────────────────────────────────── */
function el(tag, cls, parent, css, html) {
	const e = document.createElement(tag);
	if (cls) e.className = cls;
	if (css) Object.assign(e.style, css);
	if (html != null) e.innerHTML = html;
	if (parent) parent.appendChild(e);
	return e;
}
/* transform: centre at (x,y) */
function T(e, o = {}) {
	const { x = W / 2, y = H / 2, s = 1, sx = 1, sy = 1, r = 0, rx = 0, ry = 0, op } = o;
	e.style.transform = `translate(${x}px,${y}px) translate(-50%,-50%) rotateX(${rx}deg) rotateY(${ry}deg) rotate(${r}deg) scale(${s * sx},${s * sy})`;
	if (op !== undefined) e.style.opacity = op;
}
const show = (e, on) => { e.style.visibility = on ? 'visible' : 'hidden'; };
/* split text into per-character spans */
function chars(parent, text) {
	return [...text].map(ch => el('span', 'ch', parent, null, ch === ' ' ? '&nbsp;' : ch));
}
/* scale a text element so its layout width fits `w` */
function fitW(e, w) {
	const s = w / e.offsetWidth;
	e.style.fontSize = (parseFloat(getComputedStyle(e).fontSize) * s) + 'px';
}

/* ── video clips ────────────────────────────── */
const CLIPS = [];
function clip(name, parent, css) {
	const box = el('div', 'vbox', parent, css);
	const v = el('video', null, box);
	v.muted = true; v.playsInline = true; v.preload = 'auto';
	const c = { name, box, v, want: null, rate: 1 };
	CLIPS.push(c);
	return c;
}
/* request clip time this frame */
function at(c, time, rate = 1) { c.want = Math.max(0, time); c.rate = rate; }

/* ── scenes ─────────────────────────────────── */
const SCENES = [];
function scene(a, b, build, update, z = 0) {
	const root = el('div', 'scene', stage, { zIndex: z });
	const s = { a, b, root, update };
	build(root, s);
	SCENES.push(s);
	return s;
}

/* ================================================================
   01 · HOOK — footage strobes through "SOOIM", then we dive
   through the I.                                        0.0 – 2.0
   ================================================================ */
const HOOK_CLIPS = ['h_woman', 'h_film', 'h_ring', 'h_neuk', 'h_sel', 'h_ig', 'h_prime', 'h_mural', 'h_love', 'h_fellow'];
scene(0, 2, (r, s) => {
	r.classList.add('iso');
	s.clips = HOOK_CLIPS.map(n => clip(n, r, { position: 'absolute', inset: 0 }));
	s.walk = clip('h_walk', r, { position: 'absolute', inset: 0 });
	s.layer = el('div', 'fill', r, { mixBlendMode: 'screen' });
	s.knock = el('div', 'knock', s.layer);
	s.word = el('div', 't c', s.knock, { fontSize: '560px', letterSpacing: '-0.05em', position: 'absolute' });
	s.ch = chars(s.word, 'SOOIM');
	s.word.style.position = 'absolute';
}, (t, s) => {
	if (!s.fit) {
		fitW(s.word, 1760);
		const I = s.ch[3];
		s.ix = I.offsetLeft + I.offsetWidth / 2;
		s.iy = s.word.offsetHeight * 0.52;
		s.word.style.transformOrigin = `${s.ix}px ${s.iy}px`;
		s.fit = true;
	}
	// footage strobe on 16ths
	const idx = Math.floor(t / 0.125) % s.clips.length;
	const hold = t >= 1.5;
	s.clips.forEach((c, i) => {
		const on = !hold && i === idx;
		show(c.box, on);
		if (on) at(c, (t % 0.5) + 0.1);
	});
	show(s.walk.box, hold);
	if (hold) at(s.walk, t - 1.5);
	s.walk.box.style.transform = `scale(${kf(t, [[1.5, 1.18], [2, 1.04, 'oE']])})`;

	// type: slam in, pulse on beats, then dive into the I
	const slam = kf(t, [[0, 1.45], [0.4, 1, 'oE']]);
	const pulse = 1 + 0.035 * (Math.exp(-((t - 0.5) % 0.25) * 18) * (t > 0.5 && t < 1 ? 1 : 0));
	const dive = kf(t, [[1, 1], [1.5, 90, 'iE']]);
	const w = s.word;
	w.style.left = (W / 2 - w.offsetWidth / 2) + 'px';
	w.style.top = (H / 2 - w.offsetHeight / 2) + 'px';
	// keep the I centred as we dive
	const cx = lerp(0, W / 2 - (W / 2 - w.offsetWidth / 2 + s.ix), P(t, 1, 1.35, 'o3'));
	const cy = lerp(0, H / 2 - (H / 2 - w.offsetHeight / 2 + s.iy), P(t, 1, 1.35, 'o3'));
	w.style.transform = `translate(${cx}px,${cy}px) scale(${slam * pulse * dive})`;
	w.style.letterSpacing = kf(t, [[0, 0.04], [0.45, -0.05, 'oE']]) + 'em';
	show(s.layer, t < 1.5);
});

/* ================================================================
   02 · MANIFESTO — "I design for how people actually behave."
   One word-card per beat, each a different type treatment. 2.0 – 6.0
   ================================================================ */
scene(2, 6, (r, s) => {
	s.bg = el('div', 'fill', r);
	// w1 — line reveal
	s.w1 = el('div', 't c', r, { fontSize: '300px', color: C.paper });
	s.w1a = el('span', 'mask', s.w1); s.w1ai = el('span', 'ch', s.w1a, null, 'I');
	el('span', null, s.w1, null, '&nbsp;');
	s.w1b = el('span', 'mask', s.w1); s.w1bi = el('span', 'ch', s.w1b, null, 'design');
	// w2 — width axis stretch
	s.w2 = el('div', 't c', r, { fontSize: '340px', color: C.paper }, 'for how');
	// w3 — footage inside type
	s.w3 = el('div', 'fill iso', r);
	s.w3c = clip('h_walk', s.w3, { position: 'absolute', inset: 0 });
	s.w3k = el('div', 'knock', s.w3);
	s.w3t = el('div', 't', s.w3k, { fontSize: '520px', letterSpacing: '-0.055em' }, 'people');
	// w4 — letters drop
	s.w4 = el('div', 't c', r, { fontSize: '300px', color: C.paper });
	s.w4c = chars(s.w4, 'actually');
	// w5 — serif + dot that becomes the next frame
	s.w5 = el('div', 't c serif', r, { fontSize: '380px', color: C.ink });
	s.w5c = chars(s.w5, 'behave');
	s.dot = el('div', 'c', r, { width: '70px', height: '70px', borderRadius: '50%', background: C.cobalt });
	// name card
	s.nm = el('div', 'c', r, { textAlign: 'center', color: C.paper });
	s.nm1 = el('div', 't', s.nm, { fontSize: '210px' }, 'Sooim Kang');
	s.nm2 = el('div', 'serif', s.nm, { fontSize: '150px', lineHeight: 1, marginTop: '6px' }, 'Product Designer');
	s.lab = el('div', 'c', r, { fontSize: '26px', fontWeight: 600, color: C.paper, letterSpacing: '0.02em' }, 'SELECTED WORK — 2025/26');
}, (t, s) => {
	const beat = Math.floor((t - 2) / 0.5); // 0..7
	const bg = [C.ink, C.cobalt, C.paper, C.ink, C.paper, C.paper, C.cobalt, C.cobalt][beat] || C.cobalt;
	s.bg.style.background = bg;

	// w1  2.0–2.5
	show(s.w1, beat === 0);
	if (beat === 0) {
		T(s.w1, { s: kf(t, [[2, 1.08], [2.5, 1, 'o3']]) });
		s.w1ai.style.transform = `translateY(${kf(t, [[2, 110], [2.22, 0, 'oE']])}%)`;
		s.w1bi.style.transform = `translateY(${kf(t, [[2.06, 110], [2.3, 0, 'oE']])}%)`;
	}
	// w2  2.5–3.0
	show(s.w2, beat === 1);
	if (beat === 1) {
		const p = P(t, 2.5, 2.85, 'oE');
		s.w2.style.fontVariationSettings = `'wdth' ${lerp(75, 100, p)}`;
		s.w2.style.letterSpacing = lerp(0.25, -0.04, p) + 'em';
		T(s.w2, { sx: lerp(0.6, 1, p) });
	}
	// w3  3.0–3.5
	show(s.w3, beat === 2);
	if (beat === 2) {
		at(s.w3c, t - 3 + 0.2);
		s.w3t.style.transform = `scale(${kf(t, [[3, 1.25], [3.5, 1, 'oE']])})`;
	}
	// w4  3.5–4.0
	show(s.w4, beat === 3);
	if (beat === 3) {
		T(s.w4);
		s.w4c.forEach((c, i) => {
			const a = 3.5 + i * 0.03;
			c.style.transform = `translateY(${kf(t, [[a, -700], [a + 0.25, 0, 'oB']])}px) rotate(${kf(t, [[a, (rnd(i) - .5) * 70], [a + 0.25, 0, 'oB']])}deg)`;
		});
	}
	// w5  4.0–5.0
	const on5 = t >= 4 && t < 5;
	show(s.w5, on5);
	show(s.dot, t >= 4 && t < 5.2);
	if (t >= 4 && t < 5.2) {
		const wx = W / 2 - 40;
		T(s.w5, { x: wx, s: kf(t, [[4, 1.15], [4.5, 1, 'oE']]) });
		s.w5c.forEach((c, i) => {
			const a = 4 + i * 0.035;
			c.style.transform = `translateY(${kf(t, [[a, 60], [a + 0.3, 0, 'oE']])}px)`;
			c.style.opacity = P(t, a, a + 0.12);
		});
		// the full stop lands, then swallows the frame
		const ex = wx + s.w5.offsetWidth / 2 + 28, ey = H / 2 + 95;
		const land = kf(t, [[4.28, 0], [4.45, 1, 'oB2']]);
		const grow = kf(t, [[4.6, 1], [5, 60, 'iE']]);
		T(s.dot, { x: lerp(ex, W / 2, P(t, 4.6, 4.95, 'io3')), y: lerp(ey, H / 2, P(t, 4.6, 4.95, 'io3')), s: land * grow });
	}
	// name card  5.0–6.0
	const onN = t >= 5;
	show(s.nm, onN); show(s.lab, onN);
	if (onN) {
		const out = P(t, 5.75, 6, 'iE');
		T(s.nm, { y: H / 2 + 20 - out * 900 });
		s.nm1.style.transform = `translateX(${kf(t, [[5, -1400], [5.35, 0, 'oE']])}px)`;
		s.nm2.style.transform = `translateX(${kf(t, [[5.12, 1400], [5.47, 0, 'oE']])}px)`;
		T(s.lab, { y: 250 - out * 900, op: P(t, 5.3, 5.5) });
	}
});

/* ================================================================
   03 · GRID — nine circles land and square up into frames, then
   the camera pushes into the centre tile.               6.0 – 8.0
   ================================================================ */
const GRID = ['no_note', 'ig_sol', 'ac_wrist', 'nk_room', 'yap_wave', 'sb_tag', 'fo_sel', 'ib_hero', 'fe_wall'];
scene(6, 8, (r, s) => {
	r.style.background = C.cobalt;
	s.cam = el('div', 'fill', r, { transformOrigin: '50% 50%' });
	s.tiles = GRID.map(n => clip(n, s.cam, { position: 'absolute', left: 0, top: 0 }));
}, (t, s) => {
	const tw = 560, th = 315, g = 24;
	const zoom = kf(t, [[7.35, 1], [8, W / tw, 'ioE']]);
	const spin = kf(t, [[6, -8], [7.2, 0, 'o4']]);
	s.cam.style.transform = `scale(${zoom * kf(t, [[6.9, 1], [7.15, 0.965, 'o3'], [7.35, 0.965]])}) rotate(${spin * (1 - P(t, 7.35, 8))}deg)`;
	const order = [4, 1, 5, 7, 3, 0, 2, 8, 6]; // centre-out
	s.tiles.forEach((c, i) => {
		const col = i % 3, row = Math.floor(i / 3);
		const x = W / 2 + (col - 1) * (tw + g), y = H / 2 + (row - 1) * (th + g);
		const a = 6 + order.indexOf(i) * 0.0625;
		const p = P(t, a, a + 0.45, 'oE');
		const sq = P(t, a + 0.25, a + 0.7, 'oE'); // circle → frame
		const w = lerp(th, tw, sq), h = th;
		const fx = x + (rnd(i, 3) - .5) * 1800 * (1 - p), fy = y + (rnd(i, 7) - .5) * 1400 * (1 - p);
		Object.assign(c.box.style, {
			width: w + 'px', height: h + 'px',
			borderRadius: lerp(th / 2, 14, sq) * (i === 4 ? 1 - P(t, 7.5, 8) : 1) + 'px',
		});
		T(c.box, { x: fx, y: fy, s: lerp(0.2, 1, p), r: (rnd(i, 9) - .5) * 90 * (1 - p) });
		at(c, Math.max(0, t - a) + (i === 4 ? 0 : 0.3));
	});
});

/* ================================================================
   04 · yap — voice memos → topics. Bubbles and chips.  8.0 – 13.0
   ================================================================ */
scene(8, 13, (r, s) => {
	s.bg = el('div', 'fill', r, { background: `linear-gradient(120deg, #fbf3ec, #f1effd 55%, #eef7f6)` });
	s.blobs = [C.lilac, C.peach, C.mint].map((col, i) => el('div', 'c', r, {
		width: '900px', height: '900px', borderRadius: '50%', background: col, filter: 'blur(120px)', opacity: .7,
	}));
	s.wave = clip('yap_wave', r, { position: 'absolute', inset: 0 });
	s.veil = el('div', 'fill', r, { background: 'rgba(250,252,253,.55)' });
	s.title = el('div', 't c', r, { fontSize: '620px', color: C.ink, letterSpacing: '-0.06em' });
	s.titleC = chars(s.title, 'yap');
	s.card = clip('yap_topics', r, { width: '1180px', height: '664px', borderRadius: '28px', boxShadow: '0 50px 100px -40px rgba(60,40,120,.45)' });
	s.card.box.classList.add('c');
	s.head = el('div', 'c', r, { fontSize: '76px', fontWeight: 700, letterSpacing: '-0.035em', lineHeight: 1.02, color: C.ink, width: '560px' });
	s.headA = el('div', 'mask', s.head); s.headAi = el('div', null, s.headA, null, 'One long memo.');
	s.headB = el('div', 'mask', s.head); s.headBi = el('div', 'serif', s.headB, { fontSize: '86px' }, 'Three topics.');
	const chipsTxt = ['Weekend plans', 'Date outfit advice', 'Maria’s birthday brunch'];
	const chipCol = [C.lilac, C.peach, C.mint];
	s.chips = chipsTxt.map((tx, i) => el('div', 'chip c', r, { background: '#fff', color: C.ink, boxShadow: '0 12px 30px -12px rgba(40,30,90,.3)' }, `<i style="background:${chipCol[i]}">▶</i>${tx}`));
	s.play = clip('yap_play', r, { position: 'absolute', inset: 0 });
	s.burst = [C.lilac, C.peach, C.note].map(col => el('div', 'c', r, { width: '200px', height: '200px', borderRadius: '50%', background: col }));
}, (t, s) => {
	// A · 8.0–9.0  full waveform, giant lowercase title punches through
	const A = t < 9;
	show(s.wave.box, A);
	if (A) { at(s.wave, 0.7 + (t - 8)); s.wave.box.style.transform = `scale(${kf(t, [[8, 1.12], [9, 1, 'o3']])})`; }
	show(s.title, t < 9.05); show(s.veil, t < 9.05); s.veil.style.opacity = 1 - P(t, 8.6, 9.05);
	if (t < 9.05) {
		T(s.title, { y: H / 2 - 30, s: kf(t, [[8.5, 1], [9.05, 0.02, 'iE']]), op: 1 });
		s.titleC.forEach((c, i) => {
			const a = 8 + i * 0.06;
			c.style.transform = `translateY(${kf(t, [[a, 500], [a + 0.35, 0, 'oE']])}px)`;
		});
	}
	// B · 9.0–11.0  topics card + chips
	const B = t >= 9 && t < 11;
	s.blobs.forEach((b, i) => {
		show(b, B);
		const a = t * 0.9 + i * 2.1;
		T(b, { x: W / 2 + Math.cos(a) * 520, y: H / 2 + Math.sin(a * 1.3) * 260 });
	});
	show(s.card.box, B); show(s.head, B);
	if (B) {
		at(s.card, 0.4 + (t - 9) * 1.5, 1.5);
		const p = P(t, 9, 9.45, 'oE');
		T(s.card.box, { x: 1300 + (1 - p) * 500, y: H / 2 + 20, s: lerp(0.85, 0.94, p) * kf(t, [[10.5, 1], [11, 1.04, 'io3']]), r: lerp(8, -2, p) });
		T(s.head, { x: 400, y: 285 });
		s.headAi.style.transform = `translateY(${kf(t, [[9.05, 110], [9.3, 0, 'oE']])}%)`;
		s.headBi.style.transform = `translateY(${kf(t, [[9.3, 110], [9.55, 0, 'oE']])}%)`;
	}
	s.chips.forEach((c, i) => {
		show(c, B);
		if (!B) return;
		const a = 9.5 + i * 0.25;
		const p = P(t, a, a + 0.35, 'oB2');
		c.style.transformOrigin = '0 50%';
		c.style.transform = `translate(${160}px,${480 + i * 118}px) translate(0,-50%) scale(${p}) rotate(${(1 - p) * -12}deg)`;
		c.style.opacity = clamp(p * 3);
	});
	// C · 11.0–12.6  now playing, slow push
	const Cc = t >= 11;
	show(s.play.box, Cc);
	if (Cc) { at(s.play, 1.3 + (t - 11)); s.play.box.style.transform = `scale(${kf(t, [[11, 1.2], [11.4, 1.06, 'oE'], [12.6, 1.12, 'lin']])})`; }
	// burst → yellow
	s.burst.forEach((b, i) => {
		const a = 12.5 + i * 0.08;
		show(b, t >= a);
		T(b, { s: kf(t, [[a, 0], [13 - (2 - i) * 0.02, 13, 'iE']]) });
	});
}, 1);

/* ================================================================
   05 · NOTATE — yellow collapses into a sticky note, the logo
   draws, and the camera drifts over the product.       13.0 – 18.0
   ================================================================ */
scene(13, 18, (r, s) => {
	r.style.background = C.cream;
	s.logo = clip('no_logo', r, { position: 'absolute', inset: 0 });
	s.note = el('div', 'c', r, { background: C.note, borderRadius: '10px' });
	s.cam = el('div', 'fill', r, { perspective: '2200px' });
	const win = (name, w) => {
		const f = el('div', 'window c', s.cam, { width: w + 'px' });
		const b = el('div', 'window__bar', f); el('b', null, b); el('b', null, b); el('b', null, b);
		const sc = el('div', 'window__screen', f, { height: Math.round(w * 2684 / 3840) + 'px' });
		const c = clip(name, sc, { position: 'absolute', inset: 0 });
		return { f, c };
	};
	s.wA = win('no_note', 920);
	s.wB = win('no_org', 800);
	s.line = el('div', 'c', r, { fontSize: '104px', color: C.ink, whiteSpace: 'nowrap', lineHeight: 1 });
	s.l1 = el('span', 't', s.line, { fontSize: '96px' }, 'Keep the thought ');
	s.l2w = el('span', null, s.line, { position: 'relative', display: 'inline-block' });
	s.hl = el('span', null, s.l2w, { position: 'absolute', left: '-12px', right: '-12px', top: '18%', bottom: '4%', background: C.note, transformOrigin: '0 50%', zIndex: -1 });
	s.l2 = el('span', 'serif', s.l2w, null, 'next to the spark.');
	s.l2w.style.isolation = 'isolate';
	s.sweep = el('div', 'fill', r, { background: C.note, transformOrigin: '0 50%' });
}, (t, s) => {
	// yellow → sticky note (match cut to the logo clip)
	const n = P(t, 13, 13.45, 'oE');
	show(s.note, t < 13.55);
	Object.assign(s.note.style, { width: lerp(W * 1.5, 210, n) + 'px', height: lerp(W * 1.5, 210, n) + 'px' });
	T(s.note, { r: lerp(0, -10, n) });
	show(s.logo.box, t >= 13.4 && t < 14.75);
	if (t < 14.75) at(s.logo, 0.25 + Math.max(0, t - 13.4) * 1.9, 1.9);
	s.logo.box.style.transform = `scale(${kf(t, [[13.4, 1.25], [14.75, 1, 'o3']])})`;

	// product windows — drifting camera
	const on = t >= 14.75 && t < 17.25;
	show(s.cam, on); show(s.line, on);
	if (on) {
		const d = P(t, 14.75, 17.25, 'lin');
		const inA = P(t, 14.75, 15.25, 'oE'), inB = P(t, 15.0, 15.5, 'oE');
		T(s.wA.f, { x: 660 - d * 90 + (1 - inA) * -900, y: 430 + (1 - inA) * 200, ry: lerp(35, 12, inA) - d * 6, rx: 4, r: -2 + d * 1.5 });
		T(s.wB.f, { x: 1330 - d * 160 + (1 - inB) * 900, y: 470 - (1 - inB) * 120, ry: lerp(-35, -14, inB) + d * 6, rx: 4, r: 2 - d * 1.5 });
		at(s.wA.c, 0.5 + (t - 14.75) * 1.6, 1.6);
		at(s.wB.c, 1.0 + (t - 15) * 1.6, 1.6);
		T(s.line, { y: 930, x: W / 2 + (1 - P(t, 15.4, 15.9, 'oE')) * 300, op: P(t, 15.4, 15.6) });
		s.hl.style.transform = `scaleX(${P(t, 16.0, 16.35, 'oE')})`;
	}
	// highlighter sweeps the whole frame
	show(s.sweep, t >= 17);
	s.sweep.style.transform = `scaleX(${P(t, 17, 17.3, 'iE')})`;
}, 1);

/* ================================================================
   06 · INSTAGRAM LISTS — yellow becomes one of four list
   colours; colour shift into the gradient; phones rise. 17.3 – 24.0
   ================================================================ */
scene(17.3, 24, (r, s) => {
	s.bg = el('div', 'fill', r, { background: C.note });
	s.grad = el('div', 'fill', r, { background: `linear-gradient(115deg, ${C.igO}, #ff2d6b 35%, ${C.igK} 55%, #7b2bff 95%)`, backgroundSize: '220% 220%' });
	s.sq = [C.igY, C.igO, C.igP, C.igK].map(col => el('div', 'c', r, { width: '170px', height: '170px', borderRadius: '44px', background: col }));
	s.title = el('div', 't c', r, { fontSize: '190px', color: '#fff' }, 'Instagram Lists');
	s.cam = el('div', 'fill', r, { perspective: '2000px' });
	s.ph = ['ig_create', 'ig_home', 'ig_story'].map(n => {
		const c = clip(n, s.cam, { width: '432px', height: '910px', borderRadius: '66px', boxShadow: '0 60px 120px -40px rgba(60,0,40,.55)' });
		c.box.classList.add('c');
		return c;
	});
	const chips = [['Close Friends', '#1fc35b'], ['Food', C.igO], ['Sports', C.igP], ['Fitspo', C.igK], ['Northwestern', C.igY]];
	s.chips = chips.map(([tx, col]) => el('div', 'chip c', r, { background: col, color: '#fff', fontSize: '40px', padding: '20px 34px' }, tx));
	s.sol = clip('ig_sol', r, { position: 'absolute', inset: 0 });
	s.white = el('div', 'fill', r, { background: C.mist });
}, (t, s) => {
	// four squares
	const onSq = t < 19.2;
	s.sq.forEach((q, i) => {
		show(q, onSq);
		if (!onSq) return;
		const x0 = W / 2 + (i - 1.5) * 230;
		// yellow is born from the full frame; the rest pop on eighths
		const born = i === 0 ? P(t, 17.3, 17.75, 'oE') : P(t, 17.6 + i * 0.125, 17.95 + i * 0.125, 'oB2');
		const hop = Math.max(0, Math.sin(clamp((t - 18 - i * 0.07) / 0.25) * Math.PI)) * (t < 18.6 ? 1 : 0);
		const gather = P(t, 18.5, 18.85, 'io3');
		const blow = P(t, 18.85, 19.2, 'iE');
		const x = lerp(x0, W / 2 + (i - 1.5) * 20, gather);
		const y = H / 2 - hop * 80 + (i - 1.5) * 12 * gather;
		let w = 170, rr = 44;
		if (i === 0) { w = lerp(W * 1.2, 170, born); rr = lerp(0, 44, born); }
		Object.assign(q.style, { width: w + 'px', height: w + 'px', borderRadius: rr + 'px' });
		T(q, { x: i === 0 ? lerp(W / 2, x, born) : x, y, s: (i === 0 ? 1 : born) * (1 + blow * 14), r: gather * (i - 1.5) * 12 + blow * 45, op: 1 - blow });
	});
	show(s.bg, t < 17.8);
	// gradient colour shift
	s.grad.style.opacity = P(t, 17.6, 17.9);
	s.grad.style.backgroundPosition = `${kf(t, [[17.6, 0], [24, 100, 'lin']])}% ${kf(t, [[17.6, 20], [24, 80, 'lin']])}%`;
	s.grad.style.filter = `hue-rotate(${kf(t, [[18.8, 0], [21.8, -25, 'lin']])}deg)`;
	// title
	show(s.title, t >= 18.85 && t < 19.9);
	if (t >= 18.85 && t < 19.9) {
		const p = P(t, 18.85, 19.2, 'oE');
		s.title.style.fontVariationSettings = `'wdth' ${lerp(75, 100, p)}`;
		T(s.title, { s: lerp(1.6, 1, p) * (1 - P(t, 19.6, 19.9, 'iE') * 0.9), op: 1 - P(t, 19.7, 19.9) });
	}
	// phones rise in parallax, camera settles
	const onP = t >= 19.5 && t < 22.1;
	show(s.cam, onP);
	if (onP) {
		const tilt = P(t, 19.5, 20.6, 'oE');
		s.ph.forEach((c, i) => {
			const a = 19.5 + [0.12, 0, 0.24][i];
			const p = P(t, a, a + 0.6, 'oE');
			const drift = (t - 19.5) * [-26, 18, -40][i];
			T(c.box, { x: W / 2 + (i - 1) * 520, y: H / 2 + 60 + (1 - p) * 1100 + drift + [40, -20, 70][i], rx: lerp(28, 0, tilt), r: lerp(-8, 0, tilt) + (i - 1) * 2 * (1 - tilt), s: 0.96 });
			at(c, (t - 19.5) * 1.6 + [1.2, 0.4, 0.2][i], 1.6);
		});
	}
	s.chips.forEach((c, i) => {
		const a = 20.0 + i * 0.25;
		const on = onP && t >= a;
		show(c, on);
		if (!on) return;
		const p = P(t, a, a + 0.4, 'oB2');
		const fx = [300, 1640, 1560, 360, 980][i], fy = [300, 380, 820, 760, 150][i];
		T(c, { x: fx + (t - a) * [20, -30, -20, 25, 10][i], y: fy, s: p, r: [-8, 6, -5, 7, -3][i] * p });
	});
	// solution film
	const onS = t >= 22.1;
	show(s.sol.box, onS);
	if (onS) {
		at(s.sol, 0.5 + (t - 22.1));
		s.sol.box.style.transform = `scale(${kf(t, [[22.1, 1.25], [22.5, 1.04, 'oE'], [24, 1.12, 'lin']])})`;
		s.sol.box.style.filter = `blur(${P(t, 23.5, 24, 'i3') * 40}px) brightness(${1 + P(t, 23.5, 24, 'i3') * 1.2})`;
	}
	show(s.white, t >= 23.6);
	s.white.style.opacity = P(t, 23.6, 24, 'i3');
}, 1);

/* ================================================================
   07 · ACUITY — the band arrives through a circle; three states
   drive a colour shift in lock-step with the app.       24.0 – 30.0
   ================================================================ */
scene(24, 30, (r, s) => {
	s.bg = el('div', 'fill', r, { background: C.mist });
	s.big = el('div', 't c', r, { fontSize: '380px', fontWeight: 400, color: '#c5ccd6', letterSpacing: '0.22em' }, 'ACUITY');
	s.spin = clip('ac_spin', r, { width: '820px', height: '820px', borderRadius: '50%' });
	s.spin.box.classList.add('c');
	s.cap = el('div', 'c', r, { fontSize: '58px', fontWeight: 600, color: '#3c4654', letterSpacing: '-0.02em', textAlign: 'center' });
	s.capA = el('span', 'mask', s.cap); s.capAi = el('span', null, s.capA, null, 'Your body is always&nbsp;');
	s.capB = el('span', 'mask', s.cap); s.capBi = el('span', 'serif', s.capB, { fontSize: '66px' }, 'signaling.');
	s.phone = clip('ac_states', r, { width: '470px', height: '1030px', borderRadius: '56px', boxShadow: '0 50px 100px -40px rgba(20,30,50,.5)' });
	s.phone.box.classList.add('c');
	s.state = el('div', 'c serif', r, { fontSize: '250px', lineHeight: 1 });
	s.stateL = el('div', 'c', r, { fontSize: '26px', fontWeight: 600, letterSpacing: '0.12em' }, 'ACUITY SUMMARY');
	s.wrist = clip('ac_wrist', r, { position: 'absolute', inset: 0 });
	s.alert = clip('ac_alert', r, { position: 'absolute', inset: 0 });
	s.blinds = Array.from({ length: 12 }, (_, i) => el('div', null, r, { position: 'absolute', left: 0, right: 0, top: (i * H / 12) + 'px', height: (H / 12 + 1) + 'px', background: C.navy, transformOrigin: '0 50%' }));
}, (t, s) => {
	// A 24.0–25.5 circle reveal of the spinning band
	const A = t < 25.5;
	show(s.big, A); show(s.spin.box, A); show(s.cap, A);
	if (A) {
		at(s.spin, 0.1 + (t - 24) * 1.1, 1.1);
		const p = P(t, 24, 24.45, 'oE');
		T(s.spin.box, { y: H / 2 - 40, s: p * kf(t, [[24.45, 1], [25.5, 1.06, 'lin']]) });
		T(s.big, { y: H / 2 - 40, s: kf(t, [[24, 1.4], [25.5, 1, 'o3']]), op: P(t, 24.05, 24.35) });
		s.big.style.letterSpacing = kf(t, [[24, 0.6], [25.5, 0.2, 'oE']]) + 'em';
		T(s.cap, { y: 1000 });
		s.capAi.style.display = 'inline-block'; s.capBi.style.display = 'inline-block';
		s.capAi.style.transform = `translateY(${kf(t, [[24.5, 110], [24.8, 0, 'oE']])}%)`;
		s.capBi.style.transform = `translateY(${kf(t, [[24.75, 110], [25.05, 0, 'oE']])}%)`;
	}
	// B 25.5–28.0 three states — piecewise clip time so every state change lands on a beat
	const B = t >= 25.5 && t < 28;
	show(s.phone.box, B); show(s.state, B); show(s.stateL, B);
	if (B) {
		const k = t < 26.5 ? 0 : t < 27.25 ? 1 : 2;
		const seg = [[25.5, 0.8], [26.5, 3.1], [27.25, 6.0]][k];
		at(s.phone, seg[1] + (t - seg[0]) * 1.6, 1.6);
		const bgs = ['#dcefe3', '#f7e7c8', '#f7d6d2'], fgs = ['#2f7d55', '#b07a16', '#c2402f'];
		const words = ['Stable.', 'Elevated.', 'Emergent.'];
		s.bg.style.background = bgs[k];
		const kt = [25.5, 26.5, 27.25][k];
		const pin = P(t, 25.5, 26, 'oE');
		T(s.phone.box, { x: 560, y: H / 2 + (1 - pin) * 900 + 40, r: (1 - pin) * 10, s: 0.9 * (1 + 0.03 * Math.exp(-(t - kt) * 12)) });
		s.state.textContent = words[k];
		s.state.style.color = fgs[k];
		s.state.style.transformOrigin = '0 50%';
		s.state.style.transform = `translate(880px, ${H / 2 + 10}px) translate(0,-50%) translateY(${kf(t, [[kt, 90], [kt + 0.3, 0, 'oE']])}px) scale(${kf(t, [[kt, 1.08], [kt + 0.3, 1, 'oE']])})`;
		s.state.style.opacity = P(t, kt, kt + 0.1);
		s.stateL.style.color = fgs[k];
		s.stateL.style.transform = `translate(886px, ${H / 2 - 170}px) translate(0,-50%)`;
		s.stateL.style.opacity = P(t, 25.7, 25.9);
	} else s.bg.style.background = C.mist;
	// C 28.0–29.5 on the wrist, then the alert
	show(s.wrist.box, t >= 28 && t < 28.75);
	if (t >= 28 && t < 28.75) { at(s.wrist, 0.3 + (t - 28)); s.wrist.box.style.transform = `scale(${kf(t, [[28, 1.3], [28.4, 1.08, 'oE'], [28.75, 1.12]])})`; }
	show(s.alert.box, t >= 28.75);
	if (t >= 28.75) { at(s.alert, 0.2 + (t - 28.75)); s.alert.box.style.transform = `scale(${kf(t, [[28.75, 1.2], [29.1, 1.02, 'oE'], [30, 1.08]])})`; }
	// blinds wipe to navy
	s.blinds.forEach((b, i) => {
		const a = 29.45 + i * 0.03;
		show(b, t >= a);
		b.style.transform = `scaleX(${P(t, a, a + 0.22, 'o3')})`;
		b.style.transformOrigin = i % 2 ? '100% 50%' : '0 50%';
	});
}, 1);

/* ================================================================
   08 · neuk — logo, a QR ticket built from squares, then a
   slow dolly through the room.                          30.0 – 35.0
   ================================================================ */
const QR = (() => {
	const n = 11, g = [];
	const finder = (x, y) => (x < 3 && y < 3) || (x > 7 && y < 3) || (x < 3 && y > 7);
	for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
		let on;
		if (finder(x, y)) { const lx = x > 7 ? x - 8 : x, ly = y > 7 ? y - 8 : y; on = !(lx === 1 && ly === 1) || true; on = (lx === 1 && ly === 1) ? true : (lx === 0 || lx === 2 || ly === 0 || ly === 2); }
		else on = rnd(x * 31 + y, 4) > 0.52;
		if (on) g.push([x, y]);
	}
	return g;
})();
scene(30, 35, (r, s) => {
	r.style.background = C.navy;
	s.logo = clip('nk_logo', r, { position: 'absolute', inset: 0 });
	s.qr = el('div', 'fill', r);
	s.px = QR.map(() => el('div', 'c', s.qr, { width: '52px', height: '52px', borderRadius: '8px', background: C.neon }));
	s.phone = clip('nk_phone', r, { width: '480px', height: '1005px', borderRadius: '70px' });
	s.phone.box.classList.add('c');
	s.qcap = el('div', 'c', r, { fontSize: '30px', fontWeight: 600, color: C.neon, letterSpacing: '0.1em' }, 'PRIVATE SCREENING ROOMS');
	s.room = clip('nk_room', r, { position: 'absolute', inset: 0 });
	s.shade = el('div', 'fill', r, { background: 'linear-gradient(0deg, rgba(8,12,24,.85), rgba(8,12,24,0) 55%)' });
	s.l1 = el('div', 't c', r, { fontSize: '92px', color: '#fff' }, 'Everyone wants to watch together.');
	s.l2 = el('div', 'c serif', r, { fontSize: '104px', color: C.neon, lineHeight: 1 }, 'Nobody has the room.');
	s.streak = el('div', 'c', r, { width: W + 'px', height: '6px', background: C.neon, boxShadow: `0 0 40px 10px ${C.neon}` });
	s.green = el('div', 'fill', r, { background: C.amz });
}, (t, s) => {
	show(s.logo.box, t < 31);
	if (t < 31) { at(s.logo, 0.2 + (t - 30) * 1.7, 1.7); s.logo.box.style.transform = `scale(${kf(t, [[30, 1.15], [31, 1, 'o3']])})`; }
	// QR assembles on eighths, camera tilts
	const onQ = t >= 31 && t < 32.5;
	show(s.qr, onQ); show(s.phone.box, onQ); show(s.qcap, onQ);
	if (onQ) {
		const cell = 58, ox = 640 - 5 * cell, oy = H / 2 - 5 * cell;
		s.px.forEach((p, i) => {
			const [gx, gy] = QR[i];
			const a = 31 + ((gx + gy) / 20) * 0.5;
			const q = P(t, a, a + 0.35, 'oE');
			T(p, {
				x: lerp(ox + gx * cell + (rnd(i, 2) - .5) * 1400, ox + gx * cell, q),
				y: lerp(oy + gy * cell + (rnd(i, 5) - .5) * 1100, oy + gy * cell, q),
				r: (1 - q) * (rnd(i, 8) - .5) * 360, s: lerp(0.3, 1, q), op: q,
			});
		});
		s.qr.style.transform = `scale(${kf(t, [[31, 1.1], [32.5, 0.94, 'o3']])})`;
		s.qr.style.transformOrigin = '640px 540px';
		const pp = P(t, 31.25, 31.75, 'oE');
		T(s.phone.box, { x: 1330, y: H / 2 + (1 - pp) * 1100, r: (1 - pp) * 8, s: 0.92 });
		at(s.phone, 4.6 + (t - 31.25) * 1.2, 1.2);
		T(s.qcap, { x: 640, y: 930, op: P(t, 31.6, 31.8) });
	}
	// room dolly + copy
	const onR = t >= 32.5 && t < 35;
	show(s.room.box, onR); show(s.shade, onR); show(s.l1, onR); show(s.l2, onR);
	if (onR) {
		at(s.room, 0.2 + (t - 32.5));
		const d = P(t, 32.5, 35, 'lin');
		s.room.box.style.transform = `scale(${lerp(1.02, 1.22, d)}) translateX(${lerp(20, -40, d)}px)`;
		s.l1.style.transformOrigin = '0 50%'; s.l2.style.transformOrigin = '0 50%';
		s.l1.style.transform = `translate(110px, 830px) translate(0,-50%) translateY(${kf(t, [[32.75, 40], [33.05, 0, 'oE']])}px)`;
		s.l1.style.opacity = P(t, 32.75, 32.9);
		s.l2.style.transform = `translate(110px, 935px) translate(0,-50%) translateY(${kf(t, [[33.5, 40], [33.8, 0, 'oE']])}px)`;
		s.l2.style.opacity = P(t, 33.5, 33.65);
	}
	// neon streak opens into green
	show(s.streak, t >= 34.5 && t < 35);
	T(s.streak, { sx: P(t, 34.5, 34.7, 'oE'), sy: 1 + P(t, 34.7, 35, 'iE') * 200 });
	s.streak.style.background = t > 34.75 ? C.amz : C.neon;
	show(s.green, t >= 34.97);
}, 1);

/* ================================================================
   09 · SMART BUNDLES — logo morph, then a kinetic type wall with
   the product in a porthole.                             35.0 – 40.0
   ================================================================ */
scene(35, 40, (r, s) => {
	r.style.background = C.amz;
	s.morph = clip('sb_morph', r, { position: 'absolute', inset: 0 });
	s.rows = el('div', 'fill', r);
	s.row = Array.from({ length: 7 }, (_, i) => {
		const row = el('div', 't', s.rows, { position: 'absolute', left: 0, top: (i * 160 - 30) + 'px', fontSize: '170px', whiteSpace: 'nowrap', letterSpacing: '-0.04em' });
		const word = i % 2 ? 'Bundle smarter · ' : 'Waste less · ';
		row.textContent = word.repeat(8);
		if (i % 2) { row.style.color = 'transparent'; row.style.webkitTextStroke = `2px ${C.amzMint}`; }
		else row.style.color = C.amzMint;
		return row;
	});
	s.port = clip('sb_prime', r, { width: '620px', height: '620px', borderRadius: '50%', boxShadow: `0 0 0 18px ${C.amz}` });
	s.port.box.classList.add('c');
	s.cards = clip('sb_cards', r, { position: 'absolute', inset: 0 });
	s.tag = clip('sb_tag', r, { position: 'absolute', inset: 0 });
	s.iris = el('div', 'c', r, { width: '200px', height: '200px', borderRadius: '50%', background: C.lime });
}, (t, s) => {
	show(s.morph.box, t < 36.25);
	if (t < 36.25) at(s.morph, 0.6 + (t - 35) * 2.2, 2.2);
	const onK = t >= 36.25 && t < 37.75;
	show(s.rows, onK); show(s.port.box, onK);
	if (onK) {
		s.row.forEach((row, i) => {
			const dir = i % 2 ? 1 : -1;
			row.style.transform = `translateX(${-600 + dir * (t - 36.25) * 520 + (i % 3) * -140}px)`;
		});
		const a = P(t, 36.25, 36.6, 'oB');
		T(s.port.box, { s: a * kf(t, [[36.6, 1], [37.75, 1.08, 'lin']]), r: (1 - a) * -20 });
		at(s.port, 0.4 + (t - 36.25) * 1.3, 1.3);
		s.rows.style.transform = `rotate(-6deg) scale(1.15)`;
	}
	const onC = t >= 37.75 && t < 39.25;
	show(s.cards.box, onC);
	if (onC) {
		at(s.cards, 0.3 + (t - 37.75) * 1.4, 1.4);
		const d = P(t, 37.75, 39.25, 'lin');
		s.cards.box.style.transform = `scale(${kf(t, [[37.75, 1.35], [38.1, 1.18, 'oE'], [39.25, 1.28, 'lin']])}) translate(${lerp(60, -60, d)}px, ${lerp(20, -20, d)}px)`;
	}
	const onT = t >= 39.25;
	show(s.tag.box, onT);
	if (onT) at(s.tag, 3.7 + (t - 39.25));
	show(s.iris, t >= 39.6);
	T(s.iris, { s: P(t, 39.6, 40, 'iE') * 12 });
}, 1);

/* ================================================================
   10 · FORAGE — capture the world with a gesture. Beat-cut
   footage with a live selection marquee.                40.0 – 46.0
   ================================================================ */
scene(40, 46, (r, s) => {
	r.style.background = C.lime;
	s.title = el('div', 't c', r, { fontSize: '420px', color: C.ink, letterSpacing: '-0.05em' }, 'Forage');
	s.ring = clip('fo_ring', r, { width: '1300px', height: '1006px', mixBlendMode: 'multiply', background: 'transparent' });
	s.ring.box.classList.add('c');
	s.cuts = ['fo_tap', 'fo_sel', 'fo_text', 'fo_mural'].map(n => clip(n, r, { position: 'absolute', inset: 0 }));
	s.sel = el('div', 'c', r, { border: `4px dashed ${C.lime}`, borderRadius: '6px' });
	['0 0', '100% 0', '0 100%', '100% 100%'].forEach(p => {
		const [px, py] = p.split(' ');
		el('i', null, s.sel, { position: 'absolute', width: '18px', height: '18px', background: C.lime, left: `calc(${px} - 9px)`, top: `calc(${py} - 9px)`, borderRadius: '3px' });
	});
	s.tag = el('div', 'chip', s.sel, { position: 'absolute', left: '-4px', top: '-78px', background: C.lime, color: C.ink, fontSize: '30px', padding: '14px 22px' });
	s.uiWrap = el('div', 'fill', r, { background: C.ink, perspective: '2000px' });
	s.ui = clip('fo_ui', s.uiWrap, { width: '1500px', height: '841px', borderRadius: '20px' });
	s.ui.box.classList.add('c');
	s.uiCap = el('div', 'c serif', s.uiWrap, { fontSize: '72px', color: C.lime }, 'an image, a colour, a typeface, a motion');
	s.walk = clip('fo_walk', r, { position: 'absolute', left: 0, top: 0, width: '50%', height: '100%' });
	s.eyes = clip('fo_eyes', r, { position: 'absolute', right: 0, top: 0, width: '50%', height: '100%' });
	s.bar = el('div', null, r, { position: 'absolute', top: 0, bottom: 0, left: 'calc(50% - 6px)', width: '12px', background: C.lime, transformOrigin: '50% 0' });
	s.quote = el('div', 'c', r, { textAlign: 'center', color: '#fff', textShadow: '0 4px 40px rgba(0,0,0,.35)' });
	s.qw = ['The', 'world', 'is', 'an', 'asset', 'library.'].map((w, i) => el('span', i > 3 ? 'serif' : 't', s.quote, { display: 'inline-block', fontSize: i > 3 ? '150px' : '128px', margin: '0 16px' }, w));
}, (t, s) => {
	const A = t < 41;
	show(s.title, A); show(s.ring.box, A);
	if (A) {
		const p = P(t, 40, 40.35, 'oE');
		T(s.title, { s: lerp(1.3, 1, p) * (1 + (t - 40) * 0.04), op: 1 });
		s.title.style.fontVariationSettings = `'wdth' ${lerp(75, 100, p)}`;
		at(s.ring, 0.2 + (t - 40) * 1.5, 1.5);
		T(s.ring.box, { s: kf(t, [[40, 0.6], [40.5, 1, 'oB']]), r: (t - 40) * 12 });
	}
	// beat cuts with the marquee snapping to something new each time
	const k = Math.floor((t - 41) / 0.5);
	const onB = t >= 41 && t < 43;
	const boxes = [[980, 520, 520, 380], [1050, 520, 560, 760], [900, 330, 1100, 300], [700, 380, 640, 460]];
	const tags = ['gesture', 'image', 'typeface', 'colour'];
	s.cuts.forEach((c, i) => {
		const on = onB && i === k;
		show(c.box, on);
		if (on) {
			at(c, (i === 0 ? 1.9 : 0.2) + (t - 41 - i * 0.5));
			c.box.style.transform = `scale(${kf(t, [[41 + i * 0.5, 1.15], [41.3 + i * 0.5, 1.03, 'oE']])})`;
		}
	});
	show(s.sel, onB);
	if (onB) {
		const kt = 41 + k * 0.5;
		const p = P(t, kt + 0.05, kt + 0.3, 'oE');
		const [bx, by, bw, bh] = boxes[k];
		Object.assign(s.sel.style, { width: lerp(bw * 1.6, bw, p) + 'px', height: lerp(bh * 1.6, bh, p) + 'px' });
		T(s.sel, { x: bx, y: by, op: P(t, kt + 0.05, kt + 0.12) });
		s.tag.innerHTML = tags[k];
	}
	// library UI in tilt
	const onU = t >= 43 && t < 44.5;
	show(s.uiWrap, onU);
	if (onU) {
		const p = P(t, 43, 43.5, 'oE');
		T(s.ui.box, { y: H / 2 - 50 + (1 - p) * 200, rx: lerp(40, 8, p) - P(t, 43.5, 44.5) * 6, s: lerp(0.8, 0.98, p) + P(t, 43.5, 44.5) * 0.04 });
		at(s.ui, 0.2 + (t - 43) * 1.8, 1.8);
		T(s.uiCap, { y: 990, op: P(t, 43.35, 43.55) });
	}
	// split screen + quote word by word
	const onS = t >= 44.5 && t < 46;
	show(s.walk.box, onS); show(s.eyes.box, onS); show(s.bar, onS); show(s.quote, onS);
	if (onS) {
		at(s.walk, 0.8 + (t - 44.5)); at(s.eyes, 0.3 + (t - 44.5));
		const p = P(t, 44.5, 44.85, 'oE');
		s.walk.box.style.transform = `translateY(${(1 - p) * -H}px)`;
		s.eyes.box.style.transform = `translateY(${(1 - p) * H}px)`;
		s.bar.style.transform = `scaleY(${P(t, 44.6, 44.9, 'oE')})`;
		T(s.quote, { y: H / 2 });
		s.qw.forEach((w, i) => {
			const a = 44.9 + i * 0.125;
			w.style.opacity = t >= a ? 1 : 0;
			w.style.transform = `translateY(${kf(t, [[a, 30], [a + 0.2, 0, 'oE']])}px)`;
		});
		s.quote.style.opacity = 1 - P(t, 45.85, 46);
	}
}, 1);

/* ================================================================
   11 · IN BETWEEN FILM FESTIVAL — word pairs split open to
   reveal film between them.                             46.0 – 51.0
   ================================================================ */
scene(46, 51, (r, s) => {
	r.style.background = '#000';
	s.pairs = [['NEAR', 'FAR'], ['THEN', 'NOW'], ['FRIENDS', 'LOVERS']].map((pr, i) => {
		const row = el('div', 'c', r, { height: '150px', display: 'flex', alignItems: 'center' });
		const a = el('div', 't', row, { fontSize: '150px', fontWeight: 600, color: '#fff', letterSpacing: '-0.02em' }, pr[0]);
		const gap = el('div', null, row, { position: 'relative', height: '124px', overflow: 'hidden', margin: '0 8px' });
		const c = clip('ib_love', gap, { position: 'absolute', inset: 0 });
		c.box.style.width = '100%';
		const b = el('div', 't', row, { fontSize: '150px', fontWeight: 600, color: '#fff', letterSpacing: '-0.02em' }, pr[1]);
		return { row, a, gap, c, b };
	});
	s.hero = clip('ib_hero', r, { position: 'absolute', inset: 0 });
	s.sect = clip('ib_sect', r, { position: 'absolute', inset: 0 });
	s.logo = clip('ib_logo', r, { position: 'absolute', inset: 0 });
}, (t, s) => {
	const onW = t < 47.5;
	s.pairs.forEach((p, i) => {
		const a = 46 + i * 0.5;
		show(p.row, onW && t >= a);
		if (!(onW && t >= a)) return;
		const o = P(t, a + 0.08, a + 0.4, 'oE');
		p.gap.style.width = lerp(0, [520, 420, 360][i], o) + 'px';
		p.gap.style.margin = `0 ${lerp(0, 18, o)}px`;
		at(p.c, 0.3 + (t - a) + i * 0.7);
		// rows stack; older ones dim like the festival site
		const age = Math.floor((t - a) / 0.5);
		const y = H / 2 + (i - 1) * 170;
		T(p.row, { y, op: age >= 1 ? 0.35 : 1, s: kf(t, [[a, 1.12], [a + 0.3, 1, 'oE']]) });
	});
	show(s.hero.box, t >= 47.5 && t < 49);
	if (t >= 47.5 && t < 49) { at(s.hero, 0.2 + (t - 47.5)); s.hero.box.style.transform = `scale(${kf(t, [[47.5, 1.12], [47.9, 1, 'oE']])})`; }
	show(s.sect.box, t >= 49 && t < 50.25);
	if (t >= 49 && t < 50.25) { at(s.sect, 0.2 + (t - 49) * 1.4, 1.4); s.sect.box.style.transform = `scale(${kf(t, [[49, 1.35], [49.35, 1.15, 'oE'], [50.25, 1.2]])})`; }
	show(s.logo.box, t >= 50.25);
	if (t >= 50.25) { at(s.logo, 0.6 + (t - 50.25) * 1.2, 1.2); s.logo.box.style.transform = `scale(${kf(t, [[50.25, 1.2], [51, 1, 'o3']])})`; }
}, 1);

/* ================================================================
   12 · DIGITAL EXPRESSION FELLOWSHIP — two tall films pass each
   other like columns.                                  51.0 – 53.0
   ================================================================ */
scene(51, 53, (r, s) => {
	r.style.background = C.wall;
	s.fa = clip('fe_wall', r, { width: '470px', height: '836px', borderRadius: '10px' }); s.fa.box.classList.add('c');
	s.fb = clip('fe_city', r, { width: '470px', height: '836px', borderRadius: '10px' }); s.fb.box.classList.add('c');
	s.q = el('div', 'c', r, { color: '#fff', fontSize: '64px', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.02, width: '420px' }, 'How long does it take to <span class="serif" style="font-size:72px">waste a city?</span>');
}, (t, s) => {
	const p = P(t, 51, 51.5, 'oE');
	T(s.fa.box, { x: 1060, y: H / 2 + (1 - p) * -1100 + (t - 51) * 14, r: -2 });
	T(s.fb.box, { x: 1570, y: H / 2 + (1 - p) * 1100 - (t - 51) * 14, r: 2 });
	at(s.fa, 0.3 + (t - 51) * 1.6, 1.6);
	at(s.fb, 0.2 + (t - 51) * 1.8, 1.8);
	s.q.style.transformOrigin = '0 50%';
	s.q.style.transform = `translate(120px, ${H / 2}px) translate(0,-50%) translateX(${kf(t, [[51.2, -80], [51.6, 0, 'oE']])}px)`;
	s.q.style.opacity = P(t, 51.2, 51.4);
}, 1);

/* ================================================================
   13 · RECAP — a 16th-note strobe, then the camera pulls back to
   reveal the whole wall, which folds away into one dot.  53.0 – 56.0
   ================================================================ */
const WALL = ['yap_play', 'no_note', 'ig_home', 'ac_alert', 'nk_room', 'sb_cards', 'fo_mural', 'ib_hero', 'fe_wall', 'yap_wave',
	'ig_sol', 'ac_wrist', 'fo_walk', 'nk_book', 'sb_tag', 'no_logo', 'ib_sect', 'fo_text', 'ac_logo', 'ig_filter',
	'yap_topics', 'nk_qr', 'sb_morph', 'fo_eyes', 'ib_menu'];
scene(53, 56.2, (r, s) => {
	r.style.background = C.paper;
	s.cam = el('div', 'fill', r, { perspective: '2400px' });
	s.plane = el('div', 'fill', s.cam, { transformStyle: 'preserve-3d' });
	s.tiles = WALL.map(n => {
		const c = clip(n, s.plane, { position: 'absolute', left: 0, top: 0, width: '384px', height: '216px' });
		c.face = el('div', 'fill', c.box, { background: C.paper, opacity: 0 });
		return c;
	});
	s.dot = el('div', 'c', r, { width: '44px', height: '44px', borderRadius: '50%', background: C.cobalt });
}, (t, s) => {
	// strobe order: rapid-fire full frames 53.0–54.0 → centre tile at 54.0
	const strobe = t < 54;
	const pull = kf(t, [[54, 5], [54.9, 1, 'oE']]);
	const tilt = P(t, 54.2, 55.2, 'io3');
	s.plane.style.transform = `scale(${strobe ? 5 : pull * (1 - 0.12 * tilt)}) rotateX(${tilt * 16}deg) rotateZ(${tilt * -6}deg)`;
	if (strobe) {
		// one clip per 16th, full frame; lands on the centre tile (index 12) at 54.0
		const k = Math.floor((t - 53) / 0.0625);
		const cur = s.tiles[(k * 7 + 7) % s.tiles.length];
		s.tiles.forEach(c => show(c.box, c === cur));
		cur.face.style.opacity = 0;
		cur.box.style.borderRadius = '0px';
		cur.box.style.transform = `translate(${W / 2 - 192}px,${H / 2 - 108}px)`;
		at(cur, 0.3 + ((t - 53) % 0.5));
	} else s.tiles.forEach((c, i) => {
		const col = i % 5, row = Math.floor(i / 5);
		// flip to paper in a diagonal wave, then collapse to the centre
		const a = 55.0 + (col + row) * 0.035;
		const f = P(t, a, a + 0.22, 'io3');
		c.face.style.opacity = f;
		const k = P(t, 55.45, 55.95, 'iE');
		const x = lerp(W / 2 + (col - 2) * 384, W / 2, k), y = lerp(H / 2 + (row - 2) * 216, H / 2, k);
		show(c.box, k < 0.999);
		c.box.style.opacity = 1 - P(t, 55.6, 55.9);
		c.box.style.borderRadius = lerp(0, 108, f) + 'px';
		c.box.style.transform = `translate(${x - 192}px,${y - 108}px) scale(${lerp(1 - f * 0.12, 0.1, k)})`;
		if (f < 1) at(c, 0.4 + (t - 54) + i * 0.1);
	});
	show(s.dot, t >= 55.8);
	T(s.dot, { s: P(t, 55.8, 56, 'oB2') });
}, 1);

/* ================================================================
   14 · END — the dot becomes the I; the name grows out of it.
   Clean hold.                                          56.0 – 60.0
   ================================================================ */
scene(56, 60.01, (r, s) => {
	r.style.background = C.paper;
	s.block = el('div', 'c', r, { textAlign: 'left' });
	s.name = el('div', 't', s.block, { fontSize: '260px', color: C.ink, letterSpacing: '-0.055em', position: 'relative' });
	s.nc = chars(s.name, 'SOOIM KANG');
	s.nc[5].style.width = '0.32em';
	s.bar = el('div', null, r, { position: 'absolute', left: 0, top: 0, background: C.cobalt });
	s.row = el('div', null, s.block, { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '28px', color: C.ink });
	s.role = el('span', 'mask', s.row); s.rolei = el('span', 'serif', s.role, { fontSize: '96px', display: 'inline-block', lineHeight: 1.1 }, 'Product Designer');
	s.site = el('span', 'mask', s.row); s.sitei = el('span', null, s.site, { fontSize: '40px', fontWeight: 600, display: 'inline-block', letterSpacing: '-0.01em' }, 'sooimkang.com');
}, (t, s) => {
	if (!s.fit) {
		T(s.block, {});
		s.nc[3].style.color = 'transparent';
		// measure the I stem from the glyph itself
		const cs = getComputedStyle(s.name);
		const cv = document.createElement('canvas').getContext('2d');
		cv.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
		const m = cv.measureText('I');
		const I = s.nc[3];
		const probe = el('span', null, s.name, { display: 'inline-block', width: '0', height: '0', verticalAlign: 'baseline' });
		const base = probe.offsetTop; probe.remove();
		s.I = { w: m.actualBoundingBoxRight + m.actualBoundingBoxLeft, h: m.actualBoundingBoxAscent, left: I.offsetLeft - m.actualBoundingBoxLeft + (I.offsetWidth - (m.width)) / 2, base };
		s.fit = true;
	}
	const bx = W / 2 - s.block.offsetWidth / 2, by = H / 2 - s.block.offsetHeight / 2;
	const Ix = bx + s.name.offsetLeft + s.I.left + s.I.w / 2;
	const Iy = by + s.name.offsetTop + s.I.base - s.I.h / 2;
	// dot → stem
	const m = P(t, 56, 56.45, 'oE');
	const bw = lerp(44, s.I.w, m), bh = lerp(44, s.I.h, P(t, 56.05, 56.5, 'oE'));
	Object.assign(s.bar.style, {
		width: bw + 'px', height: bh + 'px', borderRadius: lerp(22, 0, m) + 'px',
		transform: `translate(${lerp(W / 2, Ix, m) - bw / 2}px, ${lerp(H / 2, Iy, m) - bh / 2}px)`,
	});
	// letters unfold out of the I
	s.nc.forEach((c, i) => {
		if (i === 3) return;
		const d = Math.abs(i - 3);
		const a = 56.3 + d * 0.045;
		const p = P(t, a, a + 0.55, 'oE');
		const dx = (s.nc[3].offsetLeft - c.offsetLeft) * (1 - p);
		c.style.transform = `translateX(${dx}px)`;
		c.style.opacity = clamp(p * 2.5);
		c.style.clipPath = 'none';
	});
	s.rolei.style.transform = `translateY(${kf(t, [[56.8, 110], [57.2, 0, 'oE']])}%)`;
	s.sitei.style.transform = `translateY(${kf(t, [[56.95, 110], [57.35, 0, 'oE']])}%)`;
}, 2);

/* ── HUD: project index, name, descriptor, timecode ─────────────── */
const HUD = [
	[8, 13, '01', 'yap', 'Voice-first group chat · 2026', C.ink],
	[13, 17.3, '02', 'Notate', 'Chrome extension', C.ink],
	[17.3, 24, '03', 'Instagram Lists', 'Product concept · 2025', '#fff'],
	[24, 30, '04', 'Acuity', 'Wearable + AI health', C.ink],
	[30, 35, '05', 'neuk', 'Service design · 2025', '#fff'],
	[35, 40, '06', 'Smart Bundles', 'Amazon Fresh concept · 2026', '#fff'],
	[40, 46, '07', 'Forage', 'Wearable + AI · FigBuild 2026', C.ink],
	[46, 51, '08', 'In Between Film Festival', 'Identity + web', '#fff'],
	[51, 53, '09', 'Digital Expression Fellowship', 'Fellowship winner · 2026', '#fff'],
];
/* per-moment colour overrides where the backdrop flips */
const HUD_TINT = [[17.3, 17.9, C.ink], [24, 24.01, C.ink], [28, 29.55, '#fff'], [40, 41, C.ink], [41, 44.5, '#fff'], [44.5, 46, '#fff']];
const hud = el('div', null, stage, { position: 'absolute', inset: 0, zIndex: 50, pointerEvents: 'none' });
hud.id = 'hud';
const hTL = el('div', 'row tl', hud), hTR = el('div', 'row tr', hud), hBL = el('div', 'row bl', hud), hBR = el('div', 'row br', hud);
const hIdx = el('span', 'idx', hTL), hNameR = el('span', 'roll', hTL), hName = el('span', null, hNameR);
const hDescR = el('span', 'roll desc', hTR), hDesc = el('span', null, hDescR);
el('span', null, hBL, null, 'Sooim Kang');
el('span', 'desc', hBL, null, 'Selected work');
const hTime = el('span', null, hBR);

function updateHud(t) {
	const cur = HUD.find(h => t >= h[0] && t < h[1]);
	hud.style.display = cur ? 'block' : 'none';
	if (!cur) return;
	const [a, , idx, name, desc, col] = cur;
	const tint = HUD_TINT.find(h => t >= h[0] && t < h[1]);
	hud.style.color = tint ? tint[2] : col;
	hIdx.textContent = idx + ' / 09';
	hName.textContent = name; hDesc.textContent = desc;
	const y = kf(t - a, [[0, 110], [0.35, 0, 'oE']]);
	hName.style.transform = `translateY(${y}%)`;
	hDesc.style.transform = `translateY(${kf(t - a, [[0.08, 110], [0.43, 0, 'oE']])}%)`;
	const f = Math.floor(t * FPS);
	hTime.textContent = `00:${String(Math.floor(t)).padStart(2, '0')}:${String(f % FPS).padStart(2, '0')}`;
}

/* ── frame engine ───────────────────────────── */
let T0 = 0;
function frame(t) {
	CLIPS.forEach(c => { c.want = null; });
	for (const s of SCENES) {
		const on = t >= s.a && t < s.b;
		s.root.classList.toggle('on', on);
		if (on) s.update(t, s);
	}
	updateHud(t);
}

/* preview: real-time playback that keeps clips in sync */
function syncPlay() {
	for (const c of CLIPS) {
		const v = c.v;
		if (c.want == null) { if (!v.paused) v.pause(); continue; }
		const want = Math.min(c.want, (v.duration || 99) - 0.05);
		if (v.playbackRate !== c.rate) v.playbackRate = c.rate;
		if (v.paused) { v.currentTime = want; if (playing) v.play().catch(() => {}); }
		else if (Math.abs(v.currentTime - want) > 0.2) v.currentTime = want;
		if (!playing && Math.abs(v.currentTime - want) > 0.02) v.currentTime = want;
	}
}

/* render: exact seek of every visible clip, resolve once painted */
function seekAll() {
	const jobs = [];
	for (const c of CLIPS) {
		const v = c.v;
		if (!v.paused) v.pause();
		if (c.want == null) continue;
		const want = Math.min(c.want, (v.duration || 99) - 0.04);
		if (Math.abs(v.currentTime - want) < 0.001 && v.readyState >= 2) continue;
		jobs.push(new Promise(res => {
			const done = () => { v.removeEventListener('seeked', done); res(); };
			v.addEventListener('seeked', done);
			v.currentTime = want;
			setTimeout(done, 4000);
		}));
	}
	return Promise.all(jobs);
}
const raf = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

/* clips load as blobs so seeking never depends on server range support */
async function loadClips() {
	const urls = {};
	await Promise.all([...new Set(CLIPS.map(c => c.name))].map(async n => {
		const b = await (await fetch(`clips/${n}.mp4`)).blob();
		urls[n] = URL.createObjectURL(b);
	}));
	CLIPS.forEach(c => { c.v.src = urls[c.name]; });
}

async function ready() {
	await loadClips();
	await document.fonts.ready;
	await Promise.all([
		document.fonts.load('700 100px "Instrument Sans"'),
		document.fonts.load('400 100px "Instrument Sans"'),
		document.fonts.load('italic 400 100px "Instrument Serif"'),
	]);
	await Promise.all(CLIPS.map(c => c.v.readyState >= 1 ? 0 : new Promise(r => { c.v.addEventListener('loadedmetadata', r, { once: true }); c.v.addEventListener('error', r, { once: true }); })));
}

let playing = !RENDER, clockT = 0, last = 0;
const ui = { play: document.getElementById('play'), scrub: document.getElementById('scrub'), clock: document.getElementById('clock') };

function fitStage() {
	const vp = document.getElementById('viewport').getBoundingClientRect();
	const k = Math.min(vp.width / W, vp.height / H);
	stage.style.transform = `translate(${-W * k / 2}px, ${-H * k / 2}px) scale(${k})`;
}

if (RENDER) {
	document.body.classList.add('render');
	window.__ready = ready().then(() => true);
	window.__frame = async t => { frame(t); await seekAll(); await raf(); return true; };
} else {
	fitStage();
	addEventListener('resize', fitStage);
	const q = new URLSearchParams(location.search);
	clockT = parseFloat(q.get('t') || '0');
	ui.play.onclick = () => { playing = !playing; ui.play.textContent = playing ? 'Pause' : 'Play'; };
	ui.scrub.oninput = () => { clockT = +ui.scrub.value; };
	addEventListener('keydown', e => {
		if (e.code === 'Space') { e.preventDefault(); ui.play.click(); }
		if (e.code === 'ArrowRight') clockT = Math.min(DUR, clockT + (e.shiftKey ? 2 : 1 / FPS));
		if (e.code === 'ArrowLeft') clockT = Math.max(0, clockT - (e.shiftKey ? 2 : 1 / FPS));
	});
	ready().then(() => {
		last = performance.now();
		const loop = now => {
			const dt = Math.min(0.1, (now - last) / 1000); last = now;
			if (playing) { clockT += dt; if (clockT >= DUR) clockT = 0; }
			frame(clockT); syncPlay();
			ui.scrub.value = clockT; ui.clock.textContent = clockT.toFixed(2);
			requestAnimationFrame(loop);
		};
		requestAnimationFrame(loop);
	});
}
