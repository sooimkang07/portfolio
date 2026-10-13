# Design system

One token set styles every page. The tokens live in the `:root` block at the top of `css/base.css`. That block is the only place raw colors, shadows, radii, type sizes and spacing values are defined.

**Rule for every edit, by people or AI agents:** use these tokens, by these exact names. Older names (`--clr-*`, `--c-*`, `--nt-*`, `--shadow-1/2/3`, `--sp-sm`, `--fs-sm` and so on) were retired; the check flags any reference to a token that doesn't exist. Don't write raw hex greys, shadows, radii, font sizes, line heights, letter spacing, font weights or margin/padding/gap px values in CSS. If nothing fits, ask before adding a token; don't invent a one-off.

`scripts/check-tokens.py` enforces this. In Claude Code it runs automatically after every CSS edit (`.claude/settings.json`) and reports anything off-system. Run it yourself with:

```
python3 scripts/check-tokens.py          # new off-system values (exit 1 if any)
python3 scripts/check-tokens.py --all    # everything off-system, including the known exceptions below
```

## Color: 8 neutrals

| Token | Value | Use |
|---|---|---|
| `--bg` | `#FAFCFD` | Page background |
| `--surface` | `#FFFFFF` | Cards, panels; text on dark fills |
| `--surface-2` | `#F7F8FA` | Card title bars, subtle fills |
| `--fig-bg` | `#EFF1F3` | Figure and media backgrounds |
| `--line` | `#E6E8EB` | Structure: borders, rules, dividers, table rows |
| `--line-strong` | `#A2A6AA` | Figure marks: axes, connectors, arrows, quote rules, placeholder shapes; light text on dark fills |
| `--muted` | `#626B76` | Body copy, labels, TOC links, meta, captions |
| `--ink` | `#1C1F24` | Headings, emphasis, nav and logo, current TOC item, figure ink, dark fills (selected cards, buttons) |
| `--fig-dot` | `#D6D9DC` | The figure dot grid and placeholder fills inside figures |

**Text uses exactly two colors:** `--ink` for headings, emphasis, the nav and logo, and `--muted` for everything else (body copy, labels, inactive nav links, TOC links, meta).

Every neutral is cool-toned (blue ≥ red), apart from pure white.

**Accent colors** (brand chips, project accents like Smart Bundles green `#06886C` / `#1F5A4B` or Neuk `#181716`) belong to a project. Set them once on that page's selector, not scattered through rules.

**Standard figure background:** `background: var(--fig-bg) radial-gradient(var(--fig-dot) .6px, transparent .9px) 0 0 / 10px 10px;` (`.fig` in `css/figures.css` already applies it).

## Lines

| Token | Value |
|---|---|
| `--line` | 1px solid `#E6E8EB`: every border and rule |
| `--line-strong` + `--line-strong-w` | 1.5px `#A2A6AA`: axes, connectors, quote rules |
| `--dash` | `5 4`: the only dash pattern (SVG `stroke-dasharray`) |

## Elevation: 2 levels

| Token | Use |
|---|---|
| `--shadow-raise` | Cards, chips, tiles, swatches |
| `--shadow-float` | Devices, floating media, dark terminals |

A 1px ring (`box-shadow: 0 0 0 1px var(--line)`) is a line, not elevation. Card boards (`.ig-cards`, `.sb-cards`, `.fg-cards`) use a 1px `--line` border and no shadow.

## Radius

| Token | Value | Use |
|---|---|---|
| `--r-sm` | 4px | Tags, thumbnails, small controls |
| `--r-md` | 6px | Inner media, small cards |
| `--r-lg` | 10px | Figures, feature media, panels |
| `--r-pill` | 999px | Pills; use `50%` for circles |
| `--fig-r-sm` | .3cqw | Small elements inside a `.fig` |
| `--fig-r` | .6cqw | Cards inside a `.fig`; scale it inside smaller containers: `calc(var(--fig-r) * 3)` |

## Type

| Token | Size | Use |
|---|---|---|
| `--fs-xs` | 11 → 12px | Caps labels, captions, meta, small UI |
| `--fs-base` | 14 → 15px | Body copy |
| `--fs-md` | 16 → 19px | H3, lead |
| `--fs-lg` | 22 → 27px | Subheads, large statements |
| `--h2-fs` | 24 → 30px | H2, "Opportunity" questions |
| `--h1-fs` | 30 → 42px | H1, display |

- **Line height:** `--lh-none` 1 (icons, numbers), `--lh-tight` 1.2 (headings, UI), `--lh-snug` 1.4 (small text, labels), `--lh-base` 1.55 (body). `--h1-lh` 1.1 is for H1 only.
- **Weight:** `--fw-regular` 400, `--fw-medium` 500, `--fw-semi` 600.
- **Tracking:** `--label-ls` .06em is the only positive tracking (caps labels). `--h2-ls` (−.025em) and `--h1-ls` (−.035em) are for large type.
- **Caps label:** `--fs-xs`, `--fw-medium`, `--label-ls`, `--lh-snug`, uppercase. It's the only uppercase style.
- **Families:** `--ff` (Instrument Sans) and `--ff-mono` (code and terminal).

Inside a `.fig`, sizes are in `cqw` so they scale with the figure. That's intended: figure-internal text doesn't use the page scale.

## Spacing: 4px scale

`--s-1` 4 · `--s-2` 8 · `--s-3` 12 · `--s-4` 16 · `--s-5` 20 · `--s-6` 24 · `--s-7` 32 · `--s-8` 40 · `--s-9` 48 · `--s-10` 64 · `--s-11` 96

Case-study rhythm (in `css/case.css`): `--sp-section` (section gap), `--sp-block` (48px between blocks), `--sp-media` (32px, text → media), `--gap-media` (12px between media). Use those for page layout, and `--s-*` everywhere else. Negative margins: `calc(var(--s-3) * -1)`.

## Motion and layout

`--ease` (default), `--ease-inout` (nav and page-level moves), `--ease-spring`; `--dur-1` 150ms (color, opacity), `--dur-2` 250ms, `--dur-3` 420ms (media), `--dur-4` 900ms (nav, page-level); `--zoom` 1.03 (media hover). Layout: `--nav-h`, `--gutter`.

## Components to reuse

Shared figure components live in `css/figures.css` (sizes in `cqw`, so a figure scales like an image):

- **Card board:** `.fig.board` > `.board__row` (`--cols`) > `.board__card` > `.board__title` (+ `<small>` subtitle) and `.board__body`. Dotted figure background, white cards, `--surface-2` title bar, 1px `--line` border. Older page-specific copies: `.ig-cards`, `.sb-cards`, `.fg-cards`.
- **Positioning map:** `.pmap` with `.pmap__ax.x/.y`, `.pmap__lab.t/.b/.l/.r` and `.pmap__pt` (`.hi` for the concept).
- **Comparison chart:** `.cmp` (`--n` columns) with `.cmp__h`, `.cmp__r`, `.cmp__c` and `.dot.y/.p/.n`; the last column is the highlighted concept (`.cmp__hi`).
- **Node graph:** `.node` cards (`.node__h`, `.node__row`, `<em>AI</em>` tag) joined by `svg.ngraph__wires` (viewBox 1920×1080), optional `.ngraph__zone` and `.ngraph__col` labels. Generate it with `scripts/figures/` (see `docs/FIGURES.md`); connectors sit on top of the cards.
- **Text card inside a figure:** `.card` with `.c-lab` (label) and `.c-txt` / `.c-big`.
- A project's accent can be passed in with `--accent` (Acuity sets it to its periwinkle).
- Add `data-no-controls` to a figure to show its videos without the glass buttons.
- **Solution phone:** `.yap-card.yap-step` with the device frame (`.sb-iphone` for the iPhone 16 Pro frame).
- **Carousel frame:** `.sb-deck-wrap` / `.nk-deck-wrap`. The page sets the background color; `--carousel-inset` keeps the first and last cards one gap from the edges (`js/card-carousel.js`).
- **Screen rail:** `.yap-rail.screen-rail` with `.screen-rail__item` (screen image + `.screen-rail__label`); the same on Yap and Neuk.
- **Prompt window:** `.yap-term` (collapsible, `js/yap-term.js`).
- **Reflection:** `.yap-takeaways`.

## Known exceptions (outside the system on purpose)

These are recorded in `scripts/token-baseline.json` so the check ignores them:

- **Self-contained subsystems with their own tokens:** `css/glass.css` (glass material) and `css/text-sooim.css` (the chat widget).
- **Mock UI that imitates a real product:** dark terminal colors in `.yap-term`, iOS greys, phone and laptop frames (including the warm Desert Titanium iPhone), the About page map widget's label grey (Apple Maps), tiny 7–10px text inside UI mocks, `1.2em` chat bubbles and `cqh` sizes in the Yap mocks.
- **Pure black:** video letterboxes and CSS masks.
- **Dark project surfaces:** Neuk `#181716`, device blacks, dark figure panels (`.fig.dark` and its greys).
- **Display type:** the Neuk brand specimens (50–128px) and the Forage 40px specimen, plus Helvetica Light (300) in the Forage type card and the site's light display weight.
- **Device geometry:** elliptical radii on phone screens and the 40px/44px rounded photo and phone images on Neuk.
- **Image cut-out shadows:** `filter: drop-shadow(...)` on transparent PNG devices. `box-shadow` tokens can't be used in `filter`.

Not yet tokenized (follow-ups): about 430 inline `style=""` attributes in the HTML (mostly figure positioning, plus some colors), chromatic accent hex values in page CSS, and `font:` shorthands in a few components.
