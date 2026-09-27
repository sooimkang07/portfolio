(() => {
 'use strict';
 const reduced = matchMedia('(prefers-reduced-motion: reduce)');
 const strip = document.querySelector('.home-greeting__strip');
 if (!strip) return;
 const preview = new URLSearchParams(location.search).get('intro') === '1';
 let active = false;
 function run() {
  if (active || reduced.matches) return;
  active = true;
  const overlay = document.createElement('div');
  overlay.className = 'portfolio-intro';
  overlay.setAttribute('aria-label', 'Hi, I’m Sooim. Product designer based in New York.');
  overlay.innerHTML = '<div class="portfolio-intro__text" aria-hidden="true"><span class="portfolio-intro__line">Hi, I’m Sooim</span><span class="portfolio-intro__line">Product designer</span><span class="portfolio-intro__line">Based in New York</span></div><button class="portfolio-intro__skip" type="button">Skip intro ↗</button>';
  const loadingName = document.createElement('span');
  loadingName.className = 'ab-name glass';
  loadingName.innerHTML = strip.querySelector('.ab-name').innerHTML;
  const firstLine = overlay.querySelector('.portfolio-intro__line');
  firstLine.replaceChildren(document.createTextNode('Hi, I’m '), loadingName);
  document.body.append(overlay);
  const overflow = document.documentElement.style.overflow;
  document.documentElement.style.overflow = 'hidden';
  strip.style.visibility = 'hidden';
  const animations = [], timers = [];
  let ended = false;
  function finish() {
   if (ended) return;
   ended = true;
   timers.forEach(clearTimeout);
   animations.forEach(a => a.cancel());
   overlay.remove();
   strip.style.visibility = '';
   document.documentElement.style.overflow = overflow;
   document.removeEventListener('keydown', onKey);
   window.removeEventListener('resize', finish);
   reduced.removeEventListener('change', finish);
   active = false;
  }
  const onKey = e => { if (e.key === 'Escape' || e.key === 'Tab') finish(); };
  document.addEventListener('keydown', onKey);
  window.addEventListener('resize', finish);
  reduced.addEventListener('change', finish);
  overlay.querySelector('button').addEventListener('click', finish);
  const animate = (el, frames, options) => { const a = el.animate(frames, {fill:'both', ...options}); animations.push(a); return a; };
  timers.push(setTimeout(() => loadingName.classList.add('is-sweep-in'), 900));
  const lines = [...overlay.querySelectorAll('.portfolio-intro__line')];
  const entrances = lines.map((line, i) => animate(line, [
   {opacity:0, transform:'translateY(45px) rotateX(-35deg)', filter:'blur(8px)'},
   {opacity:1, transform:'translateY(0) rotateX(0)', filter:'blur(0)'}
  ], {delay:150 + i * 380, duration:750, easing:'cubic-bezier(.2,.75,.2,1)'}));
  timers.push(setTimeout(() => {
   // Measure the text itself (not its box) so each line lands exactly on its strip counterpart.
   entrances.forEach(a => a.finish());
   const textRect = el => { const r = document.createRange(); r.selectNodeContents(el); return r.getBoundingClientRect(); };
   lines.forEach((line, i) => {
    const target = strip.querySelector(`[data-line="${i}"]`);
    const box = line.getBoundingClientRect(), from = textRect(line), to = textRect(target);
    const scale = parseFloat(getComputedStyle(target).fontSize) / parseFloat(getComputedStyle(line).fontSize);
    const x = to.left - box.left - scale * (from.left - box.left), y = to.top - box.top - scale * (from.top - box.top);
    animate(line, [{transform:'translate(0,0) scale(1)'}, {transform:`translate(${x}px,${y}px) scale(${scale})`}], {duration:1100, easing:'cubic-bezier(.76,0,.24,1)'});
   });
   animate(overlay, [{backgroundColor:'#FAFCFD'}, {backgroundColor:'rgba(250,252,253,0)'}], {duration:1100});
   animate(overlay.querySelector('button'), [{opacity:1},{opacity:0}], {duration:250});
   timers.push(setTimeout(finish, 1120));
  }, 2200));
  timers.push(setTimeout(finish, 4500));
 }
 if (!location.hash) run();
 if (preview) {
  const replay = document.createElement('button');
  replay.className = 'intro-replay'; replay.textContent = 'Replay intro ↻';
  replay.addEventListener('click', () => { window.scrollTo({top:0, behavior:'instant'}); run(); });
  document.body.append(replay);
 }
 const button = document.querySelector('.home-logo');
 const tile = button.querySelector('.home-logo__tile');
 let img = tile.querySelector('img');
 const logos = [['yap','yap'],['notate','Notate'],['instagram','Instagram Lists'],['amazon','Smart Bundles'],['neuk','Neuk'],['forage','Forage'],['acuity','Acuity']];
 logos.forEach(([name]) => { const preload = new Image(); preload.src = `project-app-icons/icon-${name}.png`; });
 let index = 0, paused = reduced.matches, visible = false, swiping = false;
 const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; });
 observer.observe(button);
 function label() { button.setAttribute('aria-label', `${paused ? 'Resume' : 'Pause'} rotating project logos`); }
 label();
 button.addEventListener('click', () => { paused = !paused; label(); });
 reduced.addEventListener('change', () => { paused = reduced.matches; label(); });
 // Swipe left to right: the current logo winds up and flings out to the right,
 // the next one springs in from the left with a little overshoot.
 setInterval(async () => {
  if (paused || !visible || document.hidden || swiping) return;
  swiping = true;
  index = (index + 1) % logos.length;
  const next = img.cloneNode();
  next.src = `project-app-icons/icon-${logos[index][0]}.png`; next.alt = logos[index][1];
  next.style.opacity = '0';
  tile.append(next);
  const out = img.animate([
   {transform:'translateX(0) rotate(0) scale(1)', opacity:1},
   {transform:'translateX(-8%) rotate(-4deg) scale(1.04)', opacity:1, offset:.3},
   {transform:'translateX(140%) rotate(24deg) scale(.6)', opacity:0}
  ], {duration:560, easing:'cubic-bezier(.5,0,.75,0)', fill:'forwards'});
  const enter = next.animate([
   {transform:'translateX(-140%) rotate(-24deg) scale(.6)', opacity:0},
   {transform:'translateX(0) rotate(0) scale(1)', opacity:1}
  ], {duration:760, delay:180, easing:'cubic-bezier(.34,1.56,.64,1)', fill:'backwards'});
  try { await Promise.all([out.finished, enter.finished]); } catch {}
  next.style.opacity = '';
  img.remove(); img = next; swiping = false;
 }, 2800);
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
