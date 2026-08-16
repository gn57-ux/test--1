/**
 * 加载状态 UI：在场景初始化期间挂载到 #ui-root，首次渲染发生后调用 hide() 淡出并移除。
 *
 * 当前场景无异步资源（无 GLTF/纹理/外部文件），因此无需真实的加载进度，
 * 仅需保证加载态有最短可见时长（避免一闪而过）与淡出动画（避免生硬消失）。
 */
const MIN_VISIBLE_MS = 500
const FADE_OUT_MS = 400

const prefersReducedMotion = (): boolean =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

export interface LoadingScreenHandle {
  /** 淡出并移除加载界面；保证距首次挂载至少展示 MIN_VISIBLE_MS。 */
  hide: () => void
}

export function showLoadingScreen(container: HTMLElement): LoadingScreenHandle {
  const shownAt = performance.now()
  const reduceMotion = prefersReducedMotion()
  const fadeOutMs = reduceMotion ? 0 : FADE_OUT_MS

  const root = document.createElement('div')
  root.style.cssText = `
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1.25rem;
    background: radial-gradient(circle at 50% 40%, #061a2d 0%, #020711 70%);
    color: #c6d7e2;
    font-family: system-ui, -apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif;
    opacity: 1;
    ${reduceMotion ? '' : `transition: opacity ${FADE_OUT_MS}ms ease;`}
  `

  const ring = document.createElement('div')
  ring.style.cssText = `
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
    border: 2px solid rgba(69, 214, 232, 0.2);
    border-top-color: #45d6e8;
    ${reduceMotion ? '' : 'animation: loading-screen-spin 0.9s linear infinite;'}
  `

  const label = document.createElement('p')
  label.style.cssText = `
    margin: 0;
    font-size: 0.9rem;
    letter-spacing: 0.15em;
  `
  label.textContent = '正在潜入深海…'

  const style = document.createElement('style')
  style.textContent = `
    @keyframes loading-screen-spin {
      to { transform: rotate(360deg); }
    }
  `

  root.append(style, ring, label)
  container.append(root)

  let hidden = false

  function removeNow(): void {
    root.remove()
  }

  function hide(): void {
    if (hidden) return
    hidden = true

    const elapsed = performance.now() - shownAt
    const remaining = Math.max(0, MIN_VISIBLE_MS - elapsed)

    window.setTimeout(() => {
      root.style.opacity = '0'
      window.setTimeout(removeNow, fadeOutMs)
    }, remaining)
  }

  return { hide }
}
