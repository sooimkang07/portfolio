"""Rebuild case-study pages on the Notate layout while keeping each page's content.

Shell (from notate.html): full-width cover -> sticky rail (Back + section list)
-> intro header (kicker, title, meta) -> numbered single-column sections -> end links.
Original pages are saved once to _restore/<name>-before-notate.html.
"""
from pathlib import Path
import copy, re, sys
from bs4 import BeautifulSoup, NavigableString

ROOT = Path(__file__).resolve().parent.parent
PAGES = ['acuity', 'capstone', 'forage', 'neuk', 'yap']
V = 'nt-1'


def toc_item(soup, sid, label):
    li = soup.new_tag('li')
    a = soup.new_tag('a', href='#' + sid)
    flip = BeautifulSoup(
        f'<span class="project-toc-flip"><span class="project-toc-flip-track">'
        f'<span class="project-toc-title">{label}</span>'
        f'<span class="project-toc-title" aria-hidden="true">{label}</span></span></span>',
        'html.parser')
    a.append(flip)
    li.append(a)
    return li


def convert(name):
    path = ROOT / f'{name}.html'
    src = path.read_text()
    backup = ROOT / '_restore' / f'{name}-before-notate.html'
    backup.parent.mkdir(exist_ok=True)
    if not backup.exists():
        backup.write_text(src)
    elif 'nt-story' in src:
        print(f'{name}: already converted, skipping')
        return
    soup = BeautifulSoup(src, 'html.parser')
    body, head = soup.body, soup.head
    body['class'] = ['home', 'page--project', 'notate-page', 'nt-case', f'{name}-page']

    # Stylesheets: Notate system + shared case bridge (after page-specific styles).
    for href in [f'css/notate.css?v={V}', f'css/notate-refinements.css?v={V}', f'css/project-notate.css?v={V}']:
        head.append(soup.new_tag('link', rel='stylesheet', href=href))

    main = body.find('main')
    case_body = main.select_one('.case__body')
    hero = case_body.select_one('.case__hero')

    # Section labels come from the existing TOC so nothing is renamed.
    labels = {}
    for a in main.select('.case__toc-link'):
        t = a.select_one('.project-toc-title')
        labels[a['href'][1:]] = (t or a).get_text(strip=True)

    # ── Cover ────────────────────────────────────────────────
    cover_src = hero.select_one('.case__media-block--hero, .case__hero-img, figure')
    cover = soup.new_tag('figure', attrs={'class': 'nt-media nt-wide nt-hero-media nt-case-cover'})
    if cover_src is not None:
        cover_src.extract()
        video = cover_src.find('video')
        if video is not None:
            device = cover_src.select_one('.flow__device') or cover_src
            cover.append(device)
            if cover_src.get('data-project-morph-to'):
                cover['data-project-morph-to'] = cover_src['data-project-morph-to']
        else:
            label = cover_src.get_text(' ', strip=True) or f'{name} cover'
            ph = soup.new_tag('div', attrs={'class': 'nt-placeholder nt-cinema', 'role': 'img', 'aria-label': f'Placeholder for {label}'})
            cover.append(ph)
    else:
        cover.append(soup.new_tag('div', attrs={'class': 'nt-placeholder nt-cinema', 'role': 'img', 'aria-label': f'Placeholder for {name} cover'}))

    # ── Intro header ─────────────────────────────────────────
    hero['class'] = ['nt-hero', 'nt-reading']
    hero.find('h1')['class'] = []
    del hero.find('h1')['class']
    eyebrow = hero.select_one('.case__eyebrow')
    eyebrow['class'] = ['nt-kicker']
    meta = hero.select_one('.case__meta')
    if meta is not None:
        dl = soup.new_tag('dl', attrs={'class': 'nt-meta'})
        for item in meta.select('.case__meta-item'):
            spans = [c for c in item.children if getattr(c, 'name', None)]
            if len(spans) < 2:
                continue
            wrap = soup.new_tag('div')
            dt = soup.new_tag('dt'); dt.extend(list(spans[0].contents))
            dd = soup.new_tag('dd'); dd.extend(list(spans[1].contents))
            wrap.append(dt); wrap.append(dd)
            dl.append(wrap)
        meta.replace_with(dl)

    # ── Sections ─────────────────────────────────────────────
    sections = [s for s in case_body.find_all('section', recursive=False) if s.get('id')]
    for i, sec in enumerate(sections, 1):
        cls = ['nt-section', 'nt-case-section', 'nt-reading']
        if sec.get('id') == 'reflection' or 'case__reflection' in (sec.get('class') or []):
            cls.append('nt-reflection')
        sec['class'] = cls + [c for c in (sec.get('class') or []) if c not in cls and c != 'case__reflection']
        label = labels.get(sec['id']) or sec['id'].replace('-', ' ').title()
        kicker = sec.select_one('.case__eyebrow')
        if kicker is not None:
            kicker['class'] = ['case__eyebrow', 'nt-kicker']
            kicker.string = f'{i:02d} / {kicker.get_text(strip=True)}'
        title = sec.select_one('.case__section-title')
        if title is not None and not title.get('id'):
            title['id'] = f"{sec['id']}-title"
            sec['aria-labelledby'] = title['id']

    # Copy precedes its associated visual (Notate reads text → media).
    for grid in main.select('.flow__grid'):
        copy_el = grid.select_one(':scope > .flow__copy')
        if copy_el is not None:
            copy_el.extract(); grid.insert(0, copy_el)
    for group in main.select('.case__col-group > div, .case__flow-block'):
        kids = [c for c in group.children if getattr(c, 'name', None)]
        text = [c for c in kids if c.name in ('h3', 'h4', 'p') and not c.find('img')]
        if text and kids and kids[0] not in text:
            for t in reversed(text):
                t.extract(); group.insert(0, t)

    # ── Rail ─────────────────────────────────────────────────
    rail = soup.new_tag('aside', attrs={'class': 'nt-rail'})
    nav = soup.new_tag('nav', attrs={'class': 'nt-toc', 'aria-label': 'Case study sections'})
    back = soup.new_tag('a', attrs={'class': 'nt-back', 'href': '/'}); back.string = '← Back'
    ol = soup.new_tag('ol')
    for sec in sections:
        ol.append(toc_item(soup, sec['id'], labels.get(sec['id']) or sec['id'].title()))
    nav.append(back); nav.append(ol); rail.append(nav)

    chapters = soup.new_tag('div', attrs={'class': 'nt-chapters'})
    hero.extract(); chapters.append(hero)
    for sec in sections:
        chapters.append(sec.extract())
    story = soup.new_tag('div', attrs={'class': 'nt-story'})
    story.append(rail); story.append(chapters)

    end = BeautifulSoup('<div class="nt-end nt-reading"><a href="/">← Explore more work</a>'
                        '<a href="mailto:sooimkang@gmail.com">Let’s talk ↗</a></div>', 'html.parser')

    main.clear()
    main.attrs = {'id': 'top', 'class': 'nt-main'}
    main.append(cover); main.append(story); main.append(end)

    skip = soup.new_tag('a', attrs={'class': 'nt-skip', 'href': '#' + sections[0]['id']})
    skip.string = 'Skip to case study'
    body.insert(0, skip)

    # Scripts: keep site/work (video controls, zoom)/morph; Notate scroll spy replaces case-layout.
    for s in body.find_all('script', src=True):
        if s['src'].startswith('js/case-layout.js'):
            s.decompose()
    body.append(soup.new_tag('script', src=f'js/notate.js?v={V}'))

    out = str(soup)
    path.write_text(out)
    print(f'{name}: {len(sections)} sections → Notate layout (backup {backup.relative_to(ROOT)})')


if __name__ == '__main__':
    for p in (sys.argv[1:] or PAGES):
        convert(p)
