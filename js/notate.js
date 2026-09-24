/* Page-local scroll spy: no programmatic vertical scrolling while reading. */
(() => {
  'use strict';
  const links = [...document.querySelectorAll('.nt-toc li a')];
  const sections = links.map(link => document.querySelector(link.hash)).filter(Boolean);
  const toc = document.querySelector('.nt-toc');
  const compact = matchMedia('(max-width: 1199px)');
  let scheduled = false;
  function update() {
    scheduled = false;
    const offset = compact.matches ? 170 : 130;
    let current = sections[0];
    for (const section of sections) {
      if (section.getBoundingClientRect().top <= offset) current = section;
    }
    for (const link of links) {
      const active = link.hash === '#' + current.id;
      if (active && !link.hasAttribute('aria-current')) {
        link.setAttribute('aria-current', 'location');
        if (compact.matches) {
          toc.scrollTo({ left: link.offsetLeft - toc.clientWidth / 2 + link.offsetWidth / 2, behavior: 'instant' });
        }
      } else if (!active) link.removeAttribute('aria-current');
    }
  }
  function schedule() {
    if (!scheduled) { scheduled = true; requestAnimationFrame(update); }
  }
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule);
  addEventListener('hashchange', schedule);
  update();
})();

/* Respect reduced motion: show the poster frame with controls instead of autoplaying. */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const apply = () => document.querySelectorAll('.nt-video').forEach(video => {
    if (reduce.matches) { video.pause(); video.removeAttribute('autoplay'); video.controls = true; }
    else { video.controls = false; video.play().catch(() => {}); }
  });
  apply();
  reduce.addEventListener('change', apply);
})();

/* ── Chrome Web Store link ─────────────────────────────────────
   Paste the listing URL here once Notate is approved. Both store
   links on the page (under the title and in Launch) go live. */
const STORE_URL = '';
(() => {
  if (!STORE_URL) return;
  document.querySelectorAll('[data-store-link]').forEach(link => {
    link.href = STORE_URL;
    link.target = '_blank';
    link.rel = 'noopener';
    link.removeAttribute('aria-disabled');
    link.classList.remove('nt-link-pending');
    link.textContent = 'Get Notate on the Chrome Web Store';
  });
})();
