/* WORK — staggered entrance + covers that play while visible. */
(() => {
	'use strict'
	const cards = [...document.querySelectorAll('.work-card')]
	const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
	if (!('IntersectionObserver' in window)) return

	if (!reduced) {
		let batch = 0
		let batchTimer = 0
		const reveal = new IntersectionObserver(entries => {
			entries.forEach(entry => {
				if (!entry.isIntersecting) return
				const card = entry.target
				card.style.setProperty('--d', String(batch++))
				clearTimeout(batchTimer)
				batchTimer = setTimeout(() => { batch = 0 }, 120)
				requestAnimationFrame(() => card.classList.remove('is-pending'))
				reveal.unobserve(card)
			})
		}, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' })
		const delayStart = document.documentElement.classList.contains('is-pt-enter') ? 380 : 0
		cards.forEach(card => card.classList.add('is-pending'))
		setTimeout(() => cards.forEach(card => reveal.observe(card)), delayStart)
	}

	const play = new IntersectionObserver(entries => {
		entries.forEach(entry => {
			const v = entry.target.querySelector('video')
			if (!v) return
			if (entry.isIntersecting) v.play().catch(() => {})
			else v.pause()
		})
	}, { threshold: 0.35 })
	cards.forEach(card => play.observe(card))
})()
