import './style.css'
import { SceneManager } from './scene/SceneManager'
import { isWebglAvailable, renderWebglFallback } from './ui/WebglFallback'
import { showLoadingScreen } from './ui/LoadingScreen'

/**
 * 入口文件：获取并校验分层容器的引用，接入 SceneManager 启动渲染循环。
 *
 * - #scene-canvas：Three.js Canvas 层，由 src/scene/SceneManager 接管渲染。
 * - #ui-root：HTML UI 层，后续由 src/ui 下的组件挂载文字/交互内容。
 */
const canvas = document.querySelector<HTMLCanvasElement>('#scene-canvas')
const uiRoot = document.querySelector<HTMLDivElement>('#ui-root')

if (!canvas) {
  throw new Error('未找到 #scene-canvas，Three.js Canvas 层容器缺失')
}
if (!uiRoot) {
  throw new Error('未找到 #ui-root，HTML UI 层容器缺失')
}

if (!isWebglAvailable()) {
  canvas.style.display = 'none'
  renderWebglFallback(uiRoot)
} else {
  const loadingScreen = showLoadingScreen(uiRoot)

  const sceneManager = new SceneManager()
  sceneManager.init(canvas)

  // SceneManager.init() 内部已通过 requestAnimationFrame 注册了首帧渲染回调，
  // 此处的 requestAnimationFrame 会在同一帧内排在其后触发，
  // 因此执行到这里时场景已完成至少一次实际渲染。
  requestAnimationFrame(() => {
    loadingScreen.hide()
  })
}
