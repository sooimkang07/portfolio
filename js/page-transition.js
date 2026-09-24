/* ============================================================
   PAGE TRANSITION — Koto-style curtain between Home and Work.
   Out: a panel wipes up from the bottom and covers the page.
   In:  the panel keeps moving up and off the top while the new
        page rises in behind it.
   ============================================================ */
(() => {
	'use strict'
	const KEY = 'sooim-page-transition'
	const html = document.documentElement
	const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches

	/* ── In ── */
	if (html.classList.contains('is-pt-enter')) {
		try { sessionStorage.removeItem(KEY) } catch {}
		if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
		scrollTo(0, 0)
		requestAnimationFrame(() => requestAnimationFrame(() => {
			html.classList.add('is-pt-run')
			setTimeout(() => html.classList.remove('is-pt-enter', 'is-pt-run'), 1050)
		}))
	}

	/* ── Out ── */
	function leave(e, href) {
		if (reduced || e.defaultPrevented || e.button > 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
		e.preventDefault()
		if (html.classList.contains('is-pt-leaving')) return
		html.classList.add('is-pt-leaving')
		const pre = document.createElement('link')
		pre.rel = 'prefetch'
		pre.href = href
		document.head.appendChild(pre)
		const curtain = document.createElement('div')
		curtain.className = 'pt-curtain'
		document.body.appendChild(curtain)
		curtain.animate([{ transform: 'scaleY(0)' }, { transform: 'scaleY(1)' }], {
			duration: 720, easing: 'cubic-bezier(0.76, 0, 0.24, 1)', fill: 'forwards'
		}).finished.then(() => {
			try { sessionStorage.setItem(KEY, String(Date.now())) } catch {}
			location.href = href
		})
	}

	document.querySelectorAll('[data-work-all], a[data-page-transition]').forEach(a => {
		a.addEventListener('click', e => leave(e, a.getAttribute('href')))
	})

	addEventListener('pageshow', e => {
		if (!e.persisted) return
		html.classList.remove('is-pt-leaving')
		document.querySelectorAll('.pt-curtain').forEach(n => n.remove())
	})
})()
