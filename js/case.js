/* ============================================================
   CASE — shared behavior for every project page
   1. Video playback (in-view autoplay, pause/replay/volume)
   2. Image zoom lightbox
   ============================================================ */
(() => {
	'use strict'

	const reduced = matchMedia('(prefers-reduced-motion: reduce)')

	/* ── 1. Video playback ─────────────────────────────────── */
	function realVideo(device) {
		const v = device.querySelector('video')
		return v && typeof v.play === 'function' ? v : null
	}

	document.querySelectorAll('.flow__device, .ig-gallery__tile').forEach(device => {
		const video = realVideo(device)
		const pauseBtn = device.querySelector('.flow__btn--pause')
		const replayBtn = device.querySelector('.flow__btn--replay')
		if (!video) return
		video.muted = true
		video.controls = false

		const sync = () => {
			if (!pauseBtn) return
			pauseBtn.classList.toggle('is-playing', !video.paused)
			pauseBtn.setAttribute('aria-label', video.paused ? 'Play video' : 'Pause video')
		}
		const play = () => { if (!video.dataset.userPaused) video.play().catch(sync) }

		video.addEventListener('play', sync)
		video.addEventListener('pause', sync)
		video.addEventListener('ended', sync)

		pauseBtn?.addEventListener('click', e => {
			e.stopPropagation()
			if (video.paused) { delete video.dataset.userPaused; video.play().catch(sync) }
			else { video.dataset.userPaused = '1'; video.pause() }
		})
		replayBtn?.addEventListener('click', e => {
			e.stopPropagation()
			delete video.dataset.userPaused
			video.currentTime = 0
			video.play().catch(sync)
		})

		const volBtn = device.querySelector('.flow__btn--volume')
		const volSlider = device.querySelector('.flow__volume-slider')
		if (volBtn) {
			volBtn.classList.add('is-muted')
			if (volSlider) volSlider.value = 0
			volSlider?.addEventListener('input', () => {
				const val = parseFloat(volSlider.value)
				video.volume = val
				video.muted = val === 0
				volBtn.classList.toggle('is-muted', video.muted)
			})
			volBtn.addEventListener('click', e => {
				e.stopPropagation()
				video.muted = !video.muted
				if (!video.muted && video.volume === 0) video.volume = 1
				volBtn.classList.toggle('is-muted', video.muted)
				if (volSlider) volSlider.value = video.muted ? 0 : video.volume
			})
		}

		if ('IntersectionObserver' in window) {
			new IntersectionObserver(entries => entries.forEach(entry => {
				if (entry.isIntersecting) play()
				else if (!video.closest('[data-case-cover]') || !document.documentElement.classList.contains('is-project-morph-pending')) video.pause()
			}), { threshold: 0.25 }).observe(device)
		} else play()
		sync()
	})

	document.addEventListener('visibilitychange', () => {
		if (document.hidden) return
		document.querySelectorAll('.flow__device video, .ig-gallery__tile video').forEach(v => {
			const r = v.getBoundingClientRect()
			if (r.bottom > 0 && r.top < innerHeight && !v.dataset.userPaused && typeof v.play === 'function') v.play().catch(() => {})
		})
	})

	/* ── 2. Image zoom lightbox ─────────────────────────────── */
	const frames = document.querySelectorAll('main img.case__frame[src]')
	if (frames.length) {
		const modal = document.createElement('div')
		modal.className = 'zoom-modal'
		modal.setAttribute('role', 'dialog')
		modal.setAttribute('aria-modal', 'true')
		modal.setAttribute('aria-label', 'Image viewer')
		modal.innerHTML = '<div class="zoom-modal__inner"><img class="zoom-modal__img" src="" alt=""><button class="zoom-modal__close" type="button" aria-label="Close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>'
		document.body.appendChild(modal)
		const modalImg = modal.querySelector('.zoom-modal__img')
		const close = () => { modal.classList.remove('is-open'); document.body.style.overflow = '' }
		modal.querySelector('.zoom-modal__close').addEventListener('click', close)
		modal.addEventListener('click', e => { if (e.target === modal) close() })
		addEventListener('keydown', e => { if (e.key === 'Escape') close() })
		frames.forEach(img => {
			if (!img.getAttribute('src')) return
			img.style.cursor = 'zoom-in'
			img.addEventListener('click', () => {
				modalImg.src = img.currentSrc || img.src
				modalImg.alt = img.alt || ''
				modal.classList.add('is-open')
				document.body.style.overflow = 'hidden'
			})
		})
	}
})()
