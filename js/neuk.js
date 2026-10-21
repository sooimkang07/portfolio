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

// Each room category cycles only through its own room captures. Each card keeps
// its own beat (period + start offset), and a swap waits for that card's next
// beat even when an image finishes loading late, so the cards never switch together.
;(() => {
 const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)')
 const sleep = ms => new Promise(r => setTimeout(r, ms))
 // Shared across cards: no two swaps land closer together than MIN_GAP
 const MIN_GAP = 450
 let lastSwap = -Infinity
 document.querySelectorAll('[data-room-images]').forEach((img, i) => {
  const sources = JSON.parse(img.dataset.roomImages)
  if (sources.length < 2) return
  const period = 1900 + i * 350
  const phase = 500 + i * 650
  const ready = new Map()
  const load = src => {
   if (!ready.has(src)) { const pre = new Image(); pre.src = src; ready.set(src, pre.decode().then(() => true, () => false)) }
   return ready.get(src)
  }
  let index = 0, run = 0, t0 = 0
  // Next beat for this card after `now`: t0 + phase + k * period
  const nextBeat = now => t0 + phase + Math.max(0, Math.ceil((now - t0 - phase) / period)) * period
  const loop = async id => {
   while (id === run) {
    const next = (index + 1) % sources.length
    const ok = await load(sources[next])
    await sleep(Math.max(0, nextBeat(performance.now()) - performance.now()))
    if (id !== run) return
    const wait = lastSwap + MIN_GAP - performance.now()
    if (wait > 0) await sleep(wait)
    if (id !== run) return
    lastSwap = performance.now()
    if (!ok || document.hidden || reducedMotion.matches) { await sleep(period); continue }
    img.src = sources[next]
    img.alt = sources[next].split('/').pop().replace('.png', '').replaceAll('-', ' ')
    index = next
    const duration = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--dur-3')) || 420
    img.animate([{ opacity: .4 }, { opacity: 1 }], { duration, easing: 'ease-out' })
    await sleep(1)
   }
  }
  new IntersectionObserver(([entry]) => {
   run++
   if (!entry.isIntersecting) return
   sources.forEach(load)
   t0 = performance.now()
   loop(run)
  }, { rootMargin: '200px 0px' }).observe(img)
  addEventListener('pagehide', () => { run++ }, { once: true })
 })
})()
