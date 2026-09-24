/* Video playback lives in js/case.js; this file only drives the findings scene. */
(() => {
  document.querySelectorAll('.ig-motion-toggle').forEach(button => {
    button.addEventListener('click', () => {
      const paused = button.closest('.ig-findings').classList.toggle('is-paused');
      button.textContent = paused ? '▶' : 'Ⅱ';
      button.setAttribute('aria-label', paused ? 'Play animation' : 'Pause animation');
    });
  });
})();
/* Keep Back centered while only the horizontal section list scrolls. */
(() => {
  const links = [...document.querySelectorAll('.nt-toc li a')];
  const sections = links.map(a => document.querySelector(a.hash));
  const list = document.querySelector('.nt-toc ol');
  let scheduled = false;
  function update() {
    scheduled = false;
    const compact = innerWidth < 1200;
    let active = 0;
    sections.forEach((s,i) => { if (s.getBoundingClientRect().top <= (compact ? 185 : 130)) active = i; });
    links.forEach((a,i) => {
      if(i === active) {
        if (!a.hasAttribute('aria-current') && compact) {
          const r = a.getBoundingClientRect(), b = list.getBoundingClientRect();
          list.scrollTo({left:list.scrollLeft+r.left-b.left-list.clientWidth/2+r.width/2,behavior:'instant'});
        }
        a.setAttribute('aria-current','location');
      } else a.removeAttribute('aria-current');
    });
  }
  function schedule(){if(!scheduled){scheduled=true;requestAnimationFrame(update);}}
  addEventListener('scroll',schedule,{passive:true});
  addEventListener('resize',schedule);
  addEventListener('hashchange',schedule);
  update();
})();
