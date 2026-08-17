const DEFAULT_SIZE = 32
const HOVER_SIZE = 48
const CLICK_SIZE = 24
const PRIMARY_COLOR = '#45D6E8'
const TERTIARY_COLOR = '#DDF7FF'

export interface InteractionCursorHandle {
  setHover: (active: boolean) => void
  setClick: (active: boolean) => void
  destroy: () => void
}

export function mountInteractionCursor(container: HTMLElement): InteractionCursorHandle {
  const ring = document.createElement('div')
  ring.setAttribute('aria-hidden', 'true')
  ring.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: ${DEFAULT_SIZE}px;
    height: ${DEFAULT_SIZE}px;
    border: 1px solid ${PRIMARY_COLOR};
    border-radius: 50%;
    pointer-events: none;
    transform: translate(-50%, -50%);
    z-index: 9999;
    transition: width 0.2s, height 0.2s, background-color 0.2s, border-color 0.2s;
    mix-blend-mode: screen;
  `
  container.append(ring)

  const previousCursor = document.body.style.cursor
  document.body.style.cursor = 'none'

  function onPointerMove(event: PointerEvent): void {
    if (event.pointerType !== 'mouse') return
    ring.style.left = `${event.clientX}px`
    ring.style.top = `${event.clientY}px`
  }
  window.addEventListener('pointermove', onPointerMove)

  let isHovering = false

  function applyIdleOrHoverState(): void {
    ring.style.width = `${isHovering ? HOVER_SIZE : DEFAULT_SIZE}px`
    ring.style.height = `${isHovering ? HOVER_SIZE : DEFAULT_SIZE}px`
    ring.style.backgroundColor = isHovering ? 'rgba(134, 240, 255, 0.1)' : 'transparent'
    ring.style.borderColor = PRIMARY_COLOR
  }

  function setHover(active: boolean): void {
    isHovering = active
    applyIdleOrHoverState()
  }

  function setClick(active: boolean): void {
    if (active) {
      ring.style.width = `${CLICK_SIZE}px`
      ring.style.height = `${CLICK_SIZE}px`
      ring.style.backgroundColor = TERTIARY_COLOR
      ring.style.borderColor = TERTIARY_COLOR
    } else {
      applyIdleOrHoverState()
    }
  }

  function destroy(): void {
    window.removeEventListener('pointermove', onPointerMove)
    document.body.style.cursor = previousCursor
    ring.remove()
  }

  return { setHover, setClick, destroy }
}
