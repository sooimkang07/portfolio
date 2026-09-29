/* ============================================================
   main — frame loop, preview transport, render hooks
   ============================================================ */

function frame(t) {
	CLIPS.forEach(c => { c.want = null; });
	for (const s of SCENES) {
		const on = t >= s.a && t < s.b;
		s.r0.classList.toggle('on', on);
		s.r1.classList.toggle('on', on);
		if (on && s.dom) s.dom(t, s);
	}
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
	await Promise.all(['500 100px "Instrument Sans"', '400 100px "Instrument Sans"'].map(f => document.fonts.load(f)));
	SCENES.forEach(s => s.init && s.init(s));
	await loadClips();
	await Promise.all([...document.images].map(i => i.decode().catch(() => {})));
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
		if (e.code === 'ArrowRight') clockT = Math.min(DUR, clockT + (e.shiftKey ? BEAT * 4 : 1 / FPS));
		if (e.code === 'ArrowLeft') clockT = Math.max(0, clockT - (e.shiftKey ? BEAT * 4 : 1 / FPS));
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
