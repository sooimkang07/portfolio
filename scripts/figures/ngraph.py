"""Node-graph figure generator (the "System architecture" style figure).

Builds a `.fig.ngraph` figure from a small spec and swaps it into a page,
replacing the existing <figure> whose aria-label contains `marker`.
Styles live in css/figures.css (.node, .node__h, .node__row, .ngraph__wires,
.ngraph__zone, .ngraph__col). See docs/FIGURES.md for when and how to use it.

Coordinates are in a 1920 x 1080 canvas (same as the SVG viewBox) and are
written to the page as cqw (px / 19.2), so the figure scales like an image.

Spec keys:
  cols    {name: x}                 left edge of each column
  nodes   [(key, col, y, title, rows, ai)]
          rows: [(label, right_text)]; label "dot y|p|n" renders a status dot
          ai:   True adds the <em>AI</em> tag in the header
  edges   [(a, b)] curve from a's right port to b's left port
          [(a, b, 'v')] straight line from a's bottom to b's top (same column)
  labels  [(text, col)] caps column labels at y = label_top
  zone    dict(x, y, w, h, label) dashed "AI" area behind a set of columns (optional)
  note    dict(text, x, y) one plain line of small print (optional)
  aria    full text description of the figure (required; the figure is role="img")
"""
W = 360; HEAD = 52; ROW = 46; PAD = 17; GAP = 9


def node_h(rows): return PAD * 2 + HEAD + len(rows) * ROW + (len(rows) - 1) * GAP


def cq(px): return f'{px / 19.2:.3f}cqw'


def render(spec):
    w = spec.get('W', W); cols = spec['cols']
    N = {k: dict(x=cols[c], y=y, w=w, h=node_h(r), title=t, rows=r, ai=ai) for k, c, y, t, r, ai in spec['nodes']}

    def port(k, side):
        n = N[k]
        return {'r': (n['x'] + n['w'], n['y'] + PAD + HEAD / 2), 'l': (n['x'], n['y'] + PAD + HEAD / 2),
                'b': (n['x'] + n['w'] / 2, n['y'] + n['h']), 't': (n['x'] + n['w'] / 2, n['y'])}[side]

    paths = ''; dots = set()
    for e in spec['edges']:
        a, b = e[0], e[1]
        if len(e) == 3:
            (x1, y1), (x2, y2) = port(a, 'b'), port(b, 't'); paths += f'<path d="M{x1:.0f} {y1:.0f} V{y2:.0f}"/>'
        else:
            (x1, y1), (x2, y2) = port(a, 'r'), port(b, 'l'); mx = (x1 + x2) / 2
            paths += f'<path d="M{x1:.0f} {y1:.0f} C{mx:.0f} {y1:.0f}, {mx:.0f} {y2:.0f}, {x2:.0f} {y2:.0f}"/>'
        dots.add((x1, y1)); dots.add((x2, y2))
    circ = ''.join(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="7"/>' for x, y in sorted(dots))

    def row(r):
        a, b = r
        if a.startswith('dot '):
            return f'<div class="node__row" style="justify-content:flex-start;gap:.8cqw"><i class="{a}"></i><b>{b}</b></div>'
        return f'<div class="node__row"><b>{a}</b>{("<span>" + b + "</span>") if b else ""}</div>'

    nodes = ''.join(f'<div class="node" style="left:{cq(n["x"])};top:{cq(n["y"])};width:{cq(n["w"])};height:{cq(n["h"])}">'
                    f'<div class="node__h">{n["title"]}{"<em>AI</em>" if n["ai"] else ""}</div>{"".join(row(r) for r in n["rows"])}</div>'
                    for n in N.values())
    colh = ''.join(f'<span class="ngraph__col" style="left:{cq(cols[c])};top:{cq(spec["label_top"])}">{t}</span>' for t, c in spec['labels'])
    z = spec.get('zone')
    zone = (f'<div class="ngraph__zone" style="left:{cq(z["x"])};top:{cq(z["y"])};width:{cq(z["w"])};height:{cq(z["h"])}">'
            f'<span><em>AI</em>{z["label"]}</span></div>') if z else ''
    nt = spec.get('note')
    note = (f'<span class="ngraph__col" style="left:{cq(nt["x"])};top:{cq(nt["y"])};text-transform:none;letter-spacing:0">{nt["text"]}</span>') if nt else ''
    return (f'<figure class="nt-media nt-process"><div class="fig ngraph" role="img" aria-label="{spec["aria"]}">'
            + zone + colh + f'<svg class="ngraph__wires" viewBox="0 0 1920 1080" preserveAspectRatio="none" aria-hidden="true">{paths}{circ}</svg>'
            + nodes + note + '</div></figure>'), N


def replace_figure(page, marker, fig):
    """Swap the <figure> whose markup contains `marker` (e.g. the start of its aria-label)."""
    s = open(page).read()
    i = s.find(marker)
    if i < 0: raise SystemExit(f'marker not found in {page}: {marker!r}')
    a = s.rfind('<figure', 0, i); b = s.find('</figure>', i) + 9
    open(page, 'w').write(s[:a] + fig + s[b:])
