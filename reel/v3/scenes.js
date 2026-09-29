/* ============================================================
   scenes — hook · seven projects · explorations · work · greeting
   Beats at 128 BPM; project k runs from beat SEG(k).
   Local beat L inside a project:
     0.6  icon has landed        0.7–1.7  world blooms out
     1.0–9.9  content            9.9–10.6 folds back into the icon
     10.6 icon flings out, next icon springs in
   ============================================================ */

const Lb = (t, S) => t / BEAT - S;               // local beat
const srcT = (t, S, L0, from, rate = 1) => from + Math.max(0, t - bt(S + L0)) * rate;

/* ================================================================
   ICON TRACK — the hook, then every swap between projects
   ================================================================ */
scene(0, bt(88.2), {
	init(s) {
		s.icons = PROJECTS.map((p, i) => {
			const e = iconEl(s.r1, p.id);
			e.style.zIndex = i === 0 ? 20 : 10 - i;
			return e;
		});
	},
	dom(t, s) {
		const hook = t < bt(4.7);
		s.r1.style.transform = hook ? `scale(${lerp(1.16, 1, P(t, 0, 1.1, 'ease'))})` : 'none';
		s.r1.style.transformOrigin = '50% 50%';
		s.icons.forEach((e, i) => {
			let st = null;
			if (hook) st = hookIcon(i, t);
			else {
				const S = SEG(i), L = Lb(t, S);
				const inStart = i === 0 ? -99 : bt(SEG(i - 1) + 10.984);
				if (t >= inStart && L < .7) {                      // springing in / resting
					const a = iconIn(t, inStart);
					st = { x: W / 2 + a.dx, y: H / 2, r: a.r, s: a.s, op: a.op };
				} else if (L >= .7 && L < 1.4) {                  // world blooms out of it
					const ex = P(L, .7, 1.7, 'ease');
					st = { x: W / 2, y: H / 2, r: 0, s: 1 + ex * 4, op: 1 - P(ex, 0, .32) };
				} else if (L >= 10.2 && L < 10.6) {               // world folds back into it
					st = { x: W / 2, y: H / 2, r: 0, s: 1, op: P(L, 10.25, 10.6) };
				} else if (L >= 10.6 && L < 12.2) {               // wind up and fling
					const o = iconOut(t, bt(S + 10.6));
					st = { x: W / 2 + o.dx, y: H / 2, r: o.r, s: o.s, op: o.op };
				}
			}
			vis(e, !!st && st.op > .001);
			if (st) place(e, { x: st.x, y: st.y, r: st.r, s: st.s, op: clamp(st.op) });
		});
	},
});

/* hook: seven icons spring in on a pull-back, hop on the beat, stack, and yap stays */
function hookIcon(i, t) {
	const x0 = W / 2 + (i - 3) * 250;
	const a = iconIn(t, -.3 + i * .07);
	let x = x0 + a.dx, y = H / 2, r = a.r, s = a.s, op = a.op;
	const hop = (u, d = .3) => (u > 0 && u < d) ? 4 * (u / d) * (1 - u / d) : 0;
	y -= 44 * hop(t - (bt(1) + i * .035)) + 28 * hop(t - (bt(2) + (6 - i) * .035));
	const d = Math.abs(i - 3) * .03;
	const g = P(t, bt(3) + d, bt(3) + d + .42, 'inout');
	x = lerp(x, W / 2, g);
	r = lerp(r, (i - 3) * 6, g);
	const k = P(t, bt(3.8), bt(4.45), 'ease');
	if (i === 0) { r = lerp(r, 0, k); }
	else { r = lerp(r, (i - 3) * 6 * 1.4, k); s *= lerp(1, .82, k); op *= 1 - k; }
	return { x, y, r, s, op };
}

/* ================================================================
   PROJECTS
   ================================================================ */
function project(k, build, update) {
	const S = SEG(k);
	return scene(bt(S + .6), bt(S + 10.7), {
		init(s) { makeWorld(s, k); build(s); },
		dom(t, s) { const w = updateWorld(t, s); update(t, s, w.L, w); },
	});
}

/* 01 · yap — its own wordmark animation, then topic cards that flip like the site's fliptrack */
project(0, s => {
	s.open = full(s.cam, 'yap_open');
	s.flip = el('div', 'abs', s.cam, { width: '1360px', height: '765px', transformStyle: 'preserve-3d' });
	s.flip._w = 1360; s.flip._h = 765;
	s.cam.style.perspective = '2400px';
	const face = (name, back) => {
		const f = card(s.flip, name, 1360, 765, 28);
		f.el.style.backfaceVisibility = 'hidden';
		if (back) f.el.style.transform = 'rotateY(180deg)';
		return f;
	};
	s.front = face('yap_topics', false);
	s.back = face('yap_play', true);
}, (t, s, L) => {
	const S = s.S;
	const onOpen = L < 5.4;
	vis(s.open.box, onOpen);
	if (onOpen) {
		at(s.open, srcT(t, S, 1, .4, 2.2), 2.2);
		s.open.box.style.transform = `scale(${lerp(1.08, 1, P(L, .7, 3, 'ease'))})`;
	}
	const on = L >= 4.9;
	vis(s.flip, on);
	if (on) {
		const inn = P(L, 4.9, 6, 'ease');
		const push = P(L, 8.4, 9.9, 'ease');
		const ry = 180 * P(L, 7.3, 8.2, 'inout');
		place(s.flip, { y: H / 2 + (1 - inn) * 140, s: lerp(.9, 1, inn) * lerp(1, 1.06, push), op: clamp(inn * 2) });
		s.flip.style.transform += ` rotateY(${ry}deg)`;
		at(s.front.c, srcT(t, S, 4.9, .9, 1.3), 1.3);
		if (L > 7.6) at(s.back.c, srcT(t, S, 7.6, 1.4));
	}
});

/* 02 · Notate — its sticky-note logo, then one continuous camera pan across the product */
project(1, s => {
	s.logo = full(s.cam, 'no_logo');
	s.strip = el('div', 'abs', s.cam, { width: '0px', height: '0px', transformOrigin: '0 0' });
	s.na = card(s.strip, 'no_note2', 2240, 1566, 32);
	s.nb = card(s.strip, 'no_org2', 2240, 1566, 32);
	s.na.el.style.transform = 'translate(-1120px,-783px)';
	s.nb.el.style.transform = `translate(${2320 - 1120}px,-783px)`;
}, (t, s, L) => {
	const S = s.S;
	vis(s.logo.box, L < 4.6);
	if (L < 4.6) at(s.logo, srcT(t, S, 1, .2, 2));
	const on = L >= 4.1;
	vis(s.strip, on);
	if (on) {
		const inn = P(L, 4.1, 5.1, 'ease');
		// camera: left half of the first window → across the gap → right half of the second
		const cx = kf(L, [[4.1, -470], [6.1, 470, 'inout'], [8.1, 2320 - 470, 'inout'], [9.9, 2320 + 470, 'inout']]);
		const cy = kf(L, [[4.1, 120], [6.1, 60, 'inout'], [9.9, -40, 'inout']]);
		const zoom = kf(L, [[4.1, .92], [6.1, .92], [7.1, .7, 'inout'], [8.1, .92, 'inout']]);
		s.strip.style.transform = `translate(${W / 2 - cx * zoom}px,${H / 2 - cy * zoom + (1 - inn) * 300}px) scale(${zoom})`;
		s.strip.style.opacity = clamp(inn * 2);
		at(s.na.c, srcT(t, S, 4.1, .2, 1.8), 1.8);
		at(s.nb.c, srcT(t, S, 6.6, .3, 1.8), 1.8);
	}
});

/* 03 · Instagram Lists — its own title card, then phones in parallax and a dolly into Stories */
project(2, s => {
	s.world.style.backgroundSize = '220% 220%';
	s.title = full(s.cam, 'ig_cover');
	s.phones = ['p_igh', 'p_ig', 'p_igc'].map(n => phone(s.cam, n, 860));
	s.phones[1].el.style.zIndex = 2;
}, (t, s, L) => {
	const S = s.S;
	s.world.style.backgroundPosition = `${lerp(0, 100, P(L, 0, 11))}% ${lerp(30, 70, P(L, 0, 11))}%`;
	vis(s.title.box, L < 3.9);
	if (L < 3.9) at(s.title, srcT(t, S, 1, .2, 2.6));
	const xs = [600, 960, 1320], drift = [-70, -20, -110], lag = [.2, 0, .4];
	const dolly = P(L, 7.4, 9.6, 'inout');
	s.phones.forEach((p, i) => {
		const on = L >= 3.5;
		vis(p.el, on);
		if (!on) return;
		const inn = P(L, 3.5 + lag[i], 4.7 + lag[i], 'ease');
		const d = P(L, 3.5, 9.9);
		const side = i - 1;
		place(p.el, {
			x: xs[i] + side * dolly * 520, y: H / 2 + 40 + (1 - inn) * 1000 + drift[i] * d * (1 - dolly) + (i === 1 ? dolly * 170 : 0),
			r: side * 3 * (1 - inn), s: i === 1 ? lerp(1, 1.42, dolly) : lerp(1, .9, dolly), op: 1, blur: i === 1 ? 0 : dolly * 8,
		});
		at(p.c, srcT(t, S, 3.5, [.3, .5, .3][i]));
	});
});

/* 04 · Smart Bundles — logo morph and Fresh tagline in Amazon's own type, then the product stacks up */
project(3, s => {
	s.morph = full(s.cam, 'sb_morph');
	s.tag = full(s.cam, 'sb_tag');
	s.mint = el('div', 'fill', s.cam, { background: '#eaf6ef' });
	s.left = card(s.cam, 'sb_cards', 780, 440, 24);
	s.right = card(s.cam, 'sb_prime', 420, 523, 24);
	s.ph = phone(s.cam, 'p_sb', 860);
}, (t, s, L) => {
	const S = s.S;
	vis(s.morph.box, L < 4.4);
	if (L < 4.4) at(s.morph, srcT(t, S, 1, .1, 2.6));
	vis(s.tag.box, L >= 4.2 && L < 7.2);
	if (L >= 4.2) at(s.tag, srcT(t, S, 4.2, 1.5, 3));
	const on = L >= 6.8;
	vis(s.mint, on); vis(s.left.el, on); vis(s.right.el, on); vis(s.ph.el, on);
	if (on) {
		s.mint.style.clipPath = `circle(${lerp(0, 1520, P(L, 6.8, 7.8, 'ease'))}px at 50% 100%)`;
		const pop = (L0) => clamp(P(L, L0, L0 + 1.3, 'spring'), 0, 1.2);
		const a = pop(7.1), b = pop(7.45), c = pop(6.9);
		place(s.left.el, { x: 560, y: 560 + (1 - a) * 700, r: -5 * a, op: clamp(a * 3) });
		place(s.right.el, { x: 1380, y: 580 + (1 - b) * 700, r: 5 * b, op: clamp(b * 3) });
		place(s.ph.el, { x: 960, y: 560 + (1 - c) * 900, op: clamp(c * 3) });
		at(s.left.c, srcT(t, S, 7.1, .3, 1.2));
		at(s.right.c, srcT(t, S, 7.45, .3));
		at(s.ph.c, srcT(t, S, 6.9, .2));
	}
});

/* 05 · neuk — its wordmark animation, the app and the ticket, then a dolly into the room */
project(4, s => {
	s.logo = full(s.cam, 'nk_logo');
	s.ph = phone(s.cam, 'p_nk', 860);
	s.qr = card(s.cam, 'nk_qr', 1000, 562, 24);
	s.room = full(s.cam, 'nk_room');
}, (t, s, L) => {
	const S = s.S;
	vis(s.logo.box, L < 3.8);
	if (L < 3.8) at(s.logo, srcT(t, S, 1, .1, 1.9));
	const mid = L >= 3.4 && L < 7.3;
	vis(s.ph.el, mid); vis(s.qr.el, mid);
	if (mid) {
		const a = P(L, 3.4, 4.5, 'ease'), b = P(L, 3.8, 4.9, 'ease'), d = P(L, 3.4, 7);
		place(s.ph.el, { x: 690, y: H / 2 + (1 - a) * 1000 - 40 * d, op: 1 });
		place(s.qr.el, { x: 1320 + (1 - b) * 900, y: H / 2 + 30 * d, op: 1 });
		at(s.ph.c, srcT(t, S, 3.4, .2));
		at(s.qr.c, srcT(t, S, 3.8, .4, 1.4));
	}
	const rOn = L >= 6.6;
	vis(s.room.box, rOn);
	if (rOn) {
		const w = P(L, 6.6, 7.5, 'ease');
		const a = -56 * Math.PI / 180, hw = lerp(10, 1500, w);
		const ux = Math.cos(a), uy = Math.sin(a);
		const p = [[-1600, -hw], [1600, -hw], [1600, hw], [-1600, hw]].map(([u, v]) => [960 + ux * u - uy * v, 540 + uy * u + ux * v]);
		s.room.box.style.clipPath = `polygon(${p.map(q => `${q[0].toFixed(1)}px ${q[1].toFixed(1)}px`).join(',')})`;
		const dl = P(L, 6.6, 9.9, 'inout');
		s.room.box.style.transform = `scale(${lerp(1.02, 1.2, dl)}) translateX(${lerp(30, -30, dl)}px)`;
		at(s.room, srcT(t, S, 6.6, .3));
	}
});

/* 06 · Forage — the ring render, then its blob shapes become windows on the real world */
const BLOBS = [
	['fo_tap', 640, 320, 1.6], ['fo_sel', 1280, 330, .6], ['fo_text', 660, 770, .8], ['fo_mural', 1300, 760, .5],
];
project(5, s => {
	s.ring = full(s.cam, 'fo_ring');
	s.blobs = BLOBS.map(([n, x, y]) => clip(n, s.cam, { left: (x - 350) + 'px', top: (y - 350) + 'px', width: '700px', height: '700px' }));
	s.ui = card(s.cam, 'fo_ui', 1560, 875, 28);
}, (t, s, L) => {
	const S = s.S;
	vis(s.ring.box, L < 3.8);
	if (L < 3.8) at(s.ring, srcT(t, S, 1, .2, 2.4));
	s.blobs.forEach((c, i) => {
		const [, x, y, from] = BLOBS[i];
		const L0 = 3.5 + i * .5;
		const on = L >= L0 && L < 9.9;
		vis(c.box, on);
		if (!on) return;
		const g = P(L, L0, L0 + 1.1, 'spring');
		const back = P(L, 7.2, 8.2, 'ease');
		const R = Math.max(0, 262 * g * lerp(1, .7, back));
		const pts = blobPts(350, 350, R, .12, -Math.PI / 2 + i + L * .25, 40, .03 * Math.sin(L * 2 + i));
		c.box.style.clipPath = `path('${smoothPath(pts)}')`;
		c.box.style.opacity = 1 - P(L, 8, 8.8);
		at(c, srcT(t, S, L0, from));
	});
	const uOn = L >= 7.4;
	vis(s.ui.el, uOn);
	if (uOn) {
		const inn = P(L, 7.4, 8.5, 'ease');
		place(s.ui.el, { y: H / 2 + (1 - inn) * 260, s: lerp(.9, 1, inn) * lerp(1, 1.05, P(L, 8.5, 9.9)), op: clamp(inn * 2) });
		at(s.ui.c, srcT(t, S, 7.4, .3, 1.6));
	}
});

/* 07 · Acuity — the ring turns into its logo, then the app's risk states drive a colour shift */
const STATES = [[4, .8, '#eef6f1'], [5, 4.0, '#fbf3e3'], [6, 6.2, '#fcebe8']];
project(6, s => {
	s.cover = full(s.cam, 'ac_cover');
	s.tint = el('div', 'fill', s.cam, { background: STATES[0][2] });
	s.ph = phone(s.cam, 'ac_states', 880);
	s.bands = card(s.cam, 'ac_bands', 600, 444, 24);
	s.wrist = full(s.cam, 'ac_wrist');
}, (t, s, L) => {
	const S = s.S;
	vis(s.cover.box, L < 4.4);
	if (L < 4.4) at(s.cover, srcT(t, S, 1, .2, 2.7));
	const mid = L >= 4 && L < 8.4;
	vis(s.tint, mid); vis(s.ph.el, mid); vis(s.bands.el, mid);
	if (mid) {
		const k = L < 5 ? 0 : L < 6 ? 1 : 2;
		const [L0, from, col] = STATES[k];
		s.tint.style.background = col;
		s.tint.style.clipPath = `inset(0 0 ${(1 - P(L, 4, 4.8, 'ease')) * 100}% 0)`;
		const a = P(L, 4, 5, 'ease');
		const kick = k ? Math.exp(-(t - bt(S + L0)) * 9) : 0;
		place(s.ph.el, { x: 790, y: H / 2 + (1 - a) * 1000, s: 1 + .025 * kick, op: 1 });
		at(s.ph.c, from + Math.max(0, t - bt(S + L0)));
		const b = clamp(P(L, 4.6, 5.8, 'spring'), 0, 1.2);
		place(s.bands.el, { x: 1330, y: H / 2 + 10, s: b, op: clamp(b * 3), r: (1 - b) * -8 });
		at(s.bands.c, srcT(t, S, 4.6, 0, .9));
	}
	const wOn = L >= 7.4;
	vis(s.wrist.box, wOn);
	if (wOn) {
		const inn = P(L, 7.4, 8.4, 'ease');
		s.wrist.box.style.clipPath = `inset(${(1 - inn) * 100}% 0 0 0 round ${lerp(28, 0, inn)}px)`;
		s.wrist.box.style.transform = `scale(${lerp(1, 1.1, P(L, 7.4, 9.9, 'inout'))})`;
		at(s.wrist, srcT(t, S, 7.4, .2));
	}
});

/* ================================================================
   EXPLORATIONS — a browser window (explorations.html) for IBFF,
   then the fellowship installation as 9:16 cards      beats 86.9–96
   ================================================================ */
scene(bt(86.9), bt(96.4), {
	init(s) {
		s.win = el('div', 'browser', s.r1, { width: '1520px', height: '900px' });
		s.win._w = 1520; s.win._h = 900;
		const bar = el('div', 'browser__bar', s.win);
		el('i', null, bar); el('i', null, bar); el('i', null, bar);
		el('span', 'browser__url', bar, null, 'ibff');
		s.screen = el('div', 'browser__screen', s.win);
		s.cuts = ['ib_hero', 'ib_sect', 'ib_logo'].map(n => clip(n, s.screen, { inset: 0 }));
		s.fe = ['fe_wall', 'fe_city'].map(n => card(s.r1, n, 394, 700, 20));
	},
	dom(t, s) {
		const B = t / BEAT;
		// springs in like an icon, then opens up to a window
		const a = iconIn(t, bt(86.984));
		const open = P(B, 88.7, 89.7, 'ease');
		const aside = P(B, 92.3, 93.3, 'ease');
		const out = P(B, 95.3, 96.2, 'ease');
		const w = lerp(300, 1520, open), h = lerp(190, 900, open);
		s.win.style.width = w + 'px'; s.win.style.height = h + 'px';
		s.win._w = w; s.win._h = h;
		const x = W / 2 + a.dx * (1 - open) - aside * 380;
		place(s.win, { x, y: H / 2, r: a.r * (1 - open), s: lerp(a.s, 1, open) * lerp(1, .58, aside) * lerp(1, .85, out), op: clamp(a.op) * (1 - out) });
		const k = B < 90.2 ? 0 : B < 91.2 ? 1 : 2;
		const t0 = [89, 90.2, 91.2][k];
		s.cuts.forEach((c, i) => {
			vis(c.box, i === k);
			if (i === k) at(c, .3 + Math.max(0, t - bt(t0)) * (i === 2 ? 1.3 : 1));
		});
		s.fe.forEach((f, i) => {
			const L0 = 92.6 + i * .35;
			const on = B >= L0;
			vis(f.el, on);
			if (!on) return;
			const g = clamp(P(B, L0, L0 + 1.4, 'spring'), 0, 1.2);
			place(f.el, { x: [1250, 1660][i], y: H / 2 + (1 - g) * 900, op: (1 - out), s: lerp(1, .85, out) });
			at(f.c, .2 + Math.max(0, t - bt(L0)) * 1.4, 1.4);
		});
	},
});

/* ================================================================
   WORK — the site's work grid: the camera pulls back over every
   project, then each card folds into its app icon      beats 96–112
   ================================================================ */
const GRID = [
	['yap_wave', 0], ['no_logo', 1], ['ig_cover', 2],
	['sb_morph', 3], ['nk_room', 4], ['fo_mural', 5],
	['ac_cover', 6], ['ib_sect', -1], ['nk_logo', -1],
];
const GRID_FROM = { yap_wave: .5, no_logo: 2.6, ig_cover: 2.4, sb_morph: .2, nk_room: .5, fo_mural: .4, ac_cover: 2.6, ib_sect: .5, nk_logo: 1.2 };
scene(bt(95.5), bt(112.2), {
	init(s) {
		s.plane = el('div', 'fill', s.r1, { transformOrigin: '50% 50%' });
		s.cards = GRID.map(([n, pi]) => {
			const f = card(s.plane, n, 580, 363, 16);
			f.pi = pi;
			if (pi >= 0) {
				f.icon = el('img', null, f.el, { position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0 });
				f.icon.src = `${ICONS}${PROJECTS[pi].id}.png`;
			}
			return f;
		});
	},
	dom(t, s) {
		const B = t / BEAT;
		const pull = P(B, 95.6, 99, 'ease');
		const tilt = P(B, 96.4, 99.4, 'inout') * (1 - P(B, 103.6, 105.4, 'inout'));
		const drift = P(B, 98, 105);
		s.r1.style.perspective = '2600px';
		s.plane.style.transform = `translateY(${lerp(50, -50, drift) * tilt}px) rotateX(${14 * tilt}deg) rotateZ(${-5 * tilt}deg) scale(${lerp(3.05, 1, pull) * lerp(1, .94, P(B, 103.6, 105.4, 'inout'))})`;
		const fold = P(B, 105.2, 106.4, 'ease');
		s.cards.forEach((f, i) => {
			const col = i % 3, row = (i / 3) | 0;
			let x = W / 2 + (col - 1) * 608, y = H / 2 + (row - 1) * 391;
			let w = 580, h = 363, rad = 16, op = 1;
			const hov = Math.exp(-Math.max(0, t - bt(100 + ((col + row) % 4))) * 5) * (B >= 100 + ((col + row) % 4) ? 1 : 0);
			f.c.v.style.transform = `scale(${1 + .03 * hov})`;
			if (f.pi >= 0) {
				const d = P(B, 105.6 + f.pi * .14, 107.6 + f.pi * .14, 'inout');
				x = lerp(x, W / 2 + (f.pi - 3) * 250, d);
				y = lerp(y, H / 2, d);
				w = lerp(580, ICON, d); h = lerp(363, ICON, d); rad = lerp(16, ICON_R, d);
				f.icon.style.opacity = P(d, .55, 1);
				f.c.box.style.opacity = 1 - P(d, .7, 1);
				f.el.style.boxShadow = d > .9 ? 'none' : '';
				f.el.style.background = d > .98 ? 'transparent' : '#fff';
			} else op = 1 - fold;
			f.el.style.width = w + 'px'; f.el.style.height = h + 'px'; f.el.style.borderRadius = rad + 'px';
			f.el._w = w; f.el._h = h;
			const hop = f.pi >= 0 ? 44 * Math.max(0, Math.sin(clamp((B - 110 - f.pi * .07) / .6) * Math.PI)) : 0;
			place(f.el, { x, y: y - hop, op, s: f.pi >= 0 ? 1 : lerp(1, .9, fold) });
			at(f.c, GRID_FROM[GRID[i][0]] + Math.max(0, t - bt(95.5)) * .9, .9);
		});
	},
});

/* ================================================================
   GREETING — the homepage's own opening: the lines rise in, the
   name pill sheens, and they settle into the strip   beats 112–128
   ================================================================ */
scene(bt(112), DUR + .01, {
	init(s) {
		s.icons = PROJECTS.map((p, i) => { const e = iconEl(s.r1, p.id); e.style.zIndex = 10 - i; return e; });
		s.icons[0].style.zIndex = 20;
		const F = 112;
		s.F = F;
		s.lines = [0, 1, 2].map(i => el('div', 'greet', s.r1, { fontSize: F + 'px' }));
		s.lines[0].innerHTML = 'Hi, I’m <span class="pill"><span class="pill__sheen"></span><span class="pill__rim"></span><span class="pill__t">Sooim</span></span>';
		s.lines[1].textContent = 'Product designer';
		s.lines[2].textContent = 'Based in New York';
		s.sheen = s.lines[0].querySelector('.pill__sheen');
		s.rim = s.lines[0].querySelector('.pill__rim');
	},
	dom(t, s) {
		const B = t / BEAT;
		// icons gather into one stack, the top one flings, the stack clears
		s.icons.forEach((e, i) => {
			const d = Math.abs(i - 3) * .045;
			const g = P(t, bt(112) + d, bt(112) + d + .5, 'inout');
			let x = lerp(W / 2 + (i - 3) * 250, W / 2, g), r = (i - 3) * 6 * g, sc = 1, op = 1;
			if (i === 0) {
				const o = iconOut(t, bt(113.4));
				x += o.dx; r += o.r; sc = o.s; op = o.op;
			} else {
				const k = P(t, bt(113.3), bt(113.3) + .35, 'ease');
				sc = lerp(1, .6, k); op = 1 - k;
			}
			vis(e, op > .001);
			place(e, { x, y: H / 2, r, s: sc, op });
		});
		if (!s.meas) {
			s.meas = s.lines.map(l => ({ w: l.offsetWidth, h: l.offsetHeight }));
			const gap = 10, total = s.meas.reduce((a, m) => a + m.h, 0) + gap * 2;
			let y = H / 2 - total / 2;
			s.home = s.meas.map(m => { const p = { x: W / 2 - m.w / 2, y }; y += m.h + gap; return p; });
		}
		// strip: line 1 left, line 0 centred, line 2 right, at the strip's size
		const k = .56, G = 72, sy = H / 2 - s.meas[0].h * k / 2;
		const strip = [
			{ x: W / 2 - s.meas[0].w * k / 2, y: sy },
			{ x: G, y: sy },
			{ x: W - G - s.meas[2].w * k, y: sy },
		];
		const T0 = bt(114.2);
		const settle = P(t, T0 + 2.2, T0 + 3.3, 'strip');
		s.lines.forEach((l, i) => {
			const a = P(t, T0 + .15 + i * .38, T0 + .15 + i * .38 + .75, 'intro');
			const x = lerp(s.home[i].x, strip[i].x, settle), y = lerp(s.home[i].y, strip[i].y, settle);
			const sc = lerp(1, k, settle);
			l.style.transform = `translate(${x}px,${y + (1 - a) * 60}px) perspective(800px) rotateX(${(1 - a) * -35}deg) scale(${sc})`;
			l.style.opacity = a;
			l.style.filter = a < .99 ? `blur(${(1 - a) * 10}px)` : 'none';
		});
		// the name pill's load sweep: sheen right → left, rim angle swings and returns
		const sw = P(t, T0 + .9, T0 + 1.85, 'inout');
		s.sheen.style.backgroundPosition = `${lerp(100, 0, sw)}% center`;
		s.rim.style.setProperty('--a', `${track(sw, [[0, -75], [.5, -160], [1, -75]])}deg`);
	},
});
