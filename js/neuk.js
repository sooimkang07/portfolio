/* neuk: drag the wireframe strip sideways with a mouse (touch and trackpads scroll natively) */
(() => {
	'use strict'

	document.querySelectorAll('.nk-scroll__rail').forEach(rail => {
		let startX = 0, startLeft = 0, dragging = false
		rail.addEventListener('pointerdown', e => {
			if (e.pointerType !== 'mouse' || e.button !== 0) return
			startX = e.clientX; startLeft = rail.scrollLeft; dragging = false
			const move = ev => {
				const dx = ev.clientX - startX
				if (!dragging && Math.abs(dx) > 4) { dragging = true; rail.classList.add('is-dragging'); rail.setPointerCapture(e.pointerId) }
				if (dragging) rail.scrollLeft = startLeft - dx
			}
			const up = () => {
				rail.removeEventListener('pointermove', move)
				rail.classList.remove('is-dragging')
				removeEventListener('pointerup', up)
			}
			rail.addEventListener('pointermove', move)
			addEventListener('pointerup', up)
		})
	})
})()
