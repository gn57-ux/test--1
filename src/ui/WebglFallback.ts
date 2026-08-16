/**
 * 检测当前环境是否支持 WebGL 渲染。
 *
 * 只接受 WebGL2：已安装的 THREE.WebGLRenderer（three 0.185）内部硬编码
 * 请求 'webgl2' 上下文，失败时直接 throw，不会退回 WebGL1。若这里放行
 * 仅支持 WebGL1 的环境，SceneManager.init() 会抛错而不是显示降级页。
 */
export function isWebglAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return !!canvas.getContext('webgl2')
  } catch {
    return false
  }
}

/**
 * 渲染纯 HTML/CSS 的静态降级页面，不依赖 #scene-canvas。
 * 挂载到传入的容器（通常是 #ui-root）中，展示标题与说明文字。
 */
export function renderWebglFallback(container: HTMLElement): void {
  container.innerHTML = ''

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
    gap: 1rem;
    padding: 2rem;
    box-sizing: border-box;
    text-align: center;
    background: radial-gradient(circle at 50% 40%, #061a2d 0%, #020711 70%);
    color: #e6f1fa;
    font-family: system-ui, -apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif;
  `

  const title = document.createElement('h1')
  title.style.cssText = `
    margin: 0;
    font-size: clamp(1.5rem, 4vw, 2.5rem);
    font-weight: 600;
    letter-spacing: 0.05em;
  `
  title.textContent = '深海失物博物馆'

  const desc = document.createElement('p')
  desc.style.cssText = `
    margin: 0;
    max-width: 32rem;
    font-size: clamp(0.9rem, 2vw, 1.1rem);
    line-height: 1.6;
    color: #9fb8cc;
  `
  desc.textContent =
    '当前浏览器或设备不支持 WebGL，无法呈现完整的 3D 深海场景。请更换支持 WebGL 的浏览器（如最新版 Chrome、Edge、Safari）后重新访问。'

  root.append(title, desc)
  container.append(root)
}
