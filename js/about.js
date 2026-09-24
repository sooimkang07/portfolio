/* About: NYC clock pill, the Recently row (from recents.json), and a Stories viewer for photos. */
(() => {
	'use strict'
	const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches

	/* NYC clock */
	const clock = document.querySelector('[data-nyc-clock]')
	if (clock) {
		const tick = () => {
			clock.textContent = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' })
		}
		tick()
		setInterval(tick, 15000)
	}

	/* Liquid glass: light follows the pointer; touch gets the pressed state */
	document.addEventListener('pointermove', e => {
		const g = e.target.closest?.('.glass')
		if (!g) return
		const r = g.getBoundingClientRect()
		g.style.setProperty('--mx', (e.clientX - r.left) + 'px')
		g.style.setProperty('--my', (e.clientY - r.top) + 'px')
	}, { passive: true })
	document.addEventListener('pointerdown', e => {
		const g = e.target.closest?.('.glass')
		if (!g) return
		const r = g.getBoundingClientRect()
		g.style.setProperty('--mx', (e.clientX - r.left) + 'px')
		g.style.setProperty('--my', (e.clientY - r.top) + 'px')
		g.classList.add('is-pressed')
		const up = () => { g.classList.remove('is-pressed'); removeEventListener('pointerup', up); removeEventListener('pointercancel', up) }
		addEventListener('pointerup', up); addEventListener('pointercancel', up)
	})

	/* Album Play: a full-screen slideshow, modeled on Apple Photos */
	const playBtn = document.querySelector('[data-album-play]')
	const openShow = (start = 0, autoplay = true, opener = playBtn) => {
		const photos = [...document.querySelectorAll('.ab-photos img')].map(i => ({ src: i.currentSrc || i.src, alt: i.alt }))
		if (!photos.length) return
		const I = {
			close: '<svg viewBox="0 0 24 24"><path d="M6.4 5 12 10.6 17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4-5.6-5.6L6.4 19 5 17.6l5.6-5.6L5 6.4z"/></svg>',
			back: '<svg viewBox="0 0 24 24"><path d="M15.4 4.6 8 12l7.4 7.4-1.5 1.5L5 12l8.9-8.9z"/></svg>',
			pause: '<svg viewBox="0 0 24 24"><rect x="6.5" y="5" width="3.6" height="14" rx="1"/><rect x="13.9" y="5" width="3.6" height="14" rx="1"/></svg>',
			play: '<svg viewBox="0 0 24 24"><path d="M8.6 6.4v11.2a1 1 0 0 0 1.52.85l8.9-5.6a1 1 0 0 0 0-1.7l-8.9-5.6a1 1 0 0 0-1.52.85z"/></svg>',
			next: '<svg viewBox="0 0 24 24"><path d="m8.6 19.4 7.4-7.4-7.4-7.4 1.5-1.5 8.9 8.9-8.9 8.9z"/></svg>',
			grid: '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="4.5" height="4.5" rx="1"/><rect x="9.75" y="4" width="4.5" height="4.5" rx="1"/><rect x="15.5" y="4" width="4.5" height="4.5" rx="1"/><rect x="4" y="9.75" width="4.5" height="4.5" rx="1"/><rect x="9.75" y="9.75" width="4.5" height="4.5" rx="1"/><rect x="15.5" y="9.75" width="4.5" height="4.5" rx="1"/><rect x="4" y="15.5" width="4.5" height="4.5" rx="1"/><rect x="9.75" y="15.5" width="4.5" height="4.5" rx="1"/><rect x="15.5" y="15.5" width="4.5" height="4.5" rx="1"/></svg>'
		}
		const show = document.createElement('div')
		show.className = 'ab-show'
		show.setAttribute('role', 'dialog'); show.setAttribute('aria-modal', 'true'); show.setAttribute('aria-label', 'Camera roll slideshow')
		show.tabIndex = -1
		show.innerHTML = `<div class="ab-show__stage"><div class="ab-show__track">${photos.map(p => `<div class="ab-show__slide"><img src="${esc(p.src)}" alt="${esc(p.alt)}"></div>`).join('')}</div></div>
			<button class="ab-show__back ab-lglass" type="button" data-x aria-label="Close slideshow">${I.close}</button>
			<button class="ab-show__big ab-lglass" type="button" data-big aria-label="Play">${I.play}</button>
			<button class="ab-show__arrow ab-show__arrow--prev ab-lglass" type="button" data-p aria-label="Previous photo">${I.back}</button>
			<button class="ab-show__arrow ab-show__arrow--next ab-lglass" type="button" data-n aria-label="Next photo">${I.next}</button>
			<div class="ab-show__strip">${photos.map((p, n) => `<button class="ab-show__thumb" type="button" data-i="${n}" aria-label="Photo ${n + 1}"><img src="${esc(p.src)}" alt=""></button>`).join('')}</div>`
		document.body.append(show)
		document.documentElement.style.overflow = 'hidden'
		const slides = [...show.querySelectorAll('.ab-show__slide')]
		const thumbs = [...show.querySelectorAll('.ab-show__thumb')]
		const track = show.querySelector('.ab-show__track')
		let i = -1, timer = 0, playing = true
		const center = () => {
			const s = slides[i]; if (!s) return
			const w = s.offsetWidth
			track.style.transform = `translateX(${innerWidth / 2 - (s.offsetLeft + w / 2)}px)`
			show.style.setProperty('--hw', (w / 2) + 'px')
		}
		show.querySelectorAll('.ab-show__slide img').forEach(im => im.addEventListener('load', center))
		addEventListener('resize', center)
		const go = n => {
			thumbs[i]?.classList.remove('is-on')
			i = (n + slides.length) % slides.length
			slides.forEach((s, k) => s.classList.toggle('is-on', k === i))
			center()
			thumbs[i].classList.add('is-on')
			thumbs[i].scrollIntoView({ block: 'nearest', inline: 'center', behavior: reduced ? 'auto' : 'smooth' })
		}
		const schedule = () => { clearInterval(timer); if (playing) timer = setInterval(() => go(i + 1), 2000) }
		const setPlaying = v => {
			playing = v; show.classList.toggle('is-paused', !v)
			schedule()
		}
		const close = () => { clearInterval(timer); removeEventListener('keydown', onKey); removeEventListener('resize', center); show.remove(); document.documentElement.style.overflow = ''; opener?.focus({ preventScroll: true }) }
		const onKey = e => {
			if (e.key === 'Escape') close()
			else if (e.key === 'ArrowRight') { go(i + 1); schedule() }
			else if (e.key === 'ArrowLeft') { go(i - 1); schedule() }
			else if (e.key === ' ') { e.preventDefault(); setPlaying(!playing) }
		}
		show.querySelectorAll('[data-x]').forEach(b => b.addEventListener('click', close))
		show.querySelector('[data-big]').addEventListener('click', () => setPlaying(true))
		const stage = show.querySelector('.ab-show__stage')
		let sx = 0
		stage.addEventListener('pointerdown', e => { sx = e.clientX })
		stage.addEventListener('pointerup', e => {
			const dx = e.clientX - sx
			if (Math.abs(dx) > 40) { go(i + (dx < 0 ? 1 : -1)); schedule(); return }
			const s = e.target.closest('.ab-show__slide')
			const k = slides.indexOf(s)
			if (k > -1 && k !== i) { go(k); schedule() } else setPlaying(!playing)
		})
		show.querySelector('[data-p]').addEventListener('click', () => { go(i - 1); schedule() })
		show.querySelector('[data-n]').addEventListener('click', () => { go(i + 1); schedule() })
		thumbs.forEach(t => t.addEventListener('click', () => { go(+t.dataset.i); setPlaying(false) }))
		addEventListener('keydown', onKey)
		go(start); setPlaying(autoplay && !reduced)
		show.focus({ preventScroll: true })
	}
	if (playBtn) playBtn.addEventListener('click', () => openShow(0, true, playBtn))
	document.querySelectorAll('.ab-photos .ab-photo').forEach((f, n) => {
		f.tabIndex = 0; f.setAttribute('role', 'button'); f.setAttribute('aria-label', 'Open photo ' + (n + 1) + ' in the slideshow')
		f.addEventListener('click', () => openShow(n, true, f))
		f.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openShow(n, true, f) } })
	})

	/* Hero reel: TikTok-style feed. Plays in view, tap to pause, loops back to the top. */
	const reel = document.querySelector('[data-reel]')
	if (reel) {
		const escH = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
		const fig = reel.closest('.ab-reel')
		const items = [...reel.querySelectorAll('.ab-reel__item')]
		let cur = -1, inView = false, paused = false, sheetOpen = false
		const vid = n => items[n]?.querySelector('video')
		const load = v => { if (v && !v.src) v.src = v.dataset.src }
		const setPaused = p => { paused = p; fig.classList.toggle('is-paused', p); const v = vid(cur); if (!v) return; p ? v.pause() : v.play().catch(() => {}) }
		const shouldPlay = () => inView && !paused && !sheetOpen && !reduced
		const activate = n => {
			if (n === cur) return
			items.forEach((it, k) => { if (k !== n) vid(k).pause() })
			cur = n; paused = false; fig.classList.remove('is-paused')
			const v = vid(n); load(v); load(vid((n + 1) % items.length))
			v.currentTime = 0
			if (shouldPlay()) v.play().catch(() => {})
		}
		const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting && e.intersectionRatio > 0.6) activate(items.indexOf(e.target)) }), { root: reel, threshold: [0.6] })
		items.forEach(it => io.observe(it))
		new IntersectionObserver(es => { inView = es[0].isIntersecting; const v = vid(cur); if (!v) return; shouldPlay() ? v.play().catch(() => {}) : v.pause() }, { threshold: 0.3 }).observe(reel)
		const goNext = () => {
			const next = (cur + 1) % items.length
			reel.scrollTo({ top: next * reel.clientHeight, behavior: reduced ? 'auto' : 'smooth' })
		}
		items.forEach((it, k) => { const v = vid(k); v.loop = false; v.addEventListener('ended', () => { if (k === cur && !paused && !sheetOpen) goNext() }) })

		reel.addEventListener('click', e => {
			const b = e.target.closest('[data-like],[data-save]')
			if (b) { const on = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', String(on)); const n = b.querySelector('.ab-tt__n'); if (n) { const v = parseInt(n.textContent.replace(/,/g, ''), 10) || 0; n.textContent = (v + (on ? 1 : -1)).toLocaleString('en-US') } return }
			if (e.target.closest('[data-comments]')) { openSheet(); return }
			if (e.target.closest('a, button, .ab-tt__meta')) return
			setPaused(!paused)
		})

		/* Comments: shared through Supabase when configured, otherwise saved in this browser */
		const cfg = window.SK_COMMENTS || {}
		let remote = !!(cfg.url && cfg.anonKey)
		const sheet = fig.querySelector('[data-cm]')
		const listEl = sheet.querySelector('[data-cm-list]')
		const title = sheet.querySelector('[data-cm-title]')
		const form = sheet.querySelector('[data-cm-form]')
		const input = form.querySelector('.ab-cm__input')
		const nameIn = form.querySelector('.ab-cm__name')
		const send = form.querySelector('.ab-cm__send')
		const note = sheet.querySelector('[data-cm-note]')
		const clipId = () => items[cur]?.dataset.clip || 'me'
		const LS = 'sk-reel-comments'
		const readLocal = () => { try { return JSON.parse(localStorage.getItem(LS) || '[]') } catch { return [] } }
		const writeLocal = a => { try { localStorage.setItem(LS, JSON.stringify(a.slice(-500))) } catch {} }
		try { nameIn.value = localStorage.getItem('sk-reel-name') || '' } catch {}
		const MINE = 'sk-reel-mine'
		const readMine = () => { try { return JSON.parse(localStorage.getItem(MINE) || '{}') } catch { return {} } }
		const writeMine = m => { try { localStorage.setItem(MINE, JSON.stringify(m)) } catch {} }
		const newToken = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36))
		const H = { apikey: cfg.anonKey, Authorization: 'Bearer ' + cfg.anonKey, 'Content-Type': 'application/json' }
		// Shared comments live in Supabase. If it can't be reached (e.g. the free project is paused),
		// fall back quietly to comments saved only in this visitor's browser.
		const rfetch = async (url, opts = {}) => {
			const ac = new AbortController(), t = setTimeout(() => ac.abort(), 5000)
			try { const r = await fetch(url, { ...opts, signal: ac.signal }); if (!r.ok) throw new Error(r.status); return r }
			finally { clearTimeout(t) }
		}
		const localFor = clip => { const mine = readMine(); return readLocal().filter(c => c.clip === clip).map(c => ({ ...c, mine: !!mine[c.id], local: true })) }
		const byNewest = (a, b) => new Date(b.created_at) - new Date(a.created_at)
		const fetchComments = async clip => {
			const mine = readMine()
			if (remote) {
				try {
					const r = await rfetch(`${cfg.url}/rest/v1/reel_comments?select=id,name,body,created_at&clip=eq.${encodeURIComponent(clip)}&order=created_at.desc&limit=200`, { headers: H })
					const rows = (await r.json()).map(c => ({ ...c, mine: !!mine[c.id] }))
					return [...rows, ...localFor(clip)].sort(byNewest)
				} catch { remote = false }
			}
			return localFor(clip).sort(byNewest)
		}
		const postComment = async (clip, name, body) => {
			const token = newToken()
			const row = { clip, name: name || null, body }
			let c
			if (remote) {
				try {
					const r = await rfetch(`${cfg.url}/rest/v1/reel_comments?select=id,name,body,created_at`, { method: 'POST', headers: { ...H, Prefer: 'return=representation' }, body: JSON.stringify({ ...row, delete_token: token }) })
					c = (await r.json())[0]
				} catch { remote = false }
			}
			if (!c) { const a = readLocal(); c = { ...row, id: 'l' + Date.now(), created_at: new Date().toISOString() }; a.push(c); writeLocal(a) }
			const m = readMine(); m[c.id] = token; writeMine(m)
			return c
		}
		const deleteComment = async id => {
			const m = readMine(), a = readLocal()
			if (a.some(c => String(c.id) === String(id))) writeLocal(a.filter(c => String(c.id) !== String(id)))
			else await rfetch(`${cfg.url}/rest/v1/rpc/delete_reel_comment`, { method: 'POST', headers: H, body: JSON.stringify({ p_id: +id, p_token: m[id] || '' }) })
			delete m[id]; writeMine(m)
		}
		const ago = iso => {
			const s = (Date.now() - new Date(iso)) / 1000
			if (s < 60) return 'now'
			if (s < 3600) return Math.floor(s / 60) + 'm'
			if (s < 86400) return Math.floor(s / 3600) + 'h'
			if (s < 604800) return Math.floor(s / 86400) + 'd'
			return new Date(iso).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })
		}
		const heart = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.4-8.9-8.6C1.7 8.3 3.6 4.8 7 4.8c1.9 0 3.3 1 5 2.8 1.7-1.8 3.1-2.8 5-2.8 3.4 0 5.3 3.5 3.9 6.6C19 15.6 12 20 12 20z"/></svg>'
		const down = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16.5 4.5H8.2c-.9 0-1.6.6-1.8 1.4l-1.8 7c-.3 1.2.6 2.3 1.8 2.3h4.3l-.7 3.3c-.2 1 .4 1.9 1.4 2l.5.1 4.6-6.1V4.5zm0 0h2.7c.7 0 1.3.6 1.3 1.3v7.5c0 .7-.6 1.3-1.3 1.3h-2.7" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>'
		const row = c => `<li class="ab-cm__item${c.mine ? ' is-mine' : ''}" data-id="${escH(String(c.id))}"><span class="ab-cm__av" aria-hidden="true"></span><div class="ab-cm__body"><p class="ab-cm__who">${escH(c.name || 'guest')}${c.mine ? ' · <b>You</b>' : ''}</p><p class="ab-cm__txt">${escH(c.body)}</p><div class="ab-cm__meta"><span>${ago(c.created_at)}</span><button type="button" class="ab-cm__reply" data-reply="${escH(c.name || 'guest')}">Reply</button><span class="ab-cm__acts"><button class="ab-cm__like" type="button" aria-pressed="false" aria-label="Like comment">${heart}<span>0</span></button><button class="ab-cm__down" type="button" aria-pressed="false" aria-label="Dislike comment">${down}</button></span></div></div></li>`
		let shown = []
		const render = () => {
			title.textContent = shown.length ? `${shown.length} comment${shown.length === 1 ? '' : 's'}` : 'Comments'
			listEl.innerHTML = shown.length ? shown.map(row).join('') : '<li class="ab-cm__empty">No comments yet. Say hi 👋</li>'
		}
		const openSheet = async () => {
			sheetOpen = true; vid(cur)?.pause()
			sheet.hidden = false
			note.textContent = ''
			listEl.innerHTML = '<li class="ab-cm__empty">Loading…</li>'
			try { shown = await fetchComments(clipId()) } catch { shown = []; note.textContent = 'Couldn’t load comments right now.' }
			render(); setCount(clipId(), shown.length)
			form.classList.remove('is-open')
		}
		const acts = document.createElement('div')
		acts.className = 'ab-cm__actsheet'; acts.hidden = true
		acts.innerHTML = '<div class="ab-cm__card"><button type="button" class="ab-cm__opt" data-del><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6.5h16M9.5 6.5V4.8c0-.7.6-1.3 1.3-1.3h2.4c.7 0 1.3.6 1.3 1.3v1.7M6.2 6.5l.9 12.6c.1 1 .9 1.9 2 1.9h5.8c1 0 1.9-.8 2-1.9l.9-12.6M10.2 10.5v6.5M13.8 10.5v6.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>Delete</button></div>'
		sheet.append(acts)
		const toast = document.createElement('div'); toast.className = 'ab-cm__toast'; toast.setAttribute('role', 'status'); fig.append(toast)
		let target = null, toastT
		const showToast = t => { toast.textContent = t; toast.classList.add('is-on'); clearTimeout(toastT); toastT = setTimeout(() => toast.classList.remove('is-on'), 1600) }
		const openActs = li => { acts.classList.remove('is-closing'); target = li; li.classList.add('is-held'); acts.hidden = false; acts.querySelector('[data-del]').focus({ preventScroll: true }) }
		const closeActs = () => { if (acts.hidden) return; target?.classList.remove('is-held'); target = null; acts.classList.add('is-closing'); setTimeout(() => { acts.hidden = true; acts.classList.remove('is-closing') }, 220) }
		acts.addEventListener('click', async e => {
			if (!e.target.closest('[data-del]')) { if (!e.target.closest('.ab-cm__card')) closeActs(); return }
			const li = target, id = li?.dataset.id; closeActs(); if (!id) return
			try {
				await deleteComment(id)
				shown = shown.filter(c => String(c.id) !== id); render(); setCount(clipId(), shown.length)
				showToast('Deleted')
			} catch { showToast('Couldn’t delete') }
		})
		acts.addEventListener('keydown', e => { if (e.key === 'Escape') { e.stopPropagation(); closeActs() } })
		listEl.addEventListener('contextmenu', e => { const li = e.target.closest('.ab-cm__item.is-mine'); if (!li) return; e.preventDefault(); openActs(li) })
		let pressT
		listEl.addEventListener('touchstart', e => { const li = e.target.closest('.ab-cm__item.is-mine'); if (!li) return; pressT = setTimeout(() => openActs(li), 500) }, { passive: true })
		;['touchend', 'touchmove', 'touchcancel'].forEach(ev => listEl.addEventListener(ev, () => clearTimeout(pressT), { passive: true }))
		const closeSheet = () => { closeActs(); sheet.hidden = true; sheetOpen = false; if (shouldPlay()) vid(cur)?.play().catch(() => {}) }
		sheet.querySelector('[data-cm-close]').addEventListener('click', closeSheet)
		sheet.addEventListener('click', e => { if (e.target === sheet) closeSheet() })
		sheet.addEventListener('keydown', e => { if (e.key === 'Escape') closeSheet() })
		listEl.addEventListener('click', e => {
			const r = e.target.closest('[data-reply]'); if (r) { input.value = '@' + r.dataset.reply + ' '; sync(); input.focus(); return }
			const b = e.target.closest('.ab-cm__like, .ab-cm__down'); if (!b) return
			const on = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', String(on))
			const n = b.querySelector('span'); if (n) n.textContent = String(Math.max(0, +n.textContent + (on ? 1 : -1)))
		})
		const sync = () => { const has = input.value.trim().length > 0; send.disabled = !has; form.classList.toggle('has-text', has) }
		input.addEventListener('focus', () => form.classList.add('is-open'))
		sheet.querySelector('.ab-cm__list').addEventListener('pointerdown', () => { if (!input.value.trim()) form.classList.remove('is-open') })
		input.addEventListener('input', () => { sync(); input.style.height = 'auto'; input.style.height = Math.min(input.scrollHeight, 96) + 'px' })
		input.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); form.requestSubmit() } })
		sheet.querySelector('[data-cm-emoji]').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; input.value += b.textContent; sync(); input.focus() })
		let lastPost = 0
		form.addEventListener('submit', async e => {
			e.preventDefault()
			const body = input.value.trim().slice(0, 300); if (!body) return
			if (Date.now() - lastPost < 8000) return
			const name = nameIn.value.trim().slice(0, 40)
			try { localStorage.setItem('sk-reel-name', name) } catch {}
			send.disabled = true
			try {
				const c = await postComment(clipId(), name, body)
				lastPost = Date.now()
				shown.unshift({ ...c, mine: true }); render(); setCount(clipId(), shown.length); input.value = ''; input.style.height = ''; sync()
				note.textContent = ''
			} catch { note.textContent = 'Couldn’t post that. Try again?'; sync() }
		})

		const setCount = (clip, n) => { const el = reel.querySelector(`[data-clip="${clip}"] [data-ccount]`); if (el) el.textContent = n.toLocaleString('en-US') }
		const loadCounts = async () => {
			const local = readLocal(), n = (rows, clip) => rows.filter(c => c.clip === clip).length
			let rows = []
			if (remote) { try { rows = await (await rfetch(`${cfg.url}/rest/v1/reel_comments?select=clip`, { headers: H })).json() } catch { remote = false } }
			items.forEach(it => setCount(it.dataset.clip, n(rows, it.dataset.clip) + n(local, it.dataset.clip)))
		}
		loadCounts()
		activate(0)
	}

	/* Clock widget: NYC time on an analog face */
	const hH = document.querySelector('.ab-clock [data-h]')
	if (hH) {
		const mH = document.querySelector('.ab-clock [data-m]'), sH = document.querySelector('.ab-clock [data-s]')
		const tickC = () => {
			const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false }).formatToParts(new Date()).map(x => [x.type, +x.value]))
			const h = p.hour % 12, m = p.minute, s = p.second
			hH.style.transform = `rotate(${h * 30 + m / 2}deg)`
			mH.style.transform = `rotate(${m * 6 + s / 10}deg)`
			sH.style.transform = `rotate(${s * 6}deg)`
			if (nowEl) nowEl.textContent = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' })
		}
		const nowEl = document.querySelector('[data-clock-now]'), tzEl = document.querySelector('[data-clock-tz]')
		if (tzEl) { const tz = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', timeZoneName: 'longGeneric' }).formatToParts(new Date()).find(x => x.type === 'timeZoneName'); if (tz) tzEl.textContent = tz.value }
		tickC(); setInterval(tickC, 1000)
	}

	const shelf = document.querySelector('[data-recents]')
	const list = document.querySelector('[data-recents-list]')
	if (!shelf || !list) return

	const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
	const when = d => {
		if (!d) return ''
		const t = new Date(d + 'T12:00:00')
		return isNaN(t) ? '' : 'Updated ' + t.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
	}
	const top = (label, d) => `<span class="ab-rec__top"><span class="ab-label">${label}</span><span class="ab-label">${when(d)}</span></span>`
	const ago = d => {
		if (!d) return ''
		const days = Math.floor((Date.now() - new Date(d + 'T12:00:00')) / 864e5)
		return days <= 0 ? 'today' : days < 7 ? days + 'd' : Math.floor(days / 7) + 'w'
	}
	const who = d => `<span class="ab-who"><span class="ab-who__ring"><img src="about-me-assets/me.jpg" alt=""></span><span class="ab-who__name">sooimkang</span><span class="ab-who__time">${ago(d)}</span></span>`
	const link = (href, inner, extra = '') => `<a class="ab-rec__card" href="${esc(href)}" target="_blank" rel="noopener"${extra}>${inner}</a>`

	const cards = {
		photos: p => {
			if (!p?.items?.length) return ''
			const bars = p.items.map(() => '<i></i>').join('')
			return `<li class="ab-rec ab-rec--story"><button class="ab-story" type="button" data-stories aria-label="Open my latest photos as a story">
				<img src="${esc(p.items[0].src)}" alt="" loading="lazy">
				<span class="ab-story__bars">${bars}</span>
				${who(p.items[0].date || p.updated)}
				<span class="ab-story__foot"><span class="ab-story__reply">Tap to watch</span></span>
			</button></li>`
		},
		eating: e => {
			if (!e?.link) return ''
			if (!e.place || !e.photo) {
				return `<li class="ab-rec">${link(e.link, `${top('Eating', e.updated)}<span><p class="ab-rec__title">${esc(e.place || 'Where I\u2019ve been eating')}</p><p class="ab-rec__sub">My ranked list on Beli ↗</p></span>`)}</li>`
			}
			const score = e.score ? `<span class="ab-tile__score" aria-label="My Beli score: ${esc(e.score)}">${esc(e.score)}</span>` : ''
			const meta = [e.area, e.visits].filter(Boolean).map(esc).join(' · ')
			return `<li class="ab-rec ab-rec--tile ab-rec--eat"><a class="ab-tile" href="${esc(e.link)}" target="_blank" rel="noopener">
				<img src="${esc(e.photo)}" alt="${esc(e.place)}" loading="lazy">
				<span class="ab-tile__top"><span class="ab-tile__label">Eating · Beli</span>${score}</span>
				<span class="ab-tile__body"><span class="ab-tile__date">${esc(when(e.updated)).replace('Updated', 'Ranked')}</span><span class="ab-tile__title">${esc(e.place)}</span><span class="ab-tile__sub">${meta}</span>${e.fave ? `<span class="ab-tile__quote">Get the ${esc(e.fave.toLowerCase())}</span>` : ''}</span>
			</a></li>`
		},
		watching: w => {
			if (!w?.title) return ''
			const meta = `${esc(w.year || '')}${w.rating ? ' · ' + esc(w.rating) : ''}`
			if (!w.poster) return `<li class="ab-rec">${link(w.link, `${top('Watching', w.updated)}<span><p class="ab-rec__title">${esc(w.title)}</p><p class="ab-rec__sub">${meta}</p></span>`)}</li>`
			return `<li class="ab-rec ab-rec--tile ab-rec--watch"><a class="ab-tile" href="${esc(w.link)}" target="_blank" rel="noopener">
				<img src="${esc(w.poster)}" alt="${esc(w.title)} poster" loading="lazy" referrerpolicy="no-referrer">
				<span class="ab-tile__top"><span class="ab-tile__label">Watching · Letterboxd</span></span>
				<span class="ab-tile__body"><span class="ab-tile__date">${esc(when(w.updated)).replace('Updated', 'Watched')}</span><span class="ab-tile__title">${esc(w.title)}</span><span class="ab-tile__sub">${meta}</span>${w.review ? `<span class="ab-tile__quote">\u201C${esc(w.review)}\u201D</span>` : ''}</span>
			</a></li>`
		},
		listening: l => {
			if (!l?.episode) return ''
			return `<li class="ab-rec">${link(l.link, `${top('Listening', l.updated)}<span><p class="ab-rec__title">${esc(l.episode)}</p><p class="ab-rec__sub">${esc(l.show || '')}</p></span>`)}</li>`
		},
		story: s => {
			if (!s?.headline) return ''
			return `<li class="ab-rec ab-rec--wide">${link(s.link, `${top('Following the story', s.updated)}<span><p class="ab-rec__title">${esc(s.headline)}</p><p class="ab-rec__sub">${esc(s.source || '')}</p>${s.take ? `<p class="ab-rec__take">Why it matters: ${esc(s.take)}</p>` : ''}</span>`)}</li>`
		}
	}

	fetch('recents.json', { cache: 'no-cache' })
		.then(r => (r.ok ? r.json() : Promise.reject(r.status)))
		.then(data => {
			const html = ['photos', 'eating', 'watching', 'listening', 'story'].map(k => cards[k](data[k])).join('')
			if (!html) return
			list.innerHTML = html
			shelf.hidden = false
			const btn = list.querySelector('[data-stories]')
			if (btn) btn.addEventListener('click', () => openStories(data.photos))
		})
		.catch(() => {})

	/* Stories: tap right = next, tap left = back, hold = pause, swipe down or Esc = close */
	function openStories(p) {
		const items = p.items
		const DUR = 4000
		const view = document.createElement('div')
		view.className = 'ab-stories'
		view.setAttribute('role', 'dialog')
		view.setAttribute('aria-modal', 'true')
		view.setAttribute('aria-label', 'My latest photos')
		view.innerHTML = `<div class="ab-stories__frame">
			<div class="ab-stories__bars">${items.map(() => '<span class="ab-stories__bar"><span></span></span>').join('')}</div>
			<img alt="">${who(items[0].date || p.updated)}<p class="ab-stories__cap"></p>
			<button class="ab-stories__close" type="button" aria-label="Close">×</button></div>
			<button class="ab-stories__nav ab-stories__nav--prev ab-lglass" type="button" aria-label="Previous photo"><svg viewBox="0 0 24 24"><path d="M15.4 4.6 8 12l7.4 7.4-1.5 1.5L5 12l8.9-8.9z"/></svg></button>
			<button class="ab-stories__nav ab-stories__nav--next ab-lglass" type="button" aria-label="Next photo"><svg viewBox="0 0 24 24"><path d="m8.6 19.4 7.4-7.4-7.4-7.4 1.5-1.5 8.9 8.9-8.9 8.9z"/></svg></button>`
		document.body.append(view)
		const frame = view.querySelector('.ab-stories__frame')
		const img = frame.querySelector('img')
		const cap = frame.querySelector('.ab-stories__cap')
		const fills = [...view.querySelectorAll('.ab-stories__bar span')]
		const closeBtn = view.querySelector('.ab-stories__close')
		const prevB = view.querySelector('.ab-stories__nav--prev'), nextB = view.querySelector('.ab-stories__nav--next')
		prevB.addEventListener('click', e => { e.stopPropagation(); show(Math.max(0, i - 1)) })
		nextB.addEventListener('click', e => { e.stopPropagation(); if (i < items.length - 1) show(i + 1); else close() })
		const prevFocus = document.activeElement
		let i = 0, start = 0, elapsed = 0, paused = false, raf = 0, downAt = 0, downY = 0, held = false, holdT = 0

		const show = n => {
			i = n
			img.src = items[i].src
			img.alt = items[i].caption || ''
			cap.textContent = items[i].caption || ''
			const tEl = frame.querySelector('.ab-who__time'); if (tEl) tEl.textContent = ago(items[i].date || p.updated)
			prevB.hidden = i === 0; nextB.hidden = false
			fills.forEach((f, k) => { f.style.width = k < i ? '100%' : '0%' })
			elapsed = 0
			start = performance.now()
		}
		const loop = now => {
			if (!paused) {
				const t = elapsed + (now - start)
				fills[i].style.width = Math.min(100, (t / DUR) * 100) + '%'
				if (t >= DUR) { if (i < items.length - 1) show(i + 1); else return close() }
			}
			raf = requestAnimationFrame(loop)
		}
		const pause = () => { if (!paused) { elapsed += performance.now() - start; paused = true } }
		const resume = () => { if (paused) { start = performance.now(); paused = false } }
		const close = () => {
			cancelAnimationFrame(raf)
			removeEventListener('keydown', onKey)
			view.remove()
			prevFocus?.focus?.()
		}
		const onKey = e => {
			if (e.key === 'Escape') close()
			else if (e.key === 'ArrowRight') { if (i < items.length - 1) show(i + 1); else close() }
			else if (e.key === 'ArrowLeft') show(Math.max(0, i - 1))
			else if (e.key === ' ') { e.preventDefault(); paused ? resume() : pause() }
		}

		frame.addEventListener('pointerdown', e => {
			if (e.target === closeBtn) return
			downAt = performance.now(); downY = e.clientY; held = false
			holdT = setTimeout(() => { held = true; pause() }, 220)
		})
		frame.addEventListener('pointerup', e => {
			if (e.target === closeBtn) return
			clearTimeout(holdT)
			if (e.clientY - downY > 80) return close()
			if (held) return resume()
			const r = frame.getBoundingClientRect()
			if (e.clientX - r.left < r.width / 3) show(Math.max(0, i - 1))
			else if (i < items.length - 1) show(i + 1)
			else close()
		})
		frame.addEventListener('pointercancel', () => { clearTimeout(holdT); resume() })
		view.addEventListener('click', e => { if (e.target === view) close() })
		closeBtn.addEventListener('click', close)
		addEventListener('keydown', onKey)

		show(0)
		if (reduced) { fills.forEach(f => { f.style.transition = 'none' }) }
		raf = requestAnimationFrame(loop)
		closeBtn.focus()
	}
})()
;(() => { const n = document.querySelector('.nav'); if (!n) return; const set = () => { const l = n.querySelector('.nav__logo'), r = l && l.getBoundingClientRect(); const h = r && r.height ? Math.round(r.bottom + Math.max(0, r.top)) : Math.min(n.offsetHeight, 96); document.documentElement.style.setProperty('--ab-nav', Math.min(h, 120) + 'px') }; set(); addEventListener('resize', set) })()
;(() => { const t = document.querySelector('.ab-album-text'), h = t?.parentElement; if (!t || !window.ResizeObserver) return; new ResizeObserver(() => h.style.setProperty('--ab-play', Math.max(56, Math.round(t.offsetHeight)) + 'px')).observe(t) })()
;(() => {
	const b = document.querySelector('[data-say]'), a = document.querySelector('[data-say-audio]'); if (!b || !a) return
	const set = on => { b.classList.toggle('is-playing', on); b.setAttribute('aria-pressed', String(on)) }
	b.addEventListener('click', () => { if (!a.paused) { a.pause(); a.currentTime = 0; set(false); return } a.currentTime = 0; a.play().then(() => set(true)).catch(() => set(false)) })
	a.addEventListener('ended', () => set(false)); a.addEventListener('pause', () => set(false))
})()
;(() => {
	const n = document.querySelector('.ab-name'), b = document.querySelector('[data-say]')
	if (!n || !b || matchMedia('(prefers-reduced-motion: reduce)').matches) return
	// One sheen pass per state change: left→right as the speaker slides out, right→left as it tucks back in
	const sweep = dir => { n.classList.remove('is-sweep-in', 'is-sweep-out'); void n.offsetWidth; n.classList.add(dir === 'in' ? 'is-sweep-in' : 'is-sweep-out') }
	const open = () => { if (!n.classList.contains('is-playing')) sweep('in') }
	const close = () => { if (!n.classList.contains('is-playing') && !n.matches(':hover')) sweep('out') }
	setTimeout(() => { n.classList.add('is-peek'); sweep('in'); setTimeout(() => { n.classList.remove('is-peek'); close() }, 1800) }, 700)
	n.addEventListener('pointerenter', () => { if (!n.classList.contains('is-peek')) open() })
	n.addEventListener('pointerleave', () => { if (!n.classList.contains('is-peek')) close() })
	n.addEventListener('focus', open); n.addEventListener('blur', close)
})()
