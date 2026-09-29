/* NOTATE figures: dashed elbow lines from each callout card to its pin on the screenshot,
   drawn in when the figure scrolls into view. */
(() => {
	'use strict'
	const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
	const NS = 'http://www.w3.org/2000/svg'
	const R = 12 // corner radius of each elbow

	document.querySelectorAll('[data-callouts]').forEach(fig => {
		const svg = document.createElementNS(NS, 'svg')
		svg.classList.add('ntf-lines')
		svg.setAttribute('aria-hidden', 'true')
		fig.append(svg)
		let drawn = false

		function layout() {
			const box = fig.getBoundingClientRect()
			svg.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`)
			svg.innerHTML = ''
			fig.querySelectorAll('[data-to]').forEach((card, i) => {
				const pin = fig.querySelector(`[data-pin="${card.dataset.to}"]`)
				const icon = card.querySelector('.ntc-icon')
				if (!pin || !icon) return
				const a = icon.getBoundingClientRect(), p = pin.getBoundingClientRect()
				const x1 = a.left + a.width / 2 - box.left, y1 = a.top + a.height / 2 - box.top
				const x2 = p.left + p.width / 2 - box.left, y2 = p.top + p.height / 2 - box.top
				// Run across to the pin's column, round the corner, then drop straight onto it.
				const sx = Math.sign(x2 - x1), sy = Math.sign(y2 - y1)
				const r = Math.min(R, Math.abs(x2 - x1) / 2, Math.abs(y2 - y1) / 2)
				const d = r < 1
					? `M${x1},${y1} L${x2},${y2}`
					: `M${x1},${y1} H${x2 - sx * r} Q${x2},${y1} ${x2},${y1 + sy * r} V${y2}`

				const id = 'ntc' + i + Math.random().toString(36).slice(2, 6)
				const mask = document.createElementNS(NS, 'mask')
				mask.id = id
				mask.setAttribute('maskUnits', 'userSpaceOnUse')
				const reveal = document.createElementNS(NS, 'path')
				reveal.setAttribute('d', d); reveal.setAttribute('stroke', '#fff'); reveal.setAttribute('stroke-width', '4'); reveal.setAttribute('fill', 'none')
				mask.append(reveal)
				const path = document.createElementNS(NS, 'path')
				path.setAttribute('d', d); path.setAttribute('mask', `url(#${id})`)
				svg.append(mask, path)

				const len = reveal.getTotalLength()
				reveal.style.strokeDasharray = len
				reveal.style.strokeDashoffset = drawn || reduced ? 0 : len
				reveal.style.transition = `stroke-dashoffset 720ms cubic-bezier(0.22,1,0.36,1) ${i * 80}ms`
			})
		}

		const draw = () => {
			drawn = true
			svg.querySelectorAll('mask path').forEach(p => { p.style.strokeDashoffset = 0 })
		}
		const ready = () => {
			layout()
			new IntersectionObserver(([e], io) => { if (e.isIntersecting) { requestAnimationFrame(draw); io.disconnect() } }, { threshold: 0.4 }).observe(fig)
		}
		const img = fig.querySelector('img')
		img && !img.complete ? img.addEventListener('load', ready, { once: true }) : ready()
		let t = 0
		addEventListener('resize', () => { clearTimeout(t); t = setTimeout(layout, 120) })
	})
})()
