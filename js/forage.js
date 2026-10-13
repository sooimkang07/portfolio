/* Product iterations fade automatically; the glass button pauses them. Paused for reduced motion or hidden tabs. */
document.querySelectorAll('[data-fg-carousel]').forEach(carousel => {
  const slides = [...carousel.querySelectorAll('[data-fg-slide]')]
  const button = carousel.querySelector('[data-fg-pause]')
  const motion = matchMedia('(prefers-reduced-motion: reduce)')
  let index = 0
  let paused = motion.matches
  const render = () => {
    slides.forEach((slide, i) => {
      slide.hidden = false
      slide.classList.toggle('is-active', i === index)
      slide.setAttribute('aria-hidden', String(i !== index))
    })
    button.classList.toggle('is-playing', !paused)
    button.setAttribute('aria-label', `${paused ? 'Play' : 'Pause'} slideshow`)
  }
  button.addEventListener('click', () => { paused = !paused; render() })
  motion.addEventListener('change', event => { paused = event.matches; render() })
  setInterval(() => {
    if (paused || document.hidden) return
    const bounds = carousel.getBoundingClientRect()
    if (bounds.bottom < 0 || bounds.top > innerHeight) return
    index = (index + 1) % slides.length
    render()
  }, 4500)
  render()
})

/* Live prototype inside the laptop: loads on tap, laid out at 1440x900 and scaled to the screen. */
document.querySelectorAll('[data-fg-live]').forEach(stage => {
  const fit = () => { const f = stage.querySelector('iframe'); if (f) f.style.transform = `scale(${stage.clientWidth / 1440})` }
  stage.querySelector('[data-fg-live-start]')?.addEventListener('click', () => {
    const f = document.createElement('iframe'); f.src = 'https://forage.figma.site/'; f.title = 'forage, live prototype'
    stage.replaceChildren(f); fit()
  })
  new ResizeObserver(fit).observe(stage)
})

/* Give the activation gesture more time to read. */
document.querySelectorAll('video[src*="/forage-double-tap.mp4"]').forEach(video => {
  video.defaultPlaybackRate = 0.75
  video.playbackRate = 0.75
})
