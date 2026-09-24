# Notate portfolio motion clips

Six silent H.264 MP4s at 30 fps, with PNG posters and editable HTML/JavaScript timelines.

| File | Dimensions | Duration | Content |
| --- | --- | --- | --- |
| annotate.mp4 | 1920 × 1080 | 14 s | New → select heading → type → save |
| organize.mp4 | 1920 × 1080 | 18 s | Create Design folder → color → save → reposition note |
| return.mp4 | 1920 × 1080 | 16 s | New tab → Notate → expand → select saved note → return |
| live-page.mp4 | 1080 × 1350 | 7 s | New → pencil cursor → neutral element targeting |
| purpose.mp4 | 1080 × 1350 | 24 s | Folder color previews → save to Design → All / Design / Research / Inspiration filters |
| preview.mp4 | 1080 × 1350 | 24 s | Expand two pages → select a note → scroll among saved notes |

## Usage

Open `index.html` to review. For the portfolio, use each MP4 with its matching `-poster.png`:

```html
<video autoplay muted loop playsinline preload="metadata" poster="annotate-poster.png">
  <source src="annotate.mp4" type="video/mp4">
</video>
```

Set the video width to 100% and retain its original aspect ratio. Respect prefers-reduced-motion by showing the poster and providing a play button instead of autoplaying for those visitors.

## Provenance

These are authored animation demos, not recordings of a running installed extension. Landscape clips use a simplified Figma homepage recreation (https://www.figma.com/); portrait clips use a simplified 2×4 homepage recreation (https://2x4.org/), with public copy reviewed September 23, 2026. Project tiles are graphic stand-ins, not original project imagery. Neither recreation is an exact site capture. All exports use edge-to-edge browser framing. Menus, hover states and scrolling are illustrated. The signed-in Figma dashboard and private files were not captured. Sample notes are synthetic; Chrome note storage is untouched. Notate graphics reuse the repository icon and established colors/UI language.

`demo.html` and `timeline.js` contain the editable scene and timelines. Append `?clip=annotate` (or another filename without its extension) to play the source animation. `render.cjs` exports frames through isolated headless Chrome into FFmpeg; its local dependency paths are configurable by editing the constants. The temporary FFmpeg binary came from imageio-ffmpeg 0.6.0, installed from PyPI.
