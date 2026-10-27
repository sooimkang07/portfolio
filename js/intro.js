(() => {
 'use strict';
 const reduced = matchMedia('(prefers-reduced-motion: reduce)');
 const reel = document.querySelector('.home-hero__video');
 // The loader lands on the greeting above the reel.
 const strip = document.querySelector('.home-greeting__strip');
 const REEL_START = 0;   // the film opens on yap's empty studio (no greeting of its own), so the loop is the whole film
 if (!strip) return;
 const preview = new URLSearchParams(location.search).get('intro') === '1';
 const playReel = () => { if (reel) reel.play().catch(() => {}); };
 // Resolves once the lines' web font can draw, or after `cap` ms so a slow or blocked font can't hold the page.
 const fontReady = cap => new Promise(done => {
  if (!document.fonts) return done();
  const t0 = performance.now();
  setTimeout(done, cap);
  const poll = () => document.fonts.load("500 1em 'Instrument Sans'", 'Hi, I’m Sooim').then(faces => {
   if (faces.length) done();
   else if (performance.now() - t0 < cap) setTimeout(poll, 50);   // its @font-face isn't registered yet
  }, done);
  poll();
 });
 let active = false;
 async function run() {
  if (active || reduced.matches) return;
  active = true;
  if (reel) {
   // The intro ends on the reel's first frame, so start at the top of the page with the reel at its start.
   if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
   window.scrollTo(0, 0);
   reel.pause();
   reel.currentTime = REEL_START;
  }
  const overlay = document.createElement('div');
  overlay.className = 'portfolio-intro';
  overlay.setAttribute('aria-label', 'Hi, I’m Sooim. Product designer based in New York.');
  overlay.innerHTML = '<div class="portfolio-intro__text" aria-hidden="true"><span class="portfolio-intro__line">Hi, I’m Sooim</span><span class="portfolio-intro__line">Product designer</span><span class="portfolio-intro__line">Based in New York</span></div>';
  const loadingName = document.createElement('span');
  loadingName.className = 'ab-name glass';
  loadingName.innerHTML = strip.querySelector('.ab-name').innerHTML;
  const firstLine = overlay.querySelector('.portfolio-intro__line');
  firstLine.replaceChildren(document.createTextNode('Hi, I’m '), loadingName);
  document.body.append(overlay);
  document.documentElement.classList.remove('is-intro-pending');
  const root = document.documentElement.style;
  const overflow = root.overflow, gutter = root.scrollbarGutter;
  // Keep the scrollbar's space while scrolling is locked, so the page doesn't shift sideways when it comes back.
  root.scrollbarGutter = 'stable';
  root.overflow = 'hidden';
  if (strip) strip.style.visibility = 'hidden';
  const animations = [], timers = [];
  let ended = false;
  function finish() {
   if (ended) return;
   ended = true;
   timers.forEach(clearTimeout);
   animations.forEach(a => a.cancel());
   overlay.remove();
   if (strip) strip.style.visibility = '';
   root.overflow = overflow;
   root.scrollbarGutter = gutter;
   document.removeEventListener('keydown', onKey);
   window.removeEventListener('resize', finish);
   reduced.removeEventListener('change', finish);
   active = false;
   playReel();
  }
  const onKey = e => { if (e.key === 'Escape' || e.key === 'Tab') finish(); };
  document.addEventListener('keydown', onKey);
  window.addEventListener('resize', finish);
  reduced.addEventListener('change', finish);
  const animate = (el, frames, options) => { const a = el.animate(frames, {fill:'both', ...options}); animations.push(a); return a; };
  // The lines land on the greeting's type, so on a first visit they wait (hidden, at most 1.5s) for its web font:
  // measured in the fallback font, they'd land at the wrong size and double up over the reel.
  const text = overlay.firstElementChild;
  text.style.visibility = 'hidden';
  await fontReady(1500);
  if (ended) return;
  text.style.visibility = '';
  timers.push(setTimeout(() => loadingName.classList.add('is-sweep-in'), 900));
  const lines = [...overlay.querySelectorAll('.portfolio-intro__line')];
  const entrances = lines.map((line, i) => animate(line, [
   {opacity:0, transform:'translateY(45px) rotateX(-35deg)', filter:'blur(8px)'},
   {opacity:1, transform:'translateY(0) rotateX(0)', filter:'blur(0)'}
  ], {delay:150 + i * 380, duration:750, easing:'cubic-bezier(.2,.75,.2,1)'}));
  timers.push(setTimeout(() => {
   // Measure the text itself (not its box) so each line lands exactly on its counterpart.
   // The entrances end on the lines' own styles, so drop them: a leftover blur(0) filter keeps the text soft.
   entrances.forEach(a => a.cancel());
   const textRect = el => { const r = document.createRange(); r.selectNodeContents(el); return r.getBoundingClientRect(); };
   lines.forEach((line, i) => {
    const box = line.getBoundingClientRect();
    const target = strip.querySelector(`[data-line="${i}"]`), from = textRect(line), to = textRect(target);
    const scale = parseFloat(getComputedStyle(target).fontSize) / parseFloat(getComputedStyle(line).fontSize);
    const x = to.left - box.left - scale * (from.left - box.left);
    const y = to.top - box.top - scale * (from.top - box.top);
    const end = `translate(${x}px,${y}px) scale(${scale})`;
    animate(line, [{transform:'translate(0,0) scale(1)'}, {transform:end}], {duration:1100, easing:'cubic-bezier(.76,0,.24,1)'});
   });
   animate(overlay, [{backgroundColor:'#FAFCFD'}, {backgroundColor:'rgba(250,252,253,0)'}], {duration:1100});
   timers.push(setTimeout(finish, 1120));
  }, 2200));
  timers.push(setTimeout(finish, 4500));
 }
 if (!location.hash && !reduced.matches) run();
 else if (!reduced.matches) playReel();   // reduced motion: the reel waits on its first frame until clicked
 document.documentElement.classList.remove('is-intro-pending');
 if (preview) {
  const replay = document.createElement('button');
  replay.className = 'intro-replay'; replay.textContent = 'Replay intro ↻';
  replay.addEventListener('click', () => { window.scrollTo({top:0, behavior:'instant'}); run(); });
  document.body.append(replay);
 }
})();

;(() => {
	const b = document.querySelector('[data-say]'), a = document.querySelector('[data-say-audio]'); if (!b || !a) return
	const set = on => { b.classList.toggle('is-playing', on); b.setAttribute('aria-pressed', String(on)) }
	b.addEventListener('click', () => { if (!a.paused) { a.pause(); a.currentTime = 0; set(false); return } a.currentTime = 0; a.play().then(() => set(true)).catch(() => set(false)) })
	a.addEventListener('ended', () => set(false)); a.addEventListener('pause', () => set(false))
})()
;(() => {
	const n = document.querySelector('.ab-name'), b = document.querySelector('[data-say]')
	if (!n || !b || matchMedia('(prefers-reduced-motion: reduce)').matches) return
	// One sheen pass per state change: left→right as the speaker slides out, right→left as it tucks back in
	const sweep = dir => { n.classList.remove('is-sweep-in', 'is-sweep-out'); void n.offsetWidth; n.classList.add(dir === 'in' ? 'is-sweep-in' : 'is-sweep-out') }
	const open = () => { if (!n.classList.contains('is-playing')) sweep('in') }
	const close = () => { if (!n.classList.contains('is-playing') && !n.matches(':hover')) sweep('out') }
	if (!document.querySelector('.portfolio-intro')) setTimeout(() => sweep('in'), 700)
	n.addEventListener('pointerenter', () => { if (!n.classList.contains('is-peek')) open() })
	n.addEventListener('pointerleave', () => { if (!n.classList.contains('is-peek')) close() })
	n.addEventListener('focus', open); n.addEventListener('blur', close)
})()


// Settle the Selected Work copy into the viewport while the first video's top is still halfway down.
;(() => {
 const shell = document.querySelector('.home-work__index-shell');
 const media = document.querySelector('.home-work__card .home-work__media');
 const stage = document.querySelector('.home-work__stage');
 if (!shell || !media || !stage) return;
 const desktop = matchMedia('(width >= 1200px)');
 const sync = () => {
  shell.style.marginBlockStart = '';
  stage.style.paddingBlockStart = desktop.matches ? `${innerHeight * .5}px` : '';
 };
 new ResizeObserver(sync).observe(media);
 addEventListener('resize', sync);
 desktop.addEventListener('change', sync);
 sync();
})();
