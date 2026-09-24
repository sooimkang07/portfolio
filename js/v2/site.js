/* ============================================================
   SITE (v2): nav collapse + menu, roll labels, reveals,
   in-view video, media cursor, clock, kinetic word,
   footer wordmark, TOC scrollspy + running head.
   ============================================================ */
(() => {
	'use strict'
	const doc = document.documentElement
	doc.classList.add('js')
	const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
	const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches

	/* ── Roll labels: duplicate text into a two-line track ──── */
	document.querySelectorAll('[data-roll]').forEach(el => {
		if (el.querySelector('.roll__track')) return
		const text = el.textContent.trim()
		el.textContent = ''
		el.classList.add('roll')
		const track = document.createElement('span')
		track.className = 'roll__track'
		const a = document.createElement('span')
		a.textContent = text
		const b = document.createElement('span')
		b.textContent = text
		b.setAttribute('aria-hidden', 'true')
		track.append(a, b)
		el.append(track)
	})

	/* ── Nav: collapse after 64px, chip opens the glass menu ── */
	const nav = document.querySelector('[data-nav]')
	if (nav) {
		const chip = nav.querySelector('.nav__chip')
		const menu = nav.querySelector('.nav__menu')
		const backdrop = nav.querySelector('.nav__backdrop')
		const sync = () => doc.classList.toggle('is-scrolled', scrollY > 64)
		sync()
		addEventListener('scroll', sync, { passive: true })
		const setOpen = open => {
			nav.classList.toggle('is-open', open)
			chip.setAttribute('aria-expanded', String(open))
			menu.toggleAttribute('inert', !open)
			if (open) menu.querySelector('a')?.focus({ preventScroll: true })
		}
		menu.setAttribute('inert', '')
		chip.addEventListener('click', () => setOpen(!nav.classList.contains('is-open')))
		backdrop?.addEventListener('click', () => setOpen(false))
		addEventListener('keydown', e => {
			if (e.key === 'Escape' && nav.classList.contains('is-open')) { setOpen(false); chip.focus() }
		})
	}

	/* ── Reveals: fade + rise once, at 15% in view ──────────── */
	const revealIO = new IntersectionObserver(entries => {
		entries.forEach(e => {
			if (!e.isIntersecting) return
			e.target.classList.add('is-in')
			revealIO.unobserve(e.target)
		})
	}, { threshold: 0.15, rootMargin: '0px 0px -5% 0px' })
	document.querySelectorAll('[data-reveal], .lines, .footer__mark, [data-draw]').forEach(el => revealIO.observe(el))

	/* Fallback for fast scrolls and TOC jumps: reveal anything already passed */
	let revealRaf = 0
	const sweep = () => {
		revealRaf = 0
		document.querySelectorAll('[data-reveal]:not(.is-in), .lines:not(.is-in)').forEach(el => {
			if (el.getBoundingClientRect().top < innerHeight * 0.95) { el.classList.add('is-in'); revealIO.unobserve(el) }
		})
	}
	addEventListener('scroll', () => { if (!revealRaf) revealRaf = requestAnimationFrame(sweep) }, { passive: true })
	addEventListener('load', sweep)

	/* Split marked headlines into masked lines (keeps inner markup) */
	document.querySelectorAll('[data-lines]').forEach(el => {
		el.classList.add('lines')
		const parts = el.innerHTML.split(/<br\s*\/?>/i)
		el.innerHTML = parts.map((p, i) => `<span class="line" style="--i:${i}"><span>${p.trim()}</span></span>`).join('')
		revealIO.observe(el)
	})

	/* ── Videos: play muted in view, pause out of view ──────── */
	const vidIO = new IntersectionObserver(entries => {
		entries.forEach(e => {
			const v = e.target
			if (v.dataset.manual) return
			if (e.isIntersecting && !reduced) {
				if (v.preload === 'none') v.preload = 'metadata'
				v.play().catch(() => {})
			} else v.pause()
		})
	}, { threshold: 0.35 })
	document.querySelectorAll('video[data-autoplay]').forEach(v => {
		v.muted = true
		v.playsInline = true
		vidIO.observe(v)
	})

	/* ── Media cursor: glass pill with a label ───────────────── */
	if (finePointer && !reduced) {
		const pill = document.createElement('div')
		pill.className = 'cursor-pill glass caps'
		pill.setAttribute('aria-hidden', 'true')
		document.body.append(pill)
		let x = 0, y = 0, raf = 0
		const move = () => { pill.style.left = x + 'px'; pill.style.top = y + 'px'; raf = 0 }
		document.querySelectorAll('[data-cursor]').forEach(el => {
			el.addEventListener('pointerenter', e => { x = e.clientX; y = e.clientY; move(); pill.textContent = el.dataset.cursor; pill.classList.add('is-on') })
			el.addEventListener('pointerleave', () => pill.classList.remove('is-on'))
			el.addEventListener('pointermove', e => { x = e.clientX; y = e.clientY; if (!raf) raf = requestAnimationFrame(move) })
		})
	}

	/* ── Live NYC clock ──────────────────────────────────────── */
	const clocks = document.querySelectorAll('[data-clock]')
	if (clocks.length) {
		const tick = () => {
			const t = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' })
			clocks.forEach(c => { c.textContent = `NYC ${t}` })
		}
		tick()
		setInterval(tick, 15000)
	}

	/* ── Kinetic word: swaps every 2.4s with a soft blur-in ─── */
	document.querySelectorAll('[data-kinetic]').forEach(el => {
		const words = el.dataset.kinetic.split(',').map(w => w.trim())
		if (reduced || words.length < 2) return
		let i = 0
		setInterval(() => {
			i = (i + 1) % words.length
			el.classList.add('is-out')
			setTimeout(() => { el.textContent = words[i]; el.classList.remove('is-out') }, 260)
		}, 2400)
	})

	/* ── TOC scrollspy + running head in the nav chip ───────── */
	const tocLinks = [...document.querySelectorAll('[data-toc] a[href^="#"]')]
	const head = document.querySelector('.nav__head')
	if (tocLinks.length) {
		const sections = tocLinks.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean)
		const setActive = id => {
			tocLinks.forEach((a, n) => {
				const on = a.getAttribute('href') === '#' + id
				a.toggleAttribute('aria-current', on)
				if (on && head) {
					const name = (a.querySelector('.roll__track > span') || a).textContent.trim()
					const label = `${String(n + 1).padStart(2, '0')} · ${name}`
					if (head.dataset.label !== label) {
						head.dataset.label = label
						head.innerHTML = `<span class="caps nav__head-label">${label}</span>`
						head.firstChild.animate([{ transform: 'translateY(60%)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: reduced ? 0 : 420, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' })
					}
				}
			})
			const dot = document.querySelector('[data-toc] .toc__dot')
			const active = tocLinks.find(a => a.hasAttribute('aria-current'))
			if (dot && active) dot.style.transform = `translateY(${active.offsetTop + active.offsetHeight / 2 - 3}px)`
		}
		const spy = () => {
			const y = innerHeight * 0.35
			let current = sections[0]
			sections.forEach(s => { if (s.getBoundingClientRect().top < y) current = s })
			if (current) setActive(current.id)
		}
		spy()
		addEventListener('scroll', spy, { passive: true })
		addEventListener('resize', spy)
	}
})()
