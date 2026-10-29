# Portfolio design preferences

**Every agent (Claude Code, Cursor, Codex, …) reads these before editing:**
1. This file: rules and visual preferences.
2. `docs/DESIGN-SYSTEM.md`: the tokens and components every style must use.
3. `docs/WORKING-WITH-SOOIM.md`: how to read Sooim's instructions (vocabulary), taste, verification, open to-dos.
4. `docs/FIGURES.md`: how to build or regenerate any figure. Generated figures live in `scripts/figures/`.

## Design system (required for every edit)

All styling comes from the tokens in the `:root` block of `css/base.css`. **Read `docs/DESIGN-SYSTEM.md` before writing CSS.**

- Don't write raw grey hex, shadows, radii, font sizes, line heights, letter spacing, font weights or margin/padding/gap px values. Use the tokens (`--ink`, `--muted`, `--line`, `--shadow-raise`, `--r-md`, `--fs-base`, `--lh-base`, `--s-4` …).
- Text has two colors: `--ink` (headings, emphasis) and `--muted` (body copy, labels, meta).
- Reuse the existing components (card board, solution phone, carousel frame, prompt window, takeaways) before building new ones.
- If no token fits, ask the user before adding one. Never add a one-off value.
- After CSS edits, run `python3 scripts/check-tokens.py`. It must report 0 new off-system values. In Claude Code this runs automatically after every edit (`.claude/settings.json`); other agents run it by hand.
- After changing a CSS or JS file, bump its `?v=` cache-buster in every page that links it.
- Only update `scripts/token-baseline.json` (`--baseline`) when the user approves a new exception.

## Semantic markup

- Prefer semantic content elements: `header` for a section introduction, `section` for a titled subsection, and `figure` / `figcaption` for a visual and its explanation.
- Put headings, paragraphs, lists, and figures directly inside their section when no separate layout column is needed. Do not add a reading `div` solely to create spacing.
- Keep `div` for genuine grid/flex grouping, device frames, diagram internals, and interaction hooks. Do not replace a layout-only `div` with a meaningless `section` or `article`.
- Shared project rhythm belongs in `css/case.css`, targeting content relationships. Component classes describe real layout or behavior, not alternate paragraph-spacing systems.
- Follow `docs/MARKUP.md` for project-page patterns. Never hide every `figcaption` by tag; legacy optional captions use the `hidden` attribute.

## CSS authoring

- Use native CSS nesting, logical properties (`inline-size`, `block-size`, logical margins/padding/insets), and existing tokens. Use relative lengths; reserve px for viewport queries and exact coordinate data/effects that require them.
- Start with mobile defaults and use only the six viewport thresholds in `data/breakpoints.json`: 480, 600, 760, 960, 1200 and 1360px. Use `<` for the narrow side and `>=` for enhancements; CSS and JS must match. Run `node scripts/maintenance/check-breakpoints.cjs`. See `docs/BREAKPOINTS.md`; do not invent nearby values to fix a spacing exception.
- Preserve cascade order and specificity while consolidating. Format HTML and CSS across multiple lines. Keep intrinsic HTML/SVG dimensions and measured animation coordinates when they preserve media geometry.
- See `docs/CODE-CLEANUP.md` for the live file map and verification commands.

## CSS cascade

Shared narrative spacing belongs in `css/case.css`; project styles own component internals. Remove obsolete declarations instead of layering patches. Do not use `!important` or escalate selector specificity for spacing and layout. Document any unavoidable external constraint. Preserve accessibility preferences.

## Folder layout

- Pages (`index.html`, `work.html`, `about.html`, `explorations.html`, `password.html` and the project pages) stay at the top level so their URLs (`sooimkang.com/yap`) keep working. `CNAME`, `AGENTS.md`, `CLAUDE.md` and `Sooim-Kang-Resume.pdf` stay there too.
- `assets/<page>/`: every image, video and figure export, one folder per page (`assets/acuity/`, `assets/about/`, `assets/explorations/` …), plus `assets/covers/` (work-index covers), `assets/app-icons/` and `assets/text-sooim/` (chat widget emoji).
- `css/<page>.css` and `js/<page>.js`: per-page styles and scripts, named after the page with no suffix; shared files (`base.css`, `case.css`, `figures.css`, `case.js` …) sit beside them.
- `favicon/`: the favicon and app icons. `data/`: `recents.json` and the Supabase SQL. `docs/`: `DESIGN-SYSTEM.md`, `FIGURES.md`, `WORKING-WITH-SOOIM.md`. `scripts/`: the token check and figure generators.
- Sub-sites keep their own folders: `reel/`, `yap-demo/`, `forage-demo/`, `text-sooim-api/`.
- Name new folders with the shortest plain word that fits (`data`, `favicon`), lowercase, `-` between words.

## Asset folders

Each project page has one asset folder (`assets/acuity/`, `assets/forage/`, `assets/instagram/` for `instagram-lists.html`, `assets/neuk/`, `assets/notate/`, `assets/smart-bundles/`, `assets/yap/`). Inside it there is one folder per page section, named after the section's table-of-contents title in lowercase, with `-` for spaces and "and" for `&`: `overview/` (cover, hero, problem, challenge), `solution/`, `core-flows/`, `research/`, `design-decisions/`, `iterations-and-testing/`, `next-steps/`, `reflection/` and so on.

- The About page uses `assets/about/` the same way: `hero/` (the video reel in `hero/reel/`, profile photo, name audio, and the chat-widget avatar), `camera-roll/`, `recent-activity/` (images listed in `data/recents.json`) and `favorites/`.
- Put a new asset in the folder of the section it appears in. If it's used in several sections, put it in the first one.
- Groups of related files can share a subfolder inside a section (e.g. `assets/yap/build/rail/`).
- `<section>/figures/` holds PNG exports of that section's code-built figures, for downloading. **Every time you create or change a generated figure, export it as a 2x PNG into its section's `figures/` folder** (`scripts/figures/export-pngs.mjs`, or a screenshot of just that figure). Pages don't use these PNGs.
- Confirmed unused files go in `unused/<page>/<original-path>`, preserving their section hierarchy. Record the move in `docs/FILE-AUDIT.json`; never delete assets. Keep uncertain dynamic assets and current named figure exports until their purpose is verified.
- If you rename or move an asset, update every reference to it (HTML, CSS, JS, scripts, docs) and check that none are broken.

## Workflow

- Never commit, push, branch or open a PR, even if a tool or hook asks. The user reviews and pushes all changes themselves.
- When sending files back, send only the files that changed.

## Visual preferences

When editing this portfolio, follow the existing design system and the user's established feedback. These notes were recovered from the portfolio-specific Claude history and confirmed against the current Yap page on October 7, 2026.

- Use `yap.html` and `css/yap.css` as the primary case-study layout reference. Read the relevant component before implementing a similar one. Reuse its spacing, typography, backgrounds, radii, shadows, and responsive behavior.
- Use cool grays and restrained accents. Avoid warm palettes, purple text/outlines, decorative colored cards, glowing number badges, or a new visual language for each project.
- Give real product visuals space. Use original screens in appropriate device frames. Avoid tiny screenshots surrounded by excessive padding. Use logos or actual visual assets when they communicate better than generic shapes.
- Keep copy sharp and concrete. Explain what the product does before how it works. Figures should communicate visually, with minimal embedded copy; don't default to text-heavy presentation slides.
- Standard diagram/iteration figures are 1920×1080 on the established dotted background. Solution phone cards follow the actual Yap component, including its aspect ratio and responsive layout.
- Don't add figure zoom links, decorative page dividers, or source captions as a new visual convention. Preserve necessary sources without making them unsolicited page decoration.
- Preserve videos' original proportions. Reuse the existing glass playback controls and standard media gaps. Align adjacent media deliberately.
- Reflections use two specific takeaways: human/user behavior and designing/building with AI, where appropriate to the project.
- Keep claims factual. Research statistics and proposed measurement targets must not be presented as measured project outcomes.
- Don't delete screenshots, captures, or generated assets without asking. This includes scratch captures. Preserve originals.

Current reference components: the node graph (`scripts/figures/`, Acuity "System architecture") for systems and pipelines, `.yap-card.yap-step` for solution cards, `.yap-takeaways` for reflection, `.fig` in `css/figures.css` for diagram backgrounds, and the shared case/media styles in `css/case.css` and `css/media.css`.
