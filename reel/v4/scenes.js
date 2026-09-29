/* ============================================================
   SOOIM KANG — who I am as a designer
   Her own words carry it (about.html): observe closely,
   question the obvious, design around what people actually do.
   The work is blended underneath — no project-by-project tour.
   128 BPM; everything is timed in beats (b).
   ============================================================ */

const beat = t => t / BEAT;
const from = (t, b0, s0 = 0, rate = 1) => s0 + Math.max(0, t - bt(b0)) * rate;   // clip time since beat b0
const kick = (t, b0, amt = .05, dur = .9) => lerp(1 + amt, 1, P(t, bt(b0), bt(b0 + dur), 'ease'));

/* ================================================================
   HELLO — "Hi, I'm [card of her] Sooim", then a diptych of her   b0–8.2
   ================================================================ */
scene(0, bt(8.3), {
	init(s) {
		s.hi = headline(s.r1, [[['Hi, I’m']]], 150);
		s.pillWrap = el('div', 'hl', s.r1, { fontSize: '150px' });
		s.pill = pillEl(s.pillWrap, 'Sooim');
		s.cardA = mframe(s.r1, 300, 400, 20);
		s.aVid = layer(s.cardA, 'me_hi');
		s.aImg = layer(s.cardA, 'img:me');
		s.cardB = media(s.r1, 'me_work', 500, 889, 24);
	},
	dom(t, s) {
		if (!s.m) {
			s.m = { hi: s.hi.el.offsetWidth, pill: s.pillWrap.offsetWidth, h: s.hi.el.offsetHeight };
			const g = 40, total = s.m.hi + g + 300 + g + s.m.pill;
			s.x0 = W / 2 - total / 2;
		}
		const B = beat(t), top = H / 2 - s.m.h / 2 - 6;
		// words around the card
		const split = P(B, 3.6, 4.5, 'inout');
		lineIn(s.hi.lines[0], t, bt(1.35));
		s.hi.el.style.transform = `translate(${s.x0 - split * 260}px,${top}px)`;
		s.hi.el.style.opacity = 1 - split;
		lineIn(s.pillWrap, t, bt(1.7));
		const px = s.x0 + s.m.hi + 40 + 300 + 40;
		s.pillWrap.style.left = (px + split * 260) + 'px';
		s.pillWrap.style.top = top + 'px';
		s.pillWrap.style.opacity = (1 - split) * Number(s.pillWrap.style.opacity || 1);
		sweep(s.pill, t, bt(2.6));
		// her card: springs in inline, then opens into the diptych
		const g = clamp(P(t, 0, 1.05, 'ease'));
		const cx0 = s.x0 + s.m.hi + 40 + 150;
		const w = lerp(300, 500, split), h = lerp(400, 889, split);
		size(s.cardA, w, h, lerp(20, 24, split));
		const up = P(B, 7.5, 8.25, 'inout');
		place(s.cardA.el, { x: lerp(lerp(W / 2, cx0, g), 690, split), y: H / 2 + (1 - g) * 330 - up * 1250, s: lerp(6.6, 1, g), r: lerp(-3, 0, g) });
		const still = P(t, 2.55, 2.8);
		at(s.aVid.c, from(t, 0, 0, .75), .75);
		s.aVid.node.style.opacity = 1 - still;
		s.aImg.node.style.opacity = still;
		push(s.aImg, lerp(1.06, 1.12, P(B, 5, 8.3)), 0, 0, 50, 40);
		// her at work
		const bi = P(B, 4.1, 5.1, 'ease');
		vis(s.cardB.el, B >= 4.1);
		place(s.cardB.el, { x: lerp(2300, 1230, bi), y: H / 2 - up * 1250 });
		at(s.cardB.L.c, from(t, 4.1, .4));
	},
});

/* ================================================================
   OBSERVE CLOSELY — her eye, then the Forage captures         b7.8–20
   ================================================================ */
scene(bt(7.8), bt(20.2), {
	init(s) {
		s.dots = el('div', 'dots', s.r0);
		s.hl = headline(s.r1, [[['Observe']], [['closely.', 1]]], 132);
		s.R = mframe(s.r1, 760, 940, 24);
		s.Rm = layer(s.R, 'img:museum');
		s.Rp = layer(s.R, 'img:photography');
		s.Rs = layer(s.R, 'fo_sel');
		s.T1 = media(s.r1, 'fo_text', 520, 780, 22);
		s.T2 = media(s.r1, 'fo_mural', 520, 780, 22);
		s.sel = [marquee(s.r1), marquee(s.r1), marquee(s.r1)];
		s.int = media(s.r1, 'img:interviews', 1640, 922, 24);
		s.exp = media(s.r1, 'img:explore3', 1000, 980, 24);
	},
	dom(t, s) {
		const B = beat(t);
		vis(s.dots, B >= 16);
		// headline
		s.hl.el.style.transform = `translate(120px,${H / 2 - 138}px)`;
		s.hl.lines.forEach((l, i) => lineIn(l, t, bt(8) + i * .12, bt(11.7) + i * .05));
		vis(s.hl.el, B < 12.4);
		// the right card: museum → overlook → a hand capturing a poster
		const k = B < 10 ? 0 : B < 11 ? 1 : 2;
		only(s.R, k);
		push(s.Rm, lerp(1.1, 1, P(B, 8, 10, 'ease')), 0, 0, 50, 40);
		push(s.Rp, lerp(1, 1.1, P(B, 10, 11)), 0, 0, 50, 60);
		if (k === 2) at(s.Rs.c, from(t, 11, .3));
		const ri = P(B, 7.9, 8.9, 'ease');
		const tri = P(B, 12, 12.8, 'inout');
		const out = P(B, 15.2, 15.9, 'inout');
		size(s.R, lerp(760, 520, tri), lerp(940, 780, tri), 22);
		place(s.R.el, { x: lerp(1300, 1520, tri) + out * 900, y: H / 2 + (1 - ri) * 1100 });
		vis(s.R.el, B < 16);
		// the triptych
		const a1 = P(B, 12.2, 13, 'ease'), a2 = P(B, 12.4, 13.2, 'ease');
		const full = P(B, 15.2, 15.95, 'ease');
		vis(s.T1.el, B >= 12.2 && B < 16);
		vis(s.T2.el, B >= 12.4 && B < 16);
		place(s.T1.el, { x: lerp(-420, 400, a1) - out * 900, y: H / 2 });
		size(s.T2, lerp(520, W, full), lerp(780, H, full), lerp(22, 0, full));
		place(s.T2.el, { x: 960, y: lerp(1700, 540, a2) });
		s.T2.el.style.zIndex = 5;
		if (B >= 12.2) at(s.T1.L.c, from(t, 12.2, .6));
		if (B >= 12.4) at(s.T2.L.c, from(t, 12.4, .3));
		// capture marquees, one per beat
		marqueeAt(s.sel[0], 1520 + out * 900, 470, 380, 560, (B < 11.3 ? 0 : P(B, 11.3, 11.9)) * (1 - tri * .3) * (B < 16 ? 1 : 0));
		marqueeAt(s.sel[1], 400 - out * 900, 420, 440, 250, P(B, 13.2, 13.8) * (B < 15.2 ? 1 : 0));
		marqueeAt(s.sel[2], 960, 540, 420, 560, P(B, 13.7, 14.3) * (1 - full) * (B < 16 ? 1 : 0));
		// field work: interviews, then sketches pushed in over them
		const iOn = B >= 16 && B < 20.2;
		vis(s.int.el, iOn); vis(s.exp.el, B >= 18);
		if (iOn) {
			const ii = P(B, 16, 16.7, 'ease'), px = P(B, 16, 19);
			const back = P(B, 18, 18.8, 'inout');
			const gone = P(B, 19.8, 20.2, 'inout');
			place(s.int.el, { x: 960 - back * 520 - gone * 1400, y: H / 2, s: lerp(.9, 1, ii) * lerp(1, .82, back), op: clamp(ii * 2) * lerp(1, .6, back) });
			push(s.int.L, 1.16, lerp(110, -110, px), 0);
			const e = P(B, 18, 18.9, 'ease');
			place(s.exp.el, { x: lerp(2500, 1180, e) - gone * 1500, y: H / 2 });
			push(s.exp.L, 1.35, 0, lerp(160, -260, P(B, 18, 20.2)), 50, 20);
		}
	},
});

/* ================================================================
   QUESTION THE OBVIOUS — call, text, voice note all fail;
   the answer is yap. Then the tab chaos Notate answers.      b20–32
   ================================================================ */
scene(bt(20), bt(32.3), {
	init(s) {
		s.dots = el('div', 'dots', s.r0);
		s.hl = headline(s.r1, [[['Question']], [['the obvious.', 1]]], 132);
		s.rl = [1, 2, 3].map(i => media(s.r1, `img:rl${i}.png`, 360, 524, 20));
		s.yap = media(s.r1, 'yap_topics', 1360, 765, 24);
		s.col = media(s.r1, 'img:collage', 1500, 1000, 24);
		s.not = media(s.r1, 'img:notate01', 1540, 962, 24);
		s.brain = media(s.r1, 'img:brainstorming', 1640, 1000, 24);
	},
	dom(t, s) {
		const B = beat(t);
		vis(s.dots, B < 24.2);
		s.hl.el.style.transform = `translate(120px,${H / 2 - 138}px)`;
		s.hl.lines.forEach((l, i) => lineIn(l, t, bt(20.2) + i * .12, bt(22.6) + i * .05));
		vis(s.hl.el, B < 23.2);
		// three ways people talk now — each crossed out
		const gather = P(B, 22.6, 23.4, 'inout');
		const swallow = P(B, 23.3, 23.8, 'ease');
		s.rl.forEach((m, i) => {
			const g = clamp(P(B, 20.6 + i * .5, 21.8 + i * .5, 'spring'), 0, 1.2);
			vis(m.el, B >= 20.6 + i * .5 && B < 23.9);
			place(m.el, {
				x: lerp(1160 + i * 270, 1440, gather), y: H / 2 + 20 + (1 - Math.min(g, 1)) * 500,
				r: lerp((i - 1) * 5, 0, gather), s: g * lerp(1, .8, gather), op: clamp(g * 3) * (1 - swallow),
			});
		});
		// the answer: yap finds the topics
		const yOn = B >= 23.3 && B < 26;
		vis(s.yap.el, yOn);
		if (yOn) {
			const e = P(B, 23.3, 24.2, 'ease');
			place(s.yap.el, { x: lerp(1440, 960, e), y: H / 2, s: lerp(.28, 1, e) * kick(t, 24.2, .02), op: clamp(e * 3) });
			at(s.yap.L.c, from(t, 23.3, .2, 1.35), 1.35);
		}
		// tabs, bookmarks, screenshots — then the thought, right on the page
		vis(s.col.el, B >= 26 && B < 27);
		if (B >= 26 && B < 27) { place(s.col.el, { s: kick(t, 26, .04) }); push(s.col.L, lerp(1.02, 1.1, P(B, 26, 27))); }
		vis(s.not.el, B >= 27 && B < 28);
		if (B >= 27 && B < 28) { place(s.not.el, { s: kick(t, 27, .03) }); push(s.not.L, lerp(1, 1.5, P(B, 27, 28, 'inout')), 0, 0, 30, 70); }
		// and the person doing the questioning
		const bOn = B >= 28 && B < 32.3;
		vis(s.brain.el, bOn);
		if (bOn) {
			const aside = P(B, 31.3, 32.2, 'inout');
			size(s.brain, lerp(1640, 700, aside), lerp(1000, 900, aside), 24);
			place(s.brain.el, { x: lerp(960, 1380, aside), y: H / 2, s: kick(t, 28, .03) });
			push(s.brain.L, lerp(1.04, 1.16, P(B, 28, 32)), 0, 0, 40, 50);
		}
	},
});

/* ================================================================
   DESIGN AROUND WHAT PEOPLE ACTUALLY DO — the work, blended   b31.8–82
   ================================================================ */
scene(bt(31.8), bt(36.2), {
	init(s) {
		s.hl = headline(s.r1, [[['Design around']], [['what people', 1]], [['actually do.', 1]]], 124);
		s.R = mframe(s.r1, 700, 900, 24);
		s.layers = ['img:brainstorming', 'img:nkdoor', 'img:sbhand', 'ac_wrist'].map(n => layer(s.R, n));
	},
	dom(t, s) {
		const B = beat(t);
		s.hl.el.style.transform = `translate(120px,${H / 2 - 194}px)`;
		s.hl.lines.forEach((l, i) => lineIn(l, t, bt(32.2) + i * .12, bt(35.7) + i * .04));
		const k = B < 32.3 ? 0 : B < 33.5 ? 1 : B < 34.75 ? 2 : 3;
		only(s.R, k);
		vis(s.R.el, B >= 32.2);
		place(s.R.el, { x: 1380, y: H / 2, s: k ? kick(t, [0, 32.3, 33.5, 34.75][k], .03) : 1 });
		push(s.layers[0], 1.16, 0, 0, 40, 50);
		push(s.layers[1], lerp(1.02, 1.1, P(B, 32.3, 33.5)), 0, 0, 50, 45);
		push(s.layers[2], lerp(1.1, 1.02, P(B, 33.5, 34.75)), 0, 0, 50, 55);
		if (k === 3) at(s.layers[3].c, from(t, 34.75, .4));
		s.R.el.style.opacity = 1 - P(B, 35.8, 36.2);
	},
});

/* hands: people using the things — one per beat, full bleed */
const HANDS = [['fo_tap', 1.7], ['img:nktv', 0], ['ig_sol', 1.0], ['sb_prime', .6]];
scene(bt(36), bt(40), {
	init(s) { s.f = mframe(s.r1, W, H, 0, 'flat'); s.ls = HANDS.map(([n]) => layer(s.f, n)); },
	dom(t, s) {
		const B = beat(t), k = clamp(Math.floor(B - 36), 0, 3);
		only(s.f, k);
		place(s.f.el, {});
		const L = s.ls[k];
		if (L.c) at(L.c, from(t, 36 + k, HANDS[k][1]));
		push(L, kick(t, 36 + k, .08, 1), 0, 0, 50, 50);
	},
});

/* three products, three phones, rising on the dotted panel */
scene(bt(40), bt(44.2), {
	init(s) {
		s.dots = el('div', 'dots', s.r0);
		s.ph = ['p_ig', 'p_nk', 'p_sb'].map(n => phone(s.r1, n, 880));
	},
	dom(t, s) {
		const B = beat(t);
		s.ph.forEach((p, i) => {
			const g = clamp(P(B, 40 + i * .3, 41.5 + i * .3, 'spring'), 0, 1.15);
			const d = P(B, 40, 44);
			const out = P(B, 43.5 + i * .1, 44.2, 'inout');
			place(p.el, { x: 560 + i * 400, y: H / 2 + 20 + (1 - Math.min(g, 1)) * 1000 + [-40, 10, -70][i] * d + out * 1100, r: (i - 1) * 2 * (1 - Math.min(g, 1)) });
			at(p.c, from(t, 40, [.4, .3, .3][i]));
		});
	},
});

/* Notate at work: select an element, write the note, file it */
scene(bt(44), bt(48.2), {
	init(s) {
		s.dots = el('div', 'dots', s.r0);
		s.n1 = media(s.r1, 'no_note2', 1500, 1048, 24);
		s.n2 = media(s.r1, 'no_org2', 1500, 1048, 24);
		s.pt = pointer(s.r1);
	},
	dom(t, s) {
		const B = beat(t);
		const e = P(B, 44, 44.8, 'ease');
		const nb = P(B, 46, 46.8, 'ease');
		const out = P(B, 47.7, 48.2, 'inout');
		place(s.n1.el, { x: 960 - nb * 300, y: H / 2 + (1 - e) * 1100 - out * 1300, s: lerp(1, .9, nb), op: lerp(1, .5, nb) });
		push(s.n1.L, 1.45, lerp(260, -240, P(B, 44.3, 46.2, 'inout')), 90);
		at(s.n1.L.c, from(t, 44, .3, 1.8), 1.8);
		vis(s.n2.el, B >= 46);
		place(s.n2.el, { x: lerp(2700, 1060, nb), y: H / 2 - out * 1300 });
		push(s.n2.L, 1.35, lerp(200, -160, P(B, 46.4, 48, 'inout')), 70);
		if (B >= 46) at(s.n2.L.c, from(t, 46, .6, 1.8), 1.8);
		// a pointer doing the work
		const px = kf(B, [[44.4, 1500], [45.2, 1080, 'inout'], [46.3, 1240, 'inout'], [47.2, 1250]]);
		const py = kf(B, [[44.4, 900], [45.2, 520, 'inout'], [46.3, 610, 'inout'], [47.2, 600]]);
		const press = Math.max(P(B, 45.2, 45.35) * (1 - P(B, 45.4, 45.6)), P(B, 47.2, 47.35) * (1 - P(B, 47.4, 47.6)));
		const rip = B >= 45.25 && B < 46.1 ? P(B, 45.25, 46.1) : B >= 47.25 && B < 48 ? P(B, 47.25, 48) : -1;
		vis(s.pt.el, B >= 44.4 && B < 47.8);
		pointerAt(s.pt, px, py - out * 1300, press, rip);
	},
});

/* rings: the same round shape running through the work — yap, Instagram, Acuity, Forage */
const RINGS = [['yap_play', 1.9, 2.1, 50, 56], ['p_ig', .6, 2.2, 22, 22], ['ac_spin', .3, 1.05, 50, 50], ['fo_ring', .4, 1.15, 50, 50]];
scene(bt(48), bt(52.2), {
	init(s) {
		s.orbit = el('div', 'abs', s.r1, { width: '900px', height: '900px', borderRadius: '50%', border: '2px solid #e6e8ea' });
		s.orbit._w = s.orbit._h = 900;
		s.dotO = el('div', 'abs', s.r1, { width: '18px', height: '18px', borderRadius: '50%', background: '#1c2430' });
		s.dotO._w = s.dotO._h = 18;
		s.f = mframe(s.r1, 740, 740, 370);
		s.ls = RINGS.map(([n]) => layer(s.f, n));
	},
	dom(t, s) {
		const B = beat(t), k = clamp(Math.floor(B - 48), 0, 3);
		only(s.f, k);
		const g = clamp(P(B, 48, 48.9, 'spring'), 0, 1.1);
		const out = P(B, 51.6, 52.2, 'inout');
		place(s.f.el, { s: g * kick(t, 48 + k, .07, .8) * (1 - out), r: (B - 48) * 6 });
		place(s.orbit, { s: lerp(.6, 1, P(B, 48, 49, 'ease')) * (1 - out * .3), op: P(B, 48, 48.6) * (1 - out) });
		const a = -Math.PI / 2 + (B - 48) * Math.PI * .5;
		place(s.dotO, { x: 960 + Math.cos(a) * 450, y: 540 + Math.sin(a) * 450, op: P(B, 48.3, 48.8) * (1 - out) });
		const [, s0, sc, ox, oy] = RINGS[k];
		const L = s.ls[k];
		at(L.c, from(t, 48 + k, s0));
		push(L, sc, 0, 0, ox, oy);
		L.c.v.style.transform += ` rotate(${-(B - 48) * 6}deg)`;
	},
});

/* 3D + hardware, side by side */
scene(bt(52), bt(56.2), {
	init(s) { s.m1 = media(s.r1, 'fo_scale', 900, 560, 24); s.m2 = media(s.r1, 'ac_bands', 900, 560, 24); },
	dom(t, s) {
		const B = beat(t);
		[s.m1, s.m2].forEach((m, i) => {
			const g = clamp(P(B, 52 + i * .35, 53.3 + i * .35, 'spring'), 0, 1.1);
			const out = P(B, 55.6, 56.2, 'inout');
			place(m.el, { x: 490 + i * 940, y: H / 2 + (1 - Math.min(g, 1)) * 900 - out * 1200 });
			at(m.L.c, from(t, 52 + i * .35, i ? 0 : .3, i ? .8 : 1.3), i ? .8 : 1.3);
		});
		push(s.m1.L, 1.12, 0, 0, 50, 50);
		push(s.m2.L, 1.05, 0, 0, 50, 50);
	},
});

/* type and motion, cut on the beat */
scene(bt(56), bt(60), {
	init(s) {
		s.f = mframe(s.r1, W, H, 0, 'flat');
		s.l = { sect: layer(s.f, 'ib_sect'), tag: layer(s.f, 'sb_tag'), hero: layer(s.f, 'ib_hero') };
		s.fw = media(s.r1, 'fe_wall', 470, 836, 22);
		s.fc = media(s.r1, 'fe_city', 470, 836, 22);
	},
	dom(t, s) {
		const B = beat(t), k = clamp(Math.floor(B - 56), 0, 3);
		const two = k === 2;
		vis(s.f.el, !two); vis(s.fw.el, two); vis(s.fc.el, two);
		place(s.f.el, {});
		if (k === 0) { only(s.f, 0); at(s.l.sect.c, from(t, 56, .3)); push(s.l.sect, kick(t, 56, .08, 1)); }
		if (k === 1) { only(s.f, 1); at(s.l.tag.c, from(t, 57, 2.35, 1.2), 1.2); push(s.l.tag, kick(t, 57, .06, 1)); }
		if (k === 3) { only(s.f, 2); at(s.l.hero.c, from(t, 59, .3)); push(s.l.hero, kick(t, 59, .08, 1)); }
		if (two) {
			const a = P(B, 58, 58.6, 'ease'), b2 = P(B, 58.15, 58.75, 'ease');
			place(s.fw.el, { x: 720, y: H / 2 + (1 - a) * 1000 });
			place(s.fc.el, { x: 1200, y: H / 2 - (1 - b2) * 1000 });
			at(s.fw.L.c, from(t, 58, .3, 1.6), 1.6);
			at(s.fc.L.c, from(t, 58, 1.8, 1.6), 1.6);
		}
	},
});

/* identity work at a glance: every mark, one per eighth note */
const MARKS = [['yap_open', 3.95], ['no_logo', 3.05], ['nk_logo', 1.9], ['ac_cover', 3.05], ['ib_logo', 3.0], ['sb_morph', 4.3], ['ig_cover', 2.9], ['fo_fig', 2.9]];
scene(bt(60), bt(64), {
	init(s) { s.f = mframe(s.r1, W, H, 0, 'flat'); s.ls = MARKS.map(([n]) => layer(s.f, n)); },
	dom(t, s) {
		const B = beat(t), k = clamp(Math.floor((B - 60) * 2), 0, 7);
		only(s.f, k);
		place(s.f.el, {});
		const L = s.ls[k];
		at(L.c, from(t, 60 + k / 2, MARKS[k][1], .35), .35);
		push(L, kick(t, 60 + k / 2, .05, .5));
	},
});

/* systems out in the world: the billboard, the deck */
scene(bt(64), bt(68.2), {
	init(s) {
		s.bb = media(s.r1, 'img:billboard', W, H, 0, 'flat');
		s.deck = media(s.r1, 'img:deck', 1640, 922, 24);
	},
	dom(t, s) {
		const B = beat(t);
		const shrink = P(B, 66.3, 67.1, 'inout');
		size(s.bb, lerp(W, 1640, shrink), lerp(H, 922, shrink), lerp(0, 24, shrink));
		const slide = P(B, 67, 67.8, 'inout');
		place(s.bb.el, { x: 960 - slide * 1900, y: H / 2 });
		push(s.bb.L, lerp(1.22, 1, P(B, 64, 66.5, 'ease')), 0, 0, 30, 45);
		vis(s.deck.el, B >= 67);
		place(s.deck.el, { x: lerp(2900, 960, slide), y: H / 2 });
		push(s.deck.L, lerp(1.02, 1.08, P(B, 67, 68.2)), 0, 0, 50, 50);
	},
});

/* identity + web: the festival site, the installation */
scene(bt(68), bt(72.2), {
	init(s) {
		s.win = browser(s.r1, 'ib_menu', 1240, 780, 'ibff');
		s.fe = media(s.r1, 'fe_city', 440, 782, 22);
	},
	dom(t, s) {
		const B = beat(t);
		const a = P(B, 68, 68.9, 'ease'), b2 = clamp(P(B, 68.4, 69.6, 'spring'), 0, 1.1);
		const out = P(B, 71.6, 72.2, 'inout');
		place(s.win.el, { x: lerp(-700, 740, a) - out * 1300, y: H / 2 });
		at(s.win.L.c, from(t, 68, .3));
		place(s.fe.el, { x: 1590 + out * 900, y: H / 2 + (1 - Math.min(b2, 1)) * 1000 });
		at(s.fe.L.c, from(t, 68.4, .3, 1.5), 1.5);
	},
});

/* shipped: Notate goes live on the Chrome Web Store */
scene(bt(72), bt(76.2), {
	init(s) {
		s.win = browser(s.r1, 'img:store', 1560, 975, 'chromewebstore.google.com');
		s.pt = pointer(s.r1);
	},
	dom(t, s) {
		const B = beat(t);
		const a = P(B, 72, 72.9, 'ease'), out = P(B, 75.6, 76.2, 'inout');
		const y = H / 2 + (1 - a) * 1100 - out * 1300;
		place(s.win.el, { y, s: lerp(1, 1.04, P(B, 72.9, 75.6)) });
		const bx = 1453, by = 222 + (y - H / 2);
		const px = kf(B, [[72.8, 1500], [74.2, bx, 'inout']]), py = kf(B, [[72.8, 960], [74.2, by + 26, 'inout']]);
		const press = P(B, 74.4, 74.55) * (1 - P(B, 74.6, 74.8));
		vis(s.pt.el, B >= 72.8 && B < 75.7);
		pointerAt(s.pt, px, B < 74.2 ? py : by + 26, press, B >= 74.45 && B < 75.3 ? P(B, 74.45, 75.3) : -1);
	},
});

/* for friends: yap's people, bubbling up */
scene(bt(76), bt(82.2), {
	init(s) { s.f = media(s.r1, 'yap_open', W, H, 0, 'flat'); },
	dom(t, s) {
		const B = beat(t);
		place(s.f.el, { y: H / 2 - P(B, 81.4, 82.2, 'inout') * 1100 });
		at(s.f.L.c, from(t, 76, 4.7, 1.05), 1.05);
		push(s.f.L, lerp(1.08, 1, P(B, 76, 78, 'ease')));
	},
});

/* ================================================================
   THE BODY OF WORK — the camera pulls back over everything     b81.6–92
   ================================================================ */
const WALL = [
	'yap_topics', 'no_org2', 'ig_sol', 'sb_cards',
	'nk_room', 'ac_wrist', 'img:billboard', 'fo_mural',
	'ib_hero', 'img:interviews', 'fo_scale', 'yap_play',
];
const WALL_FROM = { yap_topics: 1.6, no_org2: 1.5, ig_sol: 1.2, sb_cards: .5, nk_room: .5, ac_wrist: .5, fo_mural: .5, ib_hero: .5, fo_scale: .5, yap_play: 1.9 };
scene(bt(81.6), bt(92.2), {
	init(s) {
		s.plane = el('div', 'fill', s.r1, { transformOrigin: '50% 50%' });
		s.cards = WALL.map(n => media(s.plane, n, 440, 275, 16));
	},
	dom(t, s) {
		const B = beat(t);
		const pull = P(B, 81.6, 85, 'ease');
		const tilt = P(B, 83, 86, 'inout');
		const leave = P(B, 90.4, 92.2, 'inout');
		s.r1.style.perspective = '2400px';
		s.plane.style.transform = `translateY(${lerp(40, -60, P(B, 84, 90)) - leave * 1600}px) rotateX(${10 * tilt}deg) rotateZ(${-3 * tilt}deg) scale(${lerp(4.25, 1, pull)})`;
		s.cards.forEach((m, i) => {
			const c = i % 4, r = (i / 4) | 0;
			const hov = B >= 86 + ((c + r) % 4) ? Math.exp(-(t - bt(86 + ((c + r) % 4))) * 5) : 0;
			place(m.el, { x: W / 2 + (c - 1.5) * 468, y: H / 2 + (r - 1) * 303, s: 1 + .03 * hov });
			if (m.L.c) at(m.L.c, (WALL_FROM[WALL[i]] || 0) + Math.max(0, t - bt(81.6)));
			else push(m.L, 1.08);
		});
	},
});

/* ================================================================
   PEOPLE — the team, the fellowship, graduation, her        b91.6–100.4
   ================================================================ */
scene(bt(91.6), bt(100.4), {
	init(s) {
		s.team = media(s.r1, 'img:team', 500, 889, 24);
		s.fel = media(s.r1, 'img:fellowship', 500, 889, 24);
		s.grad = media(s.r1, 'me_grad', 560, 995, 24);
		s.hi = media(s.r1, 'me_hi', 560, 995, 24);
	},
	dom(t, s) {
		const B = beat(t);
		const a = P(B, 91.6, 92.5, 'ease'), b2 = P(B, 91.85, 92.75, 'ease');
		const up = P(B, 94.8, 95.5, 'inout');
		place(s.team.el, { x: 690, y: H / 2 + (1 - a) * 1200 - up * 1250 });
		place(s.fel.el, { x: 1230, y: H / 2 + (1 - b2) * 1200 - up * 1250 });
		push(s.team.L, lerp(1.1, 1.02, P(B, 91.6, 95)), 0, 0, 50, 40);
		push(s.fel.L, lerp(1.02, 1.1, P(B, 91.6, 95)), 0, 0, 50, 45);
		const g = P(B, 94.9, 95.7, 'ease'), gOut = P(B, 97.4, 98, 'inout');
		vis(s.grad.el, B >= 94.9 && B < 98.1);
		place(s.grad.el, { y: H / 2 + (1 - g) * 1200 - gOut * 1250 });
		at(s.grad.L.c, from(t, 94.9, .1, 1.1), 1.1);
		// her again — this card becomes the portrait in the sign-off
		const h = P(B, 97.5, 98.3, 'ease');
		vis(s.hi.el, B >= 97.5);
		const move = P(B, 99.4, 100.4, 'inout');
		size(s.hi, lerp(560, 560, move), lerp(995, 700, move), 24);
		place(s.hi.el, { x: lerp(960, 1420, move), y: lerp(H / 2 + (1 - h) * 1200, 500, move) });
		at(s.hi.L.c, from(t, 97.5, 0, .8), .8);
	},
});

/* ================================================================
   SIGN-OFF — the footer: "Let's make something worth using."  b100–120
   ================================================================ */
scene(bt(100), DUR + .01, {
	init(s) {
		s.hl = headline(s.r1, [[['Let’s make']], [['something']], [['worth using.', 1]]], 124);
		s.pic = mframe(s.r1, 560, 700, 24);
		s.picV = layer(s.pic, 'me_hi');
		s.picI = layer(s.pic, 'img:me');
		s.name = el('div', 'meta', s.r1, { fontSize: '44px', fontWeight: 500, letterSpacing: '-0.02em', color: 'var(--clr-text)' }, 'Sooim Kang');
		s.role = el('div', 'meta', s.r1, { fontSize: '30px', fontWeight: 500, letterSpacing: '-0.01em', color: 'var(--clr-muted)' }, 'Product designer & builder');
		s.url = el('div', 'meta', s.r1, { fontSize: '30px', fontWeight: 500, letterSpacing: '-0.01em', color: 'var(--clr-muted)' }, 'sooimkang.com');
	},
	dom(t, s) {
		const B = beat(t);
		s.hl.el.style.transform = `translate(120px,${226}px)`;
		s.hl.lines.forEach((l, i) => lineIn(l, t, bt(100.2) + i * .14));
		vis(s.pic.el, B >= 100.4);
		place(s.pic.el, { x: 1420, y: 500 });
		const still = P(B, 100.4, 101.2);
		at(s.picV.c, from(t, 97.5, 0, .8), .8);
		s.picV.node.style.opacity = 1 - still;
		s.picI.node.style.opacity = still;
		push(s.picI, lerp(1.06, 1.12, P(B, 100, 120)), 0, 0, 50, 42);
		[s.name, s.role, s.url].forEach((e, i) => {
			const y = [722, 780, 822][i];
			e.style.left = '124px'; e.style.top = y + 'px';
			lineIn(e, t, bt(103) + i * .12);
		});
	},
});
