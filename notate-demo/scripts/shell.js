/* The demo window plays Chrome: installing from the store, the Extensions menu, pinning, the side panel and tabs.
   The welcome page (welcome.html), side panel (panel.html) and practice page talk to it over the
   'notate-demo' BroadcastChannel; see demo-sync.js. Nothing is saved anywhere. */
(() => {
	'use strict'
	const PRACTICE_URL = '../about.html'
	const channel = new BroadcastChannel('notate-demo')
	const send = (type, extra = {}) => channel.postMessage({ type, from: 'chrome', ...extra })
	const $ = s => document.querySelector(s)

	const state = { installed: false, step: 1, panelOpen: false, pinned: false, dismissed: false, guide: false, note: null }
	const panel = $('[data-panel]'), panelFrame = $('[data-panel-frame]')
	const menu = $('[data-menu]'), extensions = $('[data-extensions]'), pinButton = $('[data-pin]'), pinned = $('[data-pinned]')
	const address = $('[data-address]')
	const pages = { store: $('[data-page="store"]'), welcome: $('[data-page="welcome"]'), practice: $('[data-page="practice"]') }
	const tabs = { store: $('[data-tab="store"]'), welcome: $('[data-tab="welcome"]'), practice: $('[data-tab="practice"]') }
	const urls = { store: 'chromewebstore.google.com/detail/notate/aceafdbnbipkdngdoejfoikjpphgendd', welcome: 'chrome-extension://aceafdbnbipkdngdoejfoikjpphgendd/welcome.html', practice: 'sooimkang.com/about' }
	const install = $('[data-install]'), added = $('[data-added]')

	// Point at the control the current step needs: the Extensions menu to open Notate, then its pin.
	const hint = () => {
		if (!state.installed) return
		extensions.classList.toggle('is-hint', !menu.hidden ? false : (state.step === 1 && !state.panelOpen) || (state.step === 2 && !state.pinned))
		pinButton.classList.toggle('is-hint', state.step === 2 && !state.pinned)
	}
	const openPanel = () => {
		if (!panelFrame.src) panelFrame.src = 'panel.html'
		panel.hidden = false
		state.panelOpen = true
		closeMenu()
		send('panel-opened')
		hint()
	}
	const closePanel = () => { panel.hidden = true; state.panelOpen = false; hint() }
	const openMenu = () => { menu.hidden = false; extensions.setAttribute('aria-expanded', 'true'); hint() }
	const closeMenu = () => { menu.hidden = true; extensions.setAttribute('aria-expanded', 'false'); hint() }
	const setPinned = value => {
		state.pinned = value
		pinned.hidden = !value
		pinButton.setAttribute('aria-pressed', String(value))
		send('pin', { pinned: value })
		hint()
	}
	const showTab = name => {
		for (const [key, frame] of Object.entries(pages)) {
			frame.hidden = key !== name
			tabs[key].classList.toggle('is-active', key === name)
			tabs[key].setAttribute('aria-selected', String(key === name))
		}
		address.textContent = urls[name]
	}

	// The practice tab is this portfolio's own About page with Notate's on-page styles and script added.
	const openPractice = () => {
		tabs.practice.hidden = false
		if (!pages.practice.src) {
			pages.practice.addEventListener('load', () => {
				const doc = pages.practice.contentDocument
				if (!doc) return
				const css = doc.createElement('link')
				css.rel = 'stylesheet'
				css.href = new URL('styles/webpage.css', location.href).href
				const own = doc.createElement('style')
				own.textContent = '.ts-root{display:none!important}'
				const script = doc.createElement('script')
				script.src = new URL('scripts/practice.js?v=1', location.href).href
				doc.head.append(css, own, script)
			}, { once: true })
			pages.practice.src = PRACTICE_URL
		}
		showTab('practice')
		openPanel()
	}

	// Installing: Add to Chrome → Chrome's confirmation → the extension opens its welcome page (onInstalled).
	$('[data-add]').addEventListener('click', () => { install.hidden = false })
	$('[data-install-cancel]').addEventListener('click', () => { install.hidden = true })
	$('[data-install-add]').addEventListener('click', () => {
		install.hidden = true
		state.installed = true
		added.hidden = false
		setTimeout(() => {
			tabs.welcome.hidden = false
			pages.welcome.src = 'welcome.html'
			showTab('welcome')
			hint()
		}, 900)
		setTimeout(() => { added.hidden = true }, 2600)
	})

	extensions.addEventListener('click', () => (menu.hidden ? openMenu() : closeMenu()))
	$('[data-open-notate]').addEventListener('click', () => (state.panelOpen ? closeMenu() : openPanel()))
	pinButton.addEventListener('click', () => setPinned(!state.pinned))
	pinned.addEventListener('click', () => (state.panelOpen ? closePanel() : openPanel()))
	$('[data-close-panel]').addEventListener('click', closePanel)
	for (const [name, tab] of Object.entries(tabs)) tab.addEventListener('click', () => showTab(name))
	// Clicks inside the page or panel land in other documents; close the menu when focus leaves this one.
	addEventListener('blur', closeMenu)
	document.addEventListener('click', e => { if (!menu.hidden && !e.target.closest('[data-menu], [data-extensions]')) closeMenu() })

	channel.onmessage = ({ data }) => {
		if (!data || data.from === 'chrome') return
		if (data.type === 'open-panel') openPanel()
		if (data.type === 'open-tab') openPractice()
		if (data.type === 'step') { state.step = data.step; hint() }
		if (data.type === 'start-guide') state.guide = true
		if (data.type === 'pin-skipped') state.dismissed = true
		if (data.type === 'first-note-saved') state.note = { text: data.text, page: data.page }
		// A newly loaded side panel asks for the state it missed.
		if (data.type === 'panel-hello') send('state', { ...state })
		if (data.type === 'hello' && state.pinned) send('pin', { pinned: true })
	}
	hint()

	// Recording (scripts/notate/record-onboarding.cjs): a drawn cursor and click ring, moved from the script.
	const cursor = $('[data-cursor]'), ring = $('[data-click]')
	const tips = { arrow: [4, 3], pencil: [7, 36] } // the drawn tips, at the sizes in shell.css
	window.notateRec = {
		at(x, y) { const [dx, dy] = tips[cursor.dataset.mode || 'arrow']; cursor.style.transform = `translate(${x - dx}px, ${y - dy}px)` },
		mode(name) { cursor.dataset.mode = name },
		click(x, y) { ring.hidden = false; ring.style.left = `${x}px`; ring.style.top = `${y}px`; ring.classList.remove('is-on'); void ring.offsetWidth; ring.classList.add('is-on') },
	}
	if (new URLSearchParams(location.search).has('record')) cursor.hidden = false
})()
