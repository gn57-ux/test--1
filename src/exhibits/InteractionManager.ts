import * as THREE from 'three'
import type { ExhibitController, InteractiveEntry } from './ExhibitController'

const HOVER_SPEED_MULTIPLIER = 0.3
const HOVER_EMISSIVE_INTENSITY = 1

type EventName = 'exhibit:select' | 'exhibit:hover'
type SelectListener = (id: string) => void
type HoverListener = (id: string | null) => void

export class InteractionManager {
  private readonly canvas: HTMLCanvasElement
  private readonly camera: THREE.PerspectiveCamera
  private readonly exhibitController: ExhibitController
  private readonly unregisterUpdatable: () => void

  private readonly raycaster = new THREE.Raycaster()
  private readonly pointer = new THREE.Vector2()
  private hasPointer = false
  private readonly selectListeners = new Set<SelectListener>()
  private readonly hoverListeners = new Set<HoverListener>()
  private hoveredId: string | null = null

  private readonly onPointerMove = (event: PointerEvent): void => {
    if (event.pointerType !== 'mouse') return
    this.updatePointer(event.clientX, event.clientY)
    this.updateHover()
  }

  private readonly onClick = (event: PointerEvent): void => {
    // 只处理落在 canvas 上的点击：故事卡片等 HTML UI 层叠在 canvas 之上，
    // window 级监听会收到卡片内容/关闭按钮的点击冒泡，若不过滤会穿透到 3D 拾取，
    // 导致卡片刚关闭又被重新打开，或在切换展品时误触发。
    if (event.target !== this.canvas) return

    // 选中对任意指针类型开放（鼠标/触摸/触控笔），移动端才能靠点击打开展品；
    // 只有 hover 高亮/自定义光标是鼠标专属概念，不在这里处理。
    if (event.pointerType === 'mouse') {
      this.updatePointer(event.clientX, event.clientY)
      this.updateHover()
      if (this.hoveredId) {
        for (const cb of this.selectListeners) cb(this.hoveredId)
      }
      return
    }

    const id = this.pickExhibitAt(event.clientX, event.clientY)
    if (id) {
      for (const cb of this.selectListeners) cb(id)
    }
  }

  /** 一次性拾取，不触碰持久化的 hover/高亮状态——供触摸/触控笔点击选中使用。 */
  private pickExhibitAt(clientX: number, clientY: number): string | null {
    const rect = this.canvas.getBoundingClientRect()
    const ndc = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1,
    )
    const entries = this.getVisibleEntries()
    this.raycaster.setFromCamera(ndc, this.camera)
    const meshes = entries.map((entry) => entry.mesh)
    const hits = this.raycaster.intersectObjects(meshes, false)
    const hitMesh = hits[0]?.object
    return entries.find((item) => item.mesh === hitMesh)?.id ?? null
  }

  constructor(
    canvas: HTMLCanvasElement,
    camera: THREE.PerspectiveCamera,
    exhibitController: ExhibitController,
    registerUpdatable: (fn: (dt: number) => void) => () => void,
  ) {
    this.canvas = canvas
    this.camera = camera
    this.exhibitController = exhibitController

    window.addEventListener('pointermove', this.onPointerMove)
    window.addEventListener('click', this.onClick)

    // 每帧用最后一次已知的指针位置重新命中检测（而不是只在滚动事件里做一次）：
    // 展品可见性由 ExhibitController 自己的按帧更新决定，二者都挂在同一个渲染循环上，
    // 跟着帧走能保证总是读到当帧最新的可见性，不依赖两个 updatable 谁先注册、谁先执行。
    this.unregisterUpdatable = registerUpdatable(() => {
      if (this.hasPointer) this.updateHover()
    })
  }

  private updatePointer(clientX: number, clientY: number): void {
    const rect = this.canvas.getBoundingClientRect()
    this.pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1
    this.pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1
    this.hasPointer = true
  }

  private getVisibleEntries(): InteractiveEntry[] {
    return this.exhibitController.getInteractiveEntries().filter((entry) => entry.group.visible)
  }

  private updateHover(): void {
    const entries = this.getVisibleEntries()
    this.raycaster.setFromCamera(this.pointer, this.camera)
    const meshes = entries.map((entry) => entry.mesh)
    const hits = this.raycaster.intersectObjects(meshes, false)
    const hitMesh = hits[0]?.object
    const entry = entries.find((item) => item.mesh === hitMesh)
    const nextId = entry?.id ?? null

    if (nextId === this.hoveredId) return

    if (this.hoveredId) this.setHighlight(this.hoveredId, false)
    if (nextId) this.setHighlight(nextId, true)

    this.hoveredId = nextId
    for (const cb of this.hoverListeners) cb(nextId)
  }

  private setHighlight(id: string, active: boolean): void {
    this.exhibitController.setSpeedMultiplier(id, active ? HOVER_SPEED_MULTIPLIER : 1)
    const entry = this.exhibitController.getInteractiveEntries().find((item) => item.id === id)
    const material = entry?.mesh.material
    if (material && 'emissiveIntensity' in material) {
      const phongMaterial = material as THREE.MeshPhongMaterial
      phongMaterial.emissiveIntensity = active
        ? HOVER_EMISSIVE_INTENSITY
        : (entry?.mesh.userData.baseEmissiveIntensity as number | undefined) ?? 0
    }
  }

  on(event: 'exhibit:select', cb: SelectListener): () => void
  on(event: 'exhibit:hover', cb: HoverListener): () => void
  on(event: EventName, cb: SelectListener | HoverListener): () => void {
    if (event === 'exhibit:select') {
      this.selectListeners.add(cb as SelectListener)
      return () => this.selectListeners.delete(cb as SelectListener)
    }
    this.hoverListeners.add(cb as HoverListener)
    return () => this.hoverListeners.delete(cb as HoverListener)
  }

  dispose(): void {
    window.removeEventListener('pointermove', this.onPointerMove)
    window.removeEventListener('click', this.onClick)
    this.unregisterUpdatable()
    this.selectListeners.clear()
    this.hoverListeners.clear()
  }
}
