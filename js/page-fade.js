/* ============================================================
   PAGE FADE — every page (except a project opened from its card,
   which uses the morph) fades in with a short slide up.
   Loaded synchronously in <head> so the start state paints first.
   ============================================================ */
(() => {
	'use strict'
	const html = document.documentElement
	if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
	const PROJECTS = ['yap', 'notate', 'instagram-lists', 'smart-bundles', 'neuk', 'forage', 'acuity', 'capstone']
	const slug = path => path.replace(/\.html$/, '').replace(/^\/+|\/+$/g, '')

	/* ── In ── */
	let morphing = false
	try {
		const d = JSON.parse(sessionStorage.getItem('sooim-project-morph') || 'null')
		morphing = !!(d && Date.now() - (d.ts || 0) < 8000)
	} catch {}
	const home = ['', 'index'].includes(slug(location.pathname))
	// Home without a hash plays its own intro, so it skips the fade.
	if (!morphing && !(home && !location.hash)) {
		html.classList.add('is-page-enter')
		setTimeout(() => html.classList.remove('is-page-enter'), 700)
	}

	/* ── Out ── */
	document.addEventListener('click', e => {
		if (e.defaultPrevented || e.button > 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
		const a = e.target.closest('a[href]')
		if (!a || a.target === '_blank' || a.hasAttribute('download') || a.closest('[data-project-morph]')) return
		const url = new URL(a.href, location.href)
		if (url.origin !== location.origin || /\.(pdf|png|jpe?g|mp4|zip)$/i.test(url.pathname)) return
		if (url.pathname === location.pathname && url.search === location.search) return
		if (PROJECTS.includes(slug(url.pathname))) return
		e.preventDefault()
		html.classList.add('is-page-leave')
		setTimeout(() => { location.href = url.href }, 180)
	})
	addEventListener('pageshow', e => { if (e.persisted) html.classList.remove('is-page-leave', 'is-page-enter') })
})()
