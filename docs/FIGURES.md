# Figures: how to build and change them

Read this before you make or edit any figure on a case-study page. It covers what Sooim means by each kind of figure and the exact components to use. It also covers how to regenerate the generated figures. Colors, type and spacing come from `DESIGN-SYSTEM.md`.

## The ground rules

1. **Every diagram is a `.fig`.** It's a 16:9 container (1920×1080 design canvas) with the *standard figure background*. That's the light grey `--fig-bg` with the dot grid in `--fig-dot`, and `--r-lg` corners. `.fig` in `css/figures.css` already applies all of this. Never draw your own background.
2. **Sizes inside a figure are in `cqw`.** 1cqw = 1% of the figure width, so 1920px of design = 100cqw and **px ÷ 19.2 = cqw**. The figure then scales like an image. Don't use px or page type tokens inside a figure.
3. **Build figures in HTML/CSS from the shared components below, not as images or hand-drawn SVG.** The old figures drawn as inline `<svg>` with `<rect>`/`<text>` and purple "AI" boxes are the retired style. Replace them; don't copy them.
4. **Exception:** when Sooim supplies a finished image for a figure (e.g. `yap-assets/build/yap-build-design.png`), insert that image instead of rebuilding it. To keep the dotted background behind it, use `<figure class="nt-media yap-board yap-board--inset"><img …></figure>`.
5. **Restrained, cool, minimal copy.** White cards, cool greys, `--ink` for emphasis. One project accent at most, passed in as `--accent`. Figures communicate visually, with short labels and no paragraphs. No purple, no glowing badges, and no new visual language per project.
6. **Real visuals beat shapes.** Use original screens in device frames, logos and product photos rather than generic placeholders, and give them room.
7. **Claims stay factual.** If something is proposed, not built or measured, the figure says so (e.g. a zone labelled "Proposed", or a one-line note).

## Component catalogue (all in `css/figures.css`)

### Node graph: "like the System Architecture figure in Acuity"
Cards (`.node`) joined by curved connectors with small open circles at each end. Use it for systems, pipelines and architectures.

- **Live examples:** Acuity › Build › "System architecture" and Forage › System Design.
- **Don't hand-edit coordinates; generate it.** Edit the spec in a script and run it from the repo root:
  - `python3 scripts/figures/acuity_architecture.py`
  - `python3 scripts/figures/forage_system_design.py`
  - New figure: copy one of these, change the spec and the `marker` (the start of the figure's `aria-label`), and run it. The engine is `scripts/figures/ngraph.py`, and its docstring documents the spec.
- **Anatomy:**
  - Caps **column labels** at the top (`01 · Input`, `02 · Processing` …).
  - **Nodes** with a title (`.node__h`), an optional dark **`AI` pill tag**, and rows (`.node__row`: bold label left, muted detail right). Status rows can use dots (`dot y/p/n`).
  - **Connectors:** curves run from a node's right port to the next node's left port. A straight vertical line joins stacked nodes in the same column.
  - **Zone:** an optional dashed **`.ngraph__zone`** wraps the AI columns, with a small `AI` pill label inside at the bottom ("Where AI contributes", "Proposed").
  - **Note:** optional one-line small print (e.g. "Nothing happens without you.").
- **Layering:** connectors and their circle ends sit **on top of** the cards (`.ngraph__wires { z-index: 1 }`).
- **Geometry defaults:** node width 360–380 canvas px, header 52, row 46. The graph is roughly vertically centred in 1080, and nothing touches the figure edge.
- **Accent:** the AI pills and zone tint use `--accent` (Acuity periwinkle `#7F9BC9`); without an accent they're `--ink`.

### Card board: "cards like Instagram / the AI tools figure"
`.fig.board` > `.board__row` (`--cols`) > `.board__card` > `.board__title` (+ `<small>`) and `.board__body`. These are white cards with a `--surface-2` title bar, 1px `--line` border and **no shadow**. **Card titles are uppercase caps labels.** Use it for side-by-side comparisons, tool stacks and research boards. Example: Acuity's "Four AI tools" board (`.ac-aistack`) and research landscape board.

### Positioning map + comparison chart: "the landscape figure"
- `.pmap`: two axes, uppercase axis labels, points. The concept point is `.pmap__pt.hi`, an ink pill. Points can use brand logos instead of dots.
- `.cmp` (`--n` columns): rows of yes/partly/no dots (`.dot.y/.p/.n`). The last column is the concept, highlighted with `.cmp__hi`, a flat `--surface-2` panel with no shadow, the same as Smart Bundles. Set `grid-row: 1 / <rows+1>` inline so it spans every row. Competitor headers are muted; the concept header (`.cmp__h.hi`) is ink, medium weight.
- Example: Acuity › Research landscape (both in one board).

### Annotated screen: "callouts"
`.fig.anno` with callout `.card`s (`.c-lab` caps label + `.c-txt`), `.dot`s on the screen and a dashed `svg.conn` leader line from card to dot. Add `data-reveal` so the lines draw in on scroll. Examples: Forage ring hardware, Notate, Instagram.

### Text card inside a figure
`.card` with `.c-lab` (label), `.c-txt` (text) or `.c-big` (big number). Positioned with `.abs` + inline `left/top`. Example: the Acuity interview cards (`.ac-int`, with round illustrated icons).

### Media figures
- **Solution phone:** `.yap-card.yap-step` with the real device frame (`.sb-iphone` = iPhone 16 Pro). Follow the Yap component's aspect ratio and responsive layout.
- **Laptop deliverables (Forage):** `.fg-lap` with a laptop PNG frame and the screen inside `.fg-lap__scr`. No shadow or fill around the block. Under it is a dark pill link button (`.fg-btn`).
- **Videos:** keep their original proportions. `js/case.js` injects the *glass playback controls* (pause/replay); add `data-no-controls` to a figure to hide them. Transparent motion uses `.webm` (VP9 with alpha) converted from `.mov`.
- **Gallery rows that share one height:** `figure.cs-gallery[data-fit-row]` with `.cs-cell`s (`case.js` sets each cell's `--ar` from the media).
- **Carousel:** `.sb-deck-wrap` / `.nk-deck-wrap`.
- **Screen rail ("all the screens in one row", Yap › Assembled screens, Neuk › High fidelity):** `figure.nt-media.yap-rail.screen-rail[data-yap-rail]` > `.yap-rail__track` > `.yap-rail__inner` > one `.screen-rail__item` per screen, which holds an `<img>` (one 402×874 screen per file, no baked labels) and `<div class="screen-rail__label"><span>01</span>LOG IN</div>` (caps label: `--fs-xs`, medium, `--label-ls`; no group pills). Keep the glass prev/next buttons from the existing markup. The CSS lives in `css/yap-case.css`; don't restyle it per page. Never bake labels or the background into one long image.

## Checklist after editing a figure

1. `python3 scripts/check-tokens.py` → must report `0 off-system value(s)`.
2. If you changed a CSS or JS file, bump its `?v=` query in every page that links it (e.g. `figures.css?v=ds4-ts2-a3` → `-a4`) so browsers reload it.
3. Look at it: serve the repo (`python3 -m http.server 5500`) and screenshot the figure at 1440px wide. Check text wrapping, overlaps, edge spacing and that connector circles show in full.
4. Don't delete the old image or asset files a figure used without asking Sooim.
5. Re-export the PNG copies: `node scripts/figures/export-pngs.mjs` (with the local server running) writes every code-built figure to `<project>-assets/<section>/figures/` at 2x.
