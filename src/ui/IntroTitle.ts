/**
 * 开场标题 HTML 组件：挂载到 #ui-root，展示标题与引导文案。
 *
 * 淡出进度暂用简单滚动比例（scrollY / 半屏高度），随 Feature 2 后续任务
 * 落地共享 depthProgress 后再整合，这里先自行监听 scroll 事件。
 */
const FADE_SCROLL_RATIO = 0.5

export interface IntroTitleHandle {
  /** 移除滚动监听并卸载 DOM。 */
  destroy: () => void
}

export function mountIntroTitle(container: HTMLElement): IntroTitleHandle {
  const root = document.createElement('div')
  root.style.cssText = `
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    padding: 2rem;
    box-sizing: border-box;
    text-align: center;
    color: #e6f1fa;
    font-family: system-ui, -apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif;
    pointer-events: none;
    transition: opacity 120ms linear;
  `

  const title = document.createElement('h1')
  title.style.cssText = `
    margin: 0;
    font-size: clamp(1.75rem, 5vw, 3rem);
    font-weight: 600;
    letter-spacing: 0.08em;
  `
  title.textContent = '深海失物博物馆'

  const subtitle = document.createElement('p')
  subtitle.style.cssText = `
    margin: 0;
    max-width: 28rem;
    font-size: clamp(0.9rem, 2vw, 1.15rem);
    line-height: 1.6;
    color: #9fb8cc;
    letter-spacing: 0.04em;
  `
  subtitle.textContent = '向下滚动，寻找那些没有真正消失的东西'

  root.append(title, subtitle)
  container.append(root)

  let ticking = false

  function update(): void {
    ticking = false
    const viewportHeight = Math.max(window.innerHeight, 1)
    const fadeDistance = Math.max(viewportHeight * FADE_SCROLL_RATIO, 1)
    const progress = Math.min(1, Math.max(0, window.scrollY / fadeDistance))
    root.style.opacity = String(1 - progress)
  }

  function onScroll(): void {
    if (ticking) return
    ticking = true
    window.requestAnimationFrame(update)
  }

  update()
  window.addEventListener('scroll', onScroll, { passive: true })

  function destroy(): void {
    window.removeEventListener('scroll', onScroll)
    root.remove()
  }

  return { destroy }
}
