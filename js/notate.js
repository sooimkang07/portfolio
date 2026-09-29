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
