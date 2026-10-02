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

  /* Chapter links: lazy media above the target loads mid-scroll and pushes it down, so a
     plain anchor jump lands a section early. Load what's above first, scroll, then keep the
     target aligned until the page stops shifting or the reader takes over. */
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  let release = null;
  function jumpTo(target) {
    if (release) release();
    const margin = () => parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
    const top = () => target.getBoundingClientRect().top + scrollY - margin();
    document.querySelectorAll('main img[loading="lazy"], main video[preload="metadata"], main video[preload="none"]').forEach(el => {
      if (el.compareDocumentPosition(target) & Node.DOCUMENT_POSITION_FOLLOWING) {
        if (el.tagName === 'IMG') el.loading = 'eager';
        else el.preload = 'auto';
      }
    });
    scrollTo({ top: top(), behavior: reduce.matches ? 'instant' : 'smooth' });
    let idle = 0;
    const atBottom = () => scrollY + innerHeight >= document.documentElement.scrollHeight - 2;
    // Past the target: always pull back. Short of it: only if the page can still scroll further.
    const settle = () => {
      const off = target.getBoundingClientRect().top - margin();
      if (off < -2 || (off > 2 && !atBottom())) scrollTo({ top: top(), behavior: 'instant' });
    };
    const onScroll = () => { clearTimeout(idle); idle = setTimeout(settle, 140); };
    const ro = new ResizeObserver(() => { clearTimeout(idle); idle = setTimeout(settle, 140); });
    ro.observe(document.querySelector('main') || document.body);
    const stop = () => release && release();
    const timer = setTimeout(stop, 4000);
    release = () => {
      clearTimeout(idle); clearTimeout(timer); ro.disconnect();
      removeEventListener('scroll', onScroll);
      ['wheel', 'touchstart', 'keydown'].forEach(type => removeEventListener(type, stop));
      release = null;
    };
    addEventListener('scroll', onScroll, { passive: true });
    ['wheel', 'touchstart', 'keydown'].forEach(type => addEventListener(type, stop, { passive: true }));
  }
  for (const link of links) {
    const target = document.querySelector(link.hash);
    if (!target) continue;
    link.addEventListener('click', event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
      event.preventDefault();
      history.pushState(null, '', link.hash);
      jumpTo(target);
      schedule();
    });
  }
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

/* Carousels: arrows page one slide at a time and hide at either end. */
document.querySelectorAll('[data-carousel]').forEach(carousel => {
  const rail = carousel.querySelector('.nt-carousel__rail');
  const buttons = carousel.querySelectorAll('.nt-carousel__btn');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const total = rail.children.length;
  const sync = () => {
    const max = rail.scrollWidth - rail.clientWidth;
    carousel.classList.toggle('is-scrollable', max > 4);
    buttons[0].disabled = rail.scrollLeft <= 4;
    buttons[1].disabled = rail.scrollLeft >= max - 4;
  };
  let target = 0;
  const stepWidth = () => rail.firstElementChild.offsetWidth + parseFloat(getComputedStyle(rail).columnGap || 0);
  buttons.forEach(button => button.addEventListener('click', () => {
    // Page from the slide we're heading to, so quick repeat clicks never land between slides.
    const step = stepWidth();
    const from = rail.dataset.moving ? target : Math.round(rail.scrollLeft / step);
    target = Math.max(0, Math.min(total - 1, from + Number(button.dataset.dir)));
    rail.dataset.moving = '1';
    rail.scrollTo({ left: target * step, behavior: reduce.matches ? 'auto' : 'smooth' });
  }));
  // scrollend isn't in every browser, so also settle after scrolling goes quiet.
  let idle = 0;
  const settle = () => { delete rail.dataset.moving; };
  rail.addEventListener('scrollend', settle);
  rail.addEventListener('scroll', () => { sync(); clearTimeout(idle); idle = setTimeout(settle, 150); }, { passive: true });
  new ResizeObserver(sync).observe(rail);
  sync();
});
