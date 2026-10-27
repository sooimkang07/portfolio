# Project spacing audit — October 27, 2026

The contextual hierarchy replaces the earlier uniform 12px/24px system. All seven pages were measured at 390px, 768px, and 1440px. Measurements: `_qa/flow26/audit.json`; screenshots: `_qa/flow26/`.

| Relationship | >700px | ≤700px |
|---|---|---|
| Related text and heading → description | 12px (`--s-3`) | 12px |
| Figure → its caption | 12px | 12px |
| Caption title → caption body | 8px (`--s-2`) | 8px |
| Explanation → figure | 24px (`--sp-media`) | 16px |
| New subsection / group | 48px (`--s-9`) | 32px (`--s-7`) |
| Full chapter | 96–128px (`--sp-section`) | 96px |
| Media siblings horizontally | 12px (`--gap-media`) | 8px |
| Separate media-and-caption cards stacked on phones | — | 32px |

New groups include steps, decisions, separate `.nt-reading` blocks, standalone figure subheadings, room subsections, and opportunity questions. Labels/kickers are attached to their own heading; they do not create a new group. First children have no extra leading margin. Following content blocks own start margins; end margins are zero. Full chapters retain their existing section-end padding, with no padding after the last chapter. Grid/flex children clear margins so container gaps do not double up. Figure canvas geometry is unchanged.

Results: all measured direct subsection boundaries use 48px above 700px and 32px below. Shared media spacing resolves to 24px/16px. No horizontal overflow on any of the 21 page/viewport combinations. Visual review caught and corrected an overbroad heading rule that separated kickers from their headings. Removed an older 128px mobile section override. Mobile section spacing was subsequently increased to 96px at Sooim’s request. Token check reports zero new off-system values.

Follow-up verification: `_qa/navflow27.cjs` checks shared metadata margins (32px), mobile chapters (96px), and matching Neuk media dimensions. Neuk frames use the original phone recording’s 4:5 ratio.

Caption wrapper correction: Forage’s solution cards use `figure + .yap-call`, with title/body nested inside. The wrapper now owns the 12px image-to-caption gap; its first heading has no extra margin, and caption body follows at 8px. The earlier direct-sibling caption audit missed this structure. Verification: `_qa/caption32.cjs`.

Grouped-media correction: Forage’s `.fg-render-pair` and `.fg-gesture-pair` now carry `.case-media-group`. Shared rules treat these wrappers like figures: 24px/16px after explanatory text, 12px between consecutive media groups or figures. Verification: `_qa/stack33.cjs` (390/768/1440px).

## Wrapper and rendered-gap audit

The broader follow-up audit measures actual element rectangles as well as margins and container gaps at 390px, 768px, and 1440px. `_qa/wrappers34/audit-after.json` records 2,872 adjacent relationships, including 1,823 context-specific spacing checks. All checked relationships pass within 1px, and all 21 page/viewport combinations have no horizontal overflow. This is a scoped page-flow audit, not a claim that every arbitrary DOM pair should share one gap.

Corrected misses:
- Yap/Forage: shared split-grid gaps were adding to child media margins, doubling 16px to 32px or 24px to 48px. Split containers now own the gap alone.
- Yap/Neuk: grouped caption wrappers now attach to their media at 12px; their separate caption groups use 32px on phones.
- Instagram: before/after caption wrappers attach at 12px; next-step question grids no longer add subsection margins to their existing row gaps.
- Smart Bundles: phone-to-caption spacing was zero; it is now 12px. Grouped decks use the consecutive-media gap, and mobile next-step cards use 32px.
- Notate: nested reflection paragraphs still had a 16px legacy override; they now use the shared 12px rhythm. The launch media group uses 12px when stacked.
- Forage: capture-media groups now use the shared stacked-media gap.
- Neuk: a shared mobile row gap was being added to room-card title/body margins. The custom image-row layout now has 12px before its first caption, 8px title-to-body, and 32px between caption groups.

Preserved distinctions: full chapters retain their larger section breaks; the next-steps reading block in Smart Bundles is a new subsection, not a caption; Forage and Neuk retain their intentional mobile image-row/grouped-caption arrangements. Product UI, figure canvases, carousel controls, and device geometry are outside page-flow checks. Acuity needed no page-flow corrections.

Visual captures are under `_qa/wrappers34/`. Token validation reports zero new off-system values.

## Naming cleanup

`docs/SPACING.md` is the complete current reference. Removed redundant `--sp-block` → `--s-3` and `--case-g` → `--gutter`; removed obsolete `--pair-gap` / `--pair-copy-pad` declarations and their superseded split-layout breakpoints. Removed conflicting fallback values from the three retained responsive spacing roles. Normalized cover-offset and carousel-inset declarations to existing scale tokens.

Regression comparison: `_qa/spacing37/before.json` and `after.json` cover all seven projects at 390px, 768px, and 1440px. All 2,872 measured relationships retain the same gap, following margin, and parent-gap values after cleanup. All 1,823 contextual checks pass, with no horizontal overflow. Token checker reports zero new off-system values. Historical QA captures may still mention retired names; live CSS does not.
