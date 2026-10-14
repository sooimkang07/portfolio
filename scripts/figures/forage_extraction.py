"""Rebuild Forage's proposed extraction board from existing assets.

The facts above the figure already name each output. The board shows the
transformation: a street capture, then the reusable asset. No gesture names
and no captions that restate the list.
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ASSETS = 'assets/forage/system-design/use-cases/'
ARROW = '<div class="fg-extract__arrow" aria-hidden="true"><svg viewBox="0 0 24 32"><path d="M12 2v26m-7-7 7 7 7-7"/></svg></div>'
CURVE = '<svg class="fg-extract__curve" viewBox="0 0 160 90" aria-label="Proposed easing curve"><path class="fg-extract__axis" d="M12 8v70h136"/><path d="M12 78C95 78 65 12 148 12"/></svg>'

def image(name, alt, cls=''):
    return f'<img class="{cls}" src="{ASSETS}{name}" alt="{alt}" loading="lazy" decoding="async">'

rows = [
    ('Image', image('forage-card-image-raw.jpg', 'A latte poster photographed on the street'),
     image('forage-card-image.png', 'The isolated latte and hand')),
    ('Typography', image('forage-card-type.jpg', 'Jerri’s Cleaners lettering on an awning'),
     '<span class="fg-extract__specimen">Ag</span><span class="fg-extract__font">Bodoni Poster</span>'),
    ('Color', image('forage-card-color.jpg', 'A pale blue storefront wall'),
     '<div class="fg-extract__swatch"></div><span class="fg-extract__hex">#99B0BF</span>'),
    ('Motion', image('forage-card-motion-poster.jpg', 'A crosswalk countdown signal'),
     image('forage-card-motion-poster.jpg', 'The captured crosswalk movement', 'fg-extract__motion') + CURVE),
]
cards = []
for title, raw, output in rows:
    cards.append(
        f'<div class="board__card"><p class="board__title">{title}</p>'
        f'<div class="board__body fg-extract__body"><div class="fg-extract__raw">{raw}</div>'
        f'{ARROW}<div class="fg-extract__result">{output}</div></div></div>'
    )
figure = (
    '<figure class="nt-media nt-process"><div class="fig board fg-extract" role="group" '
    'aria-label="Each street capture becomes a reusable asset: a cutout, a matched typeface, a sampled color, and a motion clip with a curve.">'
    '<div class="board__row" style="--cols:repeat(4,minmax(0,1fr))">' + ''.join(cards) + '</div></div></figure>'
)
p = ROOT / 'forage.html'
s = p.read_text()
marker = 'class="fig board fg-extract"'
i = s.index(marker)
a = s.rindex('<figure', 0, i)
b = s.index('</figure>', i) + len('</figure>')
p.write_text(s[:a] + figure + s[b:])
print('forage.html: extraction figure regenerated')
