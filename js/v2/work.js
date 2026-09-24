/* WORK (v2): filter chips */
(() => {
	'use strict'
	const chips = [...document.querySelectorAll('[data-filter]')]
	const items = [...document.querySelectorAll('.lead, .card')]
	const empty = document.querySelector('.grid__empty')
	chips.forEach(chip => chip.addEventListener('click', () => {
		const f = chip.dataset.filter
		chips.forEach(c => { const on = c === chip; c.classList.toggle('is-on', on); c.setAttribute('aria-pressed', String(on)) })
		let shown = 0
		items.forEach(el => {
			const match = f === 'all' || el.dataset.filters.split(' ').includes(f)
			el.classList.toggle('is-hidden', !match)
			if (match) { shown++; el.classList.add('is-in') }
		})
		if (empty) empty.hidden = shown > 0
	}))
})()
