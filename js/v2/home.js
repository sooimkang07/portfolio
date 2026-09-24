/* HOME (v2): showreel chapters + grow-to-bleed on scroll */
(() => {
	'use strict'
	const reel = document.querySelector('[data-reel]')
	if (!reel) return
	const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
	const frame = reel.querySelector('.reel__frame')
	const clips = [...reel.querySelectorAll('.reel__clip')]
	const segs = [...reel.querySelectorAll('.reel__seg')]
	let active = 0, paused = reduced, inView = false, raf = 0

	const setCursor = () => { frame.dataset.cursor = paused ? 'Play' : 'Pause'; const pill = document.querySelector('.cursor-pill.is-on'); if (pill) pill.textContent = frame.dataset.cursor }

	function show(i) {
		clips[active].pause()
		active = (i + clips.length) % clips.length
		clips.forEach((c, n) => c.classList.toggle('is-active', n === active))
		segs.forEach((s, n) => {
			s.classList.toggle('is-active', n === active)
			s.classList.toggle('is-done', n < active)
			s.setAttribute('aria-selected', String(n === active))
			s.querySelector('i').style.transform = n < active ? 'scaleX(1)' : 'scaleX(0)'
		})
		const c = clips[active]
		c.preload = 'auto'
		c.currentTime = 0
		if (!paused && inView) c.play().catch(() => {})
		// warm the next clip
		const next = clips[(active + 1) % clips.length]
		if (next.preload === 'none') next.preload = 'metadata'
	}

	function tick() {
		const c = clips[active]
		if (c.duration) segs[active].querySelector('i').style.transform = `scaleX(${Math.min(1, c.currentTime / c.duration)})`
		raf = requestAnimationFrame(tick)
	}

	clips.forEach((c, n) => c.addEventListener('ended', () => { if (n === active) show(active + 1) }))
	segs.forEach((s, n) => s.addEventListener('click', e => { e.stopPropagation(); show(n) }))
	frame.addEventListener('click', e => {
		if (e.target.closest('.reel__bar')) return
		paused = !paused
		paused ? clips[active].pause() : clips[active].play().catch(() => {})
		setCursor()
	})

	new IntersectionObserver(([e]) => {
		inView = e.isIntersecting
		if (inView && !paused) { clips[active].play().catch(() => {}); if (!raf) tick() }
		else { clips[active].pause(); cancelAnimationFrame(raf); raf = 0 }
	}, { threshold: 0.25 }).observe(frame)

	setCursor()
	show(0)

	/* Grow the frame to full bleed as it scrolls toward the top */
	if (!reduced) {
		const onScroll = () => {
			const r = reel.getBoundingClientRect()
			const start = innerHeight * 0.6, end = innerHeight * 0.08
			const p = Math.min(1, Math.max(0, (start - r.top) / (start - end)))
			reel.style.setProperty('--p', p.toFixed(3))
		}
		onScroll()
		addEventListener('scroll', onScroll, { passive: true })
		addEventListener('resize', onScroll)
	}
})()
