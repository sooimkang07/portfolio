#!/usr/bin/env python3
"""Design-token check for the portfolio. See DESIGN-SYSTEM.md.

Flags references to tokens that don't exist (e.g. retired names like --clr-text) and
raw values that should come from the tokens in css/base.css:
neutral hex greys, elevation box-shadows, border radii, font sizes, line heights,
letter spacing, font weights and margin/padding/gap px values.

Known exceptions live in scripts/token-baseline.json (the values that were off-system
when the system was set up). Only values not in the baseline are reported.

  python3 scripts/check-tokens.py               check every live stylesheet
  python3 scripts/check-tokens.py css/x.css     check specific files
  python3 scripts/check-tokens.py --all         list every off-system value, baseline included
  python3 scripts/check-tokens.py --baseline    rewrite the baseline (only when the user approves an exception)
  python3 scripts/check-tokens.py --hook        Claude Code PostToolUse hook (reads the tool call on stdin)
"""
import json, re, sys, collections
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASELINE = ROOT / 'scripts' / 'token-baseline.json'
# Self-contained subsystems with their own tokens; documented in DESIGN-SYSTEM.md.
SUBSYSTEMS = {'css/glass.css', 'css/text-sooim.css'}

def live_css():
    """Stylesheets linked from live pages (archived *-OLD pages are ignored)."""
    out = set()
    for page in ROOT.glob('*.html'):
        if '-OLD' in page.name: continue
        out |= set(re.findall(r'href="(css/[^"?]+\.css)', page.read_text(errors='ignore')))
    return sorted(out - SUBSYSTEMS)

DECL = re.compile(r'(?<=[{;])\s*([-\w]+)\s*:\s*([^;{}]*)')
SPACE = re.compile(r'^(margin|padding)(-[a-z-]+)?$|^(row-|column-)?gap$')

def neutral(h):
    h = h.lstrip('#')
    if len(h) in (3, 4): h = ''.join(c * 2 for c in h)
    if len(h) == 8 and h[6:].lower() != 'ff': return False
    r, g, b = (int(h[i:i + 2], 16) for i in (0, 2, 4))
    return max(r, g, b) - min(r, g, b) <= 26        # cool greys like #626B76 have a blue lean of ~20

def scan(path):
    text = (ROOT / path).read_text(errors='ignore')
    if path == 'css/base.css':                                  # the token block itself is the source of truth
        i = text.find(':root {'); j = text.find('\n}', i)
        text = text[:i] + text[j:]
    text = re.sub(r'/\*.*?\*/', '', text, flags=re.S)
    found = []
    for m in DECL.finditer(text):
        prop, val = m.group(1).lower(), m.group(2).strip()
        if prop.startswith('--') and path == 'css/base.css': continue
        bare = re.sub(r'url\([^)]*\)', '', val)
        for h in re.findall(r'#[0-9a-fA-F]{3,8}\b', bare):
            if neutral(h): found.append(('grey hex (use a color token)', prop, h.lower()))
        if prop == 'box-shadow' and val != 'none' and 'var(--glass' not in val:
            for layer in re.split(r',(?![^(]*\))', val):
                if 'inset' in layer or 'var(--' in layer: continue
                nums = [float(n) for n in re.findall(r'-?\d*\.?\d+', re.sub(r'(rgba?|hsla?)\([^)]*\)|#[0-9a-fA-F]+', ' ', layer))]
                if len(nums) >= 3 and nums[2] > 0:           # has blur: an elevation, not a ring or rule line
                    found.append(('elevation shadow (use --shadow-raise / --shadow-float)', prop, layer.strip())); break
        if prop.endswith('radius'):
            for v in re.findall(r'(?<![\w.(*-])(\d*\.?\d+(?:px|cqw|rem|em))\b', val):
                if float(re.match(r'[\d.]+', v).group()) > 0: found.append(('radius (use --r-* / --fig-r*)', prop, v))
        if prop == 'font-size' and re.fullmatch(r'\d*\.?\d+(px|rem)( !important)?', val):
            found.append(('font size (use --fs-* / --h1-fs / --h2-fs)', prop, val))
        if prop == 'line-height' and re.fullmatch(r'\d*\.?\d+( !important)?', val):
            found.append(('line height (use --lh-*)', prop, val))
        if prop == 'letter-spacing' and re.fullmatch(r'-?\d*\.?\d+em( !important)?', val) and float(val.split('em')[0]) != 0:
            found.append(('letter spacing (use --label-ls / --h2-ls / --h1-ls)', prop, val))
        if prop == 'font-weight' and re.fullmatch(r'[1-9]00|650|bold( !important)?', val):
            found.append(('font weight (use --fw-*)', prop, val))
        if SPACE.match(prop):
            for v in re.findall(r'(?<![\w.(-])(\d*\.?\d+)px\b', val):
                if 4 <= float(v) <= 112: found.append(('spacing px (use --s-1 … --s-11)', prop, v + 'px'))
    return found

_DEFINED = None
def defined_props():
    """Every custom property defined in the live CSS (plus any set from JS)."""
    global _DEFINED
    if _DEFINED is None:
        text = ''.join((ROOT / p).read_text(errors='ignore') for p in live_css() + sorted(SUBSYSTEMS))
        text += ''.join(p.read_text(errors='ignore') for p in ROOT.glob('js/**/*.js'))
        text += ''.join(p.read_text(errors='ignore') for p in ROOT.glob('*.html'))       # inline style="--x: …"
        _DEFINED = set(re.findall(r'(--[\w-]+)\s*:', text)) | set(re.findall(r"setProperty\(\s*['\"](--[\w-]+)", text))
    return _DEFINED

def unknown_tokens(path):
    text = re.sub(r'/\*.*?\*/', '', (ROOT / path).read_text(errors='ignore'), flags=re.S)
    return [('unknown token (not defined; see DESIGN-SYSTEM.md)', 'var', m) for m in re.findall(r'var\(\s*(--[\w-]+)', text) if m not in defined_props()]

def key(path, f): return f'{path} | {f[0]} | {f[1]}: {f[2]}'

def check(paths, show_all=False):
    base = collections.Counter(json.loads(BASELINE.read_text())) if BASELINE.exists() and not show_all else collections.Counter()
    new = []
    for p in paths:
        seen = collections.Counter(key(p, f) for f in scan(p) + unknown_tokens(p))
        for k, n in seen.items():
            if n > base.get(k, 0): new.append((k, n - base.get(k, 0)))
    return new

def main(argv):
    if '--baseline' in argv:
        c = collections.Counter(key(p, f) for p in live_css() for f in scan(p) + unknown_tokens(p))
        BASELINE.write_text(json.dumps(dict(sorted(c.items())), indent=1)); print(f'baseline: {sum(c.values())} values'); return 0
    if '--hook' in argv:
        try: call = json.load(sys.stdin)
        except Exception: return 0
        fp = (call.get('tool_input') or {}).get('file_path', '')
        try: rel = str(Path(fp).resolve().relative_to(ROOT))
        except ValueError: return 0
        if not rel.endswith('.css') or rel in SUBSYSTEMS: return 0
        new = check([rel])
        if new:
            print('Off-system styles (see DESIGN-SYSTEM.md). Use the tokens in css/base.css:', file=sys.stderr)
            for k, n in new[:25]: print(f'  {k}' + (f'  ×{n}' if n > 1 else ''), file=sys.stderr)
            return 2
        return 0
    paths = [a for a in argv if not a.startswith('--')] or live_css()
    new = check(paths, show_all='--all' in argv)
    for k, n in new: print(k + (f'  ×{n}' if n > 1 else ''))
    print(f'{sum(n for _, n in new)} off-system value(s)' + ('' if '--all' in argv else ' not in the baseline'))
    return 1 if new else 0

if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
