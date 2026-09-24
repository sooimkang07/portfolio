/* ==========================================================================
   Text Sooim — an AI you text, not prompt.

   Include on any page:
     <link rel="stylesheet" href="css/text-sooim.css?v=5">
     <script src="js/text-sooim.js?v=5" data-endpoint="https://<project>.vercel.app/api/chat" defer></script>

   data-endpoint  URL of the Vercel function (text-sooim-api/api/chat.js).
                  Leave empty to run on the local answer set below (no AI calls).
   data-open      "true" to open on load.

   Conversation state lives in sessionStorage so it follows the visitor
   across pages; nothing is stored server-side by this script.
   ========================================================================== */
(function () {
	"use strict";

	var script = document.currentScript || document.querySelector('script[src*="text-sooim.js"]');
	var ENDPOINT = (script && script.getAttribute("data-endpoint")) || "";
	var AUTO_OPEN = script && script.getAttribute("data-open") === "true";
	// Resolve assets relative to this script, so the chat works from any page depth.
	var BASE = script && script.src ? script.src.replace(/js\/text-sooim\.js.*$/, "") : "";
	var AVATAR = BASE + "about-me-assets/web/avatar.jpg"; // square of about-me-assets/me.jpg

	// Inter, the chat's typeface (once per page).
	if (!document.querySelector("link[data-ts-font]")) {
		var font = document.createElement("link");
		font.rel = "stylesheet";
		font.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap";
		font.setAttribute("data-ts-font", "");
		document.head.appendChild(font);
	}
	var NAME = "Sooim Kang";
	var SUBTITLE = "New York, NY";
	var PLACEHOLDER = "Ask me anything!";
	var STORE = "text-sooim:v4";
	var MAX_TURNS = 16;

	// A line in a reply that is only one of these paths (e.g. "sooimkang.com/yap")
	// renders as a link preview bubble.
	var LINKS = {
		yap: { title: "yap — voice chats organized by topic", icon: "project-app-icons/icon-yap.png" },
		notate: { title: "Notate — annotating the web without losing context", icon: "project-app-icons/icon-notate.png" },
		"instagram-lists": { title: "Instagram Lists — a new control layer for Instagram", icon: "project-app-icons/icon-instagram.png" },
		"smart-bundles": { title: "Smart Bundles — grocery shopping for what's actually eaten", icon: "project-app-icons/icon-amazon.png" },
		neuk: { title: "neuk — designing coordination, not a booking app", icon: "project-app-icons/icon-neuk.png" },
		acuity: { title: "Acuity — deciding when a health signal needs action", icon: "project-app-icons/icon-acuity.png" },
		work: { title: "Work — Sooim Kang", icon: "favicon.ico" },
		about: { title: "About — Sooim Kang", icon: "favicon.ico" },
		"Sooim-Kang-Resume.pdf": { title: "Sooim Kang — Resume (PDF)", icon: "favicon.ico" }
	};

	var OPENERS = ["Hey! It's Sooim 👋", "Ask me anything about my work, how I design, or what I'm up to. I'll text back!"];

	// label = what fits in the QuickType strip; text = what gets sent
	var SUGGESTIONS = [
		{ label: "What's new", text: "What are you working on right now?" },
		{ label: "Start here", text: "Which project should I look at first?" },
		{ label: "AI + you", text: "How do you use AI in your process?" },
		{ label: "yap", text: "Tell me about yap." },
		{ label: "Your process", text: "What's your design process like?" },
		{ label: "Dream role", text: "What kind of role are you looking for?" },
		{ label: "A miss", text: "What's something you got wrong?" },
		{ label: "Watching", text: "What are you watching lately?" },
		{ label: "Reach you", text: "How can I reach you?" }
	];

	// Tapbacks use Apple emoji images (text-sooim-assets/emoji); "HA HA" is type, as on iOS.
	var TAPBACKS = {
		heart: { label: "Heart", img: "heart" },
		like: { label: "Like", img: "like" },
		dislike: { label: "Dislike", img: "dislike" },
		haha: { label: "Laugh", cls: "ts-g--text ts-g--haha", html: "<span>HA<br>HA</span>" },
		emphasize: { label: "Emphasize", img: "emphasize" },
		question: { label: "Question", img: "question" },
		crying: { label: "Loudly crying", img: "crying" },
		joy: { label: "Tears of joy", img: "joy" }
	};
	var PICKER = ["heart", "like", "dislike", "haha", "emphasize", "question", "crying", "joy"];
	var MORE_EMOJI = ["fire", "tear", "eyes", "hundred", "raised-hands", "clap", "open-mouth", "exploding-head", "sparkles", "party", "skull"];
	MORE_EMOJI.forEach(function (e) { TAPBACKS[e] = { label: e.replace(/-/g, " "), img: e }; });

	function glyph(k) {
		var t = TAPBACKS[k];
		var inner = t.img ? '<img src="' + BASE + "text-sooim-assets/emoji/" + t.img + '.png" alt="" draggable="false">' : t.html;
		return '<span class="ts-g ' + (t.cls || "") + '" data-k="' + k + '">' + inner + "</span>";
	}

	// ---- Local answers (used when no endpoint is set, or as offline fallback)
	var LOCAL = [
		{ k: /yap/i, a: "yap is my lead project right now. It's a voice-first group chat where AI splits each voice memo into topics, so friends can reply to just the part they care about.\n\nThe bet: people love talking, they just hate listening to a 4-minute memo to find the one thing meant for them.\n\nsooimkang.com/yap" },
		{ k: /working on|what's new|up to\b/i, a: "Finishing my MFA at Parsons and shipping yap, a voice chat app where AI sorts your voice memos into topics.\n\nsooimkang.com/yap" },
		{ k: /notate/i, a: "Notate is a Chrome extension I designed AND built. It lets you annotate the web without losing context. It's in Chrome Web Store review right now 🤞\n\nsooimkang.com/notate" },
		{ k: /insta|lists/i, a: "Instagram Lists was my capstone. More than half the feed is AI-recommended now, so I designed a control layer that lets you choose whose posts you actually see. The hard part was fitting it into a system billions of people already know.\n\nsooimkang.com/instagram-lists" },
		{ k: /bundle|amazon|grocery/i, a: "Smart Bundles was a fast design challenge for Amazon Fresh: grocery shopping built around what people actually eat, not what they plan to. The interesting part is the pivot midway.\n\nsooimkang.com/smart-bundles" },
		{ k: /neuk/i, a: "neuk is a service design project. I realized the problem wasn't booking a space, it was coordinating people, so I designed for that instead.\n\nsooimkang.com/neuk" },
		{ k: /acuity|health/i, a: "Acuity was a 24-hour challenge: an AI health app that decides when a signal actually needs action vs. when it's just noise. I designed the app.\n\nsooimkang.com/acuity" },
		{ k: /forage/i, a: "Forage was a 72-hour FigBuild project with three friends. I owned the AI product architecture, the working prototype, and the demo animations." },
		{ k: /first|start|look at|which project|best/i, a: "Start with yap if you have 2 minutes. It shows how I design AI-native communication and actually ship it.\n\nsooimkang.com/yap\n\nIf you care about designing inside huge existing systems, Instagram Lists next." },
		{ k: /process|approach|how do you design/i, a: "I start by finding where a product's default model conflicts with how people really behave. Then I restructure around the behavior, not the feature list.\n\nAnd I prototype in code early so the tradeoffs show up fast." },
		{ k: /\bai\b|claude|cursor|llm/i, a: "I design AI products and design WITH AI. I prototype in code with Cursor and Claude, which is how Notate and yap got shipped.\n\nFun fact: you're texting a version of me right now 🙃" },
		{ k: /role|job|hire|hiring|looking|open to|available/i, a: "Product design roles, especially on AI, communication, or social products. Anything about how people connect at scale.\n\nI'm based in NYC and finishing my MFA at Parsons." },
		{ k: /wrong|fail|mistake|learn/i, a: "On Instagram Lists I spent too long on the UI before defining what \"relevant\" meant to people. Relevance only works once the right context is defined. Now I define the model first." },
		{ k: /watch|movie|film|show|read|book|listen|music|album/i, a: "Favorites: Us and Them (film), A Little Life (book), The Art of Loving by Olivia Dean on repeat, and Normal People forever.\n\nMy Letterboxd is on my About page." },
		{ k: /background|experience|resume|school|about you|who are you/i, a: "Journalism at Northwestern (Medill), now an MFA in Communication Design at Parsons. Before that I led product and brand design for a creator company working with 30+ creators and 60M+ subscribers.\n\nsooimkang.com/Sooim-Kang-Resume.pdf" },
		{ k: /reach|contact|email|talk|chat|coffee|linkedin/i, a: "Email is best: sooimkang1015@gmail.com\n\nWould love to talk!" },
		{ k: /thank|thx|ty\b|appreciate/i, a: "Of course!! Text anytime.", tap: "heart" },
		{ k: /^(hi|hey|hello|yo|sup)\b/i, a: "Hi! What do you want to know?" },
		{ k: /lol|haha|lmao/i, a: "😂", tap: "haha" }
	];
	var LOCAL_FALLBACK = "Good question! I don't want to guess on that one. Email me and I'll answer for real: sooimkang1015@gmail.com";

	function localReply(text) {
		if (isJumbo(text)) return { reply: "🫶", tapback: "heart" };
		for (var i = 0; i < LOCAL.length; i++) {
			if (LOCAL[i].k.test(text)) return { reply: LOCAL[i].a, tapback: LOCAL[i].tap || null };
		}
		return { reply: LOCAL_FALLBACK, tapback: null };
	}

	// ---- State
	var state = load() || { started: Date.now(), msgs: [], seenBanner: false, unread: 1 };
	function load() { try { return JSON.parse(sessionStorage.getItem(STORE)); } catch (e) { return null; } }
	function save() { try { sessionStorage.setItem(STORE, JSON.stringify(state)); } catch (e) {} }

	// ---- Helpers
	function h(tag, cls, html) {
		var el = document.createElement(tag);
		if (cls) el.className = cls;
		if (html != null) el.innerHTML = html;
		return el;
	}
	function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
	function linkify(s) {
		return esc(s)
			.replace(/\b([\w.+-]+@[\w-]+\.[\w.]+)\b/g, '<a href="mailto:$1">$1</a>')
			.replace(/\b(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
	}
	function time(ts) { return new Date(ts).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }); }
	function isJumbo(s) {
		var t = s.replace(/\s/g, "");
		if (!t || t.length > 16) return false;
		try { return /^(\p{Extended_Pictographic}|\p{Emoji_Component}|‍|️)+$/u.test(t) && !/\d/.test(t); } catch (e) { return false; }
	}
	function linkKey(line) {
		var m = line.trim().match(/^(?:https?:\/\/)?(?:www\.)?sooimkang\.com\/([\w.-]+?)(?:\.html)?\/?$/i);
		return m && LINKS[m[1]] ? m[1] : null;
	}
	function reduced() { return window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches; }
	var wait = function (ms) { return new Promise(function (r) { setTimeout(r, reduced() ? Math.min(ms, 250) : ms); }); };

	// ---- DOM
	// Status bar, back, xmark(→plus), arrow-up and chevron come from the iOS 26 kit in
	// Sooim's Figma icons file (exported as outlines). Video, mic and smiley aren't in
	// that file yet, so they're drawn to match.
	var P_BACK = "M0 9.40479C0.00553385 9.2111 0.0442708 9.03402 0.116211 8.87354C0.188151 8.71305 0.298828 8.55811 0.448242 8.40869L8.76562 0.356934C9.00358 0.118978 9.29688 0 9.64551 0C9.87793 0 10.0882 0.0553385 10.2764 0.166016C10.4701 0.276693 10.6222 0.426107 10.7329 0.614258C10.8491 0.802409 10.9072 1.0127 10.9072 1.24512C10.9072 1.58822 10.7772 1.88981 10.5171 2.1499L2.99658 9.39648L10.5171 16.6514C10.7772 16.917 10.9072 17.2186 10.9072 17.5562C10.9072 17.7941 10.8491 18.0072 10.7329 18.1953C10.6222 18.3835 10.4701 18.5329 10.2764 18.6436C10.0882 18.7598 9.87793 18.8179 9.64551 18.8179C9.29688 18.8179 9.00358 18.6961 8.76562 18.4526L0.448242 10.4009C0.293294 10.2515 0.17985 10.0965 0.10791 9.93604C0.0359701 9.77002 0 9.59294 0 9.40479Z";
	var P_XMARK = "M0.332031 16.7842C0.199219 16.6514 0.110677 16.4937 0.0664062 16.311C0.0221354 16.134 0.0221354 15.9541 0.0664062 15.7715C0.110677 15.5944 0.196452 15.445 0.32373 15.3232L7.08887 8.55811L0.32373 1.79297C0.196452 1.67122 0.110677 1.52181 0.0664062 1.34473C0.0221354 1.16764 0.0221354 0.987793 0.0664062 0.805176C0.110677 0.622559 0.199219 0.464844 0.332031 0.332031C0.464844 0.199219 0.619792 0.110677 0.796875 0.0664062C0.979492 0.0221354 1.15934 0.0221354 1.33643 0.0664062C1.51351 0.110677 1.66846 0.196452 1.80127 0.32373L8.55811 7.08887L15.3149 0.332031C15.4478 0.199219 15.6027 0.110677 15.7798 0.0664062C15.9569 0.0221354 16.134 0.0221354 16.311 0.0664062C16.4881 0.110677 16.6431 0.199219 16.7759 0.332031C16.9142 0.464844 17.0055 0.622559 17.0498 0.805176C17.0941 0.982259 17.0941 1.15934 17.0498 1.33643C17.0055 1.51351 16.917 1.66846 16.7842 1.80127L10.0273 8.55811L16.7842 15.3149C16.917 15.4478 17.0028 15.5999 17.0415 15.7715C17.0858 15.9486 17.0858 16.1257 17.0415 16.3027C17.0028 16.4854 16.9142 16.6458 16.7759 16.7842C16.6431 16.917 16.4881 17.0055 16.311 17.0498C16.134 17.0941 15.9569 17.0941 15.7798 17.0498C15.6027 17.0055 15.4478 16.917 15.3149 16.7842L8.55811 10.0273L1.80127 16.7925C1.66846 16.9198 1.51351 17.0055 1.33643 17.0498C1.15934 17.0941 0.982259 17.0941 0.805176 17.0498C0.628092 17.0055 0.470378 16.917 0.332031 16.7842Z";
	var P_ARROW = "M8.19287 20.229C7.89404 20.229 7.65055 20.1349 7.4624 19.9468C7.27425 19.7586 7.18018 19.5124 7.18018 19.208V5.37061L7.28809 2.06689L7.88574 2.36572L4.51562 6.08447L1.69336 8.88184C1.60482 8.97038 1.49967 9.04232 1.37793 9.09766C1.25618 9.14746 1.12061 9.17236 0.971191 9.17236C0.694499 9.17236 0.462077 9.07829 0.273926 8.89014C0.0913086 8.70199 0 8.46403 0 8.17627C0 7.90511 0.105143 7.66439 0.31543 7.4541L7.4375 0.32373C7.54264 0.218587 7.65885 0.138346 7.78613 0.0830078C7.91895 0.0276693 8.05452 0 8.19287 0C8.33122 0 8.46403 0.0276693 8.59131 0.0830078C8.72412 0.138346 8.8431 0.218587 8.94824 0.32373L16.0703 7.4541C16.2806 7.66439 16.3857 7.90511 16.3857 8.17627C16.3857 8.46403 16.2917 8.70199 16.1035 8.89014C15.9209 9.07829 15.6912 9.17236 15.4146 9.17236C15.2707 9.17236 15.1351 9.14746 15.0078 9.09766C14.8861 9.04232 14.7809 8.97038 14.6924 8.88184L11.8701 6.08447L8.4917 2.36572L9.09766 2.06689L9.20557 5.37061V19.208C9.20557 19.5124 9.11149 19.7586 8.92334 19.9468C8.73519 20.1349 8.4917 20.229 8.19287 20.229Z";
	var ICON = {
		signal: '<svg viewBox="0 0 20 13" width="20" height="13"><path fill="currentColor" d="M1.65039 7.58008C1.95012 7.58014 2.21992 7.64999 2.46973 7.7998C2.71973 7.9498 2.92031 8.15039 3.07031 8.40039C3.22009 8.6502 3.29 8.92001 3.29004 9.21973V10.6904C3.28997 10.9901 3.22011 11.26 3.07031 11.5098C2.92031 11.7598 2.71973 11.9604 2.46973 12.1104C2.21993 12.2601 1.95009 12.33 1.65039 12.3301C1.35054 12.3301 1.07022 12.2602 0.820312 12.1104C0.570312 11.9604 0.369727 11.7598 0.219727 11.5098C0.0699196 11.26 6.65565e-05 10.9901 0 10.6904V9.21973C4.28388e-05 8.92 0.0699405 8.6502 0.219727 8.40039C0.369727 8.15039 0.570312 7.9498 0.820312 7.7998C1.07023 7.64994 1.35052 7.58008 1.65039 7.58008ZM7 5.36035C7.3 5.36035 7.57031 5.43008 7.82031 5.58008C8.0701 5.73001 8.26999 5.9299 8.41992 6.17969C8.56992 6.42969 8.63965 6.7 8.63965 7V10.6904C8.63958 10.9902 8.56979 11.2599 8.41992 11.5098C8.26994 11.7597 8.07028 11.9604 7.82031 12.1104C7.57031 12.2604 7.3 12.3301 7 12.3301C6.70004 12.3301 6.4199 12.2603 6.16992 12.1104C5.91992 11.9604 5.72031 11.7598 5.57031 11.5098C5.4204 11.2599 5.34968 10.9803 5.34961 10.6904V7C5.34961 6.7 5.42031 6.42969 5.57031 6.17969C5.72027 5.92989 5.92009 5.73 6.16992 5.58008C6.41992 5.43008 6.7 5.36035 7 5.36035ZM17.6904 0C17.9901 6.55189e-05 18.26 0.0699202 18.5098 0.219727C18.7598 0.369727 18.9604 0.570312 19.1104 0.820312C19.2601 1.07011 19.33 1.33994 19.3301 1.63965V10.6904C19.33 10.9901 19.2601 11.26 19.1104 11.5098C18.9604 11.7598 18.7598 11.9604 18.5098 12.1104C18.26 12.2601 17.9901 12.33 17.6904 12.3301C17.3906 12.3301 17.1102 12.2602 16.8604 12.1104C16.6104 11.9604 16.4098 11.7598 16.2598 11.5098C16.11 11.26 16.0401 10.9901 16.04 10.6904V1.63965C16.0401 1.33992 16.11 1.07012 16.2598 0.820312C16.4098 0.570312 16.6104 0.369727 16.8604 0.219727C17.1103 0.0698807 17.3906 0 17.6904 0ZM12.3496 2.79004C12.6495 2.79004 12.92 2.85984 13.1699 3.00977C13.4199 3.15977 13.6195 3.36035 13.7695 3.61035C13.9195 3.86025 13.9902 4.12983 13.9902 4.42969V10.6797C13.9902 10.9797 13.9195 11.25 13.7695 11.5C13.6196 11.7499 13.4198 11.9497 13.1699 12.0996C12.9199 12.2496 12.6496 12.3203 12.3496 12.3203C12.0498 12.3203 11.7694 12.2603 11.5195 12.1104C11.2696 11.9704 11.0699 11.7697 10.9199 11.5098C10.77 11.2598 10.7002 10.9796 10.7002 10.6797V4.42969C10.7002 4.12993 10.7701 3.86018 10.9199 3.61035C11.0699 3.36044 11.2696 3.15975 11.5195 3.00977C11.7694 2.85983 12.0498 2.7901 12.3496 2.79004Z"/></svg>',
		wifi: '<svg viewBox="0 0 17 13" width="17" height="13"><path fill="currentColor" fill-rule="evenodd" d="M0.358555 4.76929C0.777728 5.20063 1.43114 5.12668 1.96127 4.65838C3.71194 3.08094 5.8941 2.26757 8.33517 2.26757C10.7762 2.26757 12.9707 3.10559 14.7091 4.65838C15.2269 5.13901 15.8803 5.1883 16.3118 4.76929C16.7433 4.32564 16.8049 3.66016 16.3611 3.19185C14.5118 1.30632 11.4913 0 8.33517 0C5.17904 0 2.1462 1.31864 0.309241 3.20418C-0.134589 3.66016 -0.085275 4.32564 0.358555 4.78162V4.76929ZM3.40372 7.86256C3.88454 8.33086 4.50097 8.28156 5.04343 7.83791C5.93109 7.13546 7.11463 6.65483 8.33517 6.66715C9.54337 6.66715 10.7269 7.13546 11.6269 7.85023C12.1694 8.29389 12.8105 8.31854 13.2789 7.85023C13.7351 7.38193 13.8091 6.66715 13.3283 6.2235C12.1324 5.15133 10.3324 4.39958 8.3475 4.39958C6.36259 4.39958 4.55028 5.15133 3.36674 6.2235C2.94756 6.61786 2.86126 7.29566 3.41605 7.86256H3.40372ZM7.52148 11.954C8.05161 12.4593 8.6064 12.4593 9.13653 11.954L10.1351 10.9928C10.6653 10.4752 10.7762 9.82203 10.1721 9.37838C9.66666 9.02099 9.02557 8.78684 8.33517 8.78684C7.64477 8.78684 6.99135 9.02099 6.4982 9.3907C5.8941 9.82203 6.01739 10.4875 6.54752 10.9928L7.53381 11.954H7.52148Z"/></svg>',
		battery: '<svg class="ts-status__battery" viewBox="0 0 28 13" width="28" height="13"><path fill="currentColor" fill-rule="evenodd" d="M26.0024 4.31997V8.32922C26.4026 8.21897 27.333 7.32691 27.333 6.3246C27.333 5.32228 26.4026 4.43022 26.0024 4.31997ZM25.0019 7.4973C25.0019 7.70779 25.0019 7.91827 25.0019 8.12876C25.0019 8.30918 25.0019 8.47957 25.0019 8.65998C24.9919 9.05089 24.9719 9.43177 24.9018 9.82267C24.8318 10.2136 24.7218 10.5744 24.5417 10.9252C24.3616 11.276 24.1315 11.5867 23.8614 11.8574C23.5912 12.128 23.2711 12.3585 22.9309 12.5389C22.5807 12.7194 22.2206 12.8296 21.8304 12.8998C21.4502 12.9699 21.06 12.99 20.6698 13C20.4897 13 20.3197 13 20.1396 13C19.9295 13 19.7194 13 19.5093 13H5.49261C5.28251 13 5.07241 13 4.86231 13C4.68223 13 4.51215 13 4.33206 13C3.94187 12.99 3.56169 12.9699 3.17151 12.8998C2.78132 12.8296 2.42115 12.7194 2.07099 12.5389C1.73082 12.3585 1.41067 12.128 1.14054 11.8574C0.870414 11.5867 0.640305 11.266 0.460219 10.9252C0.280133 10.5744 0.170081 10.2136 0.100048 9.82267C0.0300143 9.44179 0.0100048 9.05089 0 8.65998C0 8.47957 0 8.30918 0 8.12876C0 7.91827 0 7.70779 0 7.4973V5.49268C0 5.28219 0 5.0717 0 4.86122C0 4.6808 0 4.51041 0 4.32999C0.0100048 3.93909 0.0300143 3.55821 0.100048 3.17733C0.170081 2.78643 0.280133 2.4256 0.460219 2.07479C0.640305 1.72398 0.870414 1.41326 1.14054 1.14264C1.41067 0.872012 1.73082 0.64148 2.07099 0.461064C2.42115 0.280648 2.78132 0.170393 3.17151 0.100231C3.55169 0.0300694 3.94187 0.0100231 4.33206 0C4.51215 0 4.68223 0 4.86231 0C5.07241 0 5.28251 0 5.49261 0H19.4993C19.7094 0 19.9195 0 20.1296 0C20.3097 0 20.4797 0 20.6598 0C21.05 0.0100231 21.4302 0.0300694 21.8204 0.100231C22.2106 0.170393 22.5707 0.280648 22.9209 0.461064C23.2711 0.64148 23.5812 0.872012 23.8513 1.14264C24.1215 1.41326 24.3516 1.734 24.5317 2.07479C24.7118 2.4256 24.8218 2.78643 24.8918 3.17733C24.9619 3.55821 24.9819 3.94911 24.9919 4.32999C24.9919 4.51041 24.9919 4.6808 24.9919 4.86122C24.9919 5.0717 24.9919 5.28219 24.9919 5.49268V7.4973H25.0019Z"/></svg>',
		back: '<svg viewBox="0 0 11 19" width="11" height="19"><path fill="currentColor" d="' + P_BACK + '"/></svg>',
		chev: '<svg viewBox="0 0 11 19" width="7" height="12"><path fill="currentColor" transform="translate(11 0) scale(-1 1)" d="' + P_BACK + '"/></svg>',
		plus: '<svg viewBox="-3.6 -3.6 24.3 24.3" width="21" height="21"><path fill="currentColor" transform="rotate(45 8.558 8.558)" d="' + P_XMARK + '"/></svg>',
		close: '<svg viewBox="0 0 18 18" width="15" height="15"><path fill="currentColor" d="' + P_XMARK + '"/></svg>',
		send: '<svg viewBox="0 0 17 21" width="14" height="17"><path fill="currentColor" d="' + P_ARROW + '"/></svg>',
		video: '<svg viewBox="0 0 27 18" width="27" height="18"><rect x="1" y="1.2" width="17.5" height="15.6" rx="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M19.5 7.2 24.6 3.6c.7-.5 1.4 0 1.4.8v9.2c0 .8-.7 1.3-1.4.8l-5.1-3.6z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
		mic: '<svg viewBox="0 0 14 21" width="14" height="21"><rect x="3.5" y="1" width="7" height="12" rx="3.5" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M1 9.5a6 6 0 0 0 12 0M7 15.5V20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
		smile: '<svg viewBox="0 0 26 26" width="26" height="26"><circle cx="13" cy="13" r="11.5" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="9.2" cy="10.5" r="1.6" fill="currentColor"/><circle cx="16.8" cy="10.5" r="1.6" fill="currentColor"/><path d="M7.5 15c1.2 2.4 3.2 3.6 5.5 3.6s4.3-1.2 5.5-3.6z" fill="currentColor"/></svg>'
	};

	var root = h("div", "ts-root");
	root.innerHTML =
		'<div class="ts-banner" role="button" tabindex="-1" aria-hidden="true">' +
			'<span class="ts-banner__avatar" style="background-image:url(' + AVATAR + ')"></span>' +
			'<span class="ts-banner__name">' + NAME + '</span><span class="ts-banner__time">now</span>' +
			'<span class="ts-banner__text"></span>' +
		"</div>" +
		'<button class="ts-launcher" type="button" aria-haspopup="dialog" aria-label="Text Sooim" style="background-image:url(' + AVATAR + ')">' +
			'<span class="ts-launcher__badge" aria-hidden="true">1</span>' +
		"</button>" +
		'<section class="ts-panel" role="dialog" aria-modal="false" aria-label="Text Sooim" aria-hidden="true">' +
			'<div class="ts-status" aria-hidden="true"><span class="ts-status__time"></span><span class="ts-island"></span><span class="ts-status__icons">' + ICON.signal + ICON.wifi + ICON.battery + "</span></div>" +
			'<div class="ts-scroll" role="log" aria-live="polite" aria-relevant="additions"></div>' +
			'<div class="ts-edge ts-edge--top"></div><div class="ts-edge ts-edge--bottom"></div>' +
			'<button class="ts-back ts-glass" type="button" aria-label="Close messages">' + ICON.back + "</button>" +
			'<a class="ts-contact" href="about" aria-label="About ' + NAME + '">' +
				'<span class="ts-contact__avatar" style="background-image:url(' + AVATAR + ')"></span>' +
				'<span class="ts-contact__pill ts-glass"><span class="ts-contact__name">' + NAME + " " + ICON.chev + '</span><span class="ts-contact__sub">' + SUBTITLE + "</span></span>" +
			"</a>" +
			'<button class="ts-video ts-glass" type="button" aria-label="Video call">' + ICON.video + "</button>" +
			'<div class="ts-foot">' +
				'<div class="ts-sheet ts-glass" hidden><p class="ts-sheet__label">Ask me about</p></div>' +
				'<form class="ts-compose">' +
					'<button class="ts-plus ts-glass" type="button" aria-label="More questions" aria-expanded="false">' + ICON.plus + "</button>" +
					'<label class="ts-field ts-glass"><span class="ts-sr">Message</span>' +
						'<textarea class="ts-input" rows="1" placeholder="' + PLACEHOLDER + '" maxlength="600" enterkeyhint="send" autocomplete="off"></textarea>' +
						'<span class="ts-mic" aria-hidden="true">' + ICON.mic + "</span>" +
						'<button class="ts-send" type="submit" aria-label="Send">' + ICON.send + "</button>" +
					"</label>" +
				"</form>" +
			"</div>" +
			'<div class="ts-dim"></div>' +
			'<div class="ts-home" aria-hidden="true"></div>' +
		"</section>";

	var $ = function (s) { return root.querySelector(s); };
	var panel = $(".ts-panel"), scroller = $(".ts-scroll"), input = $(".ts-input"), field = $(".ts-field");
	var form = $(".ts-compose"), sheet = $(".ts-sheet"), plus = $(".ts-plus");
	var launcher = $(".ts-launcher"), banner = $(".ts-banner"), badge = $(".ts-launcher__badge");
	var foot = $(".ts-foot"), dim = $(".ts-dim"), clock = $(".ts-status__time");
	var busy = false, typingEl = null, receiptEl = null;

	// ---- Layout plumbing
	function tick() { clock.textContent = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }).replace(/\s?[AP]M$/i, ""); }

	// iOS paints sent bubbles with one gradient spanning the screen, so a bubble's
	// blue depends on where it sits. Feed each bubble its offset in the viewport.
	var painting = false;
	function paint() {
		if (painting) return;
		painting = true;
		requestAnimationFrame(function () {
			painting = false;
			var box = scroller.getBoundingClientRect(), gh = box.height;
			scroller.querySelectorAll(".from-me .ts-bubble").forEach(function (b) {
				var r = b.getBoundingClientRect();
				if (r.bottom < box.top - 40 || r.top > box.bottom + 40) return;
				b.style.setProperty("--gh", gh + "px");
				b.style.setProperty("--gy", box.top - r.top + "px");
				b.style.setProperty("--bh", b.offsetHeight + "px");
			});
		});
	}
	function measure() {
		panel.style.setProperty("--ts-foot", foot.offsetHeight + "px");
		panel.style.setProperty("--pw", panel.offsetWidth + "px");
		paint();
	}
	scroller.addEventListener("scroll", paint, { passive: true });
	window.addEventListener("resize", measure);
	if (window.ResizeObserver) new ResizeObserver(measure).observe(foot);

	// ---- Rendering
	function stamp(ts) {
		var d = new Date(ts), today = new Date().toDateString() === d.toDateString();
		scroller.appendChild(h("p", "ts-stamp", (today ? "Today" : d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })) + " " + time(ts)));
	}

	// Tails sit only on the last bubble of a run from the same sender.
	function retail() {
		var rows = scroller.querySelectorAll(".ts-row");
		rows.forEach(function (r, i) {
			var next = rows[i + 1], prev = rows[i - 1];
			var mine = r.classList.contains("from-me");
			var nextSame = next && next.classList.contains("from-me") === mine && next.previousElementSibling === r;
			var prevSame = prev && prev.classList.contains("from-me") === mine && r.previousElementSibling === prev;
			r.classList.toggle("has-tail", !nextSame && !r.querySelector(".ts-link") && !r.classList.contains("ts-typing"));
			r.classList.toggle("is-first", !prevSame);
		});
	}

	function addRow(msg, animate) {
		var row = h("div", "ts-row " + (msg.role === "user" ? "from-me" : "from-them") + (animate ? " is-new" : ""));
		row.dataset.id = msg.id;
		var key = msg.role === "assistant" ? linkKey(msg.text) : null;
		if (key) {
			var L = LINKS[key];
			var a = h("a", "ts-link");
			a.href = key;
			if (/\.pdf$/.test(key)) { a.target = "_blank"; a.rel = "noopener"; }
			a.innerHTML = '<span class="ts-link__meta"><span class="ts-link__title">' + esc(L.title) + '</span><span class="ts-link__domain">sooimkang.com</span></span><span class="ts-link__icon" style="background-image:url(' + L.icon + ')"></span>';
			row.appendChild(a);
		} else {
			var b = h("div", "ts-bubble" + (isJumbo(msg.text) ? " is-jumbo" : ""), linkify(msg.text));
			if (msg.role === "assistant") b.setAttribute("aria-label", "Sooim: " + msg.text);
			row.appendChild(b);
		}
		if (msg.tapback) setTapback(row, msg.tapback, false);
		scroller.insertBefore(row, typingEl && typingEl.parentNode ? typingEl : null);
		retail();
		bottom();
		paint();
		return row;
	}

	function setTapback(row, kind, animate) {
		var old = row.querySelector(".ts-tapback");
		if (old) old.remove();
		row.classList.toggle("has-tapback", !!(kind && TAPBACKS[kind]));
		if (!kind || !TAPBACKS[kind]) return;
		var el = h("span", "ts-tapback", glyph(kind));
		el.setAttribute("role", "img");
		el.setAttribute("aria-label", TAPBACKS[kind].label);
		if (!animate) el.style.animation = "none";
		row.querySelector(".ts-bubble, .ts-link").appendChild(el);
	}

	function showReceipt(html) {
		if (receiptEl) receiptEl.remove();
		var lastMine = [].slice.call(scroller.querySelectorAll(".ts-row.from-me")).pop();
		if (!lastMine) return;
		receiptEl = h("p", "ts-receipt", html);
		lastMine.appendChild(receiptEl);
	}
	function readReceipt(ts) { return "Read <span>" + time(ts) + "</span>"; }

	function typing(on) {
		if (on && !typingEl) {
			typingEl = h("div", "ts-row from-them ts-typing", '<div class="ts-bubble" aria-label="Sooim is typing"><span class="ts-dot"></span><span class="ts-dot"></span><span class="ts-dot"></span></div>');
			scroller.appendChild(typingEl);
			retail();
			bottom();
		} else if (!on && typingEl) {
			typingEl.remove();
			typingEl = null;
		}
	}

	function bottom() { scroller.scrollTop = scroller.scrollHeight; }

	function renderAll() {
		scroller.innerHTML = "";
		typingEl = null;
		stamp(state.started);
		state.msgs.forEach(function (m) { addRow(m, false); });
		var last = state.msgs[state.msgs.length - 1];
		if (last && last.role === "user") {
			if (last.failed) markFailed(last);
			else showReceipt("Delivered");
		} else if (state.msgs.some(function (m) { return m.role === "user"; })) {
			showReceipt(readReceipt(state.readAt || Date.now()));
		}
		renderSheet();
	}

	function asked() { return state.msgs.filter(function (m) { return m.role === "user"; }).map(function (m) { return m.text; }); }

	function renderSheet() {
		var done = asked();
		var left = SUGGESTIONS.filter(function (s) { return done.indexOf(s.text) < 0; });
		sheet.querySelectorAll("button").forEach(function (b) { b.remove(); });
		left.forEach(function (s) {
			var b = h("button", null, esc(s.text));
			b.type = "button";
			b.onclick = function () { toggleSheet(false); send(s.text); };
			sheet.appendChild(b);
		});
		measure();
	}

	function markFailed(msg) {
		if (receiptEl) receiptEl.remove();
		var row = scroller.querySelector('.ts-row[data-id="' + msg.id + '"]');
		if (!row) return;
		receiptEl = h("button", "ts-failed", "Not Delivered");
		receiptEl.type = "button";
		receiptEl.setAttribute("aria-label", "Not delivered. Tap to try again.");
		receiptEl.onclick = function () { msg.failed = false; save(); receiptEl.remove(); receiptEl = null; respond(msg); };
		row.appendChild(receiptEl);
	}

	// ---- Conversation
	function id() { return Math.random().toString(36).slice(2, 10); }

	function send(text) {
		text = (text || "").trim();
		if (!text || busy) return;
		var msg = { id: id(), role: "user", text: text, at: Date.now() };
		state.msgs.push(msg);
		save();
		input.value = "";
		autosize();
		addRow(msg, true);
		showReceipt("Delivered");
		renderSheet();
		respond(msg);
	}

	function history() {
		return state.msgs
			.filter(function (m) { return !m.failed && !m.local; })
			.slice(-MAX_TURNS * 2)
			.map(function (m) { return { role: m.role, content: m.text }; });
	}

	function ask() {
		if (!ENDPOINT) return wait(350).then(function () { return localReply(state.msgs[state.msgs.length - 1].text); });
		var ctl = typeof AbortController === "function" ? new AbortController() : null;
		var timer = setTimeout(function () { if (ctl) ctl.abort(); }, 25000);
		return fetch(ENDPOINT, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ messages: history(), page: location.pathname }),
			signal: ctl ? ctl.signal : undefined
		}).then(function (r) {
			clearTimeout(timer);
			if (!r.ok) throw new Error("HTTP " + r.status);
			return r.json();
		});
	}

	// Types out 1–5 texts (split on blank lines), with the typing bubble between them.
	function deliver(reply, opts) {
		var parts = reply.split(/\n\s*\n/).map(function (p) { return p.trim(); }).filter(Boolean).slice(0, 5);
		return parts.reduce(function (p, part, i) {
			return p.then(function () {
				typing(true);
				var ms = Math.min(1800, 350 + part.length * 22);
				return wait(i === 0 ? ms * 0.6 : ms);
			}).then(function () {
				typing(false);
				var m = { id: id(), role: "assistant", text: part, at: Date.now() };
				if (opts && opts.local) m.local = true;
				state.msgs.push(m);
				save();
				addRow(m, true);
				return wait(220);
			});
		}, Promise.resolve());
	}

	function respond(userMsg) {
		busy = true;
		var result = ask();
		result.catch(function () {}); // handled below, after the read receipt
		wait(500 + Math.random() * 500).then(function () {
			state.readAt = Date.now();
			save();
			showReceipt(readReceipt(state.readAt));
			return wait(250);
		}).then(function () {
			typing(true);
			return result;
		}).then(function (res) {
			var reply = String((res && res.reply) || "").trim();
			if (!reply) throw new Error("empty");
			if (res.tapback && TAPBACKS[res.tapback]) {
				userMsg.tapback = res.tapback;
				var row = scroller.querySelector('.ts-row[data-id="' + userMsg.id + '"]');
				if (row) setTapback(row, res.tapback, true);
				save();
			}
			return deliver(reply);
		}).catch(function () {
			typing(false);
			// Endpoint down: answer from the local set when it has a real answer.
			if (ENDPOINT) {
				var local = localReply(userMsg.text);
				if (local.reply !== LOCAL_FALLBACK) return deliver(local.reply.split(/\n\s*\n/)[0]);
			}
			userMsg.failed = true;
			save();
			markFailed(userMsg);
		}).then(function () {
			busy = false;
			renderSheet();
		});
	}

	// ---- Tapback picker (double-click / double-tap Sooim's bubble)
	var picker = null, more = null, liftedRow = null;
	function closePicker() {
		if (picker) picker.remove();
		if (more) more.remove();
		if (liftedRow) liftedRow.classList.remove("is-lifted");
		picker = more = liftedRow = null;
		dim.classList.remove("is-on");
	}
	scroller.addEventListener("dblclick", function (e) {
		var row = e.target.closest(".ts-row:not(.ts-typing)");
		if (!row || !row.classList.contains("from-them")) return;
		e.preventDefault();
		try { window.getSelection().removeAllRanges(); } catch (err) {}
		openPicker(row);
	});
	// Touch: long-press, like iOS.
	var pressTimer = null;
	scroller.addEventListener("touchstart", function (e) {
		var row = e.target.closest(".ts-row.from-them:not(.ts-typing)");
		if (!row) return;
		pressTimer = setTimeout(function () { openPicker(row); }, 420);
	}, { passive: true });
	["touchend", "touchmove", "touchcancel"].forEach(function (t) {
		scroller.addEventListener(t, function () { clearTimeout(pressTimer); }, { passive: true });
	});

	function fillPicker(msg, row, keys) {
		picker.innerHTML = "";
		keys.forEach(function (k) {
			var b = h("button", null, glyph(k));
			b.type = "button";
			b.setAttribute("role", "menuitemradio");
			b.setAttribute("aria-label", TAPBACKS[k].label);
			b.setAttribute("aria-pressed", msg.tapback === k ? "true" : "false");
			b.onclick = function (ev) {
				ev.stopPropagation();
				msg.tapback = msg.tapback === k ? null : k;
				save();
				setTapback(row, msg.tapback, true);
				closePicker();
			};
			picker.appendChild(b);
		});
	}

	function openPicker(row) {
		closePicker();
		var msg = state.msgs.find(function (m) { return m.id === row.dataset.id; });
		if (!msg) return;
		var target = row.querySelector(".ts-bubble, .ts-link");
		liftedRow = row;
		row.classList.add("is-lifted");
		dim.classList.add("is-on");
		picker = h("div", "ts-picker");
		picker.setAttribute("role", "menu");
		picker.setAttribute("aria-label", "Tapback");
		fillPicker(msg, row, PICKER);
		row.appendChild(picker);
		var below = row.getBoundingClientRect().top - panel.getBoundingClientRect().top < 250;
		if (below) {
			picker.classList.add("is-below");
		} else {
			more = h("button", "ts-more", ICON.smile);
			more.type = "button";
			more.setAttribute("aria-label", "More emoji");
			more.style.left = Math.min(target.offsetWidth + 14, panel.offsetWidth - 36 - 52) + "px";
			more.style.top = "-18px";
			more.onclick = function (ev) {
				ev.stopPropagation();
				fillPicker(msg, row, MORE_EMOJI);
				more.remove();
				more = null;
				picker.querySelector("button").focus();
			};
			row.appendChild(more);
		}
		picker.querySelector("button").focus({ preventScroll: true });
	}
	dim.addEventListener("click", closePicker);

	// ---- Compose
	function autosize() {
		input.style.height = "auto";
		input.style.height = Math.min(input.scrollHeight, 132) + "px";
		var has = input.value.trim().length > 0;
		field.classList.toggle("has-text", has);
		measure();
	}
	input.addEventListener("input", autosize);
	input.addEventListener("keydown", function (e) {
		if (e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); send(input.value); }
	});
	form.addEventListener("submit", function (e) { e.preventDefault(); send(input.value); });

	function toggleSheet(on) {
		on = on == null ? sheet.hidden : on;
		sheet.hidden = !on;
		plus.setAttribute("aria-expanded", on ? "true" : "false");
		if (on) { var first = sheet.querySelector("button"); if (first) first.focus(); }
	}
	plus.addEventListener("click", function (e) { e.stopPropagation(); toggleSheet(); });
	document.addEventListener("click", function (e) { if (!sheet.hidden && !sheet.contains(e.target)) toggleSheet(false); });

	// The camera button gets an honest answer instead of a dead end.
	$(".ts-video").addEventListener("click", function () {
		if (busy) return;
		busy = true;
		deliver("Sorry, I can't talk on the phone right now!\n\nHow about you email me instead? I'll get back to you ASAP.\n\nsooimkang1015@gmail.com", { local: true }).then(function () { busy = false; });
	});

	// ---- Open / close
	function open() {
		root.classList.add("is-open");
		panel.setAttribute("aria-hidden", "false");
		banner.classList.remove("is-shown");
		state.seenBanner = true;
		state.unread = 0;
		badge.hidden = true;
		save();
		tick();
		if (!scroller.children.length) renderAll();
		if (!state.msgs.length) greet();
		setTimeout(function () { measure(); bottom(); paint(); if (!matchMedia("(pointer: coarse)").matches) input.focus({ preventScroll: true }); }, 60);
	}
	function close() {
		closePicker();
		toggleSheet(false);
		root.classList.remove("is-open");
		panel.setAttribute("aria-hidden", "true");
		launcher.focus({ preventScroll: true });
	}
	function greet() {
		busy = true;
		OPENERS.reduce(function (p, text, i) {
			return p.then(function () { typing(true); return wait(i ? 1100 : 600); }).then(function () {
				typing(false);
				var m = { id: id(), role: "assistant", text: text, at: Date.now() };
				state.msgs.push(m);
				save();
				addRow(m, true);
				return wait(200);
			});
		}, Promise.resolve()).then(function () { busy = false; renderSheet(); });
	}

	launcher.addEventListener("click", open);
	banner.addEventListener("click", open);
	$(".ts-back").addEventListener("click", close);
	document.addEventListener("keydown", function (e) {
		if (e.key !== "Escape" || !root.classList.contains("is-open")) return;
		if (picker) closePicker(); else if (!sheet.hidden) toggleSheet(false); else close();
	});

	// ---- Boot
	function boot() {
		document.body.appendChild(root);
		if (!state.unread) badge.hidden = true;
		tick();
		setInterval(tick, 15000);
		renderAll();
		if (AUTO_OPEN) { open(); return; }
		// One gentle banner per session, only after the visitor has settled in.
		if (!state.seenBanner && !state.msgs.length) {
			setTimeout(function () {
				if (root.classList.contains("is-open")) return;
				banner.querySelector(".ts-banner__text").textContent = OPENERS.join(" ");
				banner.classList.add("is-shown");
				banner.setAttribute("aria-hidden", "false");
				state.seenBanner = true;
				save();
				setTimeout(function () { banner.classList.remove("is-shown"); banner.setAttribute("aria-hidden", "true"); }, 7000);
			}, 6000);
		}
	}
	if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();

	window.TextSooim = { open: open, close: close, reset: function () { try { sessionStorage.removeItem(STORE); } catch (e) {} location.reload(); } };
})();
