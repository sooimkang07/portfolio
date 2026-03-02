/* ============================================================
   SOOIM KANG — Global script.js
   Shared across all pages
   ============================================================ */
(function () {
  'use strict';

  /* ── Local time ──────────────────────────────────────────── */
  function updateTime() {
    const el = document.getElementById('local-time');
    if (!el) return;
    el.textContent = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit', hour12: true
    }) + ' LOCAL TIME';
  }
  updateTime();
  setInterval(updateTime, 30_000);

  /* ── Mobile nav ──────────────────────────────────────────── */
  const burger = document.querySelector('.nav__burger');
  const menu   = document.getElementById('nav-menu');

  if (burger && menu) {
    const close = () => {
      burger.setAttribute('aria-expanded', 'false');
      menu.classList.remove('is-open');
      document.body.style.overflow = '';
    };

    burger.addEventListener('click', () => {
      const open = burger.getAttribute('aria-expanded') !== 'true';
      burger.setAttribute('aria-expanded', String(open));
      menu.classList.toggle('is-open', open);
      document.body.style.overflow = open ? 'hidden' : '';
    });

    menu.querySelectorAll('.nav__link').forEach(l => l.addEventListener('click', close));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  }

  /* ── Scroll-reveal cards ─────────────────────────────────── */
  const cards = document.querySelectorAll('.project-card');
  if (cards.length) {
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          const idx = [...cards].indexOf(entry.target);
          entry.target.style.transitionDelay = `${(idx % 2) * 70}ms`;
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        });
      }, { threshold: 0.08 });
      cards.forEach(c => io.observe(c));
    } else {
      cards.forEach(c => c.classList.add('is-visible'));
    }
  }

  /* ── Whole-card click (data-href) ────────────────────────── */
  document.querySelectorAll('.project-card[data-href]').forEach(card => {
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'link');
    card.addEventListener('click', e => {
      if (e.target.closest('a')) return;
      window.location.href = card.dataset.href;
    });
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); window.location.href = card.dataset.href; }
    });
  });

  /* ── Case study TOC active state ─────────────────────────── */
  const tocLinks = document.querySelectorAll('.case__toc-link');
  if (tocLinks.length) {
    const sections = [...tocLinks].map(l => document.querySelector(l.getAttribute('href'))).filter(Boolean);
    const io2 = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        tocLinks.forEach(l => l.classList.remove('is-active'));
        const link = document.querySelector(`.case__toc-link[href="#${entry.target.id}"]`);
        if (link) link.classList.add('is-active');
      });
    }, { rootMargin: '-20% 0px -70% 0px' });
    sections.forEach(s => io2.observe(s));
  }

})();