/* ============================================================
   MORPH — project card → case study cover (shared element)
   Home / Work: the card's media grows into the exact rect the cover
   occupies on the case page, then the page swaps underneath it.
   Case page: the clone is rebuilt in that same rect, the real cover
   takes over once it is loaded and synced, the page fades in, and only
   then is scrolling released.
   ============================================================ */
(() => {
	'use strict'

	const KEY = 'sooim-project-morph'
	const MAX_AGE = 8000
	const GROW_MS = 620
	const EASE = 'cubic-bezier(0.76, 0, 0.24, 1)'
	const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
	const html = document.documentElement

	const read = () => {
		try {
			const d = JSON.parse(sessionStorage.getItem(KEY) || 'null')
			if (!d || !d.id || Date.now() - (d.ts || 0) > MAX_AGE) return null
			return d
		} catch { return null }
	}
	const clear = () => { try { sessionStorage.removeItem(KEY) } catch {} }

	/* Must mirror css/case.css: .case-cover geometry */
	function coverRect() {
		const vw = html.clientWidth
		const vh = innerHeight
		const g = parseFloat(getComputedStyle(html).getPropertyValue('--gutter')) ||
			Math.min(24, Math.max(16, vw * 0.025))
		const top = vw <= 700 ? 68 : 76
		const width = vw - 2 * g
		const height = Math.min(width * 9 / 16, vh - top - g)
		return { top, left: g, width, height, radius: vw <= 700 ? 10 : 12 }
	}

	function buildClone(d, rect) {
		const shell = document.createElement('div')
		shell.className = 'project-morph'
		shell.setAttribute('aria-hidden', 'true')
		place(shell, rect)
		let media
		if (d.isVideo) {
			media = document.createElement('video')
			media.muted = true
			media.playsInline = true
			media.loop = true
			media.autoplay = true
			media.preload = 'auto'
			media.src = d.src
			const seek = () => { try { media.currentTime = d.time || 0 } catch {} media.play().catch(() => {}) }
			if (media.readyState >= 1) seek()
			else media.addEventListener('loadedmetadata', seek, { once: true })
		} else {
			media = document.createElement('img')
			media.src = d.src
			media.alt = ''
		}
		media.className = 'project-morph__media'
		shell.appendChild(media)
		return shell
	}

	function place(el, r) {
		el.style.top = `${r.top}px`
		el.style.left = `${r.left}px`
		el.style.width = `${r.width}px`
		el.style.height = `${r.height}px`
		el.style.borderRadius = `${r.radius}px`
	}

	/* ── Leaving: home / work ─────────────────────────────── */
	function go(e, href, id, mediaEl) {
		if (reduced || e.defaultPrevented || e.button > 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
		const visual = mediaEl.querySelector('video, img')
		if (!visual) return
		e.preventDefault()
		e.stopPropagation()
		if (html.classList.contains('is-morph-leaving')) return

		const isVideo = visual.tagName === 'VIDEO'
		const r = mediaEl.getBoundingClientRect()
		const from = { top: r.top, left: r.left, width: r.width, height: r.height, radius: parseFloat(getComputedStyle(mediaEl).borderTopLeftRadius) || 12 }
		const to = coverRect()
		const d = { id, href, isVideo, src: visual.currentSrc || visual.src, time: isVideo ? visual.currentTime : 0 }

		const pre = document.createElement('link')
		pre.rel = 'prefetch'
		pre.href = href
		document.head.appendChild(pre)

		const clone = document.createElement('div')
		clone.className = 'project-morph'
		place(clone, from)
		const m = isVideo ? visual.cloneNode(false) : new Image()
		m.className = 'project-morph__media'
		m.removeAttribute?.('style')
		if (isVideo) { m.muted = true; m.playsInline = true; m.loop = true; m.src = d.src; m.currentTime = d.time; m.play().catch(() => {}) }
		else m.src = d.src
		clone.appendChild(m)
		document.body.appendChild(clone)
		mediaEl.style.visibility = 'hidden'
		html.classList.add('is-morph-leaving')

		const anim = clone.animate([
			{ top: `${from.top}px`, left: `${from.left}px`, width: `${from.width}px`, height: `${from.height}px`, borderRadius: `${from.radius}px` },
			{ top: `${to.top}px`, left: `${to.left}px`, width: `${to.width}px`, height: `${to.height}px`, borderRadius: `${to.radius}px` }
		], { duration: GROW_MS, easing: EASE, fill: 'forwards' })

		anim.finished.then(() => {
			try {
				d.time = isVideo ? m.currentTime : 0
				d.ts = Date.now()
				sessionStorage.setItem(KEY, JSON.stringify(d))
			} catch {}
			location.href = href
		})
	}

	function initSource() {
		const cards = document.querySelectorAll('[data-project-morph]')
		cards.forEach(card => {
			const id = card.getAttribute('data-project-morph')
			const href = card.getAttribute('data-href') || card.getAttribute('href')
			const media = card.querySelector('[data-morph-media]') || card.querySelector('.home-work__media, .work-card__media')
			if (!id || !href || !media) return
			card.addEventListener('click', e => {
				const link = e.target.closest('a[href]')
				if (link && link.getAttribute('href') !== href) return
				go(e, href, id, media)
			}, true)
		})
		/* Home index titles / footers point at the same cards */
		document.querySelectorAll('.home-work__title[href], .home-work__footer[href]').forEach(link => {
			link.addEventListener('click', e => {
				const card = document.querySelector(`[data-project-morph][data-href="${link.getAttribute('href')}"]`)
				const media = card && card.querySelector('.home-work__media')
				if (card && media) go(e, link.getAttribute('href'), card.getAttribute('data-project-morph'), media)
			})
		})
		addEventListener('pageshow', e => {
			if (!e.persisted) return
			html.classList.remove('is-morph-leaving')
			document.querySelectorAll('.project-morph').forEach(n => n.remove())
			document.querySelectorAll('[data-project-morph] .home-work__media, [data-project-morph] .work-card__media').forEach(m => { m.style.visibility = '' })
		})
	}

	/* ── Arriving: case page ──────────────────────────────── */
	const block = e => e.preventDefault()
	const blockKeys = e => { if ([' ', 'PageDown', 'PageUp', 'ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) e.preventDefault() }
	function lock() {
		addEventListener('wheel', block, { passive: false })
		addEventListener('touchmove', block, { passive: false })
		addEventListener('keydown', blockKeys)
	}
	function unlock() {
		removeEventListener('wheel', block)
		removeEventListener('touchmove', block)
		removeEventListener('keydown', blockKeys)
		html.classList.remove('is-project-morph-pending')
	}

	function ready(target, time) {
		return new Promise(resolve => {
			const done = () => resolve()
			setTimeout(done, 2400)
			if (target.tagName !== 'VIDEO') {
				if (target.complete && target.naturalWidth) done()
				else { target.addEventListener('load', done, { once: true }); target.addEventListener('error', done, { once: true }) }
				return
			}
			const seekAndWait = () => {
				try { target.currentTime = time } catch {}
				const ok = () => { target.play().catch(() => {}); done() }
				if (target.readyState >= 3) ok()
				else target.addEventListener('canplay', ok, { once: true })
			}
			if (target.readyState >= 1) seekAndWait()
			else target.addEventListener('loadedmetadata', seekAndWait, { once: true })
		})
	}

	async function initCase() {
		const d = read()
		const id = document.body.getAttribute('data-case')
		if (!d || d.id !== id) { html.classList.remove('is-project-morph-pending'); return }
		clear()
		const target = document.querySelector(`[data-project-morph-to="${id}"]`)
		if (!target || reduced) { html.classList.remove('is-project-morph-pending'); return }

		if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
		scrollTo(0, 0)
		html.classList.add('is-project-morph-pending')
		lock()

		const clone = buildClone(d, coverRect())
		document.body.appendChild(clone)
		const t0 = performance.now()

		await ready(target, (d.time || 0) + 0.15)
		/* the real cover now sits, loaded, exactly under the clone */
		if (target.tagName === 'VIDEO') {
			const cm = clone.querySelector('video')
			try { target.currentTime = cm ? cm.currentTime : target.currentTime } catch {}
		}
		html.classList.add('is-project-morph-revealing')
		html.classList.remove('is-project-morph-pending')
		clone.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, easing: 'linear', fill: 'forwards' })
			.finished.then(() => clone.remove())
		setTimeout(() => {
			unlock()
			setTimeout(() => html.classList.remove('is-project-morph-revealing'), 600)
		}, Math.max(260, 420 - (performance.now() - t0)))
	}

	const start = () => {
		if (document.body.classList.contains('case-page')) initCase()
		initSource()
	}
	if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start)
	else start()
})()
