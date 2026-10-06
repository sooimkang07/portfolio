/* forage case study: the live prototype loads on tap, laid out at 1440x900 and scaled to fit the window. */
document.querySelectorAll('[data-fg-site]').forEach(stage => {
	const screen = stage.querySelector('.fg-site__screen')
	const fit = () => {
		const frame = screen.querySelector('iframe')
		if (frame) frame.style.transform = `scale(${screen.clientWidth / 1440})`
	}
	stage.querySelector('[data-fg-site-start]')?.addEventListener('click', () => {
		const frame = document.createElement('iframe')
		frame.src = 'https://forage.figma.site/'
		frame.title = 'forage, live prototype'
		screen.replaceChildren(frame)
		fit()
	})
	new ResizeObserver(fit).observe(screen)
})
