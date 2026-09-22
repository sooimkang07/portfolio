"""Rebuild smart-bundles.html on the Notate layout, keeping its content and media components.
Original saved once to _restore/smart-bundles-before-notate.html."""
from pathlib import Path
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parent.parent
V = 'nt-1'
path = ROOT / 'smart-bundles.html'
src = path.read_text()
backup = ROOT / '_restore' / 'smart-bundles-before-notate.html'
if 'nt-story' in src:
    raise SystemExit('smart-bundles: already converted')
if not backup.exists():
    backup.write_text(src)

soup = BeautifulSoup(src, 'html.parser')
head, body = soup.head, soup.body
body['class'] = ['home', 'bundles-page', 'notate-page', 'sb-notate']
for href in [f'css/notate.css?v={V}', f'css/notate-refinements.css?v={V}', f'css/bundles-notate.css?v={V}']:
    head.append(soup.new_tag('link', rel='stylesheet', href=href))

main = body.find('main')
labels = [(a['href'][1:], (a.select_one('.sb-toc-title') or a).get_text(strip=True)) for a in main.select('.sb-toc a')]
chapters_src = main.select('section.sb-chapter')

# Cover: the opening hero tile, full width.
opening = main.select_one('.sb-opening')
hero_tile = opening.select_one('.sb-hero')
cover = soup.new_tag('figure', attrs={'class': 'nt-media nt-wide nt-hero-media sb-cover'})
cover.append(hero_tile.extract())
opening.decompose()

# Intro header from the overview editorial block.
overview = chapters_src[0]
intro = overview.select_one('.sb-project-intro')
kicker = intro.select_one('.sb-label').get_text(strip=True)
h1 = intro.find('h1')
paras = intro.select('.sb-editorial-body > p')
meta = intro.select_one('.sb-meta')
hero = BeautifulSoup('<header class="nt-hero nt-reading"></header>', 'html.parser').header
k = soup.new_tag('p', attrs={'class': 'nt-kicker'}); k.string = kicker
hero.append(k)
h1.attrs = {}
hero.append(h1.extract())
deck = soup.new_tag('p', attrs={'class': 'nt-deck'})
deck.extend(list(paras[0].extract().contents))
hero.append(deck)
meta['class'] = ['nt-meta']
hero.append(meta.extract())

def reading_block(editorial, number_label=None):
    block = soup.new_tag('div', attrs={'class': 'nt-reading sb-reading'})
    label = editorial.select_one('.sb-label')
    if label is not None:
        kp = soup.new_tag('p', attrs={'class': 'nt-kicker'})
        kp.string = number_label or label.get_text(strip=True)
        block.append(kp)
    h2 = editorial.find('h2')
    if h2 is not None:
        block.append(h2.extract())
    body_el = editorial.select_one('.sb-editorial-body')
    if body_el is not None:
        for child in list(body_el.children):
            block.append(child.extract())
    return block

sections = []
for sec in chapters_src:
    sid = sec['id']
    new = soup.new_tag('section', attrs={'id': sid, 'class': 'nt-section sb-section'})
    editorial = sec.select_one('.sb-editorial')
    if sid == 'overview':
        block = soup.new_tag('div', attrs={'class': 'nt-reading sb-reading'})
        kp = soup.new_tag('p', attrs={'class': 'nt-kicker'}); kp.string = '01 / Overview'
        block.append(kp)
        for p in paras[1:]:
            block.append(p.extract())
        editorial.decompose()
    else:
        block = reading_block(editorial)
        editorial.decompose()
    h2 = block.find('h2')
    if h2 is not None:
        h2['id'] = f'{sid}-title'; new['aria-labelledby'] = h2['id']
    new.append(block)
    for rest in [c for c in sec.children if getattr(c, 'name', None)]:
        wrap = soup.new_tag('div', attrs={'class': 'nt-process sb-media'})
        wrap.append(rest.extract())
        new.append(wrap)
    sections.append(new)

# The embedded deck stays with the reflection chapter.
figma = main.select_one('.sb-figma-wrap')
if figma is not None:
    wrap = soup.new_tag('div', attrs={'class': 'nt-process sb-media'})
    wrap.append(figma.extract())
    sections[-1].append(wrap)

# Rail
rail = BeautifulSoup('<aside class="nt-rail"><nav class="nt-toc" aria-label="Case study sections">'
                     '<a class="nt-back" href="/">← Back</a><ol></ol></nav></aside>', 'html.parser').aside
ol = rail.find('ol')
for sid, label in labels:
    ol.append(BeautifulSoup(
        f'<li><a href="#{sid}"><span class="project-toc-flip"><span class="project-toc-flip-track">'
        f'<span class="project-toc-title">{label}</span><span class="project-toc-title" aria-hidden="true">{label}</span>'
        f'</span></span></a></li>', 'html.parser'))

chapters = soup.new_tag('div', attrs={'class': 'nt-chapters'})
chapters.append(hero)
for s in sections:
    chapters.append(s)
story = soup.new_tag('div', attrs={'class': 'nt-story'})
story.append(rail); story.append(chapters)
end = BeautifulSoup('<div class="nt-end nt-reading"><a href="/">← Explore more work</a>'
                    '<a href="mailto:sooimkang@gmail.com">Let’s talk ↗</a></div>', 'html.parser')

main.clear()
main.attrs = {'id': 'top', 'class': 'nt-main'}
main.append(cover); main.append(story); main.append(end)

# Site footer (as on Notate) replaces the page-specific one.
sb_footer = body.select_one('.sb-footer')
footer = BeautifulSoup(
    '<footer class="footer"><p class="footer__copy">© 2026 · Built with <img src="claude.png" alt="Claude" class="footer__icon" width="12" height="12">, '
    '<img src="brain.png" alt="brain" class="footer__icon" width="12" height="12">, and '
    '<img src="love.png" alt="love" class="footer__icon" width="12" height="12"></p>'
    '<time class="footer__time js-clock" datetime="" aria-label="Local time"></time></footer>', 'html.parser')
if sb_footer is not None:
    sb_footer.replace_with(footer)
else:
    main.insert_after(footer)

skip = body.select_one('.sb-skip')
skip['class'] = ['nt-skip']; skip['href'] = '#overview'; skip.string = 'Skip to case study'

body.append(soup.new_tag('script', src=f'js/notate.js?v={V}'))
path.write_text(str(soup))
print('smart-bundles: converted; backup', backup.relative_to(ROOT))
