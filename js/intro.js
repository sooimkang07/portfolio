(() => {
 'use strict';
 const reduced = matchMedia('(prefers-reduced-motion: reduce)');
 const reel = document.querySelector('.home-hero__video');
 const strip = document.querySelector('.home-greeting__strip');
 if (!reel && !strip) return;
 const preview = new URLSearchParams(location.search).get('intro') === '1';
 // The showreel opens on the loader's last frame: the same three lines in one row. Where each line's text
 // starts in the film's own pixels (1920 × 1080, set at 56px), so the loader can land on it exactly.
 const FILM = {w:1920, h:1080, size:56, mid:539.95, x:[783.68, 120, 1358.29]};
 const NAME = '<span class="ab-name__t">Sooim</span><span class="ab-name__spk" aria-hidden="true"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5h3.2L11.5 6v12l-4.3-3.5H4z" fill="currentColor" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path class="ab-say__w1" d="M15 9.2a4 4 0 0 1 0 5.6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path class="ab-say__w2" d="M17.8 6.6a7.6 7.6 0 0 1 0 10.8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></span>';
 const playReel = () => { if (reel) reel.play().catch(() => {}); };
 // Where the reel's picture sits on screen: edge to edge on wide windows (cover), whole on tall ones (contain).
 const reelFrame = () => {
  const r = reel.getBoundingClientRect();
  const k = (getComputedStyle(reel).objectFit === 'contain' ? Math.min : Math.max)(r.width / FILM.w, r.height / FILM.h);
  return {k, x: r.left + (r.width - FILM.w * k) / 2, y: r.top + (r.height - FILM.h * k) / 2};
 };
 let active = false;
 function run() {
  if (active || reduced.matches) return;
  active = true;
  if (reel) {
   // The intro ends on the reel's first frame, so start at the top of the page with the reel at its start.
   if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
   window.scrollTo(0, 0);
   reel.pause();
   if (reel.currentTime) reel.currentTime = 0;
  }
  const overlay = document.createElement('div');
  overlay.className = 'portfolio-intro';
  overlay.setAttribute('aria-label', 'Hi, I’m Sooim. Product designer based in New York.');
  overlay.innerHTML = '<div class="portfolio-intro__text" aria-hidden="true"><span class="portfolio-intro__line">Hi, I’m Sooim</span><span class="portfolio-intro__line">Product designer</span><span class="portfolio-intro__line">Based in New York</span></div>';
  const loadingName = document.createElement('span');
  loadingName.className = 'ab-name glass';
  loadingName.innerHTML = strip ? strip.querySelector('.ab-name').innerHTML : NAME;
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
   const film = reel && reelFrame();
   const landed = [];
   lines.forEach((line, i) => {
    const box = line.getBoundingClientRect();
    let scale, x, y;
    if (film) {
     // …on the reel's first frame, where the film draws the same line
     const from = textRect(line.firstChild), mid = (from.top + from.bottom) / 2;
     scale = FILM.size * film.k / parseFloat(getComputedStyle(line).fontSize);
     x = film.x + FILM.x[i] * film.k - box.left - scale * (from.left - box.left);
     y = film.y + FILM.mid * film.k - box.top - scale * (mid - box.top);
    } else {
     // …or on the greeting strip
     const target = strip.querySelector(`[data-line="${i}"]`), from = textRect(line), to = textRect(target);
     scale = parseFloat(getComputedStyle(target).fontSize) / parseFloat(getComputedStyle(line).fontSize);
     x = to.left - box.left - scale * (from.left - box.left);
     y = to.top - box.top - scale * (from.top - box.top);
    }
    const end = `translate(${x}px,${y}px) scale(${scale})`;
    landed.push([line, animate(line, [{transform:'translate(0,0) scale(1)'}, {transform:end}], {duration:1100, easing:'cubic-bezier(.76,0,.24,1)'}), end]);
   });
   if (film) {
    // Landed: hold the lines still as plain transforms, so they're drawn sharp at their final size.
    timers.push(setTimeout(() => landed.forEach(([line, move, end]) => { line.style.transform = end; move.cancel(); }), 1100));
    // The reel's frame has the same lines, so the backdrop holds until they land, then lifts,
    // then the lines let go over identical ones and the reel takes over.
    animate(overlay, [{backgroundColor:'#FAFCFD'}, {backgroundColor:'rgba(250,252,253,0)'}], {delay:1100, duration:300, easing:'ease-in-out'});
    lines.forEach(line => animate(line, [{opacity:1}, {opacity:0}], {delay:1400, duration:200}));
    timers.push(setTimeout(finish, 1620));
   } else {
    animate(overlay, [{backgroundColor:'#FAFCFD'}, {backgroundColor:'rgba(250,252,253,0)'}], {duration:1100});
    timers.push(setTimeout(finish, 1120));
   }
  }, 2200));
  timers.push(setTimeout(finish, 4500));
 }
 if (!location.hash && !reduced.matches) run();
 else playReel();
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


;(() => {
 const greeting = document.querySelector('.home-greeting');
 const intro = document.querySelector('.home-intro');
 if (!greeting || !intro) return;
 const sync = () => { intro.style.minHeight = `${greeting.getBoundingClientRect().height}px`; };
 new ResizeObserver(sync).observe(greeting);
 sync();
})();

// Pin the Recent Work index as soon as the first project's video reaches the middle of the window.
;(() => {
 const shell = document.querySelector('.home-work__index-shell');
 const media = document.querySelector('.home-work__card .home-work__media');
 if (!shell || !media) return;
 const desktop = matchMedia('(width >= 1200px)');
 const sync = () => {
  shell.style.marginBlockStart = desktop.matches ? `${-Math.max(0, (innerHeight - media.offsetHeight) / 2)}px` : '';
 };
 new ResizeObserver(sync).observe(media);
 addEventListener('resize', sync);
 desktop.addEventListener('change', sync);
 sync();
})();
