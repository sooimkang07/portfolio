/* Yap prompt windows: the traffic lights collapse (red, yellow) and expand (green) each window,
   like a real terminal. Clicking the title bar toggles it. Windows start collapsed; without JS they stay open. */
(() => {
	'use strict'
	document.querySelectorAll('.yap-term').forEach((term, i) => {
		const bar = term.querySelector('.yap-term__bar')
		const panel = term.querySelector('.yap-term__panel')
		if (!bar || !panel) return
		panel.id ||= `yap-term-panel-${i + 1}`
		const lights = term.querySelectorAll('.yap-term__light')
		lights.forEach(b => b.setAttribute('aria-controls', panel.id))
		const set = open => {
			term.classList.toggle('is-collapsed', !open)
			panel.inert = !open
			lights.forEach(b => b.setAttribute('aria-expanded', String(open)))
		}
		set(false)
		bar.addEventListener('click', e => {
			const light = e.target.closest('[data-term]')
			if (light) set(light.dataset.term === 'open')
			else set(term.classList.contains('is-collapsed'))
		})
	})
})()
