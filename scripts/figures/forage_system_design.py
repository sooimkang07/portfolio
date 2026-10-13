"""Forage > System Design. Run from the repo root: python3 scripts/figures/forage_system_design.py"""
import os, sys; sys.path.insert(0, os.path.dirname(__file__))
from ngraph import render, node_h

W = 380; VG = 64  # node width, vertical gap between stacked nodes
cols = {'ring': 170, 'ai': 770, 'lib': 1370}
nodes = []
def stack(col, y, items):  # stack nodes top to bottom in one column
    for k, t, rows, ai in items:
        nodes.append((k, col, y, t, rows, ai)); y += node_h(rows) + VG
stack('ring', 230, [('trig', 'Trigger', [('Double tap', 'Capture mode on'), ('Haptic tick', 'No need to look')], False),
                    ('sel', 'Select', [('Outline in the air', 'Motion sensors'), ('Second gesture', 'Picks the type')], False),
                    ('cap', 'Capture', [('Micro camera', 'Cropped to outline')], False)])
stack('ai', 200, [('cls', 'Classify', [('Image', 'Color'), ('Type', 'Motion')], True),
                  ('ext', 'Extract', [('Palette', 'Hex values'), ('Font', 'OCR'), ('Timing curve', 'From motion')], True),
                  ('tag', 'Tag and group', [('Categories', ''), ('Findings', 'Clusters')], True)])
stack('lib', 230, [('field', 'Field', [('Every capture', 'Newest first')], False),
                   ('types', 'Types + Findings', [('Filter by asset', ''), ('AI clusters', '')], False),
                   ('boards', 'Boards + Explore', [('Boards', 'By project'), ('Explore', 'Other designers')], False)])
bot = max(y + node_h(r) for _, _, y, _, r, _ in nodes)
spec = dict(
    cols=cols, W=W, label_top=84, nodes=nodes,
    edges=[('trig', 'sel', 'v'), ('sel', 'cap', 'v'), ('cap', 'cls'), ('cls', 'ext', 'v'), ('ext', 'tag', 'v'),
           ('tag', 'field'), ('field', 'types', 'v'), ('types', 'boards', 'v')],
    labels=[('01 · The ring', 'ring'), ('02 · Intelligence', 'ai'), ('03 · The library', 'lib')],
    zone=dict(x=cols['ai'] - 30, y=140, w=W + 60, h=bot + 80 - 140, label=None),
    note=dict(text='The ring and AI are proposed; the web prototype shows the library.', x=cols['ring'], y=bot + 50),
    aria=('One capture end to end. The ring: a double tap turns capture mode on with a haptic tick, you outline the subject in the air with motion sensors, a second gesture picks the type, and the micro camera captures it cropped to the outline. '
          'Intelligence, proposed: AI classifies the image, color, type, or motion, extracts what is reusable, a palette, a font through OCR, or a timing curve, then tags and groups it into categories and Findings. '
          'The library: it lands in the Field, newest first, is filterable in Types and Findings, and is organized in Boards and Explore. The ring and AI are proposed; the web prototype shows the library.'),
)
from ngraph import replace_figure
fig, _ = render(spec)
replace_figure('forage.html', 'One capture end to end.', fig)
print('forage.html: System Design regenerated')
