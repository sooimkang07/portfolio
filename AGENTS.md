# Portfolio design preferences

When editing this portfolio, follow the existing design system and the user's established feedback. These notes were recovered from the portfolio-specific Claude history and confirmed against the current Yap page on October 7, 2026.

- Use `yap.html` and `css/yap-case.css` as the primary case-study layout reference. Read the relevant component before implementing a similar one. Reuse its spacing, typography, backgrounds, radii, shadows, and responsive behavior.
- Use cool grays and restrained accents. Avoid warm palettes, purple text/outlines, decorative colored cards, glowing number badges, or a new visual language for each project.
- Give real product visuals space. Use original screens in appropriate device frames. Avoid tiny screenshots surrounded by excessive padding. Use logos or actual visual assets when they communicate better than generic shapes.
- Keep copy sharp and concrete. Explain what the product does before how it works. Figures should communicate visually, with minimal embedded copy; don't default to text-heavy presentation slides.
- Standard diagram/iteration figures are 1920×1080 on the established dotted background. Solution phone cards follow the actual Yap component, including its aspect ratio and responsive layout.
- Don't add figure zoom links, decorative page dividers, or source captions as a new visual convention. Preserve necessary sources without making them unsolicited page decoration.
- Preserve videos' original proportions. Reuse the existing glass playback controls and standard media gaps. Align adjacent media deliberately.
- Reflections use two specific takeaways: human/user behavior and designing/building with AI, where appropriate to the project.
- Keep claims factual. Research statistics and proposed measurement targets must not be presented as measured project outcomes.
- Don't delete screenshots, captures, or generated assets without asking. This includes scratch captures. Preserve originals.

Current reference components: `.yap-card.yap-step` for solution cards, `.yap-takeaways` for reflection, `.fig` in `css/figures.css` for diagram backgrounds, and the shared case/media styles in `css/case.css` and `css/draft-extras.css`.
