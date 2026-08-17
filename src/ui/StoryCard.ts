import type { ExhibitData } from '../data/exhibits'

const TRANSITION_MS = 500

export interface StoryCardHandle {
  open: (id: string) => void
  close: () => void
  destroy: () => void
}

/**
 * 桌面端靠左偏移、卡片最大宽度不超过视口 40%；移动端占屏幕下半部分。
 * 布局属性放进带媒体查询的 class，与随开关状态变化的内联样式（opacity/transform 等）分开。
 */
const RESPONSIVE_STYLE_ID = 'story-card-responsive-style'
const MOBILE_BREAKPOINT_PX = 768

function ensureResponsiveStyle(): void {
  if (document.getElementById(RESPONSIVE_STYLE_ID)) return
  const style = document.createElement('style')
  style.id = RESPONSIVE_STYLE_ID
  style.textContent = `
    .story-card-overlay {
      justify-content: flex-start;
      align-items: center;
      padding-left: 4rem;
    }
    .story-card {
      max-width: min(28rem, 40vw);
      margin: 0 1.5rem;
    }
    @media (max-width: ${MOBILE_BREAKPOINT_PX - 1}px) {
      .story-card-overlay {
        justify-content: center;
        align-items: flex-end;
        padding-left: 0;
      }
      .story-card {
        max-width: 100%;
        max-height: 50vh;
        overflow-y: auto;
        margin: 0;
        border-radius: 0.5rem 0.5rem 0 0;
      }
    }
  `
  document.head.append(style)
}

export function mountStoryCard(container: HTMLElement, exhibits: ExhibitData[]): StoryCardHandle {
  ensureResponsiveStyle()

  const byId = new Map(exhibits.map((exhibit) => [exhibit.id, exhibit]))
  let activeExhibitId: string | null = null
  let previouslyFocusedElement: HTMLElement | null = null

  const overlay = document.createElement('div')
  overlay.className = 'story-card-overlay'
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 40;
    display: flex;
    background: rgba(1, 4, 9, 0.4);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    opacity: 0;
    pointer-events: none;
    transition: opacity ${TRANSITION_MS}ms ease;
  `

  const TITLE_ID = 'story-card-title'
  const DESC_ID = 'story-card-desc'

  const card = document.createElement('div')
  card.className = 'story-card'
  card.setAttribute('role', 'dialog')
  card.setAttribute('aria-modal', 'true')
  card.setAttribute('aria-labelledby', TITLE_ID)
  card.setAttribute('aria-describedby', DESC_ID)
  card.tabIndex = -1
  card.style.cssText = `
    position: relative;
    width: 100%;
    padding: 2.5rem;
    border-radius: 0.5rem;
    background: rgba(6, 26, 45, 0.5);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-top: 1px solid rgba(202, 228, 236, 0.2);
    border-left: 1px solid rgba(202, 228, 236, 0.2);
    color: #c6d7e2;
    font-family: system-ui, -apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif;
    transform: translateY(2rem);
    transition: transform ${TRANSITION_MS}ms ease;
  `

  const closeButton = document.createElement('button')
  closeButton.setAttribute('aria-label', '关闭故事卡片')
  closeButton.style.cssText = `
    position: absolute;
    top: 1rem;
    right: 1rem;
    width: 2rem;
    height: 2rem;
    border: none;
    background: transparent;
    color: #869395;
    font-size: 1.25rem;
    line-height: 1;
    cursor: pointer;
  `
  closeButton.textContent = '×'
  closeButton.addEventListener('click', () => close())

  const idLabel = document.createElement('div')
  idLabel.style.cssText = `
    font-family: 'SFMono-Regular', 'Menlo', 'Consolas', monospace;
    font-size: 0.75rem;
    letter-spacing: 0.2em;
    color: #45d6e8;
    margin-bottom: 1rem;
  `

  const title = document.createElement('h3')
  title.id = TITLE_ID
  title.style.cssText = `
    margin: 0 0 1.5rem;
    font-size: 1.5rem;
    font-weight: 300;
    color: #e6f1fa;
  `

  const divider = document.createElement('div')
  divider.style.cssText = `
    width: 3rem;
    height: 1px;
    background: rgba(202, 228, 236, 0.3);
    margin-bottom: 1.5rem;
  `

  const story = document.createElement('p')
  story.id = DESC_ID
  story.style.cssText = `
    margin: 0;
    font-size: 1rem;
    line-height: 1.8;
    white-space: pre-line;
  `

  overlay.setAttribute('aria-hidden', 'true')

  card.append(closeButton, idLabel, title, divider, story)
  overlay.append(card)
  container.append(overlay)

  function close(): void {
    if (activeExhibitId === null) return
    activeExhibitId = null
    overlay.style.opacity = '0'
    overlay.style.pointerEvents = 'none'
    overlay.setAttribute('aria-hidden', 'true')
    card.style.transform = 'translateY(2rem)'

    if (previouslyFocusedElement && document.contains(previouslyFocusedElement)) {
      previouslyFocusedElement.focus()
    }
    previouslyFocusedElement = null
  }

  function open(id: string): void {
    const exhibit = byId.get(id)
    if (!exhibit) return

    if (activeExhibitId === null) {
      previouslyFocusedElement = document.activeElement as HTMLElement | null
    }

    activeExhibitId = id
    idLabel.textContent = `EXHIBIT ${String(exhibit.index).padStart(2, '0')}`
    title.textContent = exhibit.name
    story.textContent = exhibit.story

    overlay.setAttribute('aria-hidden', 'false')
    overlay.style.opacity = '1'
    overlay.style.pointerEvents = 'auto'
    card.style.transform = 'translateY(0)'
    card.focus()
  }

  function onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && activeExhibitId !== null) close()
  }
  window.addEventListener('keydown', onKeydown)

  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) close()
  })

  function destroy(): void {
    window.removeEventListener('keydown', onKeydown)
    overlay.remove()
  }

  return { open, close, destroy }
}
