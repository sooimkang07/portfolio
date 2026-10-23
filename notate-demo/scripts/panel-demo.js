/* Side panel for the demo: the extension's panel markup, driven by the demo window instead of Chrome
   storage. Shows the pin reminder during the pin step, the "Click New" reminder after Get started, and
   the first note once it is saved on the practice page. */
(() => {
	'use strict'
	const channel = new BroadcastChannel('notate-demo')
	const send = (type, extra = {}) => channel.postMessage({ type, from: 'panel', ...extra })
	const pinPrompt = document.querySelector('#notate-pin-reminder')
	const startPrompt = document.querySelector('#notate-start-reminder')
	const list = document.querySelector('#annotation-pages')
	const state = { step: 1, pinned: false, dismissed: false, guide: false, startDismissed: false, note: null }

	const render = () => {
		pinPrompt.hidden = !(state.step === 2 && !state.pinned && !state.dismissed)
		startPrompt.hidden = !(state.guide && !state.note && !state.startDismissed)
		list.replaceChildren()
		if (!state.note) {
			const empty = document.createElement('li')
			empty.className = 'popup-empty-state'
			empty.textContent = 'No saved notes yet'
			list.append(empty)
			return
		}
		// Same structure popup.js renders for a saved page and its notes.
		const item = document.createElement('li'); item.className = 'popup-page-item'
		const row = document.createElement('section'); row.className = 'popup-page-row'
		const page = document.createElement('button'); page.type = 'button'; page.className = 'popup-page-button'
		const icon = document.createElement('img'); icon.className = 'popup-page-favicon'; icon.src = 'images/page.svg'; icon.alt = ''
		const title = document.createElement('span'); title.className = 'popup-page-title'; title.textContent = state.note.page
		page.append(icon, title)
		const toggle = document.createElement('button'); toggle.type = 'button'; toggle.className = 'popup-page-toggle is-open'; toggle.setAttribute('aria-label', '1 note')
		toggle.innerHTML = '<span class="popup-page-count">1</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 10 5 5 5-5" fill="none" stroke="currentColor" stroke-width="2"/></svg>'
		const notes = document.createElement('ul'); notes.className = 'popup-annotation-list'
		const li = document.createElement('li')
		const note = document.createElement('button'); note.type = 'button'; note.className = 'popup-annotation-item'
		const text = document.createElement('span'); text.className = 'popup-annotation-text'; text.textContent = state.note.text
		note.append(text)
		note.addEventListener('click', () => send('focus-note'))
		page.addEventListener('click', () => send('focus-note'))
		li.append(note); notes.append(li)
		row.append(page, toggle); item.append(row, notes); list.append(item)
	}

	document.querySelector('#dismiss-pin-reminder')?.addEventListener('click', () => {
		state.dismissed = true
		send('pin-skipped')
		render()
	})
	document.querySelector('#notate-start-dismiss')?.addEventListener('click', () => { state.startDismissed = true; render() })
	document.querySelector('[data-action="start-annotating"]')?.addEventListener('click', () => {
		state.startDismissed = true
		render()
		send('start-annotating')
	})

	channel.onmessage = ({ data }) => {
		if (!data || data.from === 'panel') return
		if (data.type === 'state') Object.assign(state, { step: data.step, pinned: data.pinned, dismissed: data.dismissed, guide: data.guide, note: data.note })
		if (data.type === 'step') state.step = data.step
		if (data.type === 'pin') state.pinned = data.pinned
		if (data.type === 'pin-skipped') state.dismissed = true
		if (data.type === 'start-guide') state.guide = true
		if (data.type === 'first-note-saved') state.note = { text: data.text, page: data.page }
		render()
	}
	render()
	send('panel-hello')
})()
