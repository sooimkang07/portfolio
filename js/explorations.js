/* Explorations: hover plays video tiles; click opens a lightbox with arrow-key stepping. */
(() => {
	'use strict'
	const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
	const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
	const tiles = [...document.querySelectorAll('.ex-tile__btn')]
	if (!tiles.length) return

	/* Liquid glass light follows the pointer */
	document.addEventListener('pointermove', e => {
		const g = e.target.closest?.('.glass'); if (!g) return
		const r = g.getBoundingClientRect()
		g.style.setProperty('--mx', (e.clientX - r.left) + 'px'); g.style.setProperty('--my', (e.clientY - r.top) + 'px')
	}, { passive: true })

	/* Reveal tiles as they scroll in; autoplay videos while in view */
	const io = new IntersectionObserver(es => es.forEach(e => {
		const li = e.target
		if (e.isIntersecting) li.classList.add('is-in')
		const v = li.querySelector('video'); if (!v || reduced) return
		if (e.isIntersecting) { if (!v.src) v.src = v.dataset.src; v.play().then(() => li.classList.add('is-playing')).catch(() => {}) }
		else v.pause()
	}), { threshold: 0.2, rootMargin: '0px 0px -5% 0px' })
	document.querySelectorAll('.ex-tile').forEach(li => io.observe(li))

	/* Lightbox */
	const I = {
		close: '<svg viewBox="0 0 24 24"><path d="M6.4 5 12 10.6 17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4-5.6-5.6L6.4 19 5 17.6l5.6-5.6L5 6.4z"/></svg>',
		prev: '<svg viewBox="0 0 24 24"><path d="M15.4 4.6 8 12l7.4 7.4-1.5 1.5L5 12l8.9-8.9z"/></svg>',
		next: '<svg viewBox="0 0 24 24"><path d="m8.6 19.4 7.4-7.4-7.4-7.4 1.5-1.5 8.9 8.9-8.9 8.9z"/></svg>'
	}
	let lb = null, i = 0, opener = null
	const render = () => {
		const d = tiles[i].dataset
		const stage = lb.querySelector('.ex-lb__stage')
		let media
		if (d.kind === 'video') media = `<video src="${esc(d.media)}" poster="${esc(d.poster)}" autoplay loop muted playsinline controls></video>`
		else if (d.kind === 'site') media = `<iframe src="${esc(d.media)}" title="${esc(d.title)}" loading="lazy"></iframe>`
		else media = `<img src="${esc(d.media)}" alt="${esc(d.title)}">`
		stage.querySelectorAll('video, img, iframe').forEach(n => n.remove())
		stage.insertAdjacentHTML('beforeend', media)
		lb.querySelector('.ex-lb__cap').innerHTML = `<strong>${esc(d.title)}</strong><span class="ex-tile__tag">${esc(d.tag)}</span>${d.href ? `<a href="${esc(d.href)}" target="_blank" rel="noopener">Open project ↗</a>` : ''}`
		lb.setAttribute('aria-label', d.title)
	}
	const step = n => { i = (i + n + tiles.length) % tiles.length; render() }
	const onKey = e => {
		if (e.key === 'Escape') close()
		else if (e.key === 'ArrowRight') step(1)
		else if (e.key === 'ArrowLeft') step(-1)
	}
	const close = () => {
		removeEventListener('keydown', onKey)
		lb.remove(); lb = null
		document.documentElement.style.overflow = ''
		opener?.focus({ preventScroll: true })
	}
	const open = n => {
		i = n; opener = tiles[n]
		lb = document.createElement('div')
		lb.className = 'ex-lb'; lb.tabIndex = -1
		lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true')
		lb.innerHTML = `<div class="ex-lb__stage">
			<button class="ex-lb__btn ex-lb__close glass" type="button" aria-label="Close">${I.close}</button>
			<button class="ex-lb__btn ex-lb__prev glass" type="button" aria-label="Previous">${I.prev}</button>
			<button class="ex-lb__btn ex-lb__next glass" type="button" aria-label="Next">${I.next}</button>
		</div><p class="ex-lb__cap"></p>`
		document.body.append(lb)
		document.documentElement.style.overflow = 'hidden'
		lb.querySelector('.ex-lb__close').addEventListener('click', close)
		lb.querySelector('.ex-lb__prev').addEventListener('click', () => step(-1))
		lb.querySelector('.ex-lb__next').addEventListener('click', () => step(1))
		let sx = 0
		lb.addEventListener('pointerdown', e => { sx = e.clientX })
		lb.addEventListener('pointerup', e => { const dx = e.clientX - sx; if (Math.abs(dx) > 50 && !e.target.closest('video, iframe, button')) step(dx < 0 ? 1 : -1) })
		addEventListener('keydown', onKey)
		render()
		lb.focus({ preventScroll: true })
	}
	tiles.forEach((t, n) => t.addEventListener('click', () => open(n)))
})()
