/* neuk: figure boards are laid out at 1920×1080 and scaled to fit the column */
(() => {
	'use strict'

	document.querySelectorAll('[data-nkb]').forEach(fig => {
		const stage = fig.querySelector('.nkb__stage')
		const fit = () => { stage.style.transform = `scale(${fig.clientWidth / 1920})` }
		new ResizeObserver(fit).observe(fig)
		fit()
	})
})()

// Each room category cycles only through its own room captures.
;(() => {
 const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)')
 document.querySelectorAll('[data-room-images]').forEach(img => {
  const sources = JSON.parse(img.dataset.roomImages)
  if (sources.length < 2) return
  let index = 0, timer, busy = false
  const advance = async () => {
   if (busy || document.hidden || reducedMotion.matches) return
   busy = true
   const next = (index + 1) % sources.length
   const preload = new Image()
   preload.src = sources[next]
   try {
    await preload.decode()
    img.src = sources[next]
    img.alt = sources[next].split('/').pop().replace('.png', '').replaceAll('-', ' ')
    index = next
    const duration = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--dur-3')) || 420
    img.animate([{ opacity: .4 }, { opacity: 1 }], { duration, easing: 'ease-out' })
   } catch { /* Keep the current room visible if an asset cannot load. */ }
   finally { busy = false }
  }
  new IntersectionObserver(([entry]) => {
   clearInterval(timer)
   if (entry.isIntersecting) timer = setInterval(advance, 4000)
  }).observe(img)
  addEventListener('pagehide', () => clearInterval(timer), { once: true })
 })
})()
