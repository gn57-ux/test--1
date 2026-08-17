const MAX_DEPTH_METERS = 3800

export interface DepthIndicatorHandle {
  update: (progress: number) => void
  destroy: () => void
}

export function mountDepthIndicator(container: HTMLElement): DepthIndicatorHandle {
  const root = document.createElement('div')
  root.style.cssText = `
    position: fixed;
    top: 50%;
    right: 1.5rem;
    transform: translateY(-50%);
    text-align: right;
    color: #c6d7e2;
    font-family: 'SFMono-Regular', 'Menlo', 'Consolas', monospace;
    pointer-events: none;
    z-index: 2;
  `

  const value = document.createElement('div')
  value.style.cssText = `
    font-size: clamp(1rem, 2vw, 1.5rem);
    letter-spacing: 0.05em;
  `

  const label = document.createElement('div')
  label.style.cssText = `
    margin-top: 0.25rem;
    font-size: 0.7rem;
    color: #6f8ba0;
    letter-spacing: 0.15em;
  `
  label.textContent = '深度'

  root.append(value, label)
  container.append(root)

  function update(progress: number): void {
    const clamped = Math.min(1, Math.max(0, progress))
    const meters = Math.round(clamped * MAX_DEPTH_METERS)
    value.textContent = `${meters}m`
  }

  function destroy(): void {
    root.remove()
  }

  return { update, destroy }
}
