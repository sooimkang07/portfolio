/* Explorations: each project row scrolls sideways. Touch swipes natively;
   mouse can drag; arrow buttons page by one piece. Media loads and plays
   only while its row is on screen. */
(() => {
	'use strict'
	const rows = [...document.querySelectorAll('.ex-row')]
	if (!rows.length) return
	const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches

	/* Reveal rows; load + play media while in view, pause when out */
	const io = new IntersectionObserver(entries => entries.forEach(e => {
		const row = e.target
		if (e.isIntersecting) row.classList.add('is-in')
		row.querySelectorAll('iframe[data-src]').forEach(f => { if (e.isIntersecting && !f.src) f.src = f.dataset.src })

	}), { threshold: 0.15, rootMargin: '0px 0px -5% 0px' })
	rows.forEach(r => io.observe(r))

	// Load only the clips near the visible rail viewport, rather than every clip in a row.
	const mediaObserver = new IntersectionObserver(entries => entries.forEach(({ target: video, isIntersecting }) => {
		if (!isIntersecting) { video.pause(); return }
		video.muted = true;
		video.defaultMuted = true;
		video.playsInline = true;
		if (!video.getAttribute('src')) {
			video.preload = 'auto';
			const source = video.dataset.src;
			video.src = matchMedia('(width < 760px)').matches && source.includes('/ibff/')
				? source.replace('.mp4', '-mobile.mp4') : source;
		}
		if (!reduced) video.play().catch(() => {});
	}), { rootMargin: '100px', threshold: 0 });
	document.querySelectorAll('.ex-row video').forEach(video => mediaObserver.observe(video));


	/* Items marked data-ar-auto take the media's own proportions once it loads, so nothing is cropped */
	document.querySelectorAll('.ex-item[data-ar-auto]').forEach(it => {
		const m = it.querySelector('img, video')
		const set = () => { const w = m.naturalWidth || m.videoWidth, h = m.naturalHeight || m.videoHeight; if (w && h) it.style.setProperty('--ar', `${w} / ${h}`) }
		m.addEventListener(m.tagName === 'IMG' ? 'load' : 'loadedmetadata', set)
		if (m.complete || m.readyState >= 1) set()
	})

	rows.forEach(row => {
		const rail = row.querySelector('.ex-row__rail')
		const [prev, next] = row.querySelectorAll('.ex-row__btn')

		/* Arrow state: hide when nothing overflows, disable at either end */
		const sync = () => {
			const max = rail.scrollWidth - rail.clientWidth
			row.classList.toggle('is-scrollable', max > 4)
			if (prev) prev.disabled = rail.scrollLeft <= 4
			if (next) next.disabled = rail.scrollLeft >= max - 4
		}
		rail.addEventListener('scroll', sync, { passive: true })
		new ResizeObserver(sync).observe(rail)
		sync()

		/* Page by one piece */
		const step = dir => {
			const items = [...rail.children]
			const pad = parseFloat(getComputedStyle(rail).paddingLeft) || 0
			const x = rail.scrollLeft
			const target = dir > 0
				? items.find(it => it.offsetLeft - pad > x + 4)
				: items.slice().reverse().find(it => it.offsetLeft - pad < x - 4)
			rail.scrollTo({ left: target ? target.offsetLeft - pad : (dir > 0 ? rail.scrollWidth : 0), behavior: reduced ? 'auto' : 'smooth' })
		}
		row.querySelectorAll('.ex-row__btn').forEach(b => b.addEventListener('click', () => step(+b.dataset.dir)))

		/* Mouse drag to scroll (touch and trackpads scroll natively) */
		let startX = 0, startLeft = 0, dragging = false
		rail.addEventListener('pointerdown', e => {
			if (e.pointerType !== 'mouse' || e.button !== 0) return
			startX = e.clientX; startLeft = rail.scrollLeft; dragging = false
			const move = ev => {
				const dx = ev.clientX - startX
				if (!dragging && Math.abs(dx) > 4) { dragging = true; rail.classList.add('is-dragging'); rail.setPointerCapture(e.pointerId) }
				if (dragging) rail.scrollLeft = startLeft - dx
			}
			const up = () => {
				rail.removeEventListener('pointermove', move)
				rail.classList.remove('is-dragging')
				removeEventListener('pointerup', up)
			}
			rail.addEventListener('pointermove', move)
			addEventListener('pointerup', up)
		})
	})

	/* Phones: each row's height is set so its widest column (an item, or a stack read as one shape)
	   spans the screen width at its own proportions; nothing is cropped and the rest scroll beside it */
	const phone = matchMedia('(width < 760px)')
	const ratio = el => { const a = getComputedStyle(el).aspectRatio.split('/').map(parseFloat); return a.length === 2 && a[1] ? a[0] / a[1] : a[0] || 16 / 9 }
	// a browser-window item's screen keeps the media's own ratio; the title bar sits on top of it
	const browserOf = col => col.matches('.ex-item') && col.querySelector('.ex-browser')
	const screenRatio = br => { const m = br.querySelector('.ex-browser__screen > :is(img, video)'); const w = m && (m.naturalWidth || m.videoWidth), h = m && (m.naturalHeight || m.videoHeight); return w && h ? w / h : 0 }
	const fitRows = () => rows.forEach(row => {
		const rail = row.querySelector('.ex-row__rail')
		const browsers = [...rail.children].filter(browserOf)
		rail.style.removeProperty('--ex-h')
		rail.querySelectorAll('.ex-item[data-ar-auto]').forEach(item => item.style.removeProperty('block-size'))
		const rowLimit = Math.max(...[...rail.children].map(col => parseFloat(getComputedStyle(col).blockSize) || 0))
		if (!phone.matches) { rail.style.removeProperty('--ex-h'); browsers.forEach(col => col.style.removeProperty('aspect-ratio')); return }
		const cs = getComputedStyle(rail)
		const avail = rail.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)
		// the tallest row height at which every column still fits the screen width
		let h = Infinity
		;[...rail.children].forEach(col => {
			const br = browserOf(col), sr = br && screenRatio(br)
			if (sr) h = Math.min(h, avail / sr + br.querySelector('.ex-browser__bar').offsetHeight)
			else if (col.classList.contains('ex-stack')) {
				// Mobile stacks become individual, equal-height rail items.
				const items = [...col.querySelectorAll(':scope > .ex-item')]
				h = Math.min(h, ...items.map(it => avail / ratio(it)))
			} else h = Math.min(h, avail / ratio(col))
		})
		if (!isFinite(h)) return
		if (['ibff', 'build-a-bubu', 'hand-coded-sites', 'ama', 'sam'].includes(row.id)) h *= 1.15
		// Taller rows must still keep each complete browser frame within the rail's usable width.
		browsers.forEach(col => {
			const br = browserOf(col), sr = screenRatio(br)
			h = Math.min(h, sr ? avail / sr + br.querySelector('.ex-browser__bar').offsetHeight : avail / ratio(col))
		})
		h = Math.floor(Math.min(h, rowLimit))
		rail.style.setProperty('--ex-h', `${h}px`)

		browsers.forEach(col => {
			const br = browserOf(col), sr = screenRatio(br)
			if (sr) col.style.aspectRatio = `${((h - br.querySelector('.ex-browser__bar').offsetHeight) * sr).toFixed(1)} / ${h}`
		})
	})
	document.querySelectorAll('.ex-phone__screen, .ex-browser__screen:has(> iframe)').forEach(screen => {
		const iframe = screen.querySelector('iframe')
		const fitViewport = () => {
			const viewport = screen.classList.contains('ex-phone__screen') ? 402 : 1400
			const scale = screen.clientWidth / viewport
			if (!scale) return
			iframe.style.inlineSize = `${viewport}px`
			iframe.style.blockSize = `${(screen.clientHeight - iframe.offsetTop - (parseFloat(getComputedStyle(iframe).insetBlockEnd) || 0)) / scale}px`
			iframe.style.transform = `scale(${scale})`
		}
		new ResizeObserver(fitViewport).observe(screen)
		fitViewport()
	})
	fitRows()
	addEventListener('resize', fitRows, { passive: true })
	document.querySelectorAll('.ex-item[data-ar-auto] img, .ex-item[data-ar-auto] video, .ex-browser__screen > img, .ex-browser__screen > video').forEach(m => m.addEventListener(m.tagName === 'IMG' ? 'load' : 'loadedmetadata', fitRows))
})()
