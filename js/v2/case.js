/* CASE (v2): anatomy callout lines (dashed, drawn in when in view) */
(() => {
	'use strict'
	const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
	const NS = 'http://www.w3.org/2000/svg'

	document.querySelectorAll('[data-anatomy]').forEach(fig => {
		const svg = document.createElementNS(NS, 'svg')
		svg.classList.add('anno-lines')
		svg.setAttribute('aria-hidden', 'true')
		fig.append(svg)
		let drawn = false

		function layout() {
			const box = fig.getBoundingClientRect()
			svg.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`)
			svg.innerHTML = ''
			fig.querySelectorAll('[data-anno]').forEach((card, i) => {
				const dot = fig.querySelector(`.anno-dot[data-for="${card.dataset.anno}"]`)
				if (!dot) return
				const c = card.getBoundingClientRect(), d = dot.getBoundingClientRect()
				const left = c.left + c.width / 2 < d.left
				const x1 = (left ? c.right : c.left) - box.left
				const y1 = c.top + c.height / 2 - box.top
				const x2 = d.left + d.width / 2 - box.left
				const y2 = d.top + d.height / 2 - box.top
				const mx = x1 + (left ? 18 : -18)
				const dPath = `M${x1},${y1} H${mx} L${x2},${y2}`
				// Mask trick: a solid path draws in and reveals the dashed one
				const id = `m${Math.random().toString(36).slice(2, 8)}`
				const mask = document.createElementNS(NS, 'mask')
				mask.id = id
				mask.setAttribute('maskUnits', 'userSpaceOnUse')
				const reveal = document.createElementNS(NS, 'path')
				reveal.setAttribute('d', dPath)
				reveal.setAttribute('stroke', '#fff')
				reveal.setAttribute('stroke-width', '4')
				reveal.setAttribute('fill', 'none')
				mask.append(reveal)
				const path = document.createElementNS(NS, 'path')
				path.setAttribute('d', dPath)
				path.setAttribute('mask', `url(#${id})`)
				const start = document.createElementNS(NS, 'circle')
				start.setAttribute('cx', x1); start.setAttribute('cy', y1); start.setAttribute('r', 2.5)
				svg.append(mask, path, start)
				const len = reveal.getTotalLength()
				reveal.style.strokeDasharray = len
				reveal.style.strokeDashoffset = drawn || reduced ? 0 : len
				reveal.style.transition = `stroke-dashoffset 720ms cubic-bezier(0.22,1,0.36,1) ${i * 60}ms`
				start.style.opacity = drawn || reduced ? 1 : 0
				start.style.transition = `opacity 240ms ${i * 60}ms`
				reveal.dataset.len = len
			})
		}

		function draw() {
			drawn = true
			svg.querySelectorAll('mask path').forEach(p => { p.style.strokeDashoffset = 0 })
			svg.querySelectorAll('circle').forEach(c => { c.style.opacity = 1 })
		}

		const ready = () => {
			layout()
			new IntersectionObserver(([e], io) => {
				if (!e.isIntersecting) return
				requestAnimationFrame(draw)
				io.disconnect()
			}, { threshold: 0.4 }).observe(fig)
		}
		const img = fig.querySelector('img')
		img && !img.complete ? img.addEventListener('load', ready, { once: true }) : ready()
		let t = 0
		addEventListener('resize', () => { clearTimeout(t); t = setTimeout(layout, 120) })
	})
})()
