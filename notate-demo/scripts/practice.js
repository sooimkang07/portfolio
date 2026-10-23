/* Injected by the demo window into the practice tab (the portfolio's About page): Notate's on-page
   behavior, using the extension's own webpage.css classes and markup. Click New in the side panel, pick an
   element, write a note and save. Esc steps back one mode at a time: annotating → previewing notes → exit.
   Notes live only in this page; nothing is stored. */
(() => {
	'use strict'
	const channel = new BroadcastChannel('notate-demo')
	const send = (type, extra = {}) => channel.postMessage({ type, from: 'page', ...extra })
	const html = document.documentElement
	const PAGE = 'About · Sooim Kang'
	const PICKABLE = 'main :is(h1, h2, h3, p, li, img, figure, button, a)'
	let mode = 'off' // 'annotating' | 'previewing' | 'off'
	let hovered = null, target = null, saved = null

	const layer = document.createElement('div')
	layer.id = 'notate-layer'
	document.body.append(layer)

	const toolbar = document.createElement('aside')
	toolbar.id = 'notate-toolbar'
	toolbar.setAttribute('aria-label', 'Notate')
	toolbar.hidden = true
	toolbar.innerHTML = '<p></p><menu class="notate-toolbar-group"><li><button class="notate-toolbar-button" type="button" data-action="exit">Done <kbd aria-hidden="true">Esc</kbd></button></li></menu>'
	document.body.append(toolbar)

	const modal = document.createElement('dialog')
	modal.id = 'notate-modal'
	modal.dataset.screen = 'note'
	modal.dataset.color = 'neutral'
	modal.innerHTML = `<form method="dialog"><section data-screen="note"><textarea name="annotation-text" aria-label="New note" placeholder="New note"></textarea></section>
		<menu data-note-actions><li><button type="submit" value="cancel">Cancel</button></li><li><button type="submit" value="save">Save <kbd aria-hidden="true">⌘ ↵</kbd></button></li></menu></form>`
	document.body.append(modal)
	const input = modal.querySelector('textarea')

	const setMode = next => {
		mode = next
		html.classList.toggle('notate-is-annotating', mode === 'annotating')
		html.classList.toggle('notate-is-previewing', mode === 'previewing')
		toolbar.hidden = mode === 'off'
		layer.hidden = mode === 'off'
		const exit = toolbar.querySelector('[data-action="exit"]')
		exit.innerHTML = `${mode === 'annotating' ? 'Done' : 'Exit Notate'} <kbd aria-hidden="true">Esc</kbd>`
		if (mode !== 'annotating') unhover()
	}
	const unhover = () => { hovered?.classList.remove('notate-hover'); hovered = null }

	document.addEventListener('mouseover', e => {
		if (mode !== 'annotating' || modal.open) return
		const el = e.target.closest(PICKABLE)
		if (el === hovered) return
		unhover()
		if (el && !el.closest('#notate-layer, #notate-toolbar')) { hovered = el; el.classList.add('notate-hover') }
	}, true)

	// Pages here are links to the rest of the portfolio; keep the practice tab on this page.
	document.addEventListener('click', e => {
		if (e.target.closest('#notate-toolbar, #notate-modal, #notate-layer')) return
		if (mode === 'annotating') {
			const el = e.target.closest(PICKABLE)
			e.preventDefault(); e.stopPropagation()
			if (!el) return
			target = el
			unhover()
			input.value = ''
			modal.showModal()
			input.focus()
		} else if (e.target.closest('a')) e.preventDefault()
	}, true)

	modal.addEventListener('close', () => {
		if (modal.returnValue !== 'save' || !target) return
		const text = input.value.trim()
		if (!text) return
		saved?.element.classList.remove('notate-annotated')
		saved?.note.remove()
		target.classList.add('notate-annotated')
		target.dataset.notateOutlineColor = 'neutral'
		const r = target.getBoundingClientRect()
		const note = document.createElement('aside')
		note.className = 'notate-note'
		note.dataset.color = 'neutral'
		note.style.cssText = `left:${Math.round(Math.min(r.right - 160, innerWidth - 280) + scrollX)}px;top:${Math.round(r.bottom + 8 + scrollY)}px;max-inline-size:256px`
		const p = document.createElement('p')
		p.textContent = text
		note.append(p)
		note.addEventListener('click', () => { if (mode !== 'off') { target = saved.element; input.value = saved.text; modal.showModal() } })
		layer.append(note)
		saved = { element: target, note, text }
		send('first-note-saved', { text, page: PAGE })
	})
	modal.addEventListener('keydown', e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); modal.close('save') } })

	toolbar.querySelector('[data-action="exit"]').addEventListener('click', () => setMode(mode === 'annotating' ? 'previewing' : 'off'))
	addEventListener('keydown', e => {
		if (e.key !== 'Escape' || modal.open) return
		if (mode === 'annotating') setMode('previewing')
		else if (mode === 'previewing') setMode('off')
	})

	channel.onmessage = ({ data }) => {
		if (!data) return
		if (data.type === 'start-annotating') setMode('annotating')
		if (data.type === 'focus-note' && saved) {
			setMode(mode === 'off' ? 'previewing' : mode)
			saved.element.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
		}
	}
	setMode('off')
})()
