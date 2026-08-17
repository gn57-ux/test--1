/**
 * 结尾展厅 HTML 组件：最终文案 + 项目名称 + 制作说明 + 链接预留位。
 * 淡入时机与 FinaleDarkening 的 depthProgress 区间衔接，由外部通过 update(progress) 驱动。
 */
const FADE_START = 0.8
const FADE_END = 1

export interface FinaleLinks {
  githubUrl?: string
  portfolioUrl?: string
}

export interface FinaleOutroHandle {
  update: (progress: number) => void
  destroy: () => void
}

function computeFade(progress: number): number {
  if (progress <= FADE_START) return 0
  if (progress >= FADE_END) return 1
  return (progress - FADE_START) / (FADE_END - FADE_START)
}

function createLink(label: string, href: string): HTMLAnchorElement {
  const link = document.createElement('a')
  link.href = href
  link.target = '_blank'
  link.rel = 'noopener noreferrer'
  link.textContent = label
  link.style.cssText = `
    color: #86f0ff;
    text-decoration: none;
    border-bottom: 1px solid rgba(134, 240, 255, 0.3);
  `
  return link
}

export function mountFinaleOutro(container: HTMLElement, links: FinaleLinks = {}): FinaleOutroHandle {
  const root = document.createElement('div')
  root.style.cssText = `
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1.5rem;
    padding: 2rem;
    box-sizing: border-box;
    text-align: center;
    color: #e6f1fa;
    font-family: system-ui, -apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif;
    pointer-events: none;
    opacity: 0;
    transition: opacity 400ms ease;
  `

  const quote = document.createElement('p')
  quote.style.cssText = `
    margin: 0;
    max-width: 28rem;
    font-size: clamp(1rem, 2.4vw, 1.25rem);
    line-height: 1.8;
    font-style: italic;
    color: #c6d7e2;
    white-space: pre-line;
  `
  quote.textContent = '有些东西没有消失，\n只是沉到了记忆更深的地方。'

  const divider = document.createElement('div')
  divider.style.cssText = `
    width: 3rem;
    height: 1px;
    background: rgba(202, 228, 236, 0.3);
  `

  const projectName = document.createElement('h2')
  projectName.style.cssText = `
    margin: 0;
    font-size: clamp(1.1rem, 2.6vw, 1.5rem);
    font-weight: 300;
    letter-spacing: 0.08em;
  `
  projectName.textContent = '深海失物博物馆'

  const credit = document.createElement('p')
  credit.style.cssText = `
    margin: 0;
    font-size: clamp(0.8rem, 1.8vw, 0.9rem);
    color: #869395;
    letter-spacing: 0.02em;
  `
  credit.textContent = '使用 Three.js 构建的沉浸式滚动体验'

  root.append(quote, divider, projectName, credit)

  const linkEntries = (
    [
      ['GitHub', links.githubUrl],
      ['作品集', links.portfolioUrl],
    ] as [string, string | undefined][]
  ).filter((entry): entry is [string, string] => Boolean(entry[1]))

  if (linkEntries.length > 0) {
    const linkRow = document.createElement('div')
    linkRow.style.cssText = `
      display: flex;
      gap: 1.5rem;
      pointer-events: auto;
      font-size: clamp(0.85rem, 1.8vw, 0.95rem);
    `
    for (const [label, href] of linkEntries) {
      linkRow.append(createLink(label, href))
    }
    root.append(linkRow)
  }

  container.append(root)

  function update(progress: number): void {
    const fade = computeFade(progress)
    root.style.opacity = String(fade)
  }

  function destroy(): void {
    root.remove()
  }

  return { update, destroy }
}
