/* ============================================================
   SOOIM KANG — SHOWREEL · 30s
   The work, blended by what it shows: product, interaction,
   identity, 3D, AI, type, the work in the world. The glass
   pill from her site opens the reel, carries the first
   transition and closes it. 128 BPM · 64 beats.
   ============================================================ */

const beat = t => t / BEAT;
const from = (t, b0, s0 = 0, rate = 1) => s0 + Math.max(0, t - bt(b0)) * rate;
const settle = (t, b0, amt = .045, dur = .9) => lerp(1 + amt, 1, P(t, bt(b0), bt(b0 + dur), 'ease'));
const FULL = { cx: W / 2, cy: H / 2, w: W, h: H, r: 0 };
const mixR = (a, b, p) => ({ cx: lerp(a.cx, b.cx, p), cy: lerp(a.cy, b.cy, p), w: lerp(a.w, b.w, p), h: lerp(a.h, b.h, p), r: lerp(a.r, b.r, p) });
const insetOf = q => `inset(${(q.cy - q.h / 2).toFixed(1)}px ${(W - q.cx - q.w / 2).toFixed(1)}px ${(H - q.cy - q.h / 2).toFixed(1)}px ${(q.cx - q.w / 2).toFixed(1)}px round ${q.r.toFixed(1)}px)`;
const fullBox = () => ({ left: 0, top: 0, width: W + 'px', height: H + 'px' });

/* the site's line entrance, quicker for the reel */
function rise(e, t, t0, t1 = 1e9, dur = .42) {
	const a = P(t, t0, t0 + dur, 'intro');
	const q = P(t, t1, t1 + .3, 'inout');
	e.style.opacity = (a * (1 - q)).toFixed(3);
	e.style.transform = `translateY(${((1 - a) * 46 - q * 36).toFixed(1)}px) perspective(900px) rotateX(${((1 - a) * -32).toFixed(1)}deg)`;
	const bl = (1 - a) * 9 + q * 7;
	e.style.filter = bl > .05 ? `blur(${bl.toFixed(1)}px)` : 'none';
}

/* ── the name: [Sooim] Kang, laid out once ─────── */
const NAME_PX = 150;
let PILL = null, NAME = null;
function measure(cls, css, html) {
	const e = el('div', cls, document.getElementById('stage'), Object.assign({ visibility: 'hidden' }, css), html);
	const r = { w: e.offsetWidth, h: e.offsetHeight };
	e.remove();
	return r;
}
function nameLayout() {
	if (NAME) return NAME;
	const lab = measure('namet', { fontSize: NAME_PX + 'px' }, 'Sooim');
	const kang = measure('namet', { fontSize: NAME_PX + 'px' }, 'Kang');
	const pw = lab.w + .64 * NAME_PX, ph = Math.round(1.14 * NAME_PX), gap = .24 * NAME_PX;
	const x0 = W / 2 - (pw + gap + kang.w) / 2;
	PILL = { cx: x0 + pw / 2, cy: H / 2, w: pw, h: ph, r: ph / 2 };
	NAME = { lw: lab.w, lh: lab.h, kx: x0 + pw + gap, ty: H / 2 - lab.h / 2 - .01 * NAME_PX };
	return NAME;
}
function ringAt(e, q, op) {
	vis(e, op > .001);
	e.style.width = q.w + 'px'; e.style.height = q.h + 'px'; e.style.borderRadius = q.r + 'px';
	e.style.transform = `translate(${(q.cx - q.w / 2).toFixed(1)}px,${(q.cy - q.h / 2).toFixed(1)}px)`;
	e.style.opacity = op;
}
/* a frame folds into the pill, the pill says her name; optionally it opens again into the next shot */
function nameScene(a, b, T) {
	return scene(bt(a), bt(b), {
		init(s) {
			s.r1.style.zIndex = 40;
			nameLayout();
			s.ring = el('div', 'ring', s.r1);
			s.rim = el('div', 'pill__rim', s.ring);
			s.fill = el('div', 'pillx', s.r1);
			s.sheen = el('div', 'pill__sheen', s.fill);
			s.label = el('div', 'namet', s.r1, { fontSize: NAME_PX + 'px' }, 'Sooim');
			s.kang = el('div', 'namet', s.r1, { fontSize: NAME_PX + 'px' }, 'Kang');
			if (T.url) s.url = el('div', 'url', s.r1, { fontSize: '38px' }, 'sooimkang.com');
		},
		dom(t, s) {
			const B = beat(t), N = NAME;
			const f = P(B, T.fold[0], T.fold[1], 'strip');
			const e = T.open ? P(B, T.open[0], T.open[1], 'strip') : 0;
			ringAt(s.ring, e > 0 ? mixR(PILL, FULL, e) : mixR(FULL, PILL, f), P(f, .2, .65) * (1 - P(e, .5, .92)));
			const fill = P(B, T.fill, T.fill + .35) * (T.close ? 1 - P(B, T.close + .05, T.close + .4) : 1);
			ringAt(s.fill, PILL, fill);
			s.label.style.left = (PILL.cx - N.lw / 2) + 'px'; s.label.style.top = N.ty + 'px';
			s.kang.style.left = N.kx + 'px'; s.kang.style.top = N.ty + 'px';
			rise(s.label, t, bt(T.label), T.close ? bt(T.close) : 1e9);
			rise(s.kang, t, bt(T.label + .12), T.close ? bt(T.close) : 1e9);
			const sw = P(B, T.sheen, T.sheen + 1.5, 'inout');
			s.sheen.style.backgroundPosition = `${lerp(100, 0, sw)}% center`;
			s.rim.style.setProperty('--a', `${track(sw, [[0, -75], [.5, -160], [1, -75]])}deg`);
			if (s.url) {
				s.url.style.left = (W / 2 - s.url.offsetWidth / 2) + 'px';
				s.url.style.top = (H / 2 + PILL.h / 2 + 34) + 'px';
				rise(s.url, t, bt(T.url), 1e9, .5);
			}
		},
	});
}

/* ================================================================
   01 · IDENT — four pieces of work on eighth notes; the frame folds
   into the glass pill and the pill says her name.        b0 – b5.4
   ================================================================ */
const OPEN = [
	['c_annot', 7.2, 1.12, 38],     // Notate on a live page: open on the product, not the festival site
	['yap_wave', .8, 1.25, 0],      // scaled from the top: the avatar row stays out of frame
	['c_lists', .9, 1, 50],
	['nk_logo', .5, 1, 50],
];
scene(0, bt(3.0), {
	init(s) {
		s.r0.style.zIndex = 5;
		nameLayout();
		s.box = el('div', 'fill', s.r0);
		s.cs = OPEN.map(([n]) => clip(n, s.box, fullBox()));
	},
	dom(t, s) {
		const B = beat(t), k = clamp(Math.floor(B * 2), 0, 3);
		s.cs.forEach((c, i) => vis(c.box, i === k));
		const [, s0, sc, oy] = OPEN[k], c = s.cs[k];
		at(c, s0 + Math.max(0, t - bt(k / 2)) * .85, .85);
		c.v.style.transformOrigin = `50% ${oy}%`;
		c.v.style.transform = `scale(${sc * settle(t, k / 2, .06, .5)})`;
		const f = P(B, 1.75, 2.55, 'strip');
		s.box.style.clipPath = f > 0 ? insetOf(mixR(FULL, PILL, f)) : 'none';
	},
});
nameScene(1.75, 5.4, { fold: [1.75, 2.55], fill: 2.4, label: 2.6, sheen: 2.9, close: 4.3, open: [4.5, 5.35] });

/* ================================================================
   02 · PRODUCT — Notate at work on a page, tilted in space; the
   camera settles and leans in as the note lands.        b4.2 – b10.8
   ================================================================ */
scene(bt(4.2), bt(10.85), {
	init(s) {
		s.r0.style.zIndex = 10;
		s.wrap = el('div', 'fill', s.r0);
		el('div', 'dots', s.wrap);
		s.stage = el('div', 'fill', s.wrap, { perspective: '2400px' });
		s.card = media(s.stage, 'c_annot', 1500, 844, 22);
	},
	dom(t, s) {
		const B = beat(t);
		const e = P(B, 4.5, 5.35, 'strip');
		s.r0.style.clipPath = e < 1 ? insetOf(mixR(PILL, FULL, e)) : 'none';
		const a = P(B, 4.4, 8.6, 'ease');
		const lean = P(B, 7.6, 10.8, 'inout');
		const out = P(B, 10.0, 10.8, 'inout');
		s.wrap.style.transform = `translateX(${(-out * W).toFixed(1)}px)`;
		place(s.card.el, { x: W / 2 - 50 * lean, y: H / 2 + 8, s: lerp(.88, 1, a) * lerp(1, 1.1, lean), rx: lerp(13, 2, a), ry: lerp(-27, -3, a) });
		at(s.card.L.c, from(t, 4.2, 0, 2.45), 2.45);
	},
});

/* ================================================================
   03 · MOBILE — one phone holds centre and turns on the beat; at
   the edge-on moment the next product takes the screen and its
   brand colour opens out from behind the phone.         b10 – b16
   ================================================================ */
const PANELS = [
	['p_igc', 'linear-gradient(135deg,#fdc830 0%,#f77737 24%,#e1306c 52%,#c13584 74%,#833ab4 100%)', .2],
	['p_nk', 'linear-gradient(180deg,#2f4452 0%,#22292f 100%)', .3],
	['p_sb', '#067d62', .3],
	['p_acl', '#eef1f6', .5],
];
const MOVES = [[10.0, 10.8], [11.8, 12.6], [13.2, 14.0], [14.6, 15.4]];
const R_MAX = Math.hypot(W, H) / 2 + 40;
scene(bt(10.0), bt(16.05), {
	init(s) {
		s.r0.style.zIndex = 12;
		s.bgs = PANELS.map(([, bg]) => el('div', 'fill', s.r0, { background: bg }));
		s.stage = el('div', 'fill', s.r0, { perspective: '2200px', zIndex: 3 });
		s.phones = PANELS.map(([n]) => phone(s.stage, n, 920));
	},
	dom(t, s) {
		const B = beat(t);
		const enter = P(B, MOVES[0][0], MOVES[0][1], 'inout');
		s.r0.style.transform = enter < 1 ? `translateX(${((1 - enter) * W).toFixed(1)}px)` : 'none';
		let k = 0;
		for (let i = 1; i < MOVES.length; i++) if (B >= MOVES[i][0]) k = i;
		const p = k ? P(B, MOVES[k][0], MOVES[k][1], 'inout') : 1;
		const from_ = k ? k - 1 : 0;
		s.bgs.forEach((bg, i) => {
			vis(bg, i === k || (i === from_ && p < 1));
			bg.style.clipPath = i === k && p < 1 ? `circle(${(R_MAX * EZ.strip(p)).toFixed(1)}px at 50% 52%)` : 'none';
			bg.style.zIndex = i === k ? 2 : 1;
		});
		const ang = p * 180, face = ang < 90 ? from_ : k, ry = ang < 90 ? ang : ang - 180;
		const lift = Math.sin(Math.PI * p);
		s.phones.forEach((ph, i) => {
			vis(ph.el, i === face);
			if (i !== face) return;
			place(ph.el, { x: W / 2, y: H / 2 + 14 - 34 * lift + 6 * Math.sin(t * 1.6), s: 1 - .07 * lift, ry: ry + (1 - enter) * -24, rx: 3 });
		});
		PANELS.forEach(([, , s0], i) => at(s.phones[i].c, from(t, MOVES[i][0], s0)));
	},
});

/* ================================================================
   04 · IDENTITY — six marks on eighth notes, then the camera pulls
   back to the whole board and dives into Acuity.        b16 – b22
   ================================================================ */
const LOGOS = [['yap_open', 3.5], ['no_logo', 2.0], ['c_lists', .66], ['sb_morph', 2.95], ['ac_cover', 2.35], ['nk_logo', .45]];
scene(bt(16), bt(19.05), {
	init(s) { s.r0.style.zIndex = 14; s.cs = LOGOS.map(([n]) => clip(n, s.r0, fullBox())); },
	dom(t, s) {
		const B = beat(t), k = clamp(Math.floor((B - 16) * 2), 0, 5), b0 = 16 + k / 2;
		s.cs.forEach((c, i) => vis(c.box, i === k));
		at(s.cs[k], from(t, b0, LOGOS[k][1], .9), .9);
		s.cs[k].v.style.transform = `scale(${settle(t, b0, .05, .45)})`;
	},
});
const BOARD = [['yap_open', 2.9], ['no_logo', 1.6], ['c_lists', .35], ['sb_morph', 2.4], ['ac_cover', 1.55], ['nk_logo', .66]];
const BT = { w: 560, h: 315, g: 28 };
scene(bt(19), bt(22.05), {
	init(s) {
		s.r0.style.zIndex = 15;
		s.plane = el('div', 'plane', s.r0);
		el('div', 'dots', s.plane, { left: '-3200px', top: '-2200px', width: '6400px', height: '4400px' });
		s.tiles = BOARD.map(([n], i) => {
			const c = i % 3, r = (i / 3) | 0;
			const cx = (c - 1) * (BT.w + BT.g), cy = (r - .5) * (BT.h + BT.g);
			const e = el('div', 'tile', s.plane, { width: BT.w + 'px', height: BT.h + 'px' });
			e.style.transform = `translate(${cx - BT.w / 2}px,${cy - BT.h / 2}px)`;
			return { e, c: clip(n, e, { inset: 0 }), cx, cy };
		});
	},
	dom(t, s) {
		const B = beat(t), nk = s.tiles[5], ac = s.tiles[4], sF = W / BT.w;
		const p1 = P(B, 19, 20.35, 'ease'), p2 = P(B, 21.15, 22.0, 'strip');
		let sc = Math.exp(lerp(Math.log(sF), 0, p1)) * lerp(1, 1.035, P(B, 20.2, 21.3));
		let fx = lerp(nk.cx, 0, p1), fy = lerp(nk.cy, 0, p1);
		sc = Math.exp(lerp(Math.log(sc), Math.log(sF), p2));
		fx = lerp(fx, ac.cx, p2); fy = lerp(fy, ac.cy, p2);
		s.plane.style.transform = `translate(${W / 2}px,${H / 2}px) scale(${sc}) translate(${-fx}px,${-fy}px)`;
		s.tiles.forEach((o, i) => {
			o.e.style.borderRadius = (i === 5 ? 16 * p1 : i === 4 ? 16 * (1 - p2) : 16) + 'px';
			const r = i === 0 ? .6 : .9;
			at(o.c, BOARD[i][1] + Math.max(0, t - bt(19)) * r, r);
		});
	},
});

/* ================================================================
   05 · 3D — the Acuity band in two colourways, one per beat; then
   the Forage ring.                                       b22 – b26
   ================================================================ */
const BANDS = ['#f3f4f6', '#e6dcec', '#d9e3ee', '#e1e6d6'];
scene(bt(22), bt(24.05), {
	init(s) {
		s.r0.style.zIndex = 16;
		s.bg = el('div', 'fill', s.r0);
		s.c = clip('ac_spin', s.r0, { left: (W / 2 - 620) + 'px', top: (H / 2 - 620) + 'px', width: '1240px', height: '1240px', mixBlendMode: 'multiply' });
		s.c.box.classList.add('feather');
	},
	dom(t, s) {
		const B = beat(t), k = clamp(Math.floor(B - 22), 0, 1);
		s.bg.style.background = BANDS[k];
		at(s.c, from(t, 22, .1));
		s.c.box.style.transform = `scale(${lerp(1, 1.05, P(B, 22, 24))})`;
	},
});
scene(bt(24), bt(26.05), {
	init(s) {
		s.r0.style.zIndex = 17;
		el('div', 'fill', s.r0, { background: '#f5f0fe' });
		s.c = clip('fo_ring', s.r0, Object.assign(fullBox(), { mixBlendMode: 'multiply' }));
	},
	dom(t, s) {
		const B = beat(t);
		at(s.c, from(t, 24, .3));
		s.c.v.style.transform = `scale(${lerp(1.02, 1.1, P(B, 24, 26)) * settle(t, 24, .04, .6)})`;
	},
});

/* ================================================================
   06 · AI — a voice memo becomes text, then yap finds the topics.
   The topic UI gets the longest hold in the reel, large enough to
   read. Cropped so no photo of her is on screen.        b26 – b32
   ================================================================ */
const YC = { w: 1560, h: 650 };
scene(bt(26), bt(32.05), {
	init(s) {
		s.r0.style.zIndex = 18;
		s.wave = clip('yap_wave', s.r0, fullBox());
		s.card = el('div', 'media', s.r0, { width: YC.w + 'px', height: YC.h + 'px', borderRadius: '28px' });
		s.card._w = YC.w; s.card._h = YC.h;
		s.topics = clip('yap_topics', s.card, { left: 0, top: 0, width: YC.w + 'px', height: Math.round(YC.w * 731 / 1300) + 'px' });
	},
	dom(t, s) {
		const B = beat(t);
		at(s.wave, from(t, 26, .7, 1.1), 1.1);
		s.wave.v.style.transformOrigin = '50% 0';
		s.wave.v.style.transform = `scale(${1.25 * lerp(1, 1.04, P(B, 26, 28))})`;
		const a = P(B, 27.2, 28.2, 'ease');
		s.wave.box.style.filter = a > .01 ? `blur(${(a * 9).toFixed(1)}px)` : 'none';
		vis(s.card, B >= 27.2);
		place(s.card, { y: lerp(H + 380, H / 2 + 10, a), s: lerp(.94, 1, a) * lerp(1, 1.03, P(B, 28.2, 32, 'inout')) });
		at(s.topics, from(t, 27.2, .9, 1.15), 1.15);
	},
});

/* ================================================================
   07 · THE BODY OF WORK — a tilted wall of everything, drifting in
   columns; the camera flattens it and dives into one.  b32 – b38
   ================================================================ */
const WALL_COLS = [
	['w_ibhero', 'sbhand', 'w_filter', 'w_acspin', 'deck'],
	['w_yapopen', 'w_acl', 'w_nkroom', 'w_lists', 'store'],
	['billboard', 'w_foring', 'w_prog', 'explore3', 'w_nkdate'],
	['w_nologo', 'w_fewall', 'w_sbtag', 'nkdoor', 'w_nkqr'],
	['w_fcomp', 'w_sbmorph', 'w_annot', 'w_yapwave', 'interviews'],
	['w_nklogo', 'sbhand2', 'w_tix', 'w_accover', 'w_org'],
];
const ASPECT = { sbhand: 1.25, sbhand2: 1.25, nkdoor: 1.25, explore3: 1.25, store: .625, w_acspin: 1, w_acl: 1.78, w_fewall: 1.78, w_foring: .775, w_fcomp: .775, w_yapwave: .447 };
const TW = 360, TG = 26, WALL_V = 55;
function glide(t, t0, t1, t2) {
	if (t <= t1) return t - t0;
	const d = t2 - t1, u = Math.min(t, t2) - t1;
	return (t1 - t0) + u - u * u / (2 * d);
}
scene(bt(32), bt(38.05), {
	init(s) {
		s.r0.style.zIndex = 19;
		s.r0.style.perspective = '2600px';
		s.r0.style.background = '#eff1f3';
		s.plane = el('div', 'plane', s.r0);
		el('div', 'dots', s.plane, { left: '-3600px', top: '-3600px', width: '7200px', height: '7200px' });
		s.cols = WALL_COLS.map((list, c) => {
			let y = 0;
			const tiles = list.concat(list).map(n => {
				const h = Math.round(TW * (ASPECT[n] || .5625));
				const e = el('div', 'tile', s.plane, { width: TW + 'px', height: h + 'px', borderRadius: '14px' });
				el('img', null, e).src = STILL + n + '.jpg';
				const o = { e, y, h }; y += h + TG;
				return o;
			});
			return { tiles, x: (c - 2.5) * (TW + TG), y0: -y / 2 + [0, -150, 70, -70, 130, -30][c], dir: c % 2 ? 1 : -1 };
		});
	},
	dom(t, s) {
		const B = beat(t);
		const g = glide(t, bt(32), bt(35.6), bt(36.5));
		s.cols.forEach(col => {
			const off = col.dir * WALL_V * g;
			col.tiles.forEach(o => { o.e.style.transform = `translate(${col.x - TW / 2}px,${(col.y0 + o.y + off).toFixed(1)}px)`; });
		});
		const tc = s.cols[2], tt = tc.tiles[2];
		const tx = tc.x, ty = tc.y0 + tt.y + tt.h / 2 + tc.dir * WALL_V * g;
		const z = P(B, 36.4, 38.0, 'inout');
		const s0 = 1.28 * settle(t, 32, .08, 1.4), s1 = W / TW;
		const sc = Math.exp(lerp(Math.log(s0), Math.log(s1), z));
		const fx = lerp(0, tx, z), fy = lerp(40 - 80 * P(B, 32, 36.4), ty, z);
		s.plane.style.transform = `translate(${W / 2}px,${H / 2}px) rotateX(${lerp(20, 0, z)}deg) rotateZ(${lerp(-11, 0, z)}deg) scale(${sc}) translate(${-fx}px,${-fy}px)`;
		tt.e.style.borderRadius = lerp(14, 0, z) + 'px';
	},
});

/* ================================================================
   08 · TYPE — the festival site, the Fresh line, the passes; cut on
   the downbeats.                                         b38 – b44
   ================================================================ */
const TYPE = [['c_prog', .4, 2.8], ['sb_tag', 2.3, 2.2], ['c_tix', .5, 1.9]];
scene(bt(38), bt(44.05), {
	init(s) { s.r0.style.zIndex = 20; s.cs = TYPE.map(([n]) => clip(n, s.r0, fullBox())); },
	dom(t, s) {
		const B = beat(t), k = clamp(Math.floor((B - 38) / 2), 0, 2), b0 = 38 + k * 2;
		s.cs.forEach((c, i) => vis(c.box, i === k));
		at(s.cs[k], from(t, b0, TYPE[k][1], TYPE[k][2]), TYPE[k][2]);
		s.cs[k].v.style.transform = `scale(${k ? settle(t, b0, .05, .8) : 1})`;
	},
});

/* ================================================================
   09 · AI LIBRARY — Forage sorting captures into image, type and
   colour.                                                b44 – b48
   ================================================================ */
scene(bt(44), bt(48.05), {
	init(s) { s.r0.style.zIndex = 21; s.c = clip('c_fcomp', s.r0, fullBox()); },
	dom(t, s) {
		const B = beat(t);
		at(s.c, from(t, 44, .2, 1.9), 1.9);
		s.c.v.style.transform = `scale(${lerp(1, 1.08, P(B, 44, 48)) * settle(t, 44, .04, .8)})`;
	},
});

/* ================================================================
   10 · IN THE WORLD — the room itself, then the billboard.  b48 – b52
   ================================================================ */
scene(bt(48), bt(52.05), {
	init(s) {
		s.r0.style.zIndex = 22;
		s.room = clip('nk_room', s.r0, fullBox());
		s.bb = el('div', 'fill', s.r0, { overflow: 'hidden' });
		s.img = el('img', null, s.bb, { width: '100%', height: '100%', objectFit: 'cover', display: 'block', transformOrigin: '30% 40%' });
		s.img.src = STILL + 'billboard.jpg';
	},
	dom(t, s) {
		const B = beat(t), two = B >= 50;
		vis(s.room.box, !two); vis(s.bb, two);
		if (!two) {
			at(s.room, from(t, 48, .8));
			s.room.v.style.transform = `scale(${lerp(1.04, 1.13, P(B, 48, 50)) * settle(t, 48, .04, .8)})`;
		} else s.img.style.transform = `scale(${lerp(1.32, 1.06, P(B, 50, 52, 'ease'))})`;
	},
});

/* ================================================================
   11 · RECAP — eleven cuts on eighth notes.             b52 – b57.5
   ================================================================ */
const RECAP = [
	['c_filter', .75, 1.12, '50% 50%'],
	['c_nkdate', 1.0, 1.08, '50% 50%'],
	['sb_cards', 1.0, 1.12, '50% 50%'],
	['ac_spin', 1.3, 1.0, '50% 50%'],
	['c_org', 1.7, 1.35, '42% 38%'],
	['fo_sel', .8, 1.0, '50% 50%'],
	['c_annot', 7.2, 1.3, '30% 38%'],
	['ib_hero', 2.2, 1.0, '50% 50%'],
	['c_nkqr2', .6, 1.1, '50% 45%'],
	['c_lists', 1.6, 1.0, '50% 50%'],
	['sb_tag', 4.5, 1.0, '50% 50%'],
];
scene(bt(52), bt(57.55), {
	init(s) { s.r0.style.zIndex = 23; s.cs = RECAP.map(([n]) => clip(n, s.r0, fullBox())); },
	dom(t, s) {
		const B = beat(t), k = clamp(Math.floor((B - 52) * 2), 0, RECAP.length - 1), b0 = 52 + k / 2;
		s.cs.forEach((c, i) => vis(c.box, i === k));
		const [, s0, sc, o] = RECAP[k], c = s.cs[k];
		at(c, from(t, b0, s0, .8), .8);
		c.v.style.transformOrigin = o;
		c.v.style.transform = `scale(${sc * settle(t, b0, .05, .45)})`;
	},
});

/* ================================================================
   12 · SIGN-OFF — the yap mark folds into the pill: [Sooim] Kang,
   sooimkang.com.                                       b57.5 – b64
   ================================================================ */
scene(bt(57.5), bt(59.2), {
	init(s) {
		s.r0.style.zIndex = 24;
		s.box = el('div', 'fill', s.r0);
		s.c = clip('yap_open', s.box, fullBox());
	},
	dom(t, s) {
		const B = beat(t);
		at(s.c, from(t, 57.5, 3.3, .35), .35);   // the wordmark holds until 4.1s; avatars follow, so stay well before
		s.c.v.style.transform = `scale(${settle(t, 57.5, .05, .5)})`;
		const f = P(B, 58.0, 58.8, 'strip');
		s.box.style.clipPath = f > 0 ? insetOf(mixR(FULL, PILL, f)) : 'none';
	},
});
nameScene(58, DUR / BEAT + .01, { fold: [58.0, 58.8], fill: 58.6, label: 58.65, sheen: 59.2, url: 59.8 });
