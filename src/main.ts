import './style.css'
import { SceneManager } from './scene/SceneManager'
import { ScrollCameraController } from './camera/ScrollCameraController'
import { applyDepthColor } from './camera/depthColor'
import { isWebglAvailable, renderWebglFallback } from './ui/WebglFallback'
import { showLoadingScreen } from './ui/LoadingScreen'
import { mountIntroTitle } from './ui/IntroTitle'
import { mountDepthIndicator } from './ui/DepthIndicator'
import { exhibits } from './data/exhibits'
import { ExhibitController } from './exhibits/ExhibitController'
import { InteractionManager } from './exhibits/InteractionManager'
import { ParallaxController } from './exhibits/ParallaxController'
import { mountInteractionCursor } from './ui/InteractionCursor'
import { mountStoryCard } from './ui/StoryCard'
import { mountFinaleOutro } from './ui/FinaleOutro'
import { mountReturnToSurfaceButton } from './ui/ReturnToSurfaceButton'
import { JellyfishField } from './finale/JellyfishField'
import { FinaleDarkening } from './finale/FinaleDarkening'

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
  mountIntroTitle(uiRoot)

  if (sceneManager.camera) {
    const scrollCamera = new ScrollCameraController(sceneManager.camera, sceneManager.registerUpdatable.bind(sceneManager))

    if (sceneManager.scene) {
      const scene = sceneManager.scene
      applyDepthColor(scene, scrollCamera.getDepthProgress())
      scrollCamera.subscribe((progress) => applyDepthColor(scene, progress))

      const exhibitController = new ExhibitController(
        scene,
        exhibits,
        scrollCamera,
        sceneManager.camera,
        sceneManager.registerUpdatable.bind(sceneManager),
      )

      new ParallaxController(sceneManager.camera, sceneManager.registerUpdatable.bind(sceneManager))

      new JellyfishField(scene, scrollCamera, sceneManager.registerUpdatable.bind(sceneManager))
      new FinaleDarkening(scene, scrollCamera)

      const interactionCursor = mountInteractionCursor(uiRoot)
      const interactionManager = new InteractionManager(
        canvas,
        sceneManager.camera,
        exhibitController,
        sceneManager.registerUpdatable.bind(sceneManager),
      )
      interactionManager.on('exhibit:hover', (id) => interactionCursor.setHover(id !== null))

      const storyCard = mountStoryCard(uiRoot, exhibits)
      interactionManager.on('exhibit:select', (id) => storyCard.open(id))

      const finaleOutro = mountFinaleOutro(uiRoot)
      finaleOutro.update(scrollCamera.getDepthProgress())
      scrollCamera.subscribe((progress) => finaleOutro.update(progress))

      const returnToSurfaceButton = mountReturnToSurfaceButton(uiRoot, () => scrollCamera.resetToTop())
      returnToSurfaceButton.update(scrollCamera.getDepthProgress())
      scrollCamera.subscribe((progress) => returnToSurfaceButton.update(progress))

      canvas.addEventListener('pointerdown', (event) => {
        if (event.pointerType === 'mouse') interactionCursor.setClick(true)
      })
      // pointerup 挂在 window 而不是 canvas：按下后若移出画布（如松手在故事卡片上）
      // 再松开，canvas 收不到事件，只挂 canvas 会让自定义光标永久停在按压态。
      window.addEventListener('pointerup', (event) => {
        if (event.pointerType === 'mouse') interactionCursor.setClick(false)
      })
      // pointercancel（指针被系统取消，如触控笔离开检测范围）与 window blur（窗口失焦，
      // 常见于按下后切到其他应用再松开）都不会触发 pointerup，同样需要重置按压态。
      window.addEventListener('pointercancel', (event) => {
        if (event.pointerType === 'mouse') interactionCursor.setClick(false)
      })
      window.addEventListener('blur', () => interactionCursor.setClick(false))
    }

    const depthIndicator = mountDepthIndicator(uiRoot)
    depthIndicator.update(scrollCamera.getDepthProgress())
    scrollCamera.subscribe((progress) => depthIndicator.update(progress))
  }

  // SceneManager.init() 内部已通过 requestAnimationFrame 注册了首帧渲染回调，
  // 此处的 requestAnimationFrame 会在同一帧内排在其后触发，
  // 因此执行到这里时场景已完成至少一次实际渲染。
  requestAnimationFrame(() => {
    loadingScreen.hide()
  })
}
