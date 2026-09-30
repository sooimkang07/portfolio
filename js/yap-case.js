/* yap case study: the live demo inside the iPhone frame. Loads on tap, then scales the
   402x848 app to fit the frame's screen. */
(() => {
	const DEMO = /^(localhost|127\.0\.0\.1)$/.test(location.hostname)
		? 'http://127.0.0.1:8792/?demo=1'
		: 'https://www.joinyap.chat/?demo=1'

	document.querySelectorAll('[data-yap-demo]').forEach(stage => {
		const screen = stage.querySelector('.yap-demo__screen')
		const start = stage.querySelector('[data-yap-demo-start]')
		const fit = () => {
			const frame = screen.querySelector('iframe')
			if (frame) frame.style.transform = `scale(${screen.clientWidth / 402})`
		}
		start?.addEventListener('click', () => {
			const frame = document.createElement('iframe')
			frame.src = DEMO
			frame.title = 'yap, live demo'
			frame.allow = 'microphone; autoplay'
			screen.replaceChildren(frame)
			fit()
		})
		new ResizeObserver(fit).observe(screen)
	})
})()
