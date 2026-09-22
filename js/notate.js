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
