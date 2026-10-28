# Spacing reference

This is the current spacing reference for the portfolio. Numeric tokens live in `css/base.css`; project-page relationships live in `css/case.css`. This document describes the live implementation after the spacing cleanup, rather than an alternative proposal.

## 1. The complete shared scale

| Variable | Value | Typical use |
|---|---:|---|
| `--s-1` | 4px | Tiny control/icon separation |
| `--s-2` | 8px | Desktop caption title → body; compact controls; mobile horizontal media gaps |
| `--s-3` | 12px | Related paragraphs, label → heading, heading → description, desktop media → caption, consecutive views of one idea |
| `--s-4` | 16px | Compact container padding |
| `--s-5` | 20px | Component padding and metadata grid gaps |
| `--s-6` | 24px | Desktop/tablet explanation → figure; component padding |
| `--s-7` | 32px | Mobile media → caption; hero metadata top margin |
| `--s-8` | 40px | Mobile subsection/card breaks; larger component padding |
| `--s-9` | 48px | Desktop/tablet subsection breaks |
| `--s-10` | 64px | Large layout padding; desktop home-intro top padding |
| `--s-11` | 96px | Large page padding; base of chapter-spacing calculations |

Typical uses are guidance, not a rule that every 24px value has one meaning. Choose a value by its relationship/context, not by matching a number in an old stylesheet. Use `0` for intentionally absent spacing; do not create a zero token. Existing larger spacing is expressed with `calc()` and the scale, such as `calc(var(--s-11) * 3)` = 288px.

## 2. Responsive project roles retained intentionally

These names are useful because they express a relationship with different values at different widths. They are not retired aliases.

| Variable | At ≤700px | Above 700px | Use |
|---|---:|---:|---|
| `--sp-media` | `--s-6` / 24px | `--s-6` / 24px | Explanation → its visual; copy/media split-grid gap |
| `--gap-media` | `--s-2` / 8px | `--s-3` / 12px | Horizontal neighbors in a media row, carousel cards |
| `--sp-section` | `calc(--s-11 + --s-6)` / 120px | `clamp(96px, 9vw, 128px)` | Full chapter breaks, hero → first chapter, end of case content |

The 128px section maximum is expressed as `calc(var(--s-11) + var(--s-7))`. These three roles are defined on `body.case-page`, so project components should not include fallback values that disagree with their definitions.

## 3. Project-page relationship rules

| Relationship | ≤700px | Above 700px | Implementation / context |
|---|---:|---:|---|
| Kicker/step label → its heading | 12px | 12px | Inside `.nt-reading`, `.dx-step`, etc. A label never creates a subsection break. |
| Heading → its body copy | 12px | 12px | Same reading group |
| Paragraph → related paragraph/list | 12px | 12px | Same reading group |
| Explanation → figure/media group | 24px | 24px | `--sp-media` |
| Figure → another view of the same idea | 12px | 12px | Consecutive figures and `.case-media-group` wrappers |
| Media → its caption title/wrapper | 32px | 12px | Direct captions and `.yap-call`, `.yap-calls`, `.case-caption` wrappers |
| Caption title → caption body | 12px | 8px | `.media-caption__title + .media-caption__body` |
| Completed group → next subsection | 40px | 48px | `--s-8` / `--s-9`; steps, decisions, separate reading groups, standalone figure subheadings |
| Separate media-and-caption cards stacked vertically | 40px | Layout-specific | Keep each caption attached to its own media; separate the complete cards. Desktop cards commonly share a row. |
| Whole chapter → next chapter | 120px | 96–128px | `--sp-section` via section-end padding |
| Hero visual → metadata | 32px | 32px | `.nt-meta`, always `--s-7` |

### Spacing ownership

- Ordinary block flow: the **following element** owns `margin-block-start`; related block-end margins are zero.
- Grid/flex flow: the **parent** owns `gap`; child margins are cleared. Never add a 24px child margin on top of a 24px grid gap.
- Captions wrapped together: put the responsive caption gap on the wrapper and keep its first heading's start margin zero.
- Full chapters: keep the existing section-end padding; the final chapter has none. This is separate from content margins.
- The first child of a group has no extra leading gap.
- `.case-media-group` marks a wrapper that is media, not a new text subsection. The wrapper follows the same text→media and media→media rules as a figure.
- `.case-caption` marks explanatory copy attached to a visual, including Instagram's before/after cards; it does not receive a new-subsection gap just because it contains a heading.
- Forage solution cards and Neuk room cards intentionally keep their image row together on phones and group captions below it: 32px before the first caption, 12px title→body, 40px between subsequent caption groups on phones.

### Layout breakpoints are different from rhythm breakpoints

The page-flow values above switch at **700px**. A component can stack at another width without inventing a new spacing scale: shared copy/media splits switch at 960px; the sticky home index starts at 1200px; several legacy media pairs switch at 600px or 760px. Use the resolved spacing tokens for that viewport, even when a component's column count changes elsewhere. Figure internals retain their own responsive canvas layout.

## 4. Site gutters and placement variables

These affect layout placement; they are not interchangeable paragraph/figure gaps.

| Variable | Definition | Scope / use |
|---|---|---|
| `--gutter` | `clamp(1rem, 2.5vw, 1.5rem)` = 16–24px at the standard root size | Global inline page margin and nav edges |
| `--nav-h` | `3.25rem` = 52px | Shared nav-height reference |
| `--case-top` | `calc(var(--nav-h) + var(--s-4))` = 68px on phones; `calc(var(--nav-h) + var(--s-6))` = 76px otherwise | Project cover offset |
| `--case-m` | 22.207vw normally; 18.333vw at ≤991px; `--gutter` at ≤767px | Computes the centered case content width; not the global inline gutter |
| `--col` | Initially 760px, then `calc(100vw - 2 * var(--case-m))` | Case content width, not a spacing token |
| `--rail-w` | 150px | Case TOC width, not a content gap |
| `--carousel-inset` | `--s-3` / 12px on Smart Bundles; otherwise JS defaults to 0 | First/last carousel-card edge inset, read by `js/card-carousel.js` |
| `--yap-demo-inset` | JS sets 8.89% of the demo stage height; fallback 0 | Aligns the Yap demo CTA to the product stage; not a page-flow gap |

Home has some deliberate layout calculations rather than new spacing variables: the intro uses 64px top / 288px bottom padding (48px top on phones), and the desktop work video stage is offset by half a viewport. The copy index has no negative start margin, so it does not consume the intro's bottom space.

## 5. About and self-contained components

These are page/component-local controls, not old names for the shared scale. They were retained to avoid silently redesigning About or product mocks.

| Variable | Current values | Purpose |
|---|---|---|
| `--ab-m` | 22.207vw; 18.333vw at ≤991px; `--gutter` at ≤767px | About column's inline margins |
| `--ab-sec` | `clamp(88px, 9vw, 128px)`; 72px at ≤767px | About-only section breaks; distinct from project chapters |
| `--ab-pair-gap` | 0.784vw | About hero's two-column geometry |
| `--ab-pair-pad` | 2.09vw | About hero copy alignment |
| `--ab-nav` | Measured by `js/about.js`, capped at 120px | About hero/nav offset; fallback values live in its existing component |
| `--sgap` | `--s-6` / 24px; `--s-3` / 12px below 760px | About slideshow gap |
| `--ts-inset` | `--gutter`, with a 24px standalone fallback | Text Sooim widget's page-edge inset |
| `--ts-top` | 62px | Status-bar area inside the widget's desktop phone mock |

Figure/device variables such as phone screen coordinates, laptop `--l`/`--t`/`--w`/`--h`, figure radii, measured heights and column widths are geometry, not page-spacing tokens. Likewise, glass border width and line-height variables do not belong in the spacing scale. Product mocks and the chat widget retain their own internal measurements.

## 6. Removed names and obsolete code

| Removed name / pattern | Replacement |
|---|---|
| `--sp-block` | `--s-3` directly; it was 12px at every width |
| `--case-g` | `--gutter` directly; it was a redundant alias |
| `--pair-gap` | Shared copy/media layout and `--sp-media`; old percentage-based split rules were superseded |
| `--pair-copy-pad` | Removed obsolete split-copy padding; the shared layout owns alignment |
| `var(--sp-media, var(--s-7))` and other conflicting fallbacks | `var(--sp-media)` in project components |
| `var(--gap-media, var(--s-3))` | `var(--gap-media)` in project components |
| `--sc-7` | Not a defined token; use `--s-7` |

Historical captures and QA scripts can mention retired names as records of earlier states. Live CSS must not use them. Existing raw values in legacy component/figure geometry remain subject to the token baseline; this cleanup does not approve new exceptions or reinterpret them as new spacing tokens.
