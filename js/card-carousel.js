/* Card carousel: cards slide left one at a time (first card flush left, middle cards centered,
   last card flush right), then swipe back to the first. Runs only while on screen.
   Markup: [data-card-carousel] > [data-card-carousel-track] > cards */
(() => {
	'use strict'
	const reduced = matchMedia('(prefers-reduced-motion: reduce)')
	document.querySelectorAll('[data-card-carousel]').forEach(root => {
		const track = root.querySelector('[data-card-carousel-track]')
		const count = track.children.length
		let i = 0
		// Layout changes (load, resize, scroll restore) snap into place; only the timed steps animate
		const go = (n, animate) => {
			i = n
			const card = track.children[n]
			const align = n === 0 ? 0 : n === count - 1 ? 1 : .5
			// --carousel-inset keeps the first and last cards that far from the edges (0 = flush)
			const inset = parseFloat(getComputedStyle(root).getPropertyValue('--carousel-inset')) || 0
			const x = card.offsetLeft - track.children[0].offsetLeft - inset - (root.clientWidth - 2 * inset - card.offsetWidth) * align  // relative to the first card, whatever the offset parent is
			if (!animate) track.style.transition = 'none'
			track.style.transform = `translateX(${-x}px)`
			if (!animate) { track.offsetWidth; track.style.transition = '' }
		}
		go(0, false)
		new ResizeObserver(() => go(i, false)).observe(root)
		const next = () => { if (!reduced.matches && !document.hidden) go((i + 1) % count, true) }
		let timer = null
		new IntersectionObserver(([e]) => {
			clearInterval(timer)
			timer = null
			// Each time it comes into view it starts again from the first card
			if (e.isIntersecting) { go(0, false); timer = setInterval(next, 2600) }
		}, { threshold: .3 }).observe(root)
	})
})()
