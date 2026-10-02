/* yap case study: the live demo inside the iPhone frame. Loads on tap, then scales the
   402x848 app to fit the frame's screen. */
(() => {
	const DEMO = /^(localhost|127\.0\.0\.1)$/.test(location.hostname)
		? 'http://127.0.0.1:8792/?demo=1'
		: 'https://www.joinyap.chat/?demo=1'

	document.querySelectorAll('[data-yap-demo]').forEach(stage => {
		const screen = stage.querySelector('.yap-demo__screen')
		const starts = [...(stage.closest('section') || stage).querySelectorAll('[data-yap-demo-start]')]
		const start = starts.find(b => b.classList.contains('yap-demo__start'))
		const fit = () => {
			/* the phone frame ends 8.9% above the stage's bottom edge; line the button up with it */
			start?.style.setProperty('--yap-demo-inset', `${stage.clientHeight * 0.0889}px`)
			const frame = screen.querySelector('iframe')
			if (!frame) return
			const scale = screen.clientWidth / 402
			frame.style.transform = `scale(${scale})`
			screen.style.setProperty('--yap-demo-scale', scale)
		}
		const launch = () => {
			const frame = document.createElement('iframe')
			frame.src = DEMO
			frame.title = 'yap, live demo'
			frame.allow = 'microphone; autoplay'
			screen.replaceChildren(frame)
			fit()
			starts.forEach(b => { b.disabled = true })
			stage.classList.add('is-live')
		}
		starts.forEach(b => b.addEventListener('click', launch))
		new ResizeObserver(fit).observe(screen)
		fit()
	})
})()

/* Iterations: one view at a time (Direction 1 · 2 · 3 · Shipped). */
document.querySelectorAll('[data-yap-tabs]').forEach(root => {
	const tabs = [...root.querySelectorAll('[data-yap-tab]')]
	const panels = [...root.querySelectorAll('[data-yap-panel]')]
	const show = i => {
		tabs.forEach((t, k) => { t.classList.toggle('is-active', k === i); t.classList.toggle('glass', k === i); t.setAttribute('aria-selected', k === i) })
		panels.forEach((p, k) => p.classList.toggle('is-active', k === i))
	}
	tabs.forEach((t, i) => t.addEventListener('click', () => show(i)))
})

/* Component library: laid out at Figma size, zoomed so a 1960-wide window fills the figure. */
document.querySelectorAll('[data-ycl]').forEach(fig => {
	const stage = fig.querySelector('.ycl__stage')
	const fit = () => { stage.style.zoom = fig.clientWidth / 1960 }
	new ResizeObserver(fit).observe(fig)
	fit()
})

/* Screen carousel: scrolls within the content column and can be dragged with a mouse. */
document.querySelectorAll('[data-yap-rail]').forEach(fig => {
	const track = fig.querySelector('.yap-rail__track')
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
	const prev = fig.querySelector('[data-yap-rail-prev]'), next = fig.querySelector('[data-yap-rail-next]')
	const step = dir => track.scrollBy({ left: dir * track.clientWidth * 0.8, behavior: 'smooth' })
	prev?.addEventListener('click', () => step(-1))
	next?.addEventListener('click', () => step(1))
	const sync = () => {
		if (prev) prev.disabled = track.scrollLeft < 4
		if (next) next.disabled = track.scrollLeft > track.scrollWidth - track.clientWidth - 4
	}
	track.addEventListener('scroll', sync, { passive: true })
	new ResizeObserver(sync).observe(track)
	track.querySelector('img')?.addEventListener('load', sync)
	sync()
})
