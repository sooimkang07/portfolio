/* ============================================================
   SITE — chrome interactions (home, about, explorations)
   Live clock, expanding header, work scroll sync, showreel
   ============================================================ */
(function () {
  'use strict'

  if (!document.body.classList.contains('home')) return

  /* ── Nav strip links: fliptrack on hover ───────────────────── */
  document.querySelectorAll('.nav__strip-link').forEach(link => {
    if (link.querySelector('.flip')) return
    const label = link.textContent.trim()
    link.setAttribute('aria-label', label)
    link.innerHTML =
      '<span class="flip" aria-hidden="true"><span class="flip__track">' +
      `<span>${label}</span><span>${label}</span>` +
      '</span></span>'
  })

  /* ── Header bar: top strip, scroll collapse, click open ───── */
  const header = document.querySelector('[data-ref-header-bar]')
  const hit = header && header.querySelector('.nav__hit')
  const burger = header && header.querySelector('.nav__burger')
  const menu = header && header.querySelector('#nav-menu')
  const backdrop = header && header.querySelector('[data-ref-header-backdrop]')
  const navDesktop = window.matchMedia('(width >= 770px)')
  const SCROLL_COLLAPSE = 64
  const NAV_TRANSITION_MS = 900
  let navCloseTimer = 0

  function finishNavClose() {
    navCloseTimer = 0
    document.body.classList.remove('is-nav-open', 'is-nav-closing')
    header.classList.remove('is-nav-open', 'is-nav-closing')
    if (menu) menu.classList.remove('is-open')
  }

  function setBackdrop(show) {
    if (!backdrop) return
    backdrop.hidden = !show
  }

  function setNavOpen(open) {
    if (!header) return

    if (open) {
      window.clearTimeout(navCloseTimer)
      navCloseTimer = 0
      document.body.classList.remove('is-nav-closing')
      header.classList.remove('is-nav-closing')
      document.body.classList.add('is-nav-open')
      header.classList.add('is-nav-open')
      if (hit) hit.setAttribute('aria-expanded', 'true')
      if (burger) burger.setAttribute('aria-expanded', 'true')
      if (menu) menu.classList.add('is-open')
      setBackdrop(true)
      return
    }

    if (!document.body.classList.contains('is-nav-open')) return
    if (document.body.classList.contains('is-nav-closing')) return

    document.body.classList.add('is-nav-closing')
    header.classList.add('is-nav-closing')
    if (hit) hit.setAttribute('aria-expanded', 'false')
    if (burger) burger.setAttribute('aria-expanded', 'false')
    setBackdrop(false)

    navCloseTimer = window.setTimeout(finishNavClose, NAV_TRANSITION_MS)
  }

  function syncNavTop() {
    if (!header) return
    const atTop = window.scrollY <= SCROLL_COLLAPSE
    header.classList.toggle('is-at-top', atTop)
  }

  /* Logo + burger wear the shared .glass once the nav floats over content */
  const logo = header && header.querySelector('.nav__logo')
  function syncNavGlass() {
    const floating = !header.classList.contains('is-at-top')
    const open = header.classList.contains('is-nav-open')
    if (logo) logo.classList.toggle('is-compact', floating)
    if (burger) burger.classList.toggle('glass', floating || open)
  }
  if (header) {
    new MutationObserver(syncNavGlass).observe(header, { attributes: true, attributeFilter: ['class'] })
    syncNavGlass()
  }

  /* ── Nav contrast: each nav piece samples what sits behind it and
     takes .is-on-dark (light text) over dark media or fills ── */
  if (header) {
    const thumbs = new WeakMap()
    const probe = document.createElement('canvas')
    probe.width = probe.height = 24
    const pctx = probe.getContext('2d', { willReadFrequently: true })
    const lum = (r, g, b) => {
      const c = v => (v /= 255) <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
      return 0.2126 * c(r) + 0.7152 * c(g) + 0.0722 * c(b)
    }
    let hitVideo = false

    /* Only what's actually painted counts: skip layers hidden by opacity / visibility */
    const visible = n => !n.checkVisibility || n.checkVisibility({ opacityProperty: true, visibilityProperty: true })
    let frame = new Map()   // one 24px read per video or image per pass, not one per sample point

    /* Luminance of a media element at a viewport point (24px thumbnail, object-fit: cover) */
    function mediaLum(m, x, y) {
      const w = m.naturalWidth || m.videoWidth, h = m.naturalHeight || m.videoHeight
      if (!w || !h) return null
      if (m.tagName === 'VIDEO') hitVideo = true
      let data = frame.get(m)
      if (!data) {
        data = m.tagName === 'VIDEO' ? null : thumbs.get(m)
        if (!data || data.src !== m.currentSrc) {
          try {
            pctx.clearRect(0, 0, 24, 24)
            pctx.drawImage(m, 0, 0, 24, 24)
            data = { src: m.currentSrc, px: pctx.getImageData(0, 0, 24, 24).data }
            if (m.tagName !== 'VIDEO') thumbs.set(m, data)
          } catch (_) { return null }
        }
        data.rect = m.getBoundingClientRect()
        frame.set(m, data)
      }
      const r = data.rect
      const s = Math.max(r.width / w, r.height / h)
      const u = (x - r.left - (r.width - w * s) / 2) / (w * s)
      const v = (y - r.top - (r.height - h * s) / 2) / (h * s)
      const i = (Math.min(23, Math.max(0, Math.floor(v * 24))) * 24 + Math.min(23, Math.max(0, Math.floor(u * 24)))) * 4
      if (data.px[i + 3] < 128) return null
      return lum(data.px[i], data.px[i + 1], data.px[i + 2])
    }

    /* Luminance of whatever paints at a viewport point, under the nav */
    function lumAt(x, y) {
      const el = document.elementsFromPoint(x, y).find(n => !header.contains(n) && visible(n))
      if (!el) return null
      /* Media can be pointer-events: none, so also look inside the hit element */
      const inside = [...el.querySelectorAll('img, video')].reverse().find(m => {
        if (!visible(m)) return false
        const r = m.getBoundingClientRect()
        return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom
      })
      for (let n = inside || el; n && n !== document.documentElement; n = n.parentElement) {
        if (n.matches('img, video')) {
          const l = mediaLum(n, x, y)
          if (l !== null) return l
        }
        if (n.tagName === 'IFRAME') return 0
        const bg = getComputedStyle(n).backgroundColor.match(/[\d.]+/g)
        if (bg && (bg[3] === undefined || +bg[3] > 0.5)) return lum(+bg[0], +bg[1], +bg[2])
      }
      return null
    }

    /* Average luminance under one nav piece (null if nothing sampled) */
    function lumUnder(el) {
      const r = el.getBoundingClientRect()
      if (!r.width || !r.height) return null
      const ls = []
      for (const fx of [0.2, 0.5, 0.8]) for (const fy of [0.3, 0.7]) {
        const l = lumAt(r.left + r.width * fx, r.top + r.height * fy)
        if (l !== null) ls.push(l)
      }
      return ls.length ? ls.reduce((a, b) => a + b, 0) / ls.length : null
    }

    const pieces = () => [header.querySelector('.nav__logo'), burger, ...header.querySelectorAll('.nav__strip-link'), menu].filter(p => p && visible(p))
    let queued = false, last = 0, trailing = 0
    function syncNavContrast() {
      queued = false
      last = performance.now()
      hitVideo = false
      frame = new Map()
      // Menu open: everything sits on the frosted panel, so the text is always ink
      if (document.body.classList.contains('is-nav-open')) {
        header.classList.remove('is-nav-dark')
        header.querySelectorAll('.is-on-dark').forEach(p => p.classList.remove('is-on-dark'))
        return
      }
      // One decision for the whole nav, so every piece turns at the same moment. Hysteresis: it goes
      // light below 0.17 and back to ink only above 0.24, so a playing video can't flick it back and forth.
      const ls = pieces().map(lumUnder).filter(l => l !== null)
      if (!ls.length) return
      const dark = ls.reduce((a, b) => a + b, 0) / ls.length   // what the nav as a whole sits on
      const wasDark = header.classList.contains('is-nav-dark')
      const next = wasDark ? dark < 0.24 : dark < 0.17
      if (next === wasDark && header.querySelector('.is-on-dark') !== null === next) return
      // Flip every piece in the same frame: their own transitions (glass, staggered strip) would stagger it
      header.classList.add('is-nav-flip')
      header.classList.toggle('is-nav-dark', next)
      pieces().forEach(p => p.classList.toggle('is-on-dark', next))
      requestAnimationFrame(() => requestAnimationFrame(() => header.classList.remove('is-nav-flip')))
    }
    /* At most one pass every 120ms while scrolling, plus one when it settles */
    const queue = () => {
      clearTimeout(trailing)
      trailing = setTimeout(() => requestAnimationFrame(syncNavContrast), 140)
      if (queued || performance.now() - last < 120) return
      queued = true
      requestAnimationFrame(syncNavContrast)
    }
    addEventListener('scroll', queue, { passive: true })
    addEventListener('resize', queue)
    addEventListener('load', queue)
    document.addEventListener('load', queue, true)
    new MutationObserver(queue).observe(header, { attributes: true, attributeFilter: ['class'] })
    /* The menu and burger only have their final size once they finish animating in */
    header.addEventListener('transitionend', queue)
    /* Video frames change under a still nav */
    setInterval(() => { if (hitVideo && !document.hidden) queue() }, 500)
    queue()
  }

  if (header) {
    syncNavTop()

    navDesktop.addEventListener('change', () => {
      if (!navDesktop.matches) {
        if (!document.body.classList.contains('is-nav-open')) setBackdrop(false)
      } else if (menu) {
        menu.classList.remove('is-open')
      }
    })

    /* Desktop scrolled + mobile: burger toggles full-screen menu */
    if (hit) {
      hit.addEventListener('click', e => {
        e.preventDefault()
      })
    }

    if (burger && menu) {
      burger.addEventListener('click', e => {
        e.preventDefault()
        e.stopImmediatePropagation()
        setNavOpen(!document.body.classList.contains('is-nav-open'))
      }, true)
    }

    if (backdrop) {
      backdrop.addEventListener('click', () => setNavOpen(false))
    }

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && document.body.classList.contains('is-nav-open')) {
        setNavOpen(false)
      }
    })
  }

  /* ── Work scroll sync (Koto featured-project pattern) ─────── */
  const workSection = document.querySelector('.home-work')
  const workIndex = document.querySelector('.home-work__index')
  const workIndexShell = document.querySelector('.home-work__index-shell')
  const titlesWrap = document.querySelector('.home-work__titles')
  const cards = [...document.querySelectorAll('.home-work__card')]
  const titles = [...document.querySelectorAll('[data-work-title]')]
  const descs = [...document.querySelectorAll('[data-work-desc]')]
  const footers = [...document.querySelectorAll('[data-work-footer]')]
  let activeIndex = 0
  let titlesHeightTimer = 0
  const workDesktop = window.matchMedia('(width >= 1200px)')

  /* Whole-card click → case study (media/title/footer links also work) */
  cards.forEach(card => {
    const href = card.dataset.href
    if (!href) return
    card.style.cursor = 'pointer'
    card.addEventListener('click', e => {
      if (e.target.closest('a')) return
      window.location.href = href
    })
    card.addEventListener('keydown', e => {
      if (e.target !== card) return
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        window.location.href = href
      }
    })
  })

  function syncTitlesHeight(index, prevIndex = index) {
    if (!titlesWrap || !titles.length) return
    const active = titles[index]
    const prev = titles[prevIndex]
    const heights = [active, prev].filter(Boolean).map(el => el.scrollHeight)
    const nextH = Math.max(...heights, 1)
    titlesWrap.style.blockSize = `${nextH}px`

    window.clearTimeout(titlesHeightTimer)
    titlesHeightTimer = window.setTimeout(() => {
      const settled = titles[activeIndex]
      if (settled) titlesWrap.style.blockSize = `${settled.scrollHeight}px`
    }, 540)
  }

  function slideItems(items, index, prev, goingDown) {
    items.forEach((el, i) => {
      el.classList.remove('is-active', 'is-exit', 'is-enter-up', 'is-exit-down')
      if (i === index) {
        if (!goingDown && prev !== index) el.classList.add('is-enter-up')
        else el.classList.add('is-active')
      } else if (i === prev && prev !== index) {
        el.classList.add(goingDown ? 'is-exit' : 'is-exit-down')
      }
    })

    if (!goingDown && prev !== index) {
      const next = items[index]
      if (!next) return
      void next.offsetWidth
      requestAnimationFrame(() => {
        next.classList.remove('is-enter-up')
        next.classList.add('is-active')
      })
    }
  }

  function startCoverVideo(card) {
    if (!card) return
    const video = card.querySelector('.home-work__media video')
    if (!video || video.dataset.started === '1') return
    const r = card.getBoundingClientRect()
    const inView = r.bottom > 0 && r.top < window.innerHeight
    if (!inView) return
    video.dataset.started = '1'
    video.play().catch(() => {})
  }

  // Stacked cards (<1200, phones and tablets): every cover plays while it's on screen, like Koto's mobile list.
  // Without this only the active card starts, and iOS shows an empty box for a video that never played.
  if ('IntersectionObserver' in window) {
    const stacked = window.matchMedia('(width < 1200px)')
    const coverIO = new IntersectionObserver(entries => entries.forEach(({ target, isIntersecting }) => {
      if (!stacked.matches) return
      if (isIntersecting) target.play().catch(() => {})
      else target.pause()
    }), { threshold: 0.2 })
    cards.forEach(card => {
      const video = card.querySelector('.home-work__media video')
      if (video) coverIO.observe(video)
    })
  }

  function clearIndexPin() {
    if (!workIndex) return
    workIndex.classList.remove('is-pinned', 'is-docked')
    workIndex.style.inlineSize = ''
    workIndex.style.insetInlineStart = ''
  }

  function syncIndexPin() {
    if (!workIndex || !cards[0] || !workSection) return
    /* Sticky index pin only on desktop work layout */
    if (!workDesktop.matches) {
      clearIndexPin()
      return
    }
    // CSS sticky keeps the index inside its section without a fixed-position jump.
    clearIndexPin()
  }

  function setActive(index) {
    if (index === activeIndex && cards[index]?.classList.contains('is-active')) {
      startCoverVideo(cards[index])
      syncTitlesHeight(index, index)
      return
    }
    const prev = activeIndex
    const goingDown = index >= prev
    activeIndex = index

    cards.forEach((card, i) => card.classList.toggle('is-active', i === index))
    slideItems(titles, index, prev, goingDown)
    slideItems(descs, index, prev, goingDown)
    footers.forEach((footer, i) => footer.classList.toggle('is-active', i === index))
    syncTitlesHeight(index, prev)
    startCoverVideo(cards[index])
  }

  function syncActive() {
    if (!cards.length) return
    const mid = window.innerHeight * 0.5
    let best = 0
    for (let i = 0; i < cards.length; i++) {
      if (cards[i].getBoundingClientRect().top <= mid) best = i
    }
    setActive(best)
    syncIndexPin()
  }

  if (cards.length) {
    let ticking = false
    window.addEventListener('scroll', () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        syncActive()
        ticking = false
      })
    }, { passive: true })
    window.addEventListener('resize', () => {
      clearIndexPin()
      syncTitlesHeight(activeIndex)
      syncActive()
    }, { passive: true })
    syncTitlesHeight(0)
    syncActive()
  }

  /* ── Custom cursor ────────────────────────────────────────── */
  const cursor = document.querySelector('.home-cursor')
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const desktop = window.matchMedia('(width >= 900px)')

  if (cursor && !reduceMotion) {
    cursor.hidden = false
    // Composited: one transform per frame, no layout (left/top made it trail the pointer)
    let cx = 0, cy = 0, cursorTick = false
    const moveCursor = () => {
      cursorTick = false
      cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0) translate(-50%, -50%)`
    }
    document.addEventListener('pointermove', e => {
      cx = e.clientX; cy = e.clientY
      if (!cursorTick) { cursorTick = true; requestAnimationFrame(moveCursor) }
    }, { passive: true })
  }

  function showCursor(mode) {
    if (!cursor || reduceMotion) return
    if (mode === 'is-close-cursor' || desktop.matches) {
      document.body.classList.remove('is-hero-cursor', 'is-work-cursor', 'is-close-cursor')
      if (mode) document.body.classList.add(mode)
    } else {
      document.body.classList.remove('is-hero-cursor', 'is-work-cursor', 'is-close-cursor')
    }
  }

  /* ── Showreel: loops behind the HTML greeting (js/intro.js starts it after the loader).
        A click opens the same video as a full-window player, so nothing reloads or has to seek a second copy. ── */
  const media = document.querySelector('[data-ref-showreel-video]')
  const bgVideo = media && media.querySelector('.home-hero__video')
  const toggle = media && media.querySelector('.home-hero__toggle')
  const ringBar = media && media.querySelector('.home-hero__ring-bar')
  const toggleIcon = media && media.querySelector('.home-hero__toggle-icon')
  const isPlayerOpen = () => document.body.classList.contains('is-showreel-open')

  const ICONS = {
    pause: '<svg viewBox="0 0 10 10" aria-hidden="true"><rect x="2.4" y="1.3" width="1.4" height="7.4"></rect><rect x="6.2" y="1.3" width="1.4" height="7.4"></rect></svg>',
    play: '<svg viewBox="0 0 10 10" aria-hidden="true"><path d="M2 1.2v7.6L8.8 5 2 1.2Z"></path></svg>'
  }

  function setToggleState(paused) {
    if (!toggle || !toggleIcon) return
    toggle.setAttribute('aria-label', paused ? 'Play' : 'Pause')
    toggleIcon.dataset.icon = paused ? 'play' : 'pause'
    toggleIcon.innerHTML = paused ? ICONS.play : ICONS.pause
  }

  function updateRing() {
    if (!bgVideo || !ringBar || !bgVideo.duration) return
    const p = bgVideo.currentTime / bgVideo.duration
    ringBar.style.strokeDashoffset = String(1 - p)
  }

  function openShowreel() {
    if (!media || !bgVideo || isPlayerOpen()) return
    setNavOpen(false)
    media.classList.add('is-player')
    document.body.classList.add('is-showreel-open')
    showCursor('is-close-cursor')
    // The full-window player is the whole film, from the start
    bgVideo.currentTime = 0
    bgVideo.muted = false
    bgVideo.play().catch(() => {
      bgVideo.muted = true
      bgVideo.play().catch(() => {})
    })
  }

  function closeShowreel() {
    if (!media || !bgVideo || !isPlayerOpen()) return
    media.classList.remove('is-player')
    document.body.classList.remove('is-showreel-open')
    showCursor(media.matches(':hover') ? 'is-hero-cursor' : null)
    bgVideo.muted = true
    document.body.classList.remove('is-cursor-native')
    // Back to the background loop, behind the HTML greeting
    bgVideo.currentTime = REEL_START
    if (!reduceMotion) bgVideo.play().catch(() => {})
    setToggleState(bgVideo.paused)
  }

  /* Background loop: the whole film. It has no greeting of its own (the HTML greeting sits over it) and its last
     frames settle back on its first (yap's empty studio), so it loops without a seam. */
  const REEL_START = 0
  if (bgVideo) {
    const keepInLoop = () => {
      if (isPlayerOpen()) return
      if (bgVideo.currentTime >= bgVideo.duration || bgVideo.currentTime < REEL_START - 0.05) bgVideo.currentTime = REEL_START
    }
    if ('requestVideoFrameCallback' in bgVideo) {
      const onFrame = () => { keepInLoop(); bgVideo.requestVideoFrameCallback(onFrame) }
      bgVideo.requestVideoFrameCallback(onFrame)
    } else bgVideo.addEventListener('timeupdate', keepInLoop)
  }

  if (media && bgVideo) {
    media.addEventListener('pointerenter', () => showCursor(isPlayerOpen() ? 'is-close-cursor' : 'is-hero-cursor'))
    media.addEventListener('pointermove', e => {
      if (e.target.closest('.home-hero__controls')) return
      if (isPlayerOpen() && !document.body.classList.contains('is-close-cursor')) showCursor('is-close-cursor')
    })
    media.addEventListener('pointerleave', () => {
      if (!isPlayerOpen()) showCursor(null)
    })

    media.addEventListener('click', e => {
      if (e.target.closest('.home-hero__toggle')) return
      if (isPlayerOpen()) closeShowreel()
      else openShowreel()
    })
    media.addEventListener('keydown', e => {
      if ((e.key === 'Enter' || e.key === ' ') && !isPlayerOpen()) {
        e.preventDefault()
        openShowreel()
      }
    })
    // The player closes itself when the reel ends, landing back on the greeting
    bgVideo.addEventListener('ended', () => {
      if (isPlayerOpen()) closeShowreel()
      else { bgVideo.currentTime = REEL_START; bgVideo.play().catch(() => {}) }
    })

    if (toggle) {
      toggle.addEventListener('click', e => {
        e.stopPropagation()
        if (bgVideo.paused) bgVideo.play().catch(() => {})
        else bgVideo.pause()
        setToggleState(bgVideo.paused)
      })
    }

    // Phones: glass play/pause on the reel. Plays in place (no full-window player); after the run ends it starts over.
    const heroBtn = media.querySelector('.home-hero__controls .flow__btn')
    if (heroBtn) {
      const syncHeroBtn = () => {
        const playing = !bgVideo.paused && !bgVideo.ended
        heroBtn.classList.toggle('is-playing', playing)
        heroBtn.setAttribute('aria-label', playing ? 'Pause the showreel' : 'Play the showreel')
      }
      ;['play', 'pause', 'ended'].forEach(type => bgVideo.addEventListener(type, syncHeroBtn))
      const heroReplay = media.querySelector('.home-hero__controls .flow__btn--replay')
      heroReplay?.addEventListener('click', e => {
        e.stopPropagation()
        bgVideo.currentTime = 0
        bgVideo.play().catch(() => {})
      })
      // Over the buttons, the Close cursor steps aside so they read as buttons
      const heroControls = media.querySelector('.home-hero__controls')
      heroControls?.addEventListener('pointerenter', () => document.body.classList.add('is-cursor-native'))
      heroControls?.addEventListener('pointerleave', () => document.body.classList.remove('is-cursor-native'))
      heroBtn.addEventListener('click', e => {
        e.stopPropagation()
        if (bgVideo.paused || bgVideo.ended) {
          if (bgVideo.ended) bgVideo.currentTime = 0
          bgVideo.play().catch(() => {})
        } else bgVideo.pause()
      })
      syncHeroBtn()
    }

    bgVideo.addEventListener('timeupdate', updateRing)
    bgVideo.addEventListener('play', () => setToggleState(false))
    bgVideo.addEventListener('pause', () => setToggleState(true))
  }

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && isPlayerOpen()) {
      e.preventDefault()
      closeShowreel()
    }
  })

  /* ── Work media cursor ───────────────────────────────────── */
  cards.forEach(card => {
    const workMedia = card.querySelector('.home-work__media')
    if (!workMedia) return

    workMedia.addEventListener('pointerenter', () => showCursor('is-work-cursor'))
    workMedia.addEventListener('pointerleave', () => showCursor(null))
  })

  /* ── Scroll: nav top + hero title out + intro lines flip in ─ */
  const introCopy = document.querySelector('[data-ref-intro-copy]')
  let introLines = []

  function buildIntroLines() {
    if (!introCopy) {
      introLines = []
      return
    }

    const source = introCopy.getAttribute('data-intro-text') || introCopy.textContent.trim()
    introCopy.setAttribute('data-intro-text', source)

    if (reduceMotion) {
      introCopy.textContent = source
      introLines = []
      return
    }

    // Glue the last two words together so the copy never ends on an orphan
    const words = source.replace(/ (\S+)$/, '\u00a0$1').split(/ +/).filter(Boolean)
    introCopy.replaceChildren(
      ...words.flatMap((word, i) => {
        const span = document.createElement('span')
        span.className = 'home-intro__word'
        span.textContent = word
        return i === 0 ? [span] : [document.createTextNode(' '), span]
      })
    )

    const wordEls = [...introCopy.querySelectorAll('.home-intro__word')]
    const groups = []
    let currentTop = null
    let current = []

    wordEls.forEach(word => {
      const top = word.offsetTop
      if (currentTop === null || Math.abs(top - currentTop) > 1) {
        if (current.length) groups.push(current)
        current = [word]
        currentTop = top
      } else {
        current.push(word)
      }
    })
    if (current.length) groups.push(current)

    const frag = document.createDocumentFragment()
    groups.forEach((group, i) => {
      const line = document.createElement('span')
      line.className = 'home-intro__line'
      const inner = document.createElement('span')
      inner.className = 'home-intro__line-inner'
      inner.style.setProperty('--intro-line', i)
      inner.textContent = group.map(w => w.textContent).join(' ')
      line.appendChild(inner)
      frag.appendChild(line)
    })

    introCopy.replaceChildren(frag)
    introLines = [...introCopy.querySelectorAll('.home-intro__line-inner')]
  }

  function syncHeroIntroScroll() {
    if (reduceMotion) {
      introLines.forEach(line => {
        line.style.transform = 'translate3d(0, 0, 0)'
      })
      return
    }


    // Expand the mask without changing layout or the video's crop on every scroll frame.
    const hero = document.querySelector('.home-hero')
    const greeting = document.querySelector('.home-greeting')
    if (hero && greeting) {
      const progress = Math.min(1, Math.max(0, (window.matchMedia('(max-width: 700px)').matches ? (window.scrollY > 0 ? 1 : 0) : window.scrollY / Math.max(1, greeting.offsetHeight * .9))))
      hero.style.setProperty('--reel-expand', progress)
    }
    if (introLines.length) {
      // Each line has its own scroll threshold, reversing in order on the way back.
      const top = introCopy.getBoundingClientRect().top
      introLines.forEach((line, i) => {
        line.classList.toggle('is-revealed', top < window.innerHeight * (.98 - i * .075))
      })
    }
  }


  let pinTick = false
  function onScrollFrame() {
    syncNavTop()
    syncHeroIntroScroll()
    pinTick = false
  }

  window.addEventListener('scroll', () => {
    if (pinTick) return
    pinTick = true
    requestAnimationFrame(onScrollFrame)
  }, { passive: true })

  let resizeTick = false
  let introWidth = window.innerWidth
  window.addEventListener('resize', () => {
    if (window.innerWidth === introWidth) { syncHeroIntroScroll(); return }
    introWidth = window.innerWidth
    if (resizeTick) return
    resizeTick = true
    requestAnimationFrame(() => {
      resizeTick = false
      buildIntroLines()
      syncNavTop()
      syncHeroIntroScroll()
    })
  }, { passive: true })

  buildIntroLines()
  syncNavTop()
  syncHeroIntroScroll()

  /* Line breaks are measured from the rendered font. If they were measured
     with the fallback font, re-measure once Instrument Sans has loaded. */
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      buildIntroLines()
      syncHeroIntroScroll()
    })
  }

  /* ── Start the hero reel when there was no intro (it plays through once) ── */
  window.addEventListener('load', () => {
    // While the intro is up it owns the start: it plays the reel when it lands on its first frame (js/intro.js).
    // With reduced motion the reel waits on its first frame, the greeting, until someone clicks it.
    if (reduceMotion || document.querySelector('.portfolio-intro')) return
    document.querySelectorAll('.home-hero video').forEach(video => {
      video.play().catch(() => {})
    })
  })

  // Keep the observed box stable while its contents expand from the corner.
  document.querySelectorAll('.portfolio-footer__portrait').forEach(portrait => {
    if (!('IntersectionObserver' in window)) return
    const motion = document.createElement('div')
    motion.className = 'portfolio-footer__portrait-motion'
    while (portrait.firstChild) motion.append(portrait.firstChild)
    portrait.append(motion)
    const observer = new IntersectionObserver(([entry]) => {
      motion.classList.toggle('is-visible', entry.isIntersecting || portrait.contains(document.activeElement))
    }, { threshold: 0.15, rootMargin: '0px 0px -5% 0px' })
    observer.observe(portrait)
    portrait.addEventListener('focusin', () => motion.classList.add('is-visible'))
  })

  /* ── Contact card: scale in on scroll (Koto mt-auto) ─────── */
  const contactCard = document.querySelector('.home-contact__card')
  const contactSlot = document.querySelector('.home-contact__card-slot') || contactCard
  if (contactCard && contactSlot && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      ([entry]) => {
        contactCard.classList.toggle('is-visible', entry.isIntersecting)
      },
      { threshold: 0.15, rootMargin: '0px 0px -5% 0px' }
    )
    io.observe(contactSlot)
  } else if (contactCard) {
    contactCard.classList.add('is-visible')
  }
})()
