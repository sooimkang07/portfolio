(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const panels = [...document.querySelectorAll('[data-animate]')];
  if (!('IntersectionObserver' in window) || reduced.matches) return;
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.remove('is-pending');
      observer.unobserve(entry.target);
    }
  }), { threshold: .16 });
  panels.forEach(panel => {
    if (panel.getBoundingClientRect().top > innerHeight) panel.classList.add('is-pending');
    observer.observe(panel);
  });
  reduced.addEventListener('change', () => {
    if (reduced.matches) {
      panels.forEach(panel => panel.classList.remove('is-pending'));
      observer.disconnect();
    }
  });
})();
