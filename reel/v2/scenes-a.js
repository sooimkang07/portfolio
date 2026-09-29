/* ============================================================
   scenes A — hook, intro, 01 easing, 02 typography   (0 – 18.3s)
   The orange dot is the protagonist: it is the full stop of the
   hook line and travels through every chapter.
   ============================================================ */

const DOT = { x: 0, y: 0, r: 30 };            // where the hook leaves the dot
const G0 = { x: 460, y: 800 }, GW = 1000, GH = 500;   // easing graph frame

/* ================================================================
   HOOK — "I DESIGN / HOW / THINGS / BEHAVE." on eighth notes,
   each stab a colour flip.                              0 – 1.875
   ================================================================ */
scene(0, bt(4), {
	init(s) {
		const g = CV.fx;
		setFont(g, { size: 330 });
		s.cap = g.measureText('H').actualBoundingBoxAscent;
		s.gl = glyphs(g, 'BEHAVE');
		s.r = 34;
		const gap = 26, total = s.gl.width + gap + s.r * 2;
		s.x0 = W / 2 - total / 2;
		s.base = H / 2 + s.cap / 2;
		DOT.x = s.x0 + s.gl.width + gap + s.r;
		DOT.y = s.base - s.r;
		DOT.r = s.r;
	},
	draw(t, s) {
		HUD.hidden = true;
		const g = CV.fx;
		const k = t < bt(.5) ? 0 : t < bt(1) ? 1 : t < bt(1.5) ? 2 : 3;
		g.textAlign = 'center'; g.textBaseline = 'alphabetic';

		if (k === 0) {
			fillBG(COL.ink);
			const p = P(t, 0, .2, 'oE');
			setFont(g, { size: 250, ls: lerp(.45, -.02, p) * 250 });
			const cap = 250 * .7;
			g.save(); g.translate(W / 2, H / 2); g.scale(lerp(1.14, 1, p), lerp(1.14, 1, p));
			g.fillStyle = COL.white; g.fillText('I DESIGN', 0, cap / 2);
			g.restore();
		}
		if (k === 1) {
			fillBG(COL.orange);
			const t0 = bt(.5), p = P(t, t0, t0 + .16, 'oE');
			setFont(g, { size: 560, ls: -.045 * 560 });
			const cap = 560 * .7, dy = (1 - p) * 180;
			for (let j = 3; j >= 0; j--) {            // vertical smear on entry
				g.globalAlpha = j ? .22 * (1 - p) / j : 1;
				g.fillStyle = COL.ink;
				g.fillText('HOW', W / 2, H / 2 + cap / 2 + dy + j * dy * .45);
			}
			g.globalAlpha = 1;
		}
		if (k === 2) {
			lightBG(COL.cream);
			const t0 = bt(1), p = P(t, t0, t0 + .22, 'oE');
			setFont(g, { fam: 'serif', w: 400, style: 'italic', size: 500, ls: -.01 * 500 });
			g.save(); g.translate(W / 2, H / 2 + 120);
			g.scale(lerp(1.3, 1, p), lerp(1.3, 1, p)); g.rotate(lerp(-.06, 0, p));
			g.fillStyle = COL.ink; g.fillText('things', 0, 40);
			g.restore();
		}
		if (k === 3) {
			fillBG(COL.ink);
			setFont(g, { size: 330 });
			g.textAlign = 'left';
			const falling = t >= bt(3);
			s.gl.forEach((c, i) => {
				const a = bt(1.5) + i * .026;
				const p = P(t, a, a + .3, 'oE');
				let x = s.x0 + c.x, y = s.base + (1 - p) * 250, rot = 0, al = clamp((t - a) / .05);
				if (falling) {
					const f = bt(3) + i * .032, dt = Math.max(0, t - f);
					y += .5 * 9000 * dt * dt;
					rot = (hash(i, 4) - .5) * 4 * dt;
					al *= 1 - P(t, f + .12, f + .32);
				}
				g.save();
				if (!falling) { g.beginPath(); g.rect(0, 0, W, s.base + 14); g.clip(); }
				g.globalAlpha = al;
				g.translate(x + c.w / 2, y - s.cap / 2); g.rotate(rot);
				g.fillStyle = COL.white; g.fillText(c.ch, -c.w / 2, s.cap / 2);
				g.restore();
			});
			// the full stop: drops in on beat 2 and squashes
			const land = bt(2);
			if (t >= land - .16) {
				let y = DOT.y, sx = 1, sy = 1;
				if (t < land) {
					const p = P(t, land - .16, land, 'i2');
					y = lerp(-80, DOT.y, p); sx = .72; sy = 1.45;
				} else {
					const q = t - land;
					sy = 1 - .42 * Math.exp(-q * 14) * Math.cos(q * 30);
					sx = 2 - sy;
				}
				blob(g, DOT.x, y + s.r * (1 - sy), s.r, sx, sy, 0, COL.orange, 40);
			}
		}
	},
});

/* ================================================================
   INTRO — the dot bounces home, stamping the title on each
   impact. Squash, stretch, arcs, timing.            1.875 – 3.75
   ================================================================ */
const INTRO = (() => {
	const I = [bt(5), bt(6), bt(7), bt(7.5)];
	const GY = 800;
	const arcs = [
		// [t0, t1, x0, y0, x1, y1, apex]
		[bt(4.2), I[0], null, null, 1250, GY, 330],
		[I[0], I[1], 1250, GY, 900, GY, 560],
		[I[1], I[2], 900, GY, 620, GY, 665],
		[I[2], I[3], 620, GY, 505, GY, 748],
	];
	function pos(t) {
		if (t < arcs[0][0]) return { x: DOT.x, y: DOT.y };
		for (const [t0, t1, xa, ya, xb, yb, ap] of arcs) {
			if (t <= t1) {
				const x0 = xa ?? DOT.x, y0 = ya ?? DOT.y;
				const p = (t - t0) / (t1 - t0);
				const yc = 2 * ap - (y0 + yb) / 2;
				return { x: lerp(x0, xb, p), y: (1 - p) * (1 - p) * y0 + 2 * p * (1 - p) * yc + p * p * yb };
			}
		}
		const p = P(t, I[3], bt(8), 'o3');
		return { x: lerp(505, G0.x, p), y: GY };
	}
	return { I, GY, pos };
})();

scene(bt(4), bt(8), {
	init(s) {
		const g = CV.fx;
		setFont(g, { size: 168, ls: -.03 * 168 });
		s.name = glyphs(g, 'Sooim Kang');
	},
	draw(t, s) {
		const g = CV.fx;
		darkBG(.8);
		const { I, GY, pos } = INTRO;
		const r = lerp(DOT.r, 22, P(t, bt(4.2), bt(6), 'io3'));
		const out = P(t, bt(7.5), bt(8), 'iE');

		// ground rule with ticks, drawn toward the dot's direction of travel
		const gp = P(t, bt(4.15), bt(4.9), 'oE') * (1 - out);
		const gx1 = 1480, gx0 = lerp(gx1, 360, gp);
		line(g, gx0, GY + 22, gx1, GY + 22, 'rgba(242,239,233,.28)', 1);
		for (let x = 380; x <= 1480; x += 40) if (x >= gx0) line(g, x, GY + 22, x, GY + 28, 'rgba(242,239,233,.2)', 1);

		// traced arc (dotted) + onion skins
		if (t > bt(4.2)) {
			g.save(); g.setLineDash([2, 9]); g.strokeStyle = `rgba(242,239,233,${.22 * (1 - out)})`; g.lineWidth = 1.5;
			g.beginPath();
			for (let u = bt(4.2); u <= t; u += 1 / 90) { const p = pos(u); u === bt(4.2) ? g.moveTo(p.x, p.y) : g.lineTo(p.x, p.y); }
			g.stroke(); g.restore();
			for (let k = 6; k >= 1; k--) {
				const u = t - k * .034;
				if (u < bt(4.2)) continue;
				const p = pos(u);
				g.strokeStyle = `rgba(242,239,233,${.34 * (1 - k / 7) * (1 - out)})`; g.lineWidth = 1.2;
				g.beginPath(); g.arc(p.x, p.y, r, 0, TAU); g.stroke();
			}
		}

		// impact annotations
		const notes = [[I[0], 1250, 'squash'], [I[1], 900, 'stretch → squash'], [I[2], 620, 'arc · timing']];
		notes.forEach(([ti, x, txt], i) => {
			const a = P(t, ti, ti + .12) * (1 - P(t, ti + .9, ti + 1.1)) * (1 - out);
			if (a <= 0) return;
			g.globalAlpha = a;
			line(g, x, GY + 34, x, GY + 52, 'rgba(242,239,233,.5)');
			label(g, `${String(i + 1).padStart(2, '0')} ${txt}`, x, GY + 74, 'rgba(242,239,233,.6)', { size: 13, align: 'center' });
			g.globalAlpha = 1;
		});

		// title, one line per impact
		g.save();
		g.translate(0, -out * 160); g.globalAlpha = 1 - out;
		g.textAlign = 'left';
		setFont(g, { size: 168, ls: -.03 * 168 });
		const nx = W / 2 - s.name.width / 2, nb = 420;
		g.save(); g.beginPath(); g.rect(0, 0, W, nb + 30); g.clip();
		s.name.forEach((c, i) => {
			const a = I[0] + i * .018, p = P(t, a, a + .45, 'oE');
			g.fillStyle = COL.white; g.fillText(c.ch, nx + c.x, nb + (1 - p) * 190);
		});
		g.restore();
		g.textAlign = 'center';
		g.save(); g.beginPath(); g.rect(0, 440, W, 110); g.clip();
		setFont(g, { fam: 'serif', w: 400, style: 'italic', size: 84 });
		g.fillStyle = 'rgba(242,239,233,.88)';
		g.fillText('Product Designer', W / 2, 522 + (1 - P(t, I[1], I[1] + .4, 'oE')) * 100);
		g.restore();
		if (t >= I[2]) label(g, 'Showreel 2026  ·  selected work', W / 2, 590 + (1 - P(t, I[2], I[2] + .3, 'oE')) * 16,
			`rgba(242,239,233,${.5 * P(t, I[2], I[2] + .2)})`, { size: 15, align: 'center' });
		g.restore();

		// the dot — anticipation, stretch along velocity, squash on impact
		const p = pos(t), q = pos(t + 1 / 240), q0 = pos(t - 1 / 240);
		const vx = (q.x - q0.x) * 120, vy = (q.y - q0.y) * 120, sp = Math.hypot(vx, vy);
		let sx = 1 + clamp(sp / 4200, 0, .42), sy = 1 / sx, ang = Math.atan2(vy, vx);
		let lift = 0;
		if (t < bt(4.2)) {                                  // anticipation before the leap
			const a = P(t, bt(4), bt(4.2), 'o2');
			sy = 1 - .3 * Math.sin(a * Math.PI); sx = 2 - sy; ang = 0; lift = r * (1 - sy);
		}
		I.forEach(ti => {
			const d = t - ti;
			if (d >= 0 && d < .18) {
				const k = Math.exp(-d * 20);
				sx = 1 + .55 * k; sy = 1 - .42 * k; ang = 0; lift = r * (1 - sy);
			}
		});
		blob(g, p.x, p.y + lift, r, sx, sy, ang, COL.orange, 36);
	},
});

/* ================================================================
   01 · EASING — graph editor, six personalities, and the word
   going from linear to alive.                        3.75 – 11.25
   ================================================================ */
const CURVE = t => {
	const m = P(t, bt(9.5), bt(10.5), 'ioE');
	const p1 = mix([1 / 3, 1 / 3], [.76, 0], m), p2 = mix([2 / 3, 2 / 3], [.24, 1], m);
	return { p1, p2, f: bezier(p1[0], p1[1], p2[0], p2[1]) };
};
const gx = u => G0.x + GW * u, gy = v => G0.y - GH * v;

/* 1A · graph editor */
scene(bt(8), bt(12.5), {
	draw(t, s) {
		const g = CV.fx;
		darkBG(.9, 960, 560);
		const out = P(t, bt(11.8), bt(12.4), 'io3');
		g.globalAlpha = 1 - out;
		const W1 = 'rgba(242,239,233,';

		// grid + axes
		const gridA = P(t, bt(8.4), bt(9));
		for (let k = 1; k <= 10; k++) line(g, gx(k / 10), gy(0), gx(k / 10), gy(1.04), `${W1}${.07 * gridA})`, 1, [2, 6]);
		[.5, 1].forEach(v => line(g, gx(0), gy(v), gx(1.04), gy(v), `${W1}${.07 * gridA})`, 1, [2, 6]));
		const ay = P(t, bt(8), bt(8.7), 'oE'), ax = P(t, bt(8.15), bt(8.85), 'oE');
		line(g, gx(0), gy(-.04), gx(0), lerp(gy(-.04), gy(1.1), ay), `${W1}.45)`, 1.5);
		line(g, gx(-.02), gy(0), lerp(gx(-.02), gx(1.06), ax), gy(0), `${W1}.45)`, 1.5);
		g.globalAlpha = (1 - out) * gridA;
		label(g, 'value', gx(0) + 12, gy(1.1) + 4, `${W1}.5)`, { size: 13 });
		label(g, 'time', gx(1.06), gy(0) + 28, `${W1}.5)`, { size: 13, align: 'right' });
		g.globalAlpha = 1 - out;

		// keyframes + curve
		const { p1, p2, f } = CURVE(t);
		const P0 = [gx(0), gy(0)], P3 = [gx(1), gy(1)];
		const H1 = [gx(p1[0]), gy(p1[1])], H2 = [gx(p2[0]), gy(p2[1])];
		const draw = P(t, bt(8.8), bt(9.5), 'io3');
		if (draw > 0) {
			g.save(); g.strokeStyle = COL.white; g.lineWidth = 3; g.lineCap = 'round';
			g.beginPath();
			const N = 90;
			for (let i = 0; i <= N * draw; i++) {
				const u = i / N, a = 1 - u;
				const x = a * a * a * P0[0] + 3 * a * a * u * H1[0] + 3 * a * u * u * H2[0] + u * u * u * P3[0];
				const y = a * a * a * P0[1] + 3 * a * a * u * H1[1] + 3 * a * u * u * H2[1] + u * u * u * P3[1];
				i ? g.lineTo(x, y) : g.moveTo(x, y);
			}
			g.stroke(); g.restore();
		}
		const hA = P(t, bt(9.4), bt(9.7));
		if (hA > 0) {
			g.globalAlpha = (1 - out) * hA;
			line(g, P0[0], P0[1], H1[0], H1[1], `${W1}.5)`, 1);
			line(g, P3[0], P3[1], H2[0], H2[1], `${W1}.5)`, 1);
			[H1, H2].forEach(h => { g.strokeStyle = COL.white; g.lineWidth = 1.5; g.beginPath(); g.arc(h[0], h[1], 7, 0, TAU); g.stroke(); });
			g.globalAlpha = 1 - out;
		}
		diamond(g, P0[0], P0[1], 17 * P(t, bt(8.1), bt(8.5), 'oB2'), COL.ink, COL.white, 2);
		diamond(g, P3[0], P3[1], 17 * P(t, bt(8.6), bt(9), 'oB2'), COL.ink, COL.white, 2);
		const fmt = v => v.toFixed(2);
		if (draw > 0) label(g, `cubic-bezier(${fmt(p1[0])}, ${fmt(p1[1])}, ${fmt(p2[0])}, ${fmt(p2[1])})`,
			gx(.5), gy(0) + 52, `${W1}${.7 * P(t, bt(9), bt(9.3))})`, { size: 16, align: 'center', ls: .5 });

		// playhead sweep + spacing chart
		const s0 = bt(10.5), s1 = bt(11.85);
		const p = P(t, s0, s1);
		const ty = gy(0) + 118;
		const trackA = P(t, bt(10.2), bt(10.6));
		if (trackA > 0) {
			g.globalAlpha = (1 - out) * trackA;
			line(g, gx(0), ty, gx(1), ty, `${W1}.2)`, 1);
			label(g, 'spacing', gx(0) - 18, ty + 5, `${W1}.45)`, { size: 13, align: 'right' });
			const N = 24;
			for (let i = 0; i <= N; i++) {
				if (i / N > p + 1e-6) break;
				const x = gx(f(i / N));
				line(g, x, ty - 9, x, ty + 9, `${W1}.65)`, 1.2);
			}
			dot(g, gx(f(p)), ty, 7, COL.white);
			g.globalAlpha = 1 - out;
		}
		if (t >= s0) line(g, gx(p), gy(0), gx(p), gy(1.02), rgba(COL.orange, .55), 1);

		// the dot: arrives at the first keyframe, then rides the curve
		let dx = G0.x, dy = G0.y, r = 13;
		if (t < bt(8.4)) { r = lerp(22, 13, P(t, bt(8), bt(8.4), 'o3')); }
		if (t >= s0) { dx = gx(p); dy = gy(f(p)); }
		g.globalAlpha = 1;
		if (t < bt(12)) dot(g, lerp(dx, gx(1), out), dy, r, COL.orange, 30);
		else s.hand = { x: dx, y: dy };
		if (t >= bt(11.85)) {
			const q = P(t, bt(11.85), bt(12.5), 'ioE');
			dot(g, lerp(gx(1), 1560, q), lerp(gy(1), 800, q), 13, COL.orange, 30);
		}
	},
});

/* 1B · one move, six personalities */
const SIX = [
	['linear', E.lin],
	['ease in', E.i3],
	['ease out', E.o3],
	['ease in-out', E.io4],
	['overshoot', E.oB2],
	['spring', p => spring(p * .9375, 1.5, .26)],
];
const ROW = i => 300 + i * 100;
const TX0 = 720, TX1 = 1560;
scene(bt(12), bt(16), {
	draw(t, s) {
		const g = CV.fx;
		darkBG(.9, 960, 560);
		const W1 = 'rgba(242,239,233,';
		const m0 = bt(12.5), m1 = bt(14.5), conv = bt(15);
		const fade = 1 - P(t, conv, conv + .3, 'o2');

		// title
		g.save(); g.beginPath(); g.rect(0, 150, W, 90); g.clip();
		setFont(g, { fam: 'serif', w: 400, style: 'italic', size: 62 });
		g.textAlign = 'left'; g.fillStyle = `${W1}${.95 * fade})`;
		g.fillText('One move, six personalities.', 300, 222 + (1 - P(t, bt(12.1), bt(12.9), 'oE')) * 90);
		g.restore();

		SIX.forEach(([name, fn], i) => {
			const y = ROW(i), a = bt(12) + i * .045;
			const on = P(t, a, a + .5, 'oE');
			g.globalAlpha = fade;
			label(g, name, 300, y + 5, `${W1}${.55 * on})`, { size: 14 });
			// glyph: the curve itself
			g.strokeStyle = `${W1}${.18 * on})`; g.lineWidth = 1; g.strokeRect(560, y - 22, 44, 44);
			g.strokeStyle = i === 5 ? rgba(COL.orange, on) : `${W1}${.8 * on})`; g.lineWidth = 1.5;
			g.beginPath();
			for (let k = 0; k <= 40; k++) { const u = k / 40, v = fn(u); const X = 560 + 44 * u, Y = y + 22 - 44 * v * .8 - 4; k ? g.lineTo(X, Y) : g.moveTo(X, Y); }
			g.stroke();
			// track
			line(g, TX0, y, lerp(TX0, TX1, on), y, `${W1}.16)`, 1);
			line(g, TX0, y - 8, TX0, y + 8, `${W1}${.4 * on})`, 1);
			line(g, TX1, y - 8, TX1, y + 8, `${W1}${.4 * on})`, 1);
			if (i === 0) {
				label(g, 'a', TX0, y - 22, `${W1}${.45 * on})`, { size: 13, align: 'center' });
				label(g, 'b', TX1, y - 22, `${W1}${.45 * on})`, { size: 13, align: 'center' });
			}
			g.globalAlpha = 1;
		});

		// dots: same distance, same duration, different feeling
		const posAt = (i, u) => {
			if (u < m0) return TX0;
			const p = clamp((u - m0) / (m1 - m0));
			const v = i === 5 ? spring(u - m0, 1.5, .26) : SIX[i][1](p);
			return lerp(TX0, TX1, v);
		};
		SIX.forEach((_, i) => {
			const y = ROW(i), a = bt(12) + i * .045;
			const on = P(t, a + .15, a + .45, 'oB2');
			const x = posAt(i, Math.min(t, conv));
			if (t < conv) {
				for (let k = 7; k >= 1; k--) {        // spacing ghosts
					const u = t - k / 30;
					if (u < m0) continue;
					g.strokeStyle = `${W1}${.28 * (1 - k / 8)})`; g.lineWidth = 1;
					g.beginPath(); g.arc(posAt(i, u), y, 11, 0, TAU); g.stroke();
				}
			}
			const c = P(t, conv, bt(16), 'iE');
			const X = lerp(x, W / 2, c), Y = lerp(y, H / 2, c);
			if (i === 5) dot(g, X, Y, 13 * on, COL.orange, 30);
			else dot(g, X, Y, 11 * on * (1 - c * .6), `${W1}${1 - c * .4})`);
		});
		// arriving from the graph: the orange dot drops into the spring lane
		if (t < bt(12.6)) {
			const q = P(t, bt(12), bt(12.6), 'ioE');
			dot(g, lerp(1560, TX0, q), lerp(800, ROW(5), q), 13, COL.orange, 30);
		}
	},
});

/* 1C/1D · linear → eased → alive. then the dot swallows the frame */
scene(bt(16), bt(24), {
	init(s) {
		const g = CV.fx;
		setFont(g, { fam: 'mono', w: 500, size: 150 }); s.lin = glyphs(g, 'linear');
		setFont(g, { w: 600, size: 190, ls: -.02 * 190 }); s.eas = glyphs(g, 'eased');
		setFont(g, { fam: 'serif', w: 400, style: 'italic', size: 260 }); s.alv = glyphs(g, 'alive');
	},
	draw(t, s) {
		const g = CV.fx;
		darkBG(.9);
		g.textAlign = 'left';
		const b16 = bt(16), b18 = bt(18), b19 = bt(19), b20 = bt(20);
		const base = 610;
		let dx = W / 2, dy = H / 2, r = 16;

		if (t < b18) {                                   // linear: constant, mechanical
			setFont(g, { fam: 'mono', w: 500, size: 150 });
			const x0 = W / 2 - s.lin.width / 2 - 30;
			let n = 0;
			s.lin.forEach((c, i) => {
				if (t < b16 + .06 + i * .085) return;
				n = i + 1;
				g.fillStyle = COL.white; g.fillText(c.ch, x0 + c.x, base);
			});
			const endX = x0 + (n ? s.lin[n - 1].x + s.lin[n - 1].w : 0) + 34;
			dx = t < b16 + .06 ? lerp(W / 2, x0 + 34, P(t, b16, b16 + .06)) : endX; dy = base - 52; r = 14;
			label(g, 'linear()', W / 2, base + 120, 'rgba(242,239,233,.4)', { size: 14, align: 'center' });
		} else if (t < b19) {                             // eased: expo out, staggered
			setFont(g, { w: 600, size: 190, ls: -.02 * 190 });
			const x0 = W / 2 - s.eas.width / 2 - 30;
			s.eas.forEach((c, i) => {
				const a = b18 + i * .032, p = P(t, a, a + .38, 'oE');
				g.globalAlpha = clamp((t - a) / .06);
				g.fillStyle = COL.white; g.fillText(c.ch, x0 + c.x, base + (1 - p) * 110);
			});
			g.globalAlpha = 1;
			dx = lerp(x0 + 34, x0 + s.eas.width + 34, P(t, b18, b18 + .4, 'oE')); dy = base - 66; r = 15;
			label(g, 'cubic-bezier(0.16, 1, 0.3, 1)', W / 2, base + 120, 'rgba(242,239,233,.4)', { size: 14, align: 'center' });
		} else {                                          // alive: spring, rotation, a full stop that lands
			setFont(g, { fam: 'serif', w: 400, style: 'italic', size: 260 });
			const x0 = W / 2 - s.alv.width / 2 - 26;
			const up = P(t, bt(20.1), bt(21), 'io3');
			s.alv.forEach((c, i) => {
				const a = b19 + i * .036;
				const k = spring(t - a, 2.1, .32);
				const lift = P(t, bt(20.1) + i * .03, bt(20.8) + i * .03, 'i3');
				g.save();
				g.globalAlpha = clamp((t - a) / .05) * (1 - lift);
				g.translate(x0 + c.x + c.w / 2, base - 70 - lift * 140);
				g.rotate((1 - k) * (hash(i, 2) - .5) * .9);
				g.scale(Math.max(.01, k), Math.max(.01, k));
				g.fillStyle = COL.white; g.fillText(c.ch, -c.w / 2, 70);
				g.restore();
			});
			if (t < bt(20.2)) label(g, 'spring(stiffness 180, damping 12)', W / 2, base + 120,
				`rgba(242,239,233,${.4 * (1 - P(t, bt(20), bt(20.2)))})`, { size: 14, align: 'center' });
			const px = x0 + s.alv.width + 30, py = base - 16;
			const land = bt(19.5);
			if (t < land) {
				const q = P(t, b19, land, 'i2');
				dx = lerp(x0 + s.eas.width * .0 + W / 2 + s.eas.width / 2 - 20, px, q);
				dy = lerp(base - 66, py, q) - Math.sin(q * Math.PI) * 180; r = 16;
			} else { dx = px; dy = py; r = 16; }
			// after landing: centre, pulse on beats, anticipate, swallow the frame
			const c = P(t, bt(20.3), bt(21), 'ioE');
			dx = lerp(dx, W / 2, c); dy = lerp(dy, H / 2, c);
			const beats = [bt(21), bt(22)];
			r = 16 * (1 + .45 * pulse(t, beats, 10));
			beats.forEach(tb => {
				const q = P(t, tb, tb + .7, 'oE');
				if (t < tb || q >= 1) return;
				g.strokeStyle = `rgba(242,239,233,${.5 * (1 - q)})`; g.lineWidth = 1.5;
				g.beginPath(); g.arc(dx, dy, 18 + q * 520, 0, TAU); g.stroke();
			});
			const ant = P(t, bt(22.5), bt(23), 'i2');
			r = lerp(r, 7, ant);
			const boom = P(t, bt(23), bt(24), 'iE');
			r = lerp(r, 1300, boom);
			if (t >= bt(23)) {
				const q = P(t, bt(23), bt(23) + .5, 'oE');
				g.strokeStyle = `rgba(242,239,233,${.6 * (1 - q)})`; g.lineWidth = 2;
				g.beginPath(); g.arc(dx, dy, 20 + q * 900, 0, TAU); g.stroke();
			}
			if (t >= land && t < land + .2) {
				const q = t - land, sy = 1 - .4 * Math.exp(-q * 16), sx = 2 - sy;
				blob(g, dx, dy + r * (1 - sy), r, sx, sy, 0, COL.orange, 40);
				return;
			}
		}
		dot(g, dx, dy, r, COL.orange, 40);
	},
});

/* ================================================================
   02 · TYPOGRAPHY                                   11.25 – 18.28
   ================================================================ */

/* 2A · the detail lives in the in-between (orange) */
scene(bt(24), bt(28), {
	init(s) {
		const g = CV.fx;
		s.size = 150;
		setFont(g, { size: s.size, ls: -.035 * s.size });
		const lines = [
			[['THE', 24], ['DETAIL', 24.5]],
			[['LIVES', 25], ['IN', 25.5]],
			[['THE', 26], ['IN-', 26.5], ['BETWEEN', 27]],
		];
		s.words = [];
		lines.forEach((ws, li) => {
			let str = '';
			ws.forEach(([w, b], wi) => {
				const pre = str + (wi && !str.endsWith('-') ? ' ' : '');
				const x = g.measureText(pre).width;
				str = pre + w;
				s.words.push({ w, t: bt(b), x: 150 + x, y: 370 + li * 190, width: g.measureText(w).width, li });
			});
		});
	},
	draw(t, s) {
		HUD.dark = true;
		const g = CV.fx;
		fillBG(COL.orange);
		setFont(g, { size: s.size, ls: -.035 * s.size });
		g.textAlign = 'left';
		const tw0 = bt(27) + .1, tw1 = bt(27.75);
		s.words.forEach(w => {
			if (t < w.t) return;
			const p = P(t, w.t, w.t + .34, 'oE');
			let x = w.x;
			const tween = w.w === 'BETWEEN';
			if (tween) {
				const shift = 300 * P(t, tw0, tw1, 'ioE');
				// in-betweens: ghosts at eased spacing
				for (let k = 1; k < 7; k++) {
					const u = k / 7, gxk = w.x + 300 * E.ioE(u);
					const seen = P(t, lerp(tw0, tw1, u), lerp(tw0, tw1, u) + .05);
					if (seen <= 0) continue;
					g.strokeStyle = `rgba(12,12,13,${.32 * seen})`; g.lineWidth = 1.5;
					g.strokeText(w.w, gxk, w.y);
				}
				x += shift;
				const ka = P(t, tw0 - .1, tw0 + .1);
				if (ka > 0) {
					g.globalAlpha = ka;
					line(g, w.x + 8, w.y + 44, w.x + 308, w.y + 44, 'rgba(12,12,13,.45)', 1.2, [3, 6]);
					diamond(g, w.x + 8, w.y + 44, 13, COL.ink);
					diamond(g, w.x + 308, w.y + 44, 13, t > tw1 ? COL.ink : null, COL.ink, 1.5);
					label(g, '12 frames · ease-in-out', w.x + 8, w.y + 86, 'rgba(12,12,13,.65)', { size: 14 });
					g.globalAlpha = 1;
					setFont(g, { size: s.size, ls: -.035 * s.size });
				}
			}
			g.save();
			g.beginPath(); g.rect(x - 20, w.y - s.size, w.width + 40, s.size * 1.14); g.clip();
			g.fillStyle = COL.ink; g.fillText(w.w, x, w.y + (1 - p) * s.size * 1.05);
			g.restore();
		});
		// the dot rides the tween like a playhead
		const tb = s.words[s.words.length - 1];
		const dp = P(t, tw0, tw1, 'ioE');
		if (t > tw0 - .1) dot(g, tb.x + 8 + 300 * dp, tb.y + 44, 9 * P(t, tw0 - .1, tw0), COL.ink);
	},
});

/* 2B · the index: seven projects, a weight wave, a moving highlight */
const WORK = [
	['yap', 'Voice-first group chat · 2026'],
	['Notate', 'Chrome extension'],
	['Instagram Lists', 'Product concept · 2025'],
	['Acuity', 'Wearable + AI health'],
	['neuk', 'Service design · 2025'],
	['Smart Bundles', 'Amazon Fresh concept · 2026'],
	['Forage', 'Wearable + AI · FigBuild 2026'],
];
scene(bt(28), bt(32), {
	init(s) {
		s.rows = WORK.map(([name, cap], i) => {
			const row = el('div', null, s.r1, { position: 'absolute', left: '170px', top: (132 + i * 104) + 'px', height: '108px', overflow: 'hidden' });
			const inner = el('div', 'nowrap', row, { fontSize: '100px', lineHeight: '108px', color: COL.white, letterSpacing: '-0.035em' }, name);
			const c = el('div', 'mono nowrap', s.r1, { position: 'absolute', left: '1230px', top: (132 + i * 104 + 46) + 'px', fontSize: '15px', color: COL.white });
			el('span', null, c, { color: COL.orange, marginRight: '18px' }, String(i + 1).padStart(2, '0'));
			el('span', null, c, null, cap);
			return { row, inner, c };
		});
	},
	dom(t, s) {
		const hi = Math.floor((t - bt(28.5)) / bt(.5));
		s.rows.forEach((r, i) => {
			const a = bt(28) + i * .03;
			const inn = 1 - P(t, a, a + .45, 'oE');
			const out = P(t, bt(31.5) + i * .018, bt(31.5) + i * .018 + .2, 'iE');
			r.inner.style.transform = `translateY(${(inn - out) * 108}px)`;
			const ph = TAU * t * .95 - i * .75;
			const on = i === hi;
			const wght = on ? 700 : 400 + 220 * (.5 + .5 * Math.sin(ph));
			const wdth = on ? 100 : 78 + 22 * (.5 + .5 * Math.sin(ph + 1.3));
			r.inner.style.fontVariationSettings = `'wght' ${wght.toFixed(1)}, 'wdth' ${wdth.toFixed(1)}`;
			r.inner.style.color = on ? COL.orange : 'rgba(242,239,233,.9)';
			r.c.style.opacity = ((on ? 1 : .34) * (1 - inn) * (1 - out)).toFixed(3);
		});
	},
	draw(t, s) {
		darkBG(.8, 700, 540);
		const hi = clamp(Math.floor((t - bt(28.5)) / bt(.5)), 0, 6);
		const k = springs(t, [[0, 0], ...WORK.map((_, i) => [bt(28.5) + i * bt(.5), i])].slice(0, 8), 3.2, .5);
		const y = 132 + 54 + k * 104;
		const a = P(t, bt(28.2), bt(28.5)) * (1 - P(t, bt(31.5), bt(31.8)));
		if (a > 0) { CV.fx.globalAlpha = a; dot(CV.fx, 128, y, 10, COL.orange, 26); CV.fx.globalAlpha = 1; }
	},
});

/* 2C · type on a path */
const PATHTXT = (() => {
	const seg = [['timing', 0], [' · ', 1], ['spacing', 0], [' · ', 1], ['weight', 0], [' · ', 1], ['rhythm', 0], [' · ', 1], ['restraint', 2], [' · ', 1]];
	const out = [];
	for (let r = 0; r < 4; r++) seg.forEach(([s, k]) => [...s].forEach(ch => out.push([ch, k])));
	return out;
})();
scene(bt(32), bt(36), {
	init(s) {
		const g = CV.fx;
		const styles = [
			{ w: 600, size: 78, ls: -1 },
			{ w: 400, size: 78, ls: 0 },
			{ fam: 'serif', w: 400, style: 'italic', size: 96 },
		];
		s.styles = styles;
		s.adv = PATHTXT.map(([ch, k]) => { setFont(g, styles[k]); return g.measureText(ch).width; });
		s.cum = []; let c = 0; s.adv.forEach(a => { s.cum.push(c); c += a; }); s.total = c;
		setFont(g, { fam: 'mono', w: 500, size: 16, ls: 2 });
		s.sub = '128 BPM · 60 FPS · 1920×1080 · SHOWREEL ’26 · SOOIM KANG · ';
		s.subAdv = [...s.sub].map(ch => g.measureText(ch).width);
	},
	draw(t, s) {
		const g = CV.fx;
		darkBG(.8);
		const lt = t - bt(32);
		const sw = Math.sin(lt * 1.3);
		const pts = [[-220, 760], [620, 1010 - 180 * sw], [1300, 90 + 180 * sw], [2140, 380]];
		const bez = u => {
			const a = 1 - u;
			return [
				a * a * a * pts[0][0] + 3 * a * a * u * pts[1][0] + 3 * a * u * u * pts[2][0] + u * u * u * pts[3][0],
				a * a * a * pts[0][1] + 3 * a * a * u * pts[1][1] + 3 * a * u * u * pts[2][1] + u * u * u * pts[3][1],
			];
		};
		const N = 700, P_ = [], L = [0];
		for (let i = 0; i <= N; i++) { P_.push(bez(i / N)); if (i) L.push(L[i - 1] + Math.hypot(P_[i][0] - P_[i - 1][0], P_[i][1] - P_[i - 1][1])); }
		const at = (d, off = 0) => {
			let lo = 0, hi = N;
			while (hi - lo > 1) { const m = (lo + hi) >> 1; if (L[m] < d) lo = m; else hi = m; }
			const q = (d - L[lo]) / (L[hi] - L[lo] || 1);
			const x = lerp(P_[lo][0], P_[hi][0], q), y = lerp(P_[lo][1], P_[hi][1], q);
			const ang = Math.atan2(P_[hi][1] - P_[lo][1], P_[hi][0] - P_[lo][0]);
			return { x: x - Math.sin(ang) * off, y: y + Math.cos(ang) * off, ang };
		};
		const cam = P(t, bt(32), bt(36), 'o3');
		g.save();
		g.translate(W / 2, H / 2); g.rotate(lerp(-.07, .015, cam)); g.scale(lerp(1.1, 1, cam), lerp(1.1, 1, cam)); g.translate(-W / 2, -H / 2);

		// the path itself, like a graph editor
		const A = P(t, bt(32), bt(32.5));
		g.globalAlpha = A;
		g.strokeStyle = 'rgba(242,239,233,.14)'; g.lineWidth = 1.2;
		g.beginPath(); P_.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke();
		line(g, pts[0][0], pts[0][1], pts[1][0], pts[1][1], 'rgba(242,239,233,.28)', 1);
		line(g, pts[3][0], pts[3][1], pts[2][0], pts[2][1], 'rgba(242,239,233,.28)', 1);
		[pts[1], pts[2]].forEach(p => { g.strokeStyle = 'rgba(242,239,233,.6)'; g.lineWidth = 1.5; g.beginPath(); g.arc(p[0], p[1], 7, 0, TAU); g.stroke(); });

		// flow speed surges on every beat
		const beats = []; for (let b = 32; b <= 36; b++) beats.push(bt(b));
		const surge = beats.reduce((a, tb) => a + (t >= tb ? (1 - Math.exp(-(t - tb) * 6)) : 0), 0);
		const off = -1200 + lt * 520 + surge * 150;
		g.textAlign = 'left'; g.textBaseline = 'alphabetic';
		PATHTXT.forEach(([ch, k], i) => {
			const d = off + s.cum[i];
			if (d < 0 || d > L[N]) return;
			const p = at(d + s.adv[i] / 2);
			setFont(g, s.styles[k]);
			g.save(); g.translate(p.x, p.y); g.rotate(p.ang);
			g.fillStyle = k === 2 ? COL.orange : k === 1 ? 'rgba(242,239,233,.35)' : COL.white;
			g.fillText(ch, -s.adv[i] / 2, 26);
			g.restore();
		});
		// counter-flow: metadata along the underside
		setFont(g, { fam: 'mono', w: 500, size: 16, ls: 2 });
		let d = L[N] - 200 - lt * 260;
		for (let r = 0; r < 12; r++) for (let i = 0; i < s.sub.length; i++) {
			d -= s.subAdv[i];
			if (d < 0 || d > L[N]) continue;
			const p = at(d, 74);
			g.save(); g.translate(p.x, p.y); g.rotate(p.ang);
			g.fillStyle = 'rgba(242,239,233,.4)'; g.fillText(s.sub[i], 0, 0);
			g.restore();
		}
		g.restore();
		g.globalAlpha = 1;
	},
});

/* 2D · colour strobe on eighths */
scene(bt(36), bt(39), {
	draw(t, s) {
		const g = CV.fx;
		const k = clamp(Math.floor((t - bt(36)) / bt(.5)), 0, 5);
		const tk = bt(36) + k * bt(.5), punch = 1 + .09 * Math.exp(-(t - tk) * 16);
		const looks = [
			[COL.ink, COL.white, { size: 300 }],
			[COL.orange, COL.ink, { fam: 'serif', w: 400, style: 'italic', size: 380 }],
			[COL.white, COL.ink, { fam: 'mono', w: 500, size: 230 }],
			[COL.ink, null, { size: 330 }],
			[COL.cream, COL.ink, { size: 430, stretch: 'condensed' }],
			[COL.orange, COL.white, { size: 300 }],
		];
		const [bg, fg, f] = looks[k];
		if (bg === COL.ink) darkBG(.7); else fillBG(bg);
		HUD.dark = bg !== COL.ink;
		setFont(g, Object.assign({ ls: -(f.fam ? 0 : .04) * f.size }, f));
		g.textAlign = 'center';
		g.save(); g.translate(W / 2, H / 2); g.scale(punch, punch);
		const y = f.size * .35;
		if (k === 3) { g.strokeStyle = COL.orange; g.lineWidth = 3; g.strokeText('rhythm', 0, y); }
		else if (k === 5) {
			g.textAlign = 'left';
			const gl = glyphs(g, 'rhythm');
			gl.forEach((c, i) => { g.fillStyle = fg; g.fillText(c.ch, c.x - gl.width / 2, y + Math.sin((t - tk) * 22 + i * .9) * 34 * Math.exp(-(t - tk) * 5)); });
		} else { g.fillStyle = fg; g.fillText('rhythm', 0, y); }
		g.restore();
		label(g, ['sans 700', 'serif italic', 'mono 500', 'outline', 'condensed', 'wave'][k], W / 2, H / 2 + 260,
			HUD.dark ? 'rgba(17,17,17,.55)' : 'rgba(242,239,233,.5)', { size: 14, align: 'center' });
	},
});
