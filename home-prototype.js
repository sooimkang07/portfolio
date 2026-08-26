/* ============================================================
   HOMEPAGE — Koto interactions
   Live clock, expanding header, work scroll sync, showreel
   ============================================================ */
(function () {
  'use strict'

  if (!document.body.classList.contains('home')) return

  /* ── Live clock (LOCAL TIME) ──────────────────────────────── */
  function updateClock() {
    const now = new Date()
    const time = now.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'America/New_York'
    })
    const label = `${time} LOCAL TIME`
    document.querySelectorAll('.js-clock').forEach(el => {
      el.textContent = label
      if (el.tagName === 'TIME') el.dateTime = now.toISOString()
    })
  }

  updateClock()
  setInterval(updateClock, 1000)

  /* ── Header bar: top strip, scroll collapse, click open ───── */
  const header = document.querySelector('[data-ref-header-bar]')
  const hit = header && header.querySelector('.nav__hit')
  const logo = header && header.querySelector('.nav__logo')
  const burger = header && header.querySelector('.nav__burger')
  const menu = header && header.querySelector('#nav-menu')
  const backdrop = header && header.querySelector('[data-ref-header-backdrop]')
  const navDesktop = window.matchMedia('(width >= 770px)')
  const SCROLL_COLLAPSE = 64

  function setBackdrop(show) {
    if (!backdrop) return
    backdrop.hidden = !show
  }

  function setNavOpen(open) {
    if (!header) return
    document.body.classList.toggle('is-nav-open', open)
    header.classList.toggle('is-nav-open', open)
    if (hit) hit.setAttribute('aria-expanded', String(open))
    if (burger) burger.setAttribute('aria-expanded', String(open))
    if (menu) menu.classList.toggle('is-open', open && !navDesktop.matches)
    setBackdrop(open)
  }

  function syncNavTop() {
    if (!header) return
    const atTop = window.scrollY <= SCROLL_COLLAPSE
    header.classList.toggle('is-at-top', atTop)
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

    /* Desktop: after scroll, bar/logo toggle menu; close also via backdrop / Esc */
    if (hit) {
      hit.addEventListener('click', e => {
        e.preventDefault()
        if (!navDesktop.matches) return
        if (header.classList.contains('is-at-top')) return
        setNavOpen(!document.body.classList.contains('is-nav-open'))
      })
    }

    /* Collapsed: logo toggles menu instead of going home */
    if (logo) {
      logo.addEventListener('click', e => {
        if (!navDesktop.matches) return
        if (header.classList.contains('is-at-top')) return
        e.preventDefault()
        setNavOpen(!document.body.classList.contains('is-nav-open'))
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

  function syncIndexPin() {
    if (!workIndex || !cards[0] || !workSection) return
    const mid = window.innerHeight * 0.5
    const yapTop = cards[0].getBoundingClientRect().top
    const workBottom = workSection.getBoundingClientRect().bottom
    const shouldPin = yapTop <= mid && workBottom > mid

    if (shouldPin) {
      if (!workIndex.classList.contains('is-pinned')) {
        const shell = workIndexShell || workIndex
        const r = workIndex.getBoundingClientRect()
        const shellR = shell.getBoundingClientRect()
        workIndex.style.inlineSize = `${r.width}px`
        workIndex.style.insetInlineStart = `${Math.max(r.left, shellR.left)}px`
        if (workIndexShell) {
          workIndexShell.style.minBlockSize = `${Math.max(shellR.height, window.innerHeight)}px`
        }
      }
      workIndex.classList.add('is-pinned')
    } else {
      workIndex.classList.remove('is-pinned')
      workIndex.style.inlineSize = ''
      workIndex.style.insetInlineStart = ''
    }
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
      if (workIndex?.classList.contains('is-pinned')) {
        workIndex.classList.remove('is-pinned')
        workIndex.style.inlineSize = ''
        workIndex.style.insetInlineStart = ''
      }
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
    document.addEventListener('pointermove', e => {
      cursor.style.insetInlineStart = `${e.clientX}px`
      cursor.style.insetBlockStart = `${e.clientY}px`
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

  /* ── Showreel: cursor, play overlay, corner toggle ───────── */
  const media = document.querySelector('[data-ref-showreel-video]')
  const bgVideo = media && media.querySelector('.home-hero__video')
  const toggle = media && media.querySelector('.home-hero__toggle')
  const ringBar = media && media.querySelector('.home-hero__ring-bar')
  const toggleIcon = media && media.querySelector('.home-hero__toggle-icon')
  const showreel = document.querySelector('.home-showreel')
  const showreelVideo = showreel && showreel.querySelector('.home-showreel__video')

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
    if (!showreel || !showreelVideo) return
    setNavOpen(false)
    showreel.hidden = false
    document.body.classList.add('is-showreel-open')
    showCursor('is-close-cursor')
    if (bgVideo) bgVideo.pause()
    showreelVideo.currentTime = bgVideo ? bgVideo.currentTime : 0
    showreelVideo.muted = false
    showreelVideo.play().catch(() => {
      showreelVideo.muted = true
      showreelVideo.play().catch(() => {})
    })
  }

  function closeShowreel() {
    if (!showreel || !showreelVideo) return
    showreel.hidden = true
    document.body.classList.remove('is-showreel-open')
    showCursor(null)
    showreelVideo.pause()
    showreelVideo.muted = true
    if (bgVideo) {
      bgVideo.currentTime = showreelVideo.currentTime
      bgVideo.play().catch(() => {})
      setToggleState(bgVideo.paused)
    }
  }

  if (media && bgVideo) {
    media.addEventListener('pointerenter', () => {
      if (!document.body.classList.contains('is-showreel-open')) showCursor('is-hero-cursor')
    })
    media.addEventListener('pointerleave', () => {
      if (!document.body.classList.contains('is-showreel-open')) showCursor(null)
    })

    media.addEventListener('click', e => {
      if (e.target.closest('.home-hero__toggle')) return
      openShowreel()
    })

    if (toggle) {
      toggle.addEventListener('click', e => {
        e.stopPropagation()
        if (bgVideo.paused) bgVideo.play().catch(() => {})
        else bgVideo.pause()
        setToggleState(bgVideo.paused)
      })
    }

    bgVideo.addEventListener('timeupdate', updateRing)
    bgVideo.addEventListener('play', () => setToggleState(false))
    bgVideo.addEventListener('pause', () => setToggleState(true))
  }

  if (showreel) {
    showreel.addEventListener('click', () => closeShowreel())
    showreel.addEventListener('pointerenter', () => showCursor('is-close-cursor'))
    showreel.addEventListener('pointermove', () => {
      if (document.body.classList.contains('is-showreel-open')) showCursor('is-close-cursor')
    })
  }

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && document.body.classList.contains('is-showreel-open')) {
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
  const pinSpacer = document.querySelector('.home-hero__pin-spacer')
  const titleWrap = document.querySelector('[data-ref-showreel-title-container]')
  const introCopy = document.querySelector('[data-ref-intro-copy]')
  const desktopHero = window.matchMedia('(width >= 900px)')
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

    const words = source.split(/\s+/).filter(Boolean)
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
    groups.forEach(group => {
      const line = document.createElement('span')
      line.className = 'home-intro__line'
      const inner = document.createElement('span')
      inner.className = 'home-intro__line-inner'
      inner.textContent = group.map(w => w.textContent).join(' ')
      line.appendChild(inner)
      frag.appendChild(line)
    })

    introCopy.replaceChildren(frag)
    introLines = [...introCopy.querySelectorAll('.home-intro__line-inner')]
  }

  function syncHeroIntroScroll() {
    if (!desktopHero.matches || reduceMotion) {
      if (titleWrap) {
        titleWrap.style.opacity = ''
        titleWrap.style.transform = ''
      }
      introLines.forEach(line => {
        line.style.transform = 'translate3d(0, 0, 0)'
      })
      return
    }

    if (pinSpacer && titleWrap) {
      const rect = pinSpacer.getBoundingClientRect()
      const range = Math.max(1, pinSpacer.offsetHeight - window.innerHeight)
      const scrolled = Math.min(range, Math.max(0, -rect.top))
      const progress = scrolled / range
      const titleOut = Math.min(1, progress * 1.35)
      titleWrap.style.opacity = String(0.72 * (1 - titleOut))
      titleWrap.style.transform = `translate3d(0, ${titleOut * -28}%, 0)`
    }

    if (introLines.length) {
      const start = window.innerHeight * 0.95
      const end = window.innerHeight * 0.42

      introLines.forEach(line => {
        const row = line.closest('.home-intro__line') || line
        const top = row.getBoundingClientRect().top
        const t = Math.min(1, Math.max(0, (start - top) / Math.max(1, start - end)))
        const eased = t * t * (3 - 2 * t)
        line.style.transform = `translate3d(0, ${(1 - eased) * 110}%, 0)`
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
  window.addEventListener('resize', () => {
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

  /* ── Keep hero video playing ─────────────────────────────── */
  window.addEventListener('load', () => {
    document.querySelectorAll('.home-hero video').forEach(video => {
      video.play().catch(() => {})
    })
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
