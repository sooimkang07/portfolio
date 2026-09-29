/* ============================================================
   kit — the portfolio's pieces, as reel parts
   media cards (video or still), phones, browser windows,
   two-tone headlines, the "Sooim" glass pill, a pointer,
   a capture marquee and the case-study dotted panel.
   ============================================================ */

const STILL = 'stills/';

/* a rounded media frame that can hold several layers (videos or stills) */
function mframe(parent, w, h, r = 20, cls = '') {
	const e = el('div', 'media ' + cls, parent, { width: w + 'px', height: h + 'px', borderRadius: r + 'px' });
	e._w = w; e._h = h;
	return { el: e, layers: [] };
}
function layer(f, src) {
	let node, c = null, img = null;
	if (src.startsWith('img:')) {
		const name = src.slice(4);
		img = el('img', null, f.el);
		img.src = STILL + (name.includes('.') ? name : name + '.jpg');
		node = img;
	} else {
		c = clip(src, f.el);
		node = c.box;
	}
	const L = { node, c, img, src };
	f.layers.push(L);
	return L;
}
/* frame with a single layer */
function media(parent, src, w, h, r = 20, cls = '') {
	const f = mframe(parent, w, h, r, cls);
	f.L = layer(f, src);
	return f;
}
/* resize a frame in place (keeps centring math in place()) */
function size(f, w, h, r) {
	f.el.style.width = w + 'px'; f.el.style.height = h + 'px';
	if (r != null) f.el.style.borderRadius = r + 'px';
	f.el._w = w; f.el._h = h;
}
/* show exactly one layer */
function only(f, k) { f.layers.forEach((L, i) => vis(L.node, i === k)); }
/* slow push / pan on a layer: s scale, x/y offsets in px, origin in % */
function push(L, s = 1, x = 0, y = 0, ox = 50, oy = 50) {
	const n = L.img || L.c.v;
	n.style.transformOrigin = `${ox}% ${oy}%`;
	n.style.transform = `translate(${x}px,${y}px) scale(${s})`;
}

function phone(parent, name, h = 860) {
	const w = Math.round(h * .462);
	const e = el('div', 'phone', parent, { width: w + 'px', height: h + 'px' });
	e._w = w; e._h = h;
	const sc = el('div', 'phone__screen', e);
	return { el: e, c: clip(name, sc) };
}

/* explorations.html browser window */
function browser(parent, src, w, h, url) {
	const e = el('div', 'browser', parent, { width: w + 'px', height: h + 'px' });
	e._w = w; e._h = h;
	const bar = el('div', 'browser__bar', e);
	el('i', null, bar); el('i', null, bar); el('i', null, bar);
	el('span', 'browser__url', bar, null, url);
	const sc = el('div', 'browser__screen', e);
	const f = { el: sc, layers: [] };
	const L = layer(f, src);
	L.node.style.position = 'absolute'; L.node.style.inset = '0';
	if (L.img) { L.img.style.width = '100%'; L.img.style.height = '100%'; L.img.style.objectFit = 'cover'; }
	return { el: e, L, screen: sc };
}

/* two-tone headline: lines = [[['text', tone?], ...], ...] */
function headline(parent, lines, size) {
	const e = el('div', 'hl', parent, { fontSize: size + 'px' });
	const ls = lines.map(parts => {
		const l = el('span', 'hl__line', e);
		parts.forEach(([txt, tone]) => el('span', tone ? 'hl__tone' : null, l, null, txt));
		return l;
	});
	return { el: e, lines: ls };
}
/* the site's line entrance (js/intro.js): rise, un-tilt, un-blur — and a quick exit */
function lineIn(e, t, t0, t1 = 1e9) {
	const a = P(t, t0, t0 + .75, 'intro');
	const q = P(t, t1, t1 + .38, 'inout');
	e.style.opacity = (a * (1 - q)).toFixed(3);
	e.style.transform = `translateY(${((1 - a) * 58 - q * 46).toFixed(1)}px) perspective(900px) rotateX(${((1 - a) * -35).toFixed(1)}deg)`;
	const bl = (1 - a) * 10 + q * 8;
	e.style.filter = bl > .05 ? `blur(${bl.toFixed(1)}px)` : 'none';
}

/* the "Sooim" glass pill, with the load sweep */
function pillEl(parent, text) {
	const e = el('span', 'pill', parent, null,
		`<span class="pill__sheen"></span><span class="pill__rim"></span><span class="pill__t">${text}</span>`);
	return { el: e, sheen: e.querySelector('.pill__sheen'), rim: e.querySelector('.pill__rim') };
}
function sweep(p, t, t0) {
	const s = P(t, t0, t0 + .95, 'inout');
	p.sheen.style.backgroundPosition = `${lerp(100, 0, s)}% center`;
	p.rim.style.setProperty('--a', `${track(s, [[0, -75], [.5, -160], [1, -75]])}deg`);
}

/* pointer (macOS arrow) with a press ripple */
function pointer(parent) {
	const e = el('div', 'cursor', parent, null,
		'<svg viewBox="0 0 24 24" width="44" height="44"><path d="M5 2.5v17.2l4.6-4.3 2.9 6.6 2.7-1.2-2.9-6.5h6.3z" fill="#111" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/></svg>');
	e._w = e._h = 0;
	const rip = el('div', 'ripple', parent);
	rip._w = rip._h = 80;
	return { el: e, rip };
}
function pointerAt(pt, x, y, press = 0, rip = -1) {
	pt.el.style.transform = `translate(${x - 8}px,${y - 4}px) scale(${1 - .14 * press})`;
	const on = rip >= 0 && rip < 1;
	vis(pt.rip, on);
	if (on) place(pt.rip, { x, y, s: .3 + rip * 1.4, op: 1 - rip });
}

/* capture marquee, drawn from its centre */
function marquee(parent) {
	const e = el('div', 'sel', parent);
	['0 0', '100% 0', '0 100%', '100% 100%'].forEach(p => {
		const [a, b] = p.split(' ');
		el('i', null, e, { left: `calc(${a} - 8px)`, top: `calc(${b} - 8px)` });
	});
	return e;
}
function marqueeAt(m, x, y, w, h, p) {
	vis(m, p > .01);
	const k = EZ.ease(clamp(p));
	m.style.width = (w * k) + 'px'; m.style.height = (h * k) + 'px';
	m.style.transform = `translate(${x - w * k / 2}px,${y - h * k / 2}px)`;
	m.style.opacity = clamp(p * 3);
}
