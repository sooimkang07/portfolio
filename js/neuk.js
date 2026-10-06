/* neuk: figure boards are laid out at 1920×1080 and scaled to fit the column */
(() => {
	'use strict'

	document.querySelectorAll('[data-nkb]').forEach(fig => {
		const stage = fig.querySelector('.nkb__stage')
		const fit = () => { stage.style.transform = `scale(${fig.clientWidth / 1920})` }
		new ResizeObserver(fit).observe(fig)
		fit()
	})
})()
