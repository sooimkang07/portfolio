# Portfolio code and file cleanup

## Live code map

The main portfolio has **21 linked stylesheets**, consolidating the original 23 and extracting the password page’s embedded stylesheet. There is no main `style.css`: `css/site.css` owns the shared chrome and home layout.

| Owner | Responsibility |
|---|---|
| `css/base.css` | The token definitions, reset and shared heading scale |
| `css/glass.css` | Glass material and effects |
| `css/site.css` | Navigation, home work presentation, footer and shared interactions |
| `css/intro.css` | Greeting, loader and intro motion |
| `css/work-index.css` | Work index and home index components |
| `css/case.css` | Project frame, type, shared flow, metadata, captions, TOC and controls |
| `css/media.css` | Media grids and galleries; replaces `draft-extras.css` and `case-gallery.css` |
| `css/figures.css` | Proportional figure canvases and diagram primitives |
| `css/<page>.css` | Actual page-specific components and geometry |
| `css/password.css` | Semantic password-gate styles, extracted from the HTML |
| `css/morph.css` | Shared card-to-project transition |
| `css/text-sooim.css` | Retained chat subsystem |

The old `notate-figures.css` labels are merged into `case.css` at the same position in the cascade. The empty `case-glance.css` is archived. Stylesheet order is preserved when consolidating helpers; native nesting does not require a runtime compiler or a build step.

## Authoring rules

- Use semantic `section`/`header` and `figure`/`figcaption` for narrative content. Keep real layout, clipping, device and interaction containers. Do not rename every div to a meaningless section or remove a class used by behavior.
- Nest component descendants and states. Keep cross-component selectors separate when nesting them would change specificity.
- Use `inline-size`/`block-size`, logical insets, logical borders and logical margin/padding. Project narrative parents own flex gaps at three levels: chapters, sections and explicit subsections. Their children have zero block margins; inner media grids keep their own gaps. Do not stack margin and gap systems. See SPACING.md.
- Reuse the scale in `base.css`. The scale is now in `rem`; its standard-root equivalents remain 4/8/12/16/20/24/32/40/48/64/96px. Figure internals retain `cqw`.
- Keep viewport-query thresholds in px. CSS declaration lengths use relative units; SVG coordinates and intrinsic HTML media dimensions are presentation/coordinate data, not CSS dimensions. Print page geometry retains print units. Exact device ratios, filters, color effects, keyframes and animation timings are not rounded arbitrarily.
- Prefer mobile defaults, then enhance at the six canonical thresholds in `data/breakpoints.json`. See [BREAKPOINTS.md](BREAKPOINTS.md) for the current system and the old-to-new mapping. CSS and JavaScript are validated together; do not invent a nearby breakpoint for an exception.
- Combine adjacent matching selectors/queries only when cascade order is preserved. Do not gather every matching query at the bottom of a file, since that can change precedence.
- Do not use `!important` for shared narrative spacing. Existing visual and external-embed exceptions remain documented by their component. Never override reduced-motion or accessibility preferences for aesthetics.
- Use multiline HTML/CSS. `.prettierrc.json` and `.editorconfig` define the formatting conventions.

Precise measured animation coordinates in JavaScript remain in DOM pixel coordinates. JavaScript style dimensions/insets updated in this cleanup use logical property names. Carousel inset measurement now reads the resolved `scroll-padding-inline-start`, so changing the spacing tokens to rem does not break its arithmetic.

The token baseline has **not** been changed. The checker recognizes equivalent rem/px values and physical/logical property names when comparing existing exceptions; new measurements and new token violations still fail.

## Archived files

See [FILE-AUDIT.md](FILE-AUDIT.md) for the per-file list and [FILE-AUDIT.json](FILE-AUDIT.json) for the exact restoration manifest. No files were deleted. The archive is organized as `unused/<page>/<original-path>`; `home` contains previous showreel renders and reel-specific material, while `shared` contains site-wide history.

Retained intentionally:

- Current film source, media, current master and render tools.
- Named downloadable figure exports and their generators.
- Dynamic or uncertain assets rather than guessing that they are unused.
- Independently runnable demos/services and the optional chat subsystem.

Old handoffs, prior renders, old v2/legacy implementations, whole-page rewrite scripts, previous section `unused` folders, old QA captures and old dotted-background/mobile-polish figure previews are archived. Empty original folder trees are preserved under `unused/shared/empty-originals/`. The completed one-time migration scripts are archived too; only reusable maintenance helpers remain active. Previously ignored production history keeps the repository’s existing ignore policy. Local verification captures/source snapshots are ignored; they remain on disk.

Restore one file with its original path:

```sh
python3 scripts/maintenance/restore-files.py assets/forage/core-experience/laptop-silver.png
```

The restore tool refuses to overwrite an existing file. `--all` restores the entire manifest if needed.

## Checks

Maintenance tooling is separate from the published site; it adds no frontend runtime dependency.

```sh
npm ci --prefix scripts/maintenance
python3 scripts/check-tokens.py
node scripts/maintenance/check-source.cjs
node scripts/maintenance/check-site.cjs check
node scripts/maintenance/check-interactions.cjs
```

Browser checks use the existing `_docs/tools` Puppeteer installation and local Chrome. `CHROME` can select another installed Chromium executable. The retained standalone demo styles and film-production code have their own rendering geometry; this cleanup preserves them rather than applying the portfolio’s page-layout rules to those products.

Source checks cover logical dimensions, relative CSS lengths, HTML copy and media references. Browser checks cover all 12 main live pages at 390/768/1440px and a separate 320px narrow-phone pass, local resources, JavaScript errors, horizontal overflow, navigation, muted looping showreel, opening/closing its player, scroll expansion, carousel inset and demo entry routes. Responsive screenshots and measurements are retained locally in `unused/shared/verification/`. Animation phases and third-party embeds can differ between captures; static layout comparisons are interpreted with those limits.

The narrow-phone pass also corrected the password gate’s implicit grid minimum, which overflowed at 320px. Its submit flow and validation remain unchanged.

Additional interaction checks verify the password error flow at 320/390/1440px and representative pages at 125% root text size with reduced motion.

The breakpoint follow-up consolidated 22 viewport values into six and passed 144 page/boundary checks. The Acuity diagram’s independent container query is documented separately in BREAKPOINTS.md.
