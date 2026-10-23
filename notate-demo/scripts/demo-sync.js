/* Demo stand-in for the extension's scripts/setup-sync.js.
   On the portfolio there is no extension, so the demo window (index.html) plays Chrome's part: it opens the
   side panel, pins Notate to the toolbar and opens the practice tab. The welcome page, the side panel and the
   practice page talk over one BroadcastChannel, the same way the real setup sync does. Nothing is stored. */
function notateSetupSync(role, onEvent) {
	const channel = new BroadcastChannel('notate-demo')
	channel.onmessage = ({ data }) => { if (data && data.from !== role) onEvent(data) }
	const send = (type, extra = {}) => channel.postMessage({ type, from: role, ...extra })
	send('hello')
	return { ready: Promise.resolve(), send, refreshPin() {}, open: async () => send('open-panel') }
}

// welcome.js opens the practice page with chrome.tabs.create; the demo window turns that into a second tab.
globalThis.chrome = {
	tabs: {
		create: async ({ url }) => {
			new BroadcastChannel('notate-demo').postMessage({ type: 'open-tab', from: 'welcome', url })
			return { id: 2 }
		},
	},
}
