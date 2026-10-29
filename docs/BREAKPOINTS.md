# Responsive breakpoint system

`data/breakpoints.json` is the shared viewport inventory. Native CSS and JavaScript use explicit queries, checked against that inventory by `scripts/maintenance/check-breakpoints.cjs`. There is no added runtime dependency or CSS build step.

| Name | Threshold | When to use it |
|---|---:|---|
| `compact` | 480px | Small About controls and recent-activity/widget arrangements |
| `phone` | 600px | Compact media/diagram arrangements, small browser chrome, mobile glass radii, full-window chat panel |
| `tablet` | 760px | Main navigation, mobile/desktop spacing roles, greeting layout, footer, captions, page gutters and dot density |
| `split` | 960px | Copy/media columns, wider work-card layouts, desktop pointer interactions and intermediate page margins |
| `desktop` | 1200px | Sticky home fliptrack and project sidebar TOC |
| `wide` | 1360px | About’s two-column editorial hero, where text and the reel need extra content width |

These names describe layout roles, not particular devices. A layout can use a subset of the six; it does not need a rule at every threshold. Use a parent’s fluid layout or an existing threshold rather than inventing a nearby value.

## Exact boundary convention

The narrow range is exclusive; the enhancement starts at the exact threshold:

```css
.component {
  /* Mobile/default arrangement. */

  @media (width >= 760px) {
    /* Wider arrangement. */
  }
}
```

When a narrow-only rule is needed, use `(width < 760px)`. JavaScript uses the identical query strings in `matchMedia`. Do not reintroduce 759/767/770 variants, `max-width`, or an extra one-pixel adjustment. Hover, pointer and reduced-motion conditions remain independent feature queries.

## Consolidation map

| Previous viewport values | Shared threshold |
|---|---:|
| 480 | 480 |
| 520, 559, 560, 600, 601 | 600 |
| 640, 700, 701, 759, 760, 767, 770 | 760 |
| 900, 959, 960, 991, 1000 | 960 |
| 1199, 1200 | 1200 |
| 1359, 1360 | 1360 |

This reduces 22 distinct viewport thresholds to six. Values between the old and new cutoffs intentionally inherit one coherent layout/spacing mode rather than a mixture. CSS queries, JavaScript mode switches and the project-cover transition’s width check were updated together. Existing rule order and specificity are preserved.

## Viewport versus a figure’s content width

The Acuity timeline retains one existing `acjourney` container-size query at 700px for its internal figure typography. It measures the diagram’s available column width, not the viewport, and does not control page spacing or layout modes. It is kept separate to preserve the current artwork. Standard dotted backgrounds continue to use the shared **760px viewport** threshold and never scale with an individual figure’s dimensions.

## Verification

```sh
node scripts/maintenance/check-breakpoints.cjs
node scripts/maintenance/check-responsive.cjs
python3 scripts/check-tokens.py
```

The boundary check resizes all 12 live pages immediately below and at all six thresholds: **144 combinations**. It checks overflow, project cover offsets, spacing roles, metadata columns, TOC mode, the home index and About hero columns. It also records local-resource and JavaScript errors. Screenshots/results are retained under `unused/shared/verification/breakpoints/`.
