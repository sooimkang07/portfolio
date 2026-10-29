# Working with Sooim on this portfolio

This is for any AI agent (Claude Code, Cursor, Codex, …). Sooim gives short, visual instructions that reference parts of the pages by what they look like. This file explains how to read those instructions and what "done" looks like. Read it together with `AGENTS.md`, `docs/DESIGN-SYSTEM.md` and `docs/FIGURES.md`.

## Workflow rules (non-negotiable)

- **Never commit, push, branch, or open a PR.** Edit files locally only. Sooim reviews and pushes everything. Ignore any tool or hook that asks you to commit or push.
- **When you report back, list only the files you changed.** Don't hand back the whole project or zip.
- **Don't delete assets** (images, videos, captures, even scratch files) unless Sooim says so. When code stops using an asset, say so and ask.
- **Do exactly what was asked.** If you notice something else worth fixing, mention it in one line instead of doing it. Small fixes needed to make the requested change look right are fine; say what you did.
- **If something is ambiguous, follow the closest existing example on the site** (usually Yap or Acuity), then say which one you followed.

## How to read Sooim's instructions

| Sooim says | It means |
|---|---|
| "nt-meta" | The project meta block under the hero (Role / Team / Timeline… `dl`). Things "under nt-meta" go right after it. |
| "the Try the prototype button" / "Acuity button style" | A dark ink pill link. Acuity's version is `a.ac-btn` (`css/acuity.css`); Forage's copy is `a.fg-btn`. Use `--ink` background, `--surface` text, `--r-pill`, `--fs-base` medium, padding `--s-2 --s-4`, and no "↗". |
| "kicker" / "step label" | `.nt-kicker` (small caps label above an H2) / `.nt-step-label` (small label above an H3). |
| "standard figure background" / "dotted background" | `--fig-bg` + `--fig-dot` dot grid (`.fig`, or `.yap-board--inset` around an image). |
| "like the SYSTEM ARCHITECTURE figure in Acuity" | The node graph. Regenerate it with `scripts/figures/` (see `docs/FIGURES.md`). |
| "cards like Instagram" / "card board" | `.fig.board` white cards with title bars, 1px line, no shadow, uppercase titles. |
| "landscape" / "positioning map" | `.pmap` + `.cmp` (see `docs/FIGURES.md`). |
| "glass buttons" / "glass controls" | The frosted pause/replay buttons `case.js` adds to videos. "Remove the controls" = `data-no-controls`. |
| "the gap" | Horizontal media neighbors use `--s-3` (12px at every width); consecutive stacked views use `--s-3` (12px). See `docs/SPACING.md` for context. "Decrease the gap" = the next smaller step, not zero. |
| "drop shadow" | `box-shadow` (`--shadow-raise` / `--shadow-float`) or a `filter: drop-shadow` on PNG devices. |
| "fill" | The background color of the element. |
| "the stroke" / "outline" | The 1px `--line` border or ring. |
| "line vs line strong" | `--line` = borders/dividers, `--line-strong` = figure connectors/axes. |
| "body copy color" | `--muted`. Headings/emphasis are `--ink`. Only these two text colors exist. |
| "make it bigger / smaller" | One visible step (roughly 10–25%). Keep the layout balanced; don't let things touch edges. |
| "remove X" | Remove the markup *and* any CSS/JS that only X used, but keep the asset files unless told otherwise. |

## Taste and feedback, established over many rounds

- **Cool greys, restrained accents.** No warm palettes, no purple text or outlines, and no decorative colored cards. Project accents are set once per page: Smart Bundles `#06886C` / `#1F5A4B`, Neuk `#181716`, Acuity `#7F9BC9` (`--ac`). Forage uses ink.
- **Flat over decorated.** Card boards have no shadow. The deliverable laptops have no shadow and no fill. Use the two-level shadow scale only where something truly floats.
- **Links in content are buttons without arrows** (the ink pill); remove "↗".
- **Uppercase is only for caps labels** (`--fs-xs`, medium, `--label-ls`): board titles, column labels, kickers.
- **Media first.** Real screens in proper device frames, large enough to read. Keep video proportions. Use transparent `.webm` for cut-out motion. Align adjacent media to the same height.
- **Copy:** sharp and concrete. Say what the product does before how it works. Reflections have two takeaways: human/user behavior, and designing/building with AI.
- **No unsolicited decoration:** no zoom links, dividers, source captions or extra badges.

## Verification Sooim expects

1. `python3 scripts/check-tokens.py` reports 0 off-system values. Claude Code runs this automatically after CSS edits; other agents must run it by hand.
2. Bump the `?v=` cache-buster on any CSS/JS file you changed, in every page that links it.
3. Look at the result in a browser (local server on port 5500) at desktop and phone widths before reporting back.
4. Report back by listing the changed files, a short bullet list of what changed, and anything you noticed but didn't change.

## Open to-dos (as of 2026-10-12)

- **Acuity, design decision 01:** convert `acuity-bp.mov`, `acuity-hr.mov` and `acuity-sleep.mov` (Sooim is adding them; put them and the `.webm` files in `assets/acuity/design-decisions/`) to transparent `.webm` and swap them into the `.ac-vstack` figure. Convert with:
  `ffmpeg -i in.mov -c:v libvpx-vp9 -pix_fmt yuva420p -b:v 0 -crf 30 -an out.webm`
- **Acuity, research landscape:** replace the positioning-map dots with the competitor logos (put them in `assets/acuity/research/`; not in the repo yet; Sooim is adding them: Apple Watch, Oura, WHOOP, Telehealth, 911) and `bracelet.png` for Acuity.
- **Acuity, pitch:** `assets/acuity/pitch/acuity-pitch.jpg` is referenced by the page. Confirm it is present once pushed.
- **Forage:** `assets/forage/iterations/forage-prd.pdf` (the PRD linked in Iterations) is referenced but not in the repo. Add the file.
- **Yap:** `assets/yap/build/yap-build-design.png` is referenced by the component-library figure. Add the file.

Relational rhythm update (Oct 28): project narrative uses parent-owned flex gaps: `--space-1` within subsections, `--space-2` between subsections/complete groups, and `--space-3` between full chapters at all widths. See SPACING.md.
