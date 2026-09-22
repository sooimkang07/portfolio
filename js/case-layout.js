/* Case layout helpers + Smart Bundles scroll motion */
(function () {
  'use strict';

  /* Auto-wrap stacked section intros into title|copy columns */
  function wrapIntros() {
    document.querySelectorAll('.case__body > section').forEach(function (section) {
      if (section.querySelector(':scope > .case__intro')) return;

      var kids = Array.prototype.slice.call(section.children);
      var stage = null;
      var eyebrow = null;
      var title = null;
      var copies = [];

      kids.forEach(function (el) {
        if (el.classList && el.classList.contains('case__stage')) stage = el;
        else if (el.classList && el.classList.contains('case__eyebrow') && !eyebrow) eyebrow = el;
        else if (el.classList && el.classList.contains('case__section-title') && !title) title = el;
        else if (el.classList && el.classList.contains('case__copy') && copies.length < 2 && title) {
          /* only immediate lead copy before media-ish blocks */
          if (!el.previousElementSibling || el.previousElementSibling === title || el.previousElementSibling === eyebrow || (copies.length && copies[copies.length-1] === el.previousElementSibling)) {
            copies.push(el);
          }
        }
      });

      if (stage && !eyebrow) {
        eyebrow = stage.querySelector('.case__eyebrow');
      }
      if (!title) return;

      var intro = document.createElement('div');
      intro.className = 'case__intro';
      var lead = document.createElement('div');
      lead.className = 'case__intro-lead';
      var body = document.createElement('div');
      body.className = 'case__intro-body';

      var insertBefore = title;
      if (stage) insertBefore = stage;
      else if (eyebrow) insertBefore = eyebrow;

      section.insertBefore(intro, insertBefore);
      intro.appendChild(lead);
      intro.appendChild(body);

      if (stage) {
        if (eyebrow) lead.appendChild(eyebrow);
        stage.remove();
      } else if (eyebrow) {
        lead.appendChild(eyebrow);
      }
      lead.appendChild(title);
      copies.forEach(function (c) { body.appendChild(c); });
    });
  }

  /* Scroll progress for loop stroke + parallax orbs */
  function bindViz() {
    var vizList = document.querySelectorAll('.sb-viz');
    if (!vizList.length) return;

    var reduceMotion = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function markIn() {
      vizList.forEach(function (v) { v.classList.add('is-in'); });
    }

    if (reduceMotion) {
      markIn();
      document.querySelectorAll('.sb-loop-progress').forEach(function (path) {
        path.style.strokeDashoffset = '0';
      });
      return;
    }

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) entry.target.classList.add('is-in');
        });
      }, { threshold: 0.28 });
      vizList.forEach(function (v) { io.observe(v); });
    } else {
      markIn();
    }

    var loops = document.querySelectorAll('.sb-viz--loop');
    var orbs = document.querySelectorAll('.sb-viz [data-parallax]');

    function onScroll() {
      var vh = window.innerHeight || 1;
      loops.forEach(function (viz) {
        var path = viz.querySelector('.sb-loop-progress');
        if (!path) return;
        var rect = viz.getBoundingClientRect();
        var t = 1 - Math.min(1, Math.max(0, rect.bottom / (vh + rect.height)));
        path.style.strokeDashoffset = String(1 - t);
      });
      orbs.forEach(function (orb) {
        var host = orb.closest('.sb-viz');
        if (!host) return;
        var rect = host.getBoundingClientRect();
        var p = (vh / 2 - (rect.top + rect.height / 2)) / vh;
        var depth = parseFloat(orb.getAttribute('data-parallax') || '12');
        orb.style.transform = 'translate3d(0,' + (p * depth) + 'px,0)';
      });
    }

    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () { onScroll(); ticking = false; });
    }, { passive: true });
    onScroll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      wrapIntros();
      bindViz();
    });
  } else {
    wrapIntros();
    bindViz();
  }
})();
