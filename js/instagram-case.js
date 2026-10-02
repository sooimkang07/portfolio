/* Instagram Lists case study: exploration tabs and draggable screen rails (same behavior as yap's). */

/* Explorations: one exploration at a time. */
document.querySelectorAll('[data-ig-tabs]').forEach(root => {
	const tabs = [...root.querySelectorAll('[data-ig-tab]')]
	const panels = [...root.querySelectorAll('[data-ig-panel]')]
	const show = i => {
		tabs.forEach((t, k) => { t.classList.toggle('is-active', k === i); t.classList.toggle('glass', k === i); t.setAttribute('aria-selected', k === i) })
		panels.forEach((p, k) => p.classList.toggle('is-active', k === i))
		panels[i].querySelector('[data-ig-rail]')?.dispatchEvent(new Event('ig-rail-sync'))
	}
	tabs.forEach((t, i) => t.addEventListener('click', () => show(i)))
})

/* Screen rail: scrolls sideways within the content column and can be dragged with a mouse. */
document.querySelectorAll('[data-ig-rail]').forEach(fig => {
	const track = fig.querySelector('.ig-rail__track')
	let x0 = 0, s0 = 0, down = false
	track.addEventListener('pointerdown', e => {
		if (e.pointerType !== 'mouse') return
		down = true; x0 = e.clientX; s0 = track.scrollLeft
		track.setPointerCapture(e.pointerId); track.classList.add('is-dragging')
	})
	track.addEventListener('pointermove', e => { if (down) track.scrollLeft = s0 - (e.clientX - x0) })
	const up = () => { down = false; track.classList.remove('is-dragging') }
	track.addEventListener('pointerup', up)
	track.addEventListener('pointercancel', up)
	const prev = fig.querySelector('[data-ig-rail-prev]'), next = fig.querySelector('[data-ig-rail-next]')
	const step = dir => track.scrollBy({ left: dir * track.clientWidth * 0.8, behavior: 'smooth' })
	prev?.addEventListener('click', () => step(-1))
	next?.addEventListener('click', () => step(1))
	const sync = () => {
		if (prev) prev.disabled = track.scrollLeft < 4
		if (next) next.disabled = track.scrollLeft > track.scrollWidth - track.clientWidth - 4
	}
	track.addEventListener('scroll', sync, { passive: true })
	fig.addEventListener('ig-rail-sync', sync)
	new ResizeObserver(sync).observe(track)
	track.querySelector('img')?.addEventListener('load', sync)
	sync()
})
