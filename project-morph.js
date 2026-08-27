/* ============================================================
   Project media morph — home card → case study hero video
   Mirrors Koto-style shared-element expand across page load.
   ============================================================ */
(function () {
  'use strict'

  const STORAGE_KEY = 'sooim-project-morph'
  const MAX_AGE_MS = 14000
  const DURATION_MS = 1700
  const REVEAL_SETTLE_MS = 2600
  const EASE = 'cubic-bezier(0.65, 0, 0.35, 1)'
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  function readPayload() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY)
      if (!raw) return null
      const data = JSON.parse(raw)
      if (!data || !data.id || !data.rect) return null
      if (Date.now() - (data.ts || 0) > MAX_AGE_MS) {
        sessionStorage.removeItem(STORAGE_KEY)
        return null
      }
      return data
    } catch {
      return null
    }
  }

  function clearPayload() {
    try {
      sessionStorage.removeItem(STORAGE_KEY)
    } catch {}
  }

  function rectPayload(el) {
    const r = el.getBoundingClientRect()
    const cs = getComputedStyle(el)
    return {
      top: r.top,
      left: r.left,
      width: r.width,
      height: r.height,
      radius: cs.borderRadius || '0px'
    }
  }

  function buildClone(data) {
    const shell = document.createElement('div')
    shell.className = 'project-morph'
    shell.setAttribute('aria-hidden', 'true')
    Object.assign(shell.style, {
      top: `${data.rect.top}px`,
      left: `${data.rect.left}px`,
      width: `${data.rect.width}px`,
      height: `${data.rect.height}px`,
      borderRadius: data.rect.radius
    })

    let media
    if (data.isVideo) {
      media = document.createElement('video')
      media.className = 'project-morph__media'
      media.src = data.src
      media.muted = true
      media.playsInline = true
      media.loop = true
      media.preload = 'auto'
      media.currentTime = Math.max(0, data.time || 0)
      media.play().catch(() => {})
    } else {
      media = document.createElement('img')
      media.className = 'project-morph__media'
      media.src = data.src
      media.alt = ''
    }

    shell.appendChild(media)
    return shell
  }

  function captureFromMedia(mediaEl, id, href) {
    const visual = mediaEl.querySelector('video, img') || mediaEl
    const isVideo = visual.tagName === 'VIDEO'
    return {
      id,
      href,
      isVideo,
      src: isVideo ? (visual.currentSrc || visual.src) : visual.currentSrc || visual.src,
      time: isVideo ? visual.currentTime || 0 : 0,
      rect: rectPayload(mediaEl),
      ts: Date.now()
    }
  }

  function navigateWithMorph(e, href, id, mediaEl) {
    if (
      reduceMotion ||
      !mediaEl ||
      e.defaultPrevented ||
      e.button !== 0 ||
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey
    ) {
      return false
    }

    e.preventDefault()
    e.stopPropagation()

    const payload = captureFromMedia(mediaEl, id, href)
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    } catch {}

    const clone = buildClone(payload)
    document.documentElement.classList.add('is-project-morphing')
    mediaEl.style.opacity = '0'
    document.body.appendChild(clone)

    requestAnimationFrame(() => {
      window.location.href = href
    })
    return true
  }

  function initHome() {
    const cards = document.querySelectorAll('.home-work__card[data-project-morph]')
    cards.forEach(card => {
      const id = card.getAttribute('data-project-morph')
      const href = card.getAttribute('data-href')
      const media = card.querySelector('.home-work__media')
      if (!id || !href || !media) return

      const onNav = e => {
        const link = e.target.closest('a[href]')
        if (link && link.getAttribute('href') !== href && !link.classList.contains('home-work__media')) {
          /* allow unrelated links inside card if any */
        }
        navigateWithMorph(e, href, id, media)
      }

      card.addEventListener('click', onNav, true)
      media.addEventListener('click', onNav, true)
    })
  }

  function waitForTarget(selector, attempts) {
    return new Promise(resolve => {
      let left = attempts
      const tick = () => {
        const el = document.querySelector(selector)
        if (el) {
          const r = el.getBoundingClientRect()
          const readyVideo =
            el.tagName !== 'VIDEO' ||
            el.readyState >= 1 ||
            (el.videoWidth > 0 && el.videoHeight > 0)
          if (r.width > 1 && r.height > 1 && readyVideo) {
            resolve(el)
            return
          }
          if (el.tagName === 'VIDEO' && el.readyState < 1) {
            el.addEventListener(
              'loadedmetadata',
              () => resolve(el),
              { once: true }
            )
            /* keep polling as fallback */
          }
        }
        if (--left <= 0) {
          resolve(document.querySelector(selector))
          return
        }
        requestAnimationFrame(tick)
      }
      tick()
    })
  }

  async function initCase() {
    const payload = readPayload()
    if (!payload) {
      document.documentElement.classList.remove('is-project-morph-pending')
      return
    }

    window.scrollTo(0, 0)

    const target = await waitForTarget(`[data-project-morph-to="${payload.id}"]`, 90)
    clearPayload()

    if (!target || reduceMotion) {
      document.documentElement.classList.remove('is-project-morph-pending')
      return
    }

    /* Prefer an existing flying clone from the previous page (bfcache / rare);
       otherwise rebuild from stored rect. */
    let clone = document.querySelector('.project-morph')
    if (!clone) clone = buildClone(payload)
    if (!clone.parentNode) document.body.appendChild(clone)

    target.style.opacity = '0'
    if (target.tagName === 'VIDEO') {
      try {
        target.pause()
        target.currentTime = payload.time || 0
      } catch {}
    }

    const finish = () => {
      target.style.opacity = ''
      if (target.tagName === 'VIDEO') {
        try {
          target.currentTime = payload.time || 0
          target.muted = true
          target.play().catch(() => {})
        } catch {}
      }
      clone.remove()
      document.documentElement.classList.remove('is-project-morph-pending')
      document.documentElement.classList.remove('is-project-morphing')
      window.setTimeout(() => {
        document.documentElement.classList.remove('is-project-morph-revealing')
      }, Math.max(0, REVEAL_SETTLE_MS - DURATION_MS))
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const to = target.getBoundingClientRect()
        const toRadius = getComputedStyle(target).borderRadius || '0px'

        document.documentElement.classList.add('is-project-morph-revealing')

        clone.style.transition = [
          `top ${DURATION_MS}ms ${EASE}`,
          `left ${DURATION_MS}ms ${EASE}`,
          `width ${DURATION_MS}ms ${EASE}`,
          `height ${DURATION_MS}ms ${EASE}`,
          `border-radius ${DURATION_MS}ms ${EASE}`
        ].join(', ')

        clone.style.top = `${to.top}px`
        clone.style.left = `${to.left}px`
        clone.style.width = `${to.width}px`
        clone.style.height = `${to.height}px`
        clone.style.borderRadius = toRadius

        let done = false
        const complete = () => {
          if (done) return
          done = true
          finish()
        }

        clone.addEventListener('transitionend', complete, { once: true })
        window.setTimeout(complete, DURATION_MS + 180)
      })
    })
  }

  /* Mark pending ASAP when a morph payload exists for this case page */
  if (document.body && document.body.classList.contains('page--project')) {
    const pending = readPayload()
    if (pending && pending.id) {
      document.documentElement.classList.add('is-project-morph-pending')
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (document.body.classList.contains('home')) initHome()
      if (document.body.classList.contains('page--project')) initCase()
    })
  } else {
    if (document.body.classList.contains('home')) initHome()
    if (document.body.classList.contains('page--project')) initCase()
  }
})()
