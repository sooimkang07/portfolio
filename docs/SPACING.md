# Parent-owned narrative spacing

Project pages use four spacing tokens defined in `css/base.css`:

| Parent | Layout | Token | Gap |
|---|---|---|---|
| `.nt-chapters` | Flex column of hero and full chapters | `--space-3` | 6rem |
| `.nt-section` | Flex column of subsections | `--space-2` | 3rem at every width |
| `.nt-subsection` | Flex column of related content | `--space-1` | 1rem |
| Compact related groups | Meta label/value, caption text, compact media cells | `--space-0` | .5rem at every width |
| `.case-figure-group` | Figure title and its visual | `--space-1` | 1rem |

`--space-1` is 1rem, `--space-2` is 3rem, and `--space-3` is 6rem. The compact token `--space-0` is .5rem at every width. Subsections use `--space-2` separation at every width. All lengths scale with the reader’s root font size.

## Ownership

Parents own `gap`. Their direct children have zero block margins. Chapters have zero block padding, so chapter padding and sibling margins cannot add to the parent gap. Main has no bottom padding.

Every direct content group in a chapter is an explicit `section.nt-subsection`. A chapter’s introduction and its supporting visual form one subsection; later titled groups form separate subsections. Chapter IDs, headings and table-of-contents anchors remain in place.

A genuine split layout or interactive component may need an inner `.nt-content` container. This container uses the smallest gap by default; established component classes retain their responsive grid layout. These layout containers do not add a fourth spacing level. Figures and device internals retain their component geometry.

Text-only headers use `--space-1`; captions use `--space-0` and have no child block margins. Separate media/caption cards use the middle gap when stacked; consecutive views of one idea use the smallest.

Do not add individual narrative margins, chapter-end padding, page-specific spacing patches, or `!important`. Fix the grouping or the parent gap instead. Shared layout lives in `css/case.css`.

## Component scale

The older `--s-1` through `--s-11` (excluding retired `--s-3`) scale is still used by navigation, controls, component padding, gutters and device/layout geometry. Those are separate from narrative spacing; do not delete or globally renumber them. New narrative code uses the four `--space-*` tokens. `--s-3` has been retired; all former .75rem references use `--space-0` directly. No alias maps those tokens back to the component scale.

Home and About retain their established page layouts. This hierarchy is the reference for future narrative layouts, rather than a blanket change to every control and mock product UI.

## Remaining component tokens

These remain fixed; doubling the narrative tokens does not change them.

| Token | Value | Remaining purpose |
|---|---|---|
| `--s-1` | .25rem | Small icon/control gaps and animation geometry |
| `--s-2` | .5rem | Compact control padding and mock-interface details |
| `--s-4` | 1rem | Buttons, card padding and compact layout insets |
| `--s-5` | 1.25rem | Component/control padding and layout dimensions |
| `--s-6` | 1.5rem | Component padding, split layouts and About slideshow |
| `--s-7` | 2rem | Larger component padding and Home/About layout |
| `--s-8` | 2.5rem | Component padding and Home/About layout |
| `--s-9` | 3rem | Larger component grids, padding and Home/About layout |
| `--s-10` | 4rem | Large page/layout padding and Home/About calculations |
| `--s-11` | 6rem | Large Home/About padding and related calculations |

Project covers share a `.case-cover-group` with the compact `--space-0` gap. `.nt-main` uses `--space-1` between that group and the story below 1200px, and `--space-2` at desktop widths (1200px and above). Below 1200px, `.nt-story` also owns a `--space-1` gap between the TOC and the H1. Tab panels, media labels, and note groups also use parent gaps instead of attachment margins.

Remaining nonzero block margins belong to diagram/mock-interface geometry, animation keyframes, navigation placement, or auto/negative positioning. They are not content-flow spacing. Shared zero-margin resets remain intentional.

Project-specific groups: Neuk room images use `--space-0` below 760px and `--space-1` from 760px. Acuity research and core-experience media grids use `calc(var(--space-1) * 2)` below 760px and `--space-1` from 760px. Forage and Yap Build chapters use `--space-2`; other Build chapters retain `--space-1`.

Text/media pairs use `.nt-content.case-split`: one column below 760px, then the shared 2fr/3fr columns with `--space-2` between them. `.case-subsection-stack` groups related subsections with `calc(var(--space-1) * 2)`. `.case-media-row` stacks below 760px and becomes a horizontal flex row from 760px, with `--space-0` throughout.

Selected multi-media groups (launch, testing, reflection, onboarding, capture, and wearable pairs) keep their compact mobile gaps and use `--space-1` from 760px. Figure/caption text still uses its own compact gap.
