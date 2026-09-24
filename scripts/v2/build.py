"""Builds the v2 pages from shared partials + one projects list.

    python3 scripts/v2/build.py

Writes index.html and work.html at the repo root. Case pages
(e.g. notate.html) are hand-written but reuse head(), nav() and footer().
"""
from pathlib import Path
from html import escape
import sys

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(Path(__file__).parent))
from projects import PROJECTS, FEATURED, REEL, FILTERS  # noqa: E402

V = "v2-1"  # cache-bust
BY_SLUG = {p["slug"]: p for p in PROJECTS}
EMAIL = "sooimkang1015@gmail.com"


def roll(text, cls="caps"):
    return f'<span class="{cls}" data-roll>{escape(text)}</span>'


def head(title, description, extra_css=(), case=None):
    css = "".join(f'\n\t<link rel="stylesheet" href="css/v2/{c}.css?v={V}">' for c in extra_css)
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
	<script src="js/preview-gate.js"></script>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title>{escape(title)}</title>
	<meta name="description" content="{escape(description)}">
	<link rel="icon" href="favicon.ico">
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
	<link rel="stylesheet" href="css/v2/tokens.css?v={V}">
	<link rel="stylesheet" href="css/v2/site.css?v={V}">{css}
</head>"""


NAV_ITEMS = [("work", "Work", "Case studies"), ("explorations", "Explorations", "Side quests"),
             ("about", "About", "Get to know me"), ("Sooim-Kang-Resume.pdf", "Resume", "PDF")]


def nav(current=None):
    def attrs(href):
        ext = ' target="_blank" rel="noopener"' if href.endswith(".pdf") else ""
        cur = ' aria-current="page"' if href == current else ""
        return f'href="{href}"{ext}{cur}'
    links = "".join(f'<a {attrs(h)}>{roll(t)}</a>' for h, t, _ in NAV_ITEMS)
    menu = "".join(f'<a {attrs(h)}>{roll(t)}<small>{escape(s)}</small></a>' for h, t, s in NAV_ITEMS)
    return f"""
	<a class="skip" href="#main">Skip to content</a>
	<header class="nav" data-nav>
		<a class="nav__logo" href="./" aria-label="Sooim Kang, home">Sooim Kang</a>
		<nav class="nav__links" aria-label="Primary">{links}</nav>
		<button class="nav__chip glass" type="button" aria-expanded="false" aria-controls="nav-menu" aria-label="Menu">
			<span class="nav__head" aria-hidden="true"></span>
			<span class="nav__dots" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
		</button>
		<div class="nav__backdrop" aria-hidden="true"></div>
		<nav class="nav__menu glass" id="nav-menu" aria-label="Menu">{menu}</nav>
	</header>"""


def footer():
    links = [(f"mailto:{EMAIL}", "Email"), ("https://linkedin.com/in/sooimkang/", "LinkedIn"),
             ("https://github.com/sooimkang07", "GitHub"), ("Sooim-Kang-Resume.pdf", "Resume")]
    ext = ' target="_blank" rel="noopener"'
    items = "".join(
        f'<a href="{h}"{ext if h.startswith(("http", "Sooim")) else ""}>{roll(t)}</a>'
        for h, t in links)
    return f"""
	<footer class="footer">
		<div class="wrap footer__top">
			<p class="footer__cta">Building something people talk about?<br><a href="mailto:{EMAIL}">Let's talk.</a></p>
			<nav class="footer__links" aria-label="Contact">{items}</nav>
		</div>
		<div class="wrap footer__meta">
			<span class="eyebrow">© 2026 Sooim Kang</span>
			<span class="eyebrow" data-clock>NYC</span>
		</div>
		<div class="footer__mark" aria-hidden="true">sooim</div>
	</footer>
	<script src="js/v2/site.js?v={V}" defer></script>"""


def media(p, cursor="View case", vt=True, loading="lazy"):
    m = p["media"]
    style = f' style="view-transition-name: cover-{p["slug"]}"' if vt else ""
    if "video" in m:
        inner = (f'<video src="{m["video"]}" poster="{m["poster"]}" muted loop playsinline '
                 f'preload="none" data-autoplay aria-hidden="true"></video>')
    else:
        inner = f'<img src="{m["image"]}" alt="" loading="{loading}" decoding="async">'
    return f'<div class="media" data-cursor="{cursor}"{style}>{inner}</div>'


def tags(p):
    return "".join(f'<span class="tag">{escape(t)}</span>' for t in p["tags"])


# ── Home ────────────────────────────────────────────────────
def build_home():
    reel_items = "".join(
        f'<video class="reel__clip{" is-active" if i == 0 else ""}" data-i="{i}" src="{src}" poster="{poster}" '
        f'muted playsinline preload="{"auto" if i == 0 else "none"}" data-manual aria-hidden="true"></video>'
        for i, (_, _, src, poster) in enumerate(REEL))
    reel_bar = "".join(
        f'<button type="button" role="tab" class="reel__seg{" is-active" if i == 0 else ""}" data-i="{i}">'
        f'<span class="reel__label">{label}</span><span class="reel__track"><i></i></span></button>'
        for i, (_, label, _, _) in enumerate(REEL))

    rows = []
    for n, slug in enumerate(FEATURED):
        p = BY_SLUG[slug]
        rows.append(f"""
			<article class="feature{' feature--flip' if n % 2 else ''}" data-reveal data-accent="{p['slug']}">
				<a class="feature__media" href="{p['url']}" aria-label="{escape(p['name'])} case study">{media(p)}</a>
				<div class="feature__copy">
					<div class="tags">{tags(p)}</div>
					<h2 class="h1"><a href="{p['url']}">{escape(p['featured_h2'])}</a></h2>
					<p class="eyebrow feature__proof">{escape(p['proof'])}</p>
					<a class="pill" href="{p['url']}">{roll('Read case study')}<span class="arrow" aria-hidden="true">→</span></a>
				</div>
			</article>""")

    html = head("Sooim Kang · Product Designer",
                "Sooim Kang is a product designer focused on how people connect, communicate, and build at scale.",
                ["home"]) + f"""
<body class="page-home">{nav()}
	<main id="main">
		<section class="hero wrap">
			<p class="eyebrow" data-reveal>Sooim Kang · Product designer · New York</p>
			<h1 class="display hero__title" data-lines>Products built around<br>how people actually <span class="kinetic" data-kinetic="talk, share, watch, remember">talk</span>.</h1>
			<p class="dek hero__dek" data-reveal style="--i:2">I'm Sooim, a product designer focused on how people connect, communicate, and build at scale. I started in journalism, so every product starts with the story.</p>
			<div class="hero__actions" data-reveal style="--i:3">
				<a class="pill pill--ink" href="work">{roll('See the work')}<span class="arrow" aria-hidden="true">→</span></a>
				<a class="pill" href="about">{roll('About me')}</a>
			</div>
		</section>

		<section class="reel" aria-label="Showreel" data-reel>
			<div class="reel__frame" data-cursor="Pause">
				{reel_items}
				<div class="reel__bar glass" role="tablist" aria-label="Showreel chapters">{reel_bar}</div>
			</div>
		</section>

		<section class="wrap section featured" aria-labelledby="featured-title">
			<h2 class="eyebrow" id="featured-title" data-reveal>Selected work</h2>
			{''.join(rows)}
			<div class="featured__more" data-reveal>
				<a class="pill" href="work">{roll(f'View all work ({len(PROJECTS)})')}<span class="arrow" aria-hidden="true">→</span></a>
			</div>
		</section>

		<section class="wrap recog" aria-label="Recognition" data-reveal>
			<span class="eyebrow">Recognition</span>
			<ul class="recog__list">
				<li>FigBuild 2026</li>
				<li>Parsons AI Startup Design Hackathon</li>
				<li>Digital Expression Fellowship</li>
			</ul>
		</section>

		<section class="wrap section teaser" aria-labelledby="teaser-title">
			<div class="teaser__photo" data-reveal><div class="media"><img src="about-me-assets/me.jpg" alt="Sooim Kang" loading="lazy" decoding="async"></div></div>
			<div class="teaser__copy" data-reveal style="--i:1">
				<p class="eyebrow">About</p>
				<h2 class="h1" id="teaser-title">Journalism taught me to find the story. <span class="tone-2">Product design lets me build what happens next.</span></h2>
				<div class="teaser__actions">
					<a class="pill" href="about">{roll('More about me')}<span class="arrow" aria-hidden="true">→</span></a>
					<a class="link" href="mailto:{EMAIL}">{EMAIL}</a>
				</div>
			</div>
		</section>
	</main>{footer()}
	<script src="js/v2/home.js?v={V}" defer></script>
</body>
</html>
"""
    (ROOT / "index.html").write_text(html)


# ── Work ────────────────────────────────────────────────────
def build_work():
    lead, rest = PROJECTS[0], PROJECTS[1:]
    chips = "".join(
        f'<button type="button" class="chip{" is-on" if k == "all" else ""}" data-filter="{k}" aria-pressed="{str(k == "all").lower()}">{roll(t)}</button>'
        for k, t in FILTERS)
    cards = "".join(f"""
			<a class="card" href="{p['url']}" data-filters="{' '.join(p['filters'])}" data-reveal style="--i:{i % 3}">
				{media(p)}
				<span class="card__row"><span class="card__name">{escape(p['name'])}</span><span class="card__year">{p['year']}</span></span>
				<span class="card__line">{escape(p['line'])}</span>
				<span class="tags">{tags(p)}</span>
			</a>""" for i, p in enumerate(rest))

    html = head("Work · Sooim Kang", "Selected product design work by Sooim Kang.", ["work"]) + f"""
<body class="page-work">{nav('work')}
	<main id="main" class="wrap">
		<header class="work-head">
			<h1 class="display" data-lines>Selected work.<br><span class="tone-2">Designing systems behind everyday behaviors.</span></h1>
			<div class="chips" role="group" aria-label="Filter projects" data-reveal>{chips}</div>
		</header>

		<a class="lead" href="{lead['url']}" data-filters="{' '.join(lead['filters'])}" data-reveal>
			{media(lead)}
			<span class="lead__copy">
				<span class="lead__title"><span class="h1">{escape(lead['name'])}</span><span class="eyebrow">Latest · {lead['year']}</span></span>
				<span class="lead__text">
					<span class="dek">{escape(lead['featured_h2'])}</span>
					<span class="tags">{tags(lead)}</span>
				</span>
			</span>
		</a>

		<section class="grid" aria-label="All projects">{cards}
		</section>
		<p class="grid__empty dek" hidden>Nothing here yet for that filter.</p>
	</main>{footer()}
	<script src="js/v2/work.js?v={V}" defer></script>
</body>
</html>
"""
    (ROOT / "work.html").write_text(html)


if __name__ == "__main__":
    build_home()
    build_work()
    print("built index.html, work.html")


# ── Case pages ──────────────────────────────────────────────
def vid(src, poster, label, cls="clip", cursor=None, w=None, h=None):
    cur = f' data-cursor="{cursor}"' if cursor else ""
    size = f' width="{w}" height="{h}"' if w else ""
    return (f'<div class="media {cls}"{cur}><video src="{src}" poster="{poster}"{size} muted loop playsinline '
            f'preload="none" data-autoplay aria-label="{escape(label)}"></video></div>')


def toc(items, back="work"):
    lis = "".join(f'<li><a href="#{i}">{roll(t)}</a></li>' for i, t in items)
    return f"""
			<nav class="toc" aria-label="Case study sections" data-toc>
				<a class="toc__back" href="{back}">{roll('← All work')}</a>
				<ol><li class="toc__dot" aria-hidden="true"></li>{lis}</ol>
			</nav>"""


def next_project(slug):
    p = BY_SLUG[slug]
    return f"""
		<a class="wrap next" href="{p['url']}" data-reveal data-accent="{p['slug']}">
			<span class="next__copy">
				<span class="eyebrow">Next project</span>
				<span class="h1">{escape(p['name'])}</span>
				<span class="dek">{escape(p['line'])}</span>
			</span>
			{media(p)}
		</a>"""


NT = "notate-assets"
NTM = f"{NT}/notate-portfolio-motion"


def build_notate():
    ladder_steps = [
        ("Step 1 · Keep the tab open",
         '<div class="mb"><div class="mb__bar mb__tabs--many"><i></i><i></i><i></i>' + '<span class="mb__tab"></span>' * 18 +
         '</div><div class="mb__body"><span class="mb__line w8"></span><span class="mb__line w6"></span><span class="mb__line w4"></span><span class="mb__q">40 tabs</span></div></div>',
         "40 tabs later, you can't find anything and your laptop slows down.", "Can't find it"),
        ("Step 2 · Bookmark it",
         '<div class="mb"><div class="mb__bar"><i></i><i></i><i></i><span class="mb__tab" style="width:40px"></span></div><div class="mb__body">'
         '<span class="mb__folder">Design refs</span><span class="mb__folder">Read later</span><span class="mb__folder">Misc 2</span><span class="mb__q">why this one?</span></div></div>',
         "Tabs closed. A month later: why did I save this?", "Loses the why"),
        ("Step 3 · Screenshot it, note it elsewhere",
         '<div class="mb"><div class="mb__bar"><i></i><i></i><i></i><span class="mb__tab" style="width:40px"></span></div><div class="mb__split">'
         '<span class="mb__shot"></span><span class="mb__notes"><span class="mb__line w8"></span><span class="mb__line w6"></span><span class="mb__line"></span></span></div></div>',
         "The thought is in one app. The page is in another, and it moves on without you.", "Split in two"),
    ]
    ladder = "".join(f"""
						<div class="ladder__step">{art}<span class="eyebrow">{escape(tag)}</span><p>{escape(txt)}</p><span class="fail">{escape(fail)}</span></div>"""
                     for tag, art, txt, fail in ladder_steps)

    annos_l = [("element", "1", "The element", "Any part of the page: a headline, an image, a button."),
               ("note", "2", "The note", "Your thought, pinned right beside it.")]
    annos_r = [("folder", "3", "The folders", "Filter by project. Any note can go in any folder."),
               ("panel", "4", "The side panel", "Every page you've annotated, with its notes underneath.")]
    dots = [("element", "1", 16, 40), ("note", "2", 47, 50), ("folder", "3", 82, 35), ("panel", "4", 84, 58)]

    def anno(k, n, t, d):
        return f'<div class="anno" data-anno="{k}"><span class="eyebrow"><b>{n}</b>{escape(t)}</span><p>{escape(d)}</p></div>'

    anatomy = f"""
					<figure class="fig fig--wide panel" data-reveal>
						<div class="anatomy" data-anatomy>
							<div class="anatomy__col">{''.join(anno(*a) for a in annos_l)}</div>
							<div class="anatomy__shot">
								<img src="{NT}/notate-solutions/return-poster.png" alt="Notate on figma.com: a yellow note pinned to the headline, and the side panel listing saved pages and their notes." width="1920" height="1080" loading="lazy" decoding="async">
								{''.join(f'<span class="anno-dot" data-for="{k}" style="left:{x}%;top:{y}%">{n}</span>' for k, n, x, y in dots)}
							</div>
							<div class="anatomy__col">{''.join(anno(*a) for a in annos_r)}</div>
						</div>
					</figure>"""

    def feature(eyebrow, h3, body, clip, pair_clip, lead_in, pair_body):
        return f"""
					<div class="sub">
						<div class="block" data-reveal><p class="eyebrow">{eyebrow}</p><h3 class="h3">{escape(h3)}</h3><p>{escape(body)}</p></div>
						<figure class="fig" data-reveal>{clip}</figure>
						<div class="pair" data-reveal>{pair_clip}<div class="pair__copy"><p class="lead-in">{escape(lead_in)}</p><p>{escape(pair_body)}</p></div></div>
					</div>"""

    solution = "".join([
        feature("Annotate", "Click New, pick any element, and write. The note stays attached as the page moves.",
                "A pencil cursor highlights whatever you point at. Save, and the note is pinned beside it.",
                vid(f"{NTM}/annotate.mp4", f"{NTM}/annotate-poster.png", "Selecting a heading on a live page, typing a note, and saving it", w=1920, h=1080),
                vid(f"{NTM}/live-page.mp4", f"{NTM}/live-page-poster.png", "Clicking New and targeting an element directly on the live page"),
                "A click has to mean one thing.",
                "On a live page, a click either follows a link or picks an element, never both. While browsing, notes stay visible and the site works normally. New switches to a pencil that only picks, and saving keeps you there so you can leave several notes in a row."),
        feature("Organize", "Put any note in any folder, or make a new folder without leaving the page.",
                "Folders work across websites, so one project can collect notes from everywhere you researched it.",
                vid(f"{NTM}/organize.mp4", f"{NTM}/organize-poster-folder.png", "Creating a Design folder, choosing a color, and saving the note into it", w=1920, h=1080),
                vid(f"{NTM}/purpose.mp4", f"{NTM}/purpose-poster.png", "Saving a note to a colored folder and filtering notes by folder"),
                "One palette for every folder.",
                "Every folder color shares the same lightness, so no project looks louder than another. Tags and nested folders were cut: one folder per note keeps filtering predictable."),
        feature("Return", "Open a note from the side panel and land right back on what you annotated.",
                "The page reopens, or an existing tab is reused, and it scrolls straight to the element.",
                vid(f"{NTM}/return.mp4", f"{NTM}/return-poster-sidebar.png", "Opening Notate from a new tab and jumping back to a saved note on its page", w=1920, h=1080),
                vid(f"{NTM}/preview.mp4", f"{NTM}/preview-poster.png", "Expanding saved pages in the sidebar to preview notes before opening them"),
                "Preview before opening.",
                "The side panel lists every saved page with its notes underneath, so you can read what you saved before deciding to reopen it."),
    ])

    welcome = [("01", "Install", "01-install"), ("02", "Open the side panel", "02-open-sidebar"), ("03", "Pin to the toolbar", "03-pin")]
    steps = "".join(f"""<div class="step">{vid(f'{NT}/notate-welcome/{f}.mp4', f'{NT}/notate-welcome/{f}.png', t)}<p><span>{n}</span>{escape(t)}</p></div>""" for n, t, f in welcome)
    store = [("01", "Your thoughts. Right where they happen."), ("02", "See something? Leave a note."), ("03", "A little color. A lot more organized."),
             ("04", "Pick up where you left a thought."), ("05", "Make the web your thinking space.")]
    gallery = "".join(f'<img src="{NT}/notate-chrome-webpage/notate-{n}-1600.jpg" alt="Chrome Web Store screenshot: {escape(t)}" width="1600" height="1000" loading="lazy" decoding="async">' for n, t in store)

    chapters = [("problem", "Problem"), ("solution", "Solution"), ("craft", "Craft"), ("outcome", "Outcome")]

    html = head("Notate · Sooim Kang", "Notate is a Chrome extension for annotating live webpages. A case study by Sooim Kang.", ["case"]) + f"""
<body class="page-case" data-case="notate">{nav('work')}
	<main id="main">
		<header class="wrap case-head">
			<p class="eyebrow" data-reveal>New York · 2026 · Chrome extension</p>
			<h1 class="h1 case-head__title" data-reveal style="--i:1">Notate is a Chrome extension for annotating live webpages. <span class="tone-2">Pin a note to the exact part of a page, sort it into folders, and jump back to it later.</span></h1>
			<dl class="case-meta" data-reveal style="--i:2">
				<div><dt class="eyebrow">Role</dt><dd>Product designer and engineer, solo</dd></div>
				<div><dt class="eyebrow">Scope</dt><dd>Problem framing, product, build, launch</dd></div>
				<div><dt class="eyebrow">Platform</dt><dd>Chrome (Manifest V3)</dd></div>
				<div><dt class="eyebrow">Status</dt><dd>In Chrome Web Store review</dd></div>
			</dl>
			<div class="case-head__links" data-reveal style="--i:3">
				<span class="pill" aria-disabled="true"><span class="status-dot" aria-hidden="true"></span><span class="caps">Chrome Web Store · soon</span></span>
			</div>
		</header>

		<figure class="wrap case-cover" data-reveal>
			<div class="media" style="view-transition-name: cover-notate"><video src="{NT}/n-notate-logo.mp4" poster="covers/notate-cover.png" muted loop playsinline preload="auto" data-autoplay aria-label="Notate logo animation"></video></div>
		</figure>

		<div class="wrap case-body">{toc(chapters)}
			<div class="chapters">
				<section class="chapter" id="problem" aria-labelledby="problem-h">
					<p class="eyebrow chapter__label">01 · Problem</p>
					<div class="block" data-reveal>
						<h2 class="h2" id="problem-h">Every way we save the web loses why we saved it.</h2>
						<p>When something on a page sparks a thought, the usual tools split the thought from its source. Each workaround fixes the last one and creates a new problem.</p>
					</div>
					<figure class="fig panel" data-reveal>
						<span class="eyebrow ladder__tag">Each fix creates the next problem</span>
						<div class="ladder">{ladder}
						</div>
					</figure>
					<div class="block" data-reveal>
						<p>That's why the answer isn't a better bookmark manager. The note has to live on the page itself.</p>
					</div>
				</section>

				<section class="chapter" id="solution" aria-labelledby="solution-h">
					<p class="eyebrow chapter__label">02 · Solution</p>
					<div class="block" data-reveal>
						<h2 class="h2" id="solution-h">Notate puts the note on the page, attached to exactly what you noticed.</h2>
						<p>I scoped it to one loop: annotate, organize, return. Instead of saving screenshots, collecting disconnected bookmarks, or leaving dozens of tabs open, your notes stay attached to their original context.</p>
					</div>{anatomy}{solution}
				</section>

				<section class="chapter" id="craft" aria-labelledby="craft-h">
					<p class="eyebrow chapter__label">03 · Craft</p>
					<div class="block" data-reveal>
						<h2 class="h2" id="craft-h">Setup ends with a real note, not a demo.</h2>
						<p>Chrome tucks new extensions behind the puzzle-piece menu, so a fresh install is easy to lose. The welcome page walks through opening the side panel and pinning Notate, and checks off each step only when Chrome confirms it.</p>
					</div>
					<figure class="fig" data-reveal><div class="steps">{steps}</div></figure>
					<div class="pair pair--wide" data-reveal>{vid(f'{NT}/notate-welcome/04-make-a-note.mp4', f'{NT}/notate-welcome/04-make-a-note.png', 'Welcome tour card: select an element, then write a note')}<div class="pair__copy"><p class="lead-in">The tour finishes on a real page.</p><p>The last step opens a real webpage, points at New, and completes only after your first note is saved. No sample notes are written into your library.</p></div></div>
					<div class="block sub" data-reveal>
						<h2 class="h2">Designing how Notate gets found.</h2>
						<p>The store listing is the first screen most people see, so each screenshot shows one step of the loop on a real page, with one line of copy.</p>
					</div>
					<figure class="fig fig--wide" data-reveal><div class="gallery" tabindex="0" aria-label="Chrome Web Store screenshots">{gallery}</div></figure>
				</section>

				<section class="chapter" id="outcome" aria-labelledby="outcome-h">
					<p class="eyebrow chapter__label">04 · Outcome</p>
					<div class="block" data-reveal>
						<h2 class="h2" id="outcome-h">Built and submitted: Notate is in Chrome Web Store review.</h2>
						<p>No usage data yet, so here's what's true today. Next, I'll watch three people create, file, and return to a note without coaching, and let people move a note when its element disappears from a changed page.</p>
					</div>
					<div class="stats" data-reveal>
						<div class="stat stat--accent"><span class="eyebrow">Built and submitted</span><strong>v1.14</strong><p>To the Chrome Web Store.</p></div>
						<div class="stat"><span class="eyebrow">Permissions</span><strong>4</strong><p>Each one justified in the listing.</p></div>
						<div class="stat"><span class="eyebrow">Accounts needed</span><strong>0</strong><p>Notes stay in your browser.</p></div>
					</div>
					<div class="takeaway" data-reveal>
						<p class="eyebrow">Takeaway</p>
						<p class="h2">Remembering why something was saved matters more than what was saved.</p>
					</div>
				</section>
			</div>
		</div>
		{next_project('instagram')}
	</main>{footer()}
	<script src="js/v2/case.js?v={V}" defer></script>
</body>
</html>
"""
    (ROOT / "notate.html").write_text(html)


if __name__ == "__main__":
    build_notate()
    print("built notate.html")
