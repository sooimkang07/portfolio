"""Rebuild Forage's proposed extraction comparison from existing assets."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ASSETS = 'assets/forage/system-design/use-cases/'
ARROW = '<svg viewBox="0 0 24 32" aria-hidden="true"><path d="M12 2v26m-7-7 7 7 7-7"/></svg>'
CURVE = '<svg class="fg-extract__curve" viewBox="0 0 160 90" aria-label="Proposed easing curve"><path class="fg-extract__axis" d="M12 8v70h136"/><path d="M12 78C95 78 65 12 148 12"/></svg>'
def image(name, alt, cls=''):
    return f'<img class="{cls}" src="{ASSETS}{name}" alt="{alt}" loading="lazy" decoding="async">'
rows = [
    ('Image', 'forage-card-image-raw.jpg', 'A latte poster photographed on the street', 'Tap', image('forage-card-image.png', 'The isolated latte and hand'), 'Background removed', 'PNG'),
    ('Typography', 'forage-card-type.jpg', 'Jerri’s Cleaners lettering on an awning', 'Two-finger drag', '<span class="fg-extract__specimen">Ag</span><span class="fg-extract__font">Bodoni Poster<br>Compressed</span>', 'Font matched', 'OTF / TTF'),
    ('Color', 'forage-card-color.jpg', 'A pale blue storefront wall', 'Two-finger tap', '<div class="fg-extract__swatch"></div><span class="fg-extract__hex">#99B0BF</span>', 'Color sampled', 'HEX'),
    ('Motion', 'forage-card-motion-poster.jpg', 'A crosswalk countdown signal', 'Hold + drag', image('forage-card-motion-poster.jpg', 'The captured crosswalk movement', 'fg-extract__motion') + CURVE, 'Movement + curve', 'MP4 / GIF'),
]
cards = []
for title, raw, alt, gesture, output, caption, fmt in rows:
    cards.append(f'<div class="board__card"><p class="board__title">{title}</p><div class="board__body fg-extract__body"><div class="fg-extract__raw">{image(raw,alt)}</div><div class="fg-extract__gesture">{ARROW}<span>{gesture}</span></div><div class="fg-extract__result">{output}</div><div class="fg-extract__caption"><span>{caption}</span><strong>{fmt}</strong></div></div></div>')
figure = '<figure class="nt-media nt-process"><div class="fig board fg-extract" role="group" aria-label="Proposed AI extraction: four gestures turn street captures into a cutout image, a font match, a color, and a motion clip with a curve"><div class="fg-extract__labels"><span>Capture</span><span>Reusable asset · Proposed</span></div><div class="board__row" style="--cols:repeat(4,minmax(0,1fr))">' + ''.join(cards) + '</div></div></figure>'
p = ROOT / 'forage.html'
s = p.read_text()
i = s.index('Keep the useful information, not just the file.')
a = s.index('<figure', i)
b = s.index('</figure>', a) + len('</figure>')
p.write_text(s[:a] + figure + s[b:])
