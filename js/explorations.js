/* Explorations: each project row scrolls sideways. Touch swipes natively;
   mouse can drag; arrow buttons page by one piece. Media loads and plays
   only while its row is on screen. */
(() => {
	'use strict'
	const rows = [...document.querySelectorAll('.ex-row')]
	if (!rows.length) return
	const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches

	/* Reveal rows; load + play media while in view, pause when out */
	const io = new IntersectionObserver(entries => entries.forEach(e => {
		const row = e.target
		if (e.isIntersecting) row.classList.add('is-in')
		row.querySelectorAll('iframe[data-src]').forEach(f => { if (e.isIntersecting && !f.src) f.src = f.dataset.src })
		row.querySelectorAll('video').forEach(v => {
			if (!e.isIntersecting) return v.pause()
			if (!v.src) { v.src = v.dataset.src; v.preload = 'metadata' }
			if (!reduced) v.play().catch(() => {})
		})
	}), { threshold: 0.15, rootMargin: '0px 0px -5% 0px' })
	rows.forEach(r => io.observe(r))

	rows.forEach(row => {
		const rail = row.querySelector('.ex-row__rail')
		const [prev, next] = row.querySelectorAll('.ex-row__btn')

		/* Arrow state: hide when nothing overflows, disable at either end */
		const sync = () => {
			const max = rail.scrollWidth - rail.clientWidth
			row.classList.toggle('is-scrollable', max > 4)
			if (prev) prev.disabled = rail.scrollLeft <= 4
			if (next) next.disabled = rail.scrollLeft >= max - 4
		}
		rail.addEventListener('scroll', sync, { passive: true })
		new ResizeObserver(sync).observe(rail)
		sync()

		/* Page by one piece */
		const step = dir => {
			const items = [...rail.children]
			const pad = parseFloat(getComputedStyle(rail).paddingLeft) || 0
			const x = rail.scrollLeft
			const target = dir > 0
				? items.find(it => it.offsetLeft - pad > x + 4)
				: items.slice().reverse().find(it => it.offsetLeft - pad < x - 4)
			rail.scrollTo({ left: target ? target.offsetLeft - pad : (dir > 0 ? rail.scrollWidth : 0), behavior: reduced ? 'auto' : 'smooth' })
		}
		row.querySelectorAll('.ex-row__btn').forEach(b => b.addEventListener('click', () => step(+b.dataset.dir)))

		/* Mouse drag to scroll (touch and trackpads scroll natively) */
		let startX = 0, startLeft = 0, dragging = false
		rail.addEventListener('pointerdown', e => {
			if (e.pointerType !== 'mouse' || e.button !== 0) return
			startX = e.clientX; startLeft = rail.scrollLeft; dragging = false
			const move = ev => {
				const dx = ev.clientX - startX
				if (!dragging && Math.abs(dx) > 4) { dragging = true; rail.classList.add('is-dragging'); rail.setPointerCapture(e.pointerId) }
				if (dragging) rail.scrollLeft = startLeft - dx
			}
			const up = () => {
				rail.removeEventListener('pointermove', move)
				rail.classList.remove('is-dragging')
				removeEventListener('pointerup', up)
			}
			rail.addEventListener('pointermove', move)
			addEventListener('pointerup', up)
		})
	})
})()
