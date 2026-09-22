/* Autoplay every gallery video, preserving intentional manual pauses. */
(() => {
  const videos = [...document.querySelectorAll('video')];
  videos.forEach(video => {
    video.muted = true;
    video.controls = false;
    const device = video.closest('.flow__device, .ig-gallery__tile');
    const button = device?.querySelector('.flow__btn--pause');
    const sync = () => {
      button?.classList.toggle('is-playing', !video.paused);
      button?.setAttribute('aria-label', video.paused ? 'Play video' : 'Pause video');
    };
    button?.addEventListener('click', () => {
      if (video.paused) { video.dataset.userPaused = ''; video.play().catch(sync); }
      else { video.dataset.userPaused = 'true'; video.pause(); }
    });
    device?.querySelector('.flow__btn--replay')?.addEventListener('click', () => {
      video.currentTime = 0; video.dataset.userPaused = ''; video.play().catch(sync);
    });
    video.addEventListener('play', sync);
    video.addEventListener('pause', sync);
    video.play().catch(sync);
  });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) videos.forEach(v => { if (!v.dataset.userPaused) v.play().catch(() => {}); });
  });
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
