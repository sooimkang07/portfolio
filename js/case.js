/* ============================================================
   CASE — shared behavior for every project page
   1. Video playback (in-view autoplay, pause/replay/volume)
   2. Image zoom lightbox
   ============================================================ */
(() => {
	'use strict'

	// Pair text with a single video, excluding galleries and mixed-media figures.
 document.querySelectorAll('.nt-step, .nt-section').forEach(section => {
  const children = [...section.children];
  const copy = children.find(el => el.matches('.nt-reading'));
  const media = children.find(el => el.matches('figure.nt-media'));
  if (children.length === 2 && copy && media &&
      media.querySelectorAll('video').length === 1 &&
      !media.matches('.cs-gallery') &&
      !media.querySelector('img, .dx-grid, .ig-gallery')) {
   section.classList.add('case-single-video');
  }
 });

	// No orphans: glue each text block's last two words so a line never ends on one word.
	document.querySelectorAll('main :is(p, li, h1, h2, h3, h4, dd, figcaption)').forEach(el => {
		const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
		let last = null
		while (walker.nextNode()) if (walker.currentNode.nodeValue.trim()) last = walker.currentNode
		if (!last) return
		const text = last.nodeValue.replace(/\s+$/, '')
		const i = text.lastIndexOf(' ')
		if (i < 1 || text.length - i > 18) return
		last.nodeValue = text.slice(0, i) + ' ' + text.slice(i + 1) + last.nodeValue.slice(text.length)
	})

	const reduced = matchMedia('(prefers-reduced-motion: reduce)')


	// Side-by-side media that keep their own proportions: each cell's width follows its media's
	// aspect ratio, so both share one height (figure[data-fit-row] > .cs-cell, CSS reads --ar).
	document.querySelectorAll('[data-fit-row] .cs-cell').forEach(cell => {
		const m = cell.querySelector('img, video')
		if (!m) return
		const set = (w, h) => { if (w && h) cell.style.setProperty('--ar', (w / h).toFixed(4)) }
		if (m.tagName === 'IMG') { if (m.complete) set(m.naturalWidth, m.naturalHeight); else m.addEventListener('load', () => set(m.naturalWidth, m.naturalHeight)) }
		else { if (m.readyState >= 1) set(m.videoWidth, m.videoHeight); else m.addEventListener('loadedmetadata', () => set(m.videoWidth, m.videoHeight)) }
	})

	/* ── 1. Video playback ─────────────────────────────────── */
	function realVideo(device) {
		const v = device.querySelector('video')
		return v && typeof v.play === 'function' ? v : null
	}

	/* Every case-study video gets the same glass pause + replay pair, top-right.
	   Videos whose markup already carries controls are left alone; videos with native
	   controls (long talks with sound) and the stepped Notate onboarding keep theirs.
   Add data-no-controls to a figure to show its videos without any buttons. */
	const CONTROLS = '<div class="flow__controls"><button class="glass flow__btn flow__btn--pause is-playing" type="button" aria-label="Pause video"><svg class="icon-pause" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="5" y="4" width="4" height="16" rx="1"></rect><rect x="15" y="4" width="4" height="16" rx="1"></rect></svg><svg class="icon-play" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="5,3 19,12 5,21"></polygon></svg></button><button class="glass flow__btn flow__btn--replay" type="button" aria-label="Replay video"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 .49-4.5"></path></svg></button></div>'
	const hasControls = v => {
		for (let a = v.parentElement, i = 0; a && i < 4; a = a.parentElement, i++) {
			if (a.querySelector(':scope > :is(.flow__controls, .sb-video-controls, .ig-scene-controls)')) return true
		}
		return false
	}
	document.querySelectorAll('body.case-page main video').forEach(v => {
		if (v.hasAttribute('controls') || v.closest('.nt-onboarding, [data-no-controls]') || hasControls(v)) return
		const host = v.parentElement
		if (host.querySelectorAll('video').length > 1) return
		host.classList.add('vc-host')
		host.insertAdjacentHTML('beforeend', CONTROLS)
	})

	document.querySelectorAll('.flow__device, .ig-gallery__tile, .dx-media:has(> .flow__controls), .vc-host').forEach(device => {
		const video = realVideo(device)
		const pauseBtn = device.querySelector('.flow__btn--pause')
		const replayBtn = device.querySelector('.flow__btn--replay')
		if (!video) return
		video.muted = true
		video.controls = false

		const sync = () => {
			if (!pauseBtn) return
			pauseBtn.classList.toggle('is-playing', !video.paused)
			pauseBtn.setAttribute('aria-label', video.paused ? 'Play video' : 'Pause video')
		}
		const play = () => { if (!reduced.matches && !video.dataset.userPaused) video.play().catch(sync) }

		video.addEventListener('play', sync)
		video.addEventListener('pause', sync)
		video.addEventListener('ended', sync)

		pauseBtn?.addEventListener('click', e => {
			e.stopPropagation()
			if (video.paused) { delete video.dataset.userPaused; video.play().catch(sync) }
			else { video.dataset.userPaused = '1'; video.pause() }
		})
		replayBtn?.addEventListener('click', e => {
			e.stopPropagation()
			delete video.dataset.userPaused
			video.currentTime = 0
			video.play().catch(sync)
		})

		const volBtn = device.querySelector('.flow__btn--volume')
		const volSlider = device.querySelector('.flow__volume-slider')
		if (volBtn) {
			volBtn.classList.add('is-muted')
			if (volSlider) volSlider.value = 0
			volSlider?.addEventListener('input', () => {
				const val = parseFloat(volSlider.value)
				video.volume = val
				video.muted = val === 0
				volBtn.classList.toggle('is-muted', video.muted)
			})
			volBtn.addEventListener('click', e => {
				e.stopPropagation()
				video.muted = !video.muted
				if (!video.muted && video.volume === 0) video.volume = 1
				volBtn.classList.toggle('is-muted', video.muted)
				volBtn.setAttribute('aria-label', video.muted ? 'Unmute video' : 'Mute video')
				if (volSlider) volSlider.value = video.muted ? 0 : video.volume
			})
		}

		if ('IntersectionObserver' in window) {
			new IntersectionObserver(entries => entries.forEach(entry => {
				if (entry.isIntersecting) play()
				else if (!video.closest('[data-case-cover]') || !document.documentElement.classList.contains('is-project-morph-pending')) video.pause()
			}), { threshold: 0.25 }).observe(device)
		} else play()
		sync()
	})

	document.addEventListener('visibilitychange', () => {
		if (document.hidden) return
		document.querySelectorAll('.flow__device video, .ig-gallery__tile video').forEach(v => {
			const r = v.getBoundingClientRect()
			if (r.bottom > 0 && r.top < innerHeight && !v.dataset.userPaused && typeof v.play === 'function') v.play().catch(() => {})
		})
	})

	/* Figures marked data-reveal animate in once, when scrolled into view (hidden only once JS is running) */
	const reveals = document.querySelectorAll('[data-reveal]')
	if (reveals.length && 'IntersectionObserver' in window && !reduced.matches) {
		const io = new IntersectionObserver(entries => entries.forEach(e => {
			if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target) }
		}), { threshold: 0.35 })
		reveals.forEach(el => { el.classList.add('reveal-ready'); io.observe(el) })
	}

	/* ── 2. Image zoom lightbox ─────────────────────────────── */
	const frames = document.querySelectorAll('main img.case__frame[src]')
	if (frames.length) {
		const modal = document.createElement('div')
		modal.className = 'zoom-modal'
		modal.setAttribute('role', 'dialog')
		modal.setAttribute('aria-modal', 'true')
		modal.setAttribute('aria-label', 'Image viewer')
		modal.innerHTML = '<div class="zoom-modal__inner"><img class="zoom-modal__img" src="" alt=""><button class="zoom-modal__close" type="button" aria-label="Close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>'
		document.body.appendChild(modal)
		const modalImg = modal.querySelector('.zoom-modal__img')
		const close = () => { modal.classList.remove('is-open'); document.body.style.overflow = '' }
		modal.querySelector('.zoom-modal__close').addEventListener('click', close)
		modal.addEventListener('click', e => { if (e.target === modal) close() })
		addEventListener('keydown', e => { if (e.key === 'Escape') close() })
		frames.forEach(img => {
			if (!img.getAttribute('src')) return
			img.style.cursor = 'zoom-in'
			img.addEventListener('click', () => {
				modalImg.src = img.currentSrc || img.src
				modalImg.alt = img.alt || ''
				modal.classList.add('is-open')
				document.body.style.overflow = 'hidden'
			})
		})
	}
})()

// Shared body links reuse the TOC flip track, including wrapped reference labels.
;(() => {
 const init = () => {
  const links = document.querySelectorAll('body.case-page main p a[href], body.case-page main .nt-reading li a[href], body.case-page main .nt-meta dd a[href]')
  const resize = new ResizeObserver(entries => entries.forEach(({ target }) => {
   const label = target.querySelector('.body-link__label')
   if (label) target.style.setProperty('--body-link-height', `${label.getBoundingClientRect().height}px`)
  }))
  links.forEach(link => {
   if (link.classList.contains('body-link') || link.querySelector('img, svg') || link.matches('[role="button"], .ac-btn, .fg-btn')) return
   const label = link.textContent.trim().replace(/\s*↗\s*$/, '')
   if (!label) return
   link.classList.add('body-link')
   const flip = document.createElement('span'); flip.className = 'flip'
   const track = document.createElement('span'); track.className = 'flip__track'
   const first = document.createElement('span'); first.className = 'body-link__label'; first.textContent = `${label} ↗`
   const second = first.cloneNode(true); second.setAttribute('aria-hidden', 'true')
   track.append(first, second); flip.append(track); link.replaceChildren(flip)
   resize.observe(link)
  })
 }
 if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true })
 else init()
})()

// Phones and tablets: once the TOC strip is stuck under the nav, it slides away while scrolling down
// and slides back on any scroll up (css/case.css .nt-rail.is-tucked).
;(() => {
 const rail = document.querySelector('body.case-page .nt-rail')
 if (!rail) return
 const strip = matchMedia('(max-width: 1199px)')
 let lastY = scrollY, travel = 0, ticking = false, holdUntil = 0
 const update = () => {
  ticking = false
  const y = scrollY, dy = y - lastY
  lastY = y
  if (!strip.matches) { rail.classList.remove('is-tucked', 'is-stuck'); return }
  const stuck = rail.getBoundingClientRect().top <= parseFloat(getComputedStyle(rail).top) + 1
  rail.classList.toggle('is-stuck', strip.matches && stuck)   // the band above it only paints while stuck (css/case.css)
  // a few pixels of travel in one direction before it reacts, so small jitters don't flicker it
  travel = (dy > 0) === (travel > 0) ? travel + dy : dy
  if (!stuck || y < 80 || performance.now() < holdUntil) rail.classList.remove('is-tucked')
  else if (travel > 12) rail.classList.add('is-tucked')
  else if (travel < -12) rail.classList.remove('is-tucked')
 }
 addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update) } }, { passive: true })
 strip.addEventListener('change', update)
 update()
 // A TOC tap scrolls down to its section: keep the strip visible for that jump
 rail.addEventListener('click', () => { rail.classList.remove('is-tucked'); travel = 0; holdUntil = performance.now() + 1200 })
})()
