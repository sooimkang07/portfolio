# Project-page markup

Prefer the element that describes the content. A smaller count of divs is useful when it removes redundant structure, but substituting arbitrary sections for layout containers does not improve semantics.

## The shared narrative

```html
<div class="nt-chapters">
  <section class="nt-section" id="research" aria-labelledby="research-title">
    <section class="nt-subsection">
      <header>
        <p class="nt-kicker">Research</p>
        <h2 id="research-title">The chapter’s main finding</h2>
        <p>Brief context for this chapter.</p>
      </header>
      <figure class="nt-media">
        <img src="assets/project/research/example.webp" alt="What the visual shows">
      </figure>
    </section>
    <section class="nt-subsection" aria-labelledby="interviews-title">
      <p class="nt-step-label">Interviews</p>
      <h3 id="interviews-title">A specific finding</h3>
      <p>The explanation belongs directly to this subsection.</p>
    </section>
  </section>
</div>
```

A chapter's opening header groups its introduction. A subsection already groups its heading and copy, so it does not need another reading wrapper. A later, independently titled group is another section rather than a second chapter header. Preserve existing chapter IDs and heading levels so the table of contents and deep links continue working.

A real two-column copy/media layout still needs a copy group. Use a header for that subsection's introduction, alongside its figure. `case.js` recognizes a header or titled section directly; it no longer requires `.nt-reading` to identify the copy column.

## Figures and captions

Use figure/figcaption for media with its own label and explanation. Related figures may sit in one grid. The first and only caption is a direct child of its figure; nested figures are valid when they form one larger visual group. A caption referring to several separate visuals should stay attached to that group, rather than being forced into one arbitrary child figure.

Do not add a visible caption merely to satisfy a markup pattern. Existing optional source captions that were already hidden retain `hidden`; the stylesheet does not suppress every figcaption.

The shared caption flow uses `--space-1` between related text elements at every width. Nested captions do not inherit a second top gap from their first paragraph.

## Keep useful layout containers

Divs remain appropriate for device-screen clipping, media controls, carousels, tab panels, diagram canvases, and grid/flex groups that have no independent document meaning. Existing classes such as `.dx-grid`, `.phones-fig`, and `.nt-step` describe reusable components or contexts. Do not remove a wrapper until its CSS and JavaScript dependencies have been checked.

Legacy `.nt-reading` groups remain where they still serve a special layout or interactive component. Do not introduce new ones for ordinary narrative paragraphs. Historical whole-page redesign scripts are not canonical templates; follow the live page patterns and this reference.

## Spacing ownership

`css/case.css` owns narrative spacing. The chapter stack, chapters, and explicit subsections are flex columns owning their gaps. Their direct children have zero block margins. Inner media grids own their own gaps. Device and diagram internals keep their component geometry. See [SPACING.md](SPACING.md) for the numeric and responsive rules.

## Cascade ownership

Shared narrative spacing belongs in `css/case.css`; project styles own component internals. Use normal cascade order and modest selector specificity. Remove an obsolete declaration instead of appending an overriding patch. Do not use `!important` for narrative spacing or layout, or increase selector specificity to win a conflict. Reserve exceptions for a documented external constraint, such as a third-party embed with inline styles. Respect browser accessibility preferences, including reduced motion and forced colors.

## Nested subsections

Every thematic project subsection is a `section` nested inside its chapter `section`. This includes Opportunity statements, room-size explanations, individual design decisions, and titled next steps. A chapter opening uses `header`; grid, device, and control containers remain layout elements. Keep existing component classes while changing the structural element.

## Explicit subsections

All seven project pages use `section.nt-subsection` for each chapter content group. An inner `.nt-content` is reserved for a retained copy/media layout or reusable component; it is not another narrative level. Never put split-layout classes on `.nt-section` or `.nt-subsection`: those stay flex columns.

Shared media explanations use `figcaption.case-caption` within `div.case-caption`, with `--space-1` between notes. `.case-media-stack` groups consecutive media with `--space-0`; the subsection owns the gap between its introduction and that media group. Forage solution media and its captions use separate flex groups, so mobile captions stack below the media row.

`figcaption.case-caption` uses `--space-0` between its title and body; `div.case-caption` uses `--space-1` between separate captions.
