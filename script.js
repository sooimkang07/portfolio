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
    }) + ' Local Time';
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
    };

    burger.addEventListener('click', () => {
      const open = burger.getAttribute('aria-expanded') !== 'true';
      burger.setAttribute('aria-expanded', String(open));
      menu.classList.toggle('is-open', open);
    });

    menu.querySelectorAll('.nav__link').forEach(l => l.addEventListener('click', close));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  }


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
  /* Covers both the desktop sidebar (.case__toc-link) and the   */
  /* mobile horizontal bar (.case__toc-bar-link).                */
  const tocLinks    = document.querySelectorAll('.case__toc-link');
  const barLinks    = document.querySelectorAll('.case__toc-bar-link');
  const allTocLinks = document.querySelectorAll('.case__toc-link, .case__toc-bar-link');

  if (allTocLinks.length) {
    /* Dedupe sections — sidebar and bar point to the same hrefs */
    const seen = new Set();
    const sections = [...allTocLinks]
      .map(l => document.querySelector(l.getAttribute('href')))
      .filter(el => {
        if (!el || seen.has(el.id)) return false;
        seen.add(el.id);
        return true;
      });

    function setActive(id) {
      allTocLinks.forEach(l => {
        l.classList.toggle('is-active', l.getAttribute('href') === '#' + id);
      });

      /* Scroll the active bar item into view horizontally */
      const activeBar = document.querySelector(`.case__toc-bar-link[href="#${id}"]`);
      if (activeBar) {
        activeBar.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }

    if (sections.length) setActive(sections[0].id);

    const io2 = new IntersectionObserver(entries => {
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

  /* ── Flow video: autoplay on viewport entry + custom controls ── */
  document.querySelectorAll('.flow__device').forEach(device => {
    const video    = device.querySelector('.flow__video');
    const pauseBtn = device.querySelector('.flow__btn--pause');
    const replayBtn = device.querySelector('.flow__btn--replay');
    if (!video) return;

    /* Play when ≥40% of the device is visible; pause when it leaves */
    const ioVid = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
          if (pauseBtn) pauseBtn.classList.add('is-playing');
        } else {
          video.pause();
          if (pauseBtn) pauseBtn.classList.remove('is-playing');
        }
      });
    }, { threshold: 0.4 });
    ioVid.observe(device);

    /* Pause / play toggle */
    if (pauseBtn) {
      pauseBtn.addEventListener('click', () => {
        if (video.paused) {
          video.play();
          pauseBtn.classList.add('is-playing');
        } else {
          video.pause();
          pauseBtn.classList.remove('is-playing');
        }
      });
    }

    /* Replay from start */
    if (replayBtn) {
      replayBtn.addEventListener('click', () => {
        video.currentTime = 0;
        video.play();
        if (pauseBtn) pauseBtn.classList.add('is-playing');
      });
    }

    /* Volume button + slider */
    const volBtn    = device.querySelector('.flow__btn--volume');
    const volSlider = device.querySelector('.flow__volume-slider');
    if (volBtn && volSlider) {
      /* Range is 0→1 left-to-right, but rotated -90deg so:
         visually "up" = right = high value. No inversion needed. */
      volSlider.addEventListener('input', () => {
        const val = parseFloat(volSlider.value);
        video.volume = val;
        video.muted  = val === 0;
        volBtn.classList.toggle('is-muted', video.muted);
      });
      /* Click button → toggle mute, sync slider */
      volBtn.addEventListener('click', () => {
        video.muted = !video.muted;
        volBtn.classList.toggle('is-muted', video.muted);
        if (!video.muted && video.volume === 0) video.volume = 1;
        volSlider.value = video.muted ? 0 : video.volume;
      });
    }

    /* When video ends naturally, flip button back to play */
    video.addEventListener('ended', () => {
      if (pauseBtn) pauseBtn.classList.remove('is-playing');
    });
  });

  /* ── Image zoom: magnify button + lightbox ───────────────── */
  (function () {
    /* Build the shared modal once */
    const modal = document.createElement('div');
    modal.className = 'zoom-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Image viewer');
    modal.innerHTML = `
      <div class="zoom-modal__inner">
        <img class="zoom-modal__img" src="" alt="" />
        <button class="zoom-modal__close" aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>`;
    document.body.appendChild(modal);

    const modalImg   = modal.querySelector('.zoom-modal__img');
    const closeBtn   = modal.querySelector('.zoom-modal__close');

    function openModal(src, alt) {
      modalImg.src = src;
      modalImg.alt = alt || '';
      modal.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    }
    function closeModal() {
      modal.classList.remove('is-open');
      document.body.style.overflow = '';
    }

    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

    /* Magnify SVG */
    const zoomSVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>`;

    /* Wrap every img.case__frame in .img-zoom-wrap and inject button */
    document.querySelectorAll('img.case__frame').forEach(img => {
      /* Skip if already wrapped */
      if (img.parentElement.classList.contains('img-zoom-wrap')) return;

      const wrap = document.createElement('div');
      wrap.className = 'img-zoom-wrap';

      /* Carry over the figure's border/outline via the wrap inheriting display */
      img.parentNode.insertBefore(wrap, img);
      wrap.appendChild(img);

      const btn = document.createElement('button');
      btn.className = 'img-zoom-btn';
      btn.setAttribute('aria-label', 'View full size');
      btn.innerHTML = zoomSVG;
      wrap.appendChild(btn);

      btn.addEventListener('click', () => openModal(img.src, img.alt));
    });
  })();

})();