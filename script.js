/* ============================================================
   SOOIM KANG — Global script.js
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

  /* ── Case study TOC active state (scroll-spy) ────────────── */
  const tocLinks = document.querySelectorAll('.case__toc-link');
  if (tocLinks.length) {
    const sections = [...tocLinks]
      .map(l => document.querySelector(l.getAttribute('href')))
      .filter(Boolean);

    function setActive(id) {
      tocLinks.forEach(l => {
        l.classList.toggle('is-active', l.getAttribute('href') === '#' + id);
      });
    }

    // Set first section active on load
    if (sections.length) setActive(sections[0].id);

    const io2 = new IntersectionObserver(entries => {
      // Find the topmost intersecting section
      const visible = entries
        .filter(e => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible.length) setActive(visible[0].target.id);
    }, {
      rootMargin: '-10% 0px -60% 0px',
      threshold: 0
    });

    sections.forEach(s => io2.observe(s));
  }

})();