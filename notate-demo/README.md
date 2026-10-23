# notate-demo

Source for the Notate case study's Onboarding screen recording (`assets/notate/core-flows/onboarding-walkthrough.mp4`). No page links here directly.

`index.html` is a quiet Chrome stand-in: a store tab showing the real listing capture, Chrome's install dialog, the Extensions menu with the pin, tabs and the side panel. Inside it are copies of the extension's own pages from `~/notate-extension`:

- `welcome.html`, `scripts/welcome.js`, `styles/welcome.css`, `styles/tokens.css`: the welcome page, unchanged except that `scripts/demo-sync.js` replaces `setup-sync.js`.
- `panel.html`, `styles/style.css`, `styles/reset.css`: the side panel's markup and styles, driven by `scripts/panel-demo.js` instead of Chrome storage.
- `styles/webpage.css` + `scripts/practice.js`: Notate's on-page note, injected into the portfolio's About page for the first-note step.

The pages talk over one `BroadcastChannel` (`notate-demo`), like the extension's setup sync. Nothing is stored.

Re-record with `node scripts/notate/record-onboarding.cjs` (it serves the repo locally and captures in real time). If the extension's pages change, copy them in again and keep the script swap in `welcome.html`.
