(() => {
  const tocLinks = [...document.querySelectorAll('.sb-toc a')];
  const chapters = tocLinks.map(link => document.querySelector(link.getAttribute('href')));
  let activeChapter = -1;
  function updateChapter() {
    if (!tocLinks.length) return;
    let current = 0;
    chapters.forEach((chapter, index) => {
      if (chapter.getBoundingClientRect().top <= 180) current = index;
    });
    if (current === activeChapter) return;
    activeChapter = current;
    tocLinks.forEach((link, index) => {
      if (index === current) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    const active = tocLinks[current];
    const toc = active.parentElement;
    if (getComputedStyle(toc).flexDirection === 'row') toc.scrollTo({ left: active.offsetLeft - toc.clientWidth / 2 + active.clientWidth / 2, behavior: 'instant' });
  }
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const videos = [...document.querySelectorAll('.sb-tile video')];
  const syncVideo = video => {
    if (!document.hidden && video.dataset.paused !== 'true') video.play().catch(() => {});
    else video.pause();
  };
  videos.forEach(video => {
    const button = video.parentElement.querySelector('.sb-play');
    const label = video.getAttribute('aria-label');
    const update = () => { button.classList.toggle('is-playing', !video.paused); button.setAttribute('aria-label', `${video.paused ? 'Play' : 'Pause'} ${label}`); };
    video.addEventListener('play', update); video.addEventListener('pause', update); update();
    video.parentElement.querySelector('.sb-replay').addEventListener('click', () => {
      video.currentTime = 0; video.dataset.paused = 'false'; video.play().catch(() => {});
    });
    button.addEventListener('click', () => {
      if (video.paused) { video.dataset.paused = 'false'; video.play().catch(() => {}); }
      else { video.dataset.paused = 'true'; video.pause(); }
    });
  });
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.remove('is-waiting'); revealObserver.unobserve(entry.target); }
    }), { threshold: .06 });
    document.querySelectorAll('[data-reveal]').forEach(tile => {
      if (tile.getBoundingClientRect().top > innerHeight && !reduced.matches) tile.classList.add('is-waiting');
      revealObserver.observe(tile);
    });
  }
  videos.forEach(syncVideo);
  document.addEventListener('visibilitychange', () => videos.forEach(syncVideo));
  reduced.addEventListener('change', () => { videos.forEach(syncVideo); document.querySelectorAll('.is-waiting').forEach(el => el.classList.remove('is-waiting')); });
  const progress = document.querySelector('.sb-progress');
  const hero = document.querySelector('.sb-hero');
  let queued = false;
  function paint() {
    updateChapter();
    const length = document.documentElement.scrollHeight - innerHeight;
    if (progress) progress.style.transform = `scaleX(${length > 0 ? scrollY / length : 0})`;
    if (!reduced.matches && hero) {
      const rect = hero.getBoundingClientRect();
      hero.style.setProperty('--hero-scale', String(1 + Math.min(.045, Math.max(0, -rect.top / (rect.height + innerHeight) * .08))));
    }
    queued = false;
  }
  addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(paint); } }, { passive: true });
  addEventListener('resize', paint); paint();
})();
