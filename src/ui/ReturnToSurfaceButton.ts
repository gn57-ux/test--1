/**
 * "返回海面"按钮：固定于底部居中，滚动接近页面底部时淡入，点击触发 onReset 回调。
 * 阈值明显晚于 FinaleOutro/FinaleDarkening 的 0.8，只在真正触底时出现（对齐 Stitch 设计稿）。
 */
const FADE_START = 0.95
const FADE_END = 1

export interface ReturnToSurfaceButtonHandle {
  update: (progress: number) => void
  destroy: () => void
}

function computeFade(progress: number): number {
  if (progress <= FADE_START) return 0
  if (progress >= FADE_END) return 1
  return (progress - FADE_START) / (FADE_END - FADE_START)
}

export function mountReturnToSurfaceButton(
  container: HTMLElement,
  onReset: () => void,
): ReturnToSurfaceButtonHandle {
  const button = document.createElement('button')
  button.type = 'button'
  button.textContent = '↑ 返回海面'
  button.setAttribute('aria-label', '返回海面，回到页面顶部重新开始')
  button.style.cssText = `
    position: fixed;
    bottom: 2rem;
    left: 50%;
    transform: translateX(-50%);
    padding: 0.6rem 1.5rem;
    border-radius: 999px;
    border: 1px solid rgba(134, 240, 255, 0.2);
    background: rgba(6, 26, 45, 0.4);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    color: #c6d7e2;
    font-family: system-ui, -apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif;
    font-size: 0.9rem;
    letter-spacing: 0.04em;
    cursor: pointer;
    opacity: 0;
    pointer-events: none;
    transition: opacity 400ms ease, box-shadow 200ms ease;
  `

  button.addEventListener('mouseenter', () => {
    button.style.boxShadow = '0 0 15px rgba(134, 240, 255, 0.3)'
  })
  button.addEventListener('mouseleave', () => {
    button.style.boxShadow = 'none'
  })
  button.addEventListener('click', () => onReset())

  button.tabIndex = -1
  container.append(button)

  function update(progress: number): void {
    const fade = computeFade(progress)
    const visible = fade > 0.001
    button.style.opacity = String(fade)
    button.style.pointerEvents = visible ? 'auto' : 'none'
    // pointer-events:none 只挡鼠标，不影响 Tab 顺序：隐藏时还要显式退出 Tab 焦点顺序，
    // 否则键盘用户能聚焦并激活一个视觉上不存在的按钮。
    button.tabIndex = visible ? 0 : -1
  }

  function destroy(): void {
    button.remove()
  }

  return { update, destroy }
}
