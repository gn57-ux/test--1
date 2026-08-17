import * as THREE from 'three'
import type { ExhibitData } from '../data/exhibits'
import type { ScrollCameraController } from '../camera/ScrollCameraController'
import { createExhibitObject, BUBBLE_RADIUS } from './ExhibitFactory'
import { subscribe as subscribeReducedMotion } from '../utils/reducedMotion'

/**
 * 展品与相机到达其 depthRange 中点时所在位置的额外前置距离，避免展品与相机重合。
 * 取值需保证即使在很窄的竖屏移动端（aspect 低至约 0.35）气泡居中也能落在视锥内，
 * 否则 T-005 引入的"距离过近强制隐藏"安全网会在窄屏上把所有展品都判定为裁切而隐藏。
 */
const VIEW_DISTANCE = 12
/** 气泡边缘与视锥边界之间的安全边距。 */
const SAFETY_MARGIN = 0.3

const ROTATION_SPEED = 0.3
const FLOAT_AMPLITUDE = 0.15
const FLOAT_FREQUENCY = 0.6
const REDUCED_MOTION_SCALE = 1 / 3

/** depthRange 两侧额外的淡入/淡出过渡区间（depthProgress 单位）。 */
const FADE_PADDING = 0.06

const MIN_DISTANCE_FOR_OFFSET = 0.1

/**
 * 相机水平半视锥宽度：按传入的实时距离计算——展品在其 depthRange 内移动时，
 * 相机到展品的实际距离会持续变化（区间起点距离最远、终点最近），必须用当前距离
 * 而非固定设计距离，否则近端会裁切出画面。
 */
function computeHorizontalHalfWidth(camera: THREE.PerspectiveCamera, distance: number): number {
  const safeDistance = Math.max(MIN_DISTANCE_FOR_OFFSET, distance)
  const verticalHalfFovRad = THREE.MathUtils.degToRad(camera.fov / 2)
  return safeDistance * Math.tan(verticalHalfFovRad) * camera.aspect
}

/** depthRange 外侧 FADE_PADDING 内线性淡入淡出，range 内完全不透明，再往外完全透明。 */
function computeActivation(progress: number, [start, end]: [number, number]): number {
  if (progress < start - FADE_PADDING || progress > end + FADE_PADDING) return 0
  if (progress < start) return (progress - (start - FADE_PADDING)) / FADE_PADDING
  if (progress > end) return 1 - (progress - end) / FADE_PADDING
  return 1
}

interface ExhibitInstance {
  id: string
  group: THREE.Group
  index: number
  phase: number
  depthRange: [number, number]
  meshes: THREE.Mesh[]
  light: THREE.PointLight | null
  baseLightIntensity: number
  speedMultiplier: number
  /** 由 depthProgress 决定的可见性意图；最终 group.visible 还要再叠加视锥安全检查。 */
  activationVisible: boolean
}

export interface InteractiveEntry {
  id: string
  group: THREE.Group
  mesh: THREE.Mesh
}

export class ExhibitController {
  private readonly scene: THREE.Scene
  private readonly groups = new Map<string, THREE.Group>()
  private readonly instances: ExhibitInstance[] = []
  private readonly camera: THREE.PerspectiveCamera

  private elapsed = 0
  private motionScale = 1
  private readonly unregisterUpdatable: () => void
  private readonly unsubscribeReducedMotion: () => void
  private readonly unsubscribeDepthProgress: () => void

  constructor(
    scene: THREE.Scene,
    exhibits: ExhibitData[],
    scrollCamera: ScrollCameraController,
    camera: THREE.PerspectiveCamera,
    registerUpdatable: (fn: (dt: number) => void) => () => void,
  ) {
    this.scene = scene
    this.camera = camera

    exhibits.forEach((data, index) => {
      const group = createExhibitObject(data)

      const centerProgress = (data.depthRange[0] + data.depthRange[1]) / 2
      const z = scrollCamera.getWorldZ(centerProgress) - VIEW_DISTANCE
      group.position.set(0, 0, z)
      group.userData.exhibitIndex = index

      scene.add(group)
      this.groups.set(data.id, group)

      const meshes = group.children.filter((child): child is THREE.Mesh => child instanceof THREE.Mesh)
      const light = group.children.find((child): child is THREE.PointLight => child instanceof THREE.PointLight) ?? null

      this.instances.push({
        id: data.id,
        group,
        index,
        phase: index * 1.7,
        depthRange: data.depthRange,
        meshes,
        light,
        baseLightIntensity: light?.intensity ?? 0,
        speedMultiplier: 1,
        activationVisible: false,
      })
    })

    this.unregisterUpdatable = registerUpdatable((dt) => this.update(dt))
    this.unsubscribeReducedMotion = subscribeReducedMotion((reduced) => {
      this.motionScale = reduced ? REDUCED_MOTION_SCALE : 1
    })
    this.unsubscribeDepthProgress = scrollCamera.subscribe((progress) => this.applyActivation(progress))
    this.applyActivation(scrollCamera.getDepthProgress())
    // 首帧同步跑一次，避免在渲染循环第一次 tick 之前，group.visible 停留在 Object3D 默认的 true。
    this.update(0)
  }

  private applyActivation(progress: number): void {
    for (const instance of this.instances) {
      const activation = computeActivation(progress, instance.depthRange)
      instance.activationVisible = activation > 0.001

      for (const mesh of instance.meshes) {
        const material = mesh.material as THREE.Material & { opacity: number }
        const baseOpacity = (mesh.userData.baseOpacity as number | undefined) ?? 1
        material.opacity = baseOpacity * activation
      }

      if (instance.light) {
        instance.light.intensity = instance.baseLightIntensity * activation
      }
    }
  }

  private update(dt: number): void {
    this.elapsed += dt

    for (const instance of this.instances) {
      const { group, index, phase, speedMultiplier, activationVisible } = instance
      group.rotation.y += ROTATION_SPEED * speedMultiplier * this.motionScale * dt
      group.position.y = Math.sin(this.elapsed * FLOAT_FREQUENCY + phase) * FLOAT_AMPLITUDE * this.motionScale

      const distance = this.camera.position.z - group.position.z
      const horizontalHalfWidth = computeHorizontalHalfWidth(this.camera, distance)
      const xOffset = Math.max(0, horizontalHalfWidth - BUBBLE_RADIUS - SAFETY_MARGIN)
      group.position.x = index % 2 === 0 ? xOffset : -xOffset

      // 淡出尾段相机可能已经非常接近展品：即使横向偏移收缩到 0，气泡半径本身仍可能超出
      // 该距离下的视锥（宽高比越窄越明显）。在这种情况下强制隐藏，而不是让用户看到裁切。
      const bubbleFitsInFrustum = horizontalHalfWidth >= BUBBLE_RADIUS + SAFETY_MARGIN
      group.visible = activationVisible && bubbleFitsInFrustum
    }
  }

  getGroup(id: string): THREE.Group | undefined {
    return this.groups.get(id)
  }

  /** 供 InteractionManager 悬停时降低旋转速度使用（multiplier=1 为正常速度）。 */
  setSpeedMultiplier(id: string, multiplier: number): void {
    const instance = this.instances.find((item) => item.id === id)
    if (instance) instance.speedMultiplier = multiplier
  }

  /** 供 InteractionManager 做 raycaster 拾取：仅返回主体网格（不含气泡外壳）。 */
  getInteractiveEntries(): InteractiveEntry[] {
    return this.instances.map(({ id, group, meshes }) => ({ id, group, mesh: meshes[0] }))
  }

  dispose(): void {
    this.unregisterUpdatable()
    this.unsubscribeReducedMotion()
    this.unsubscribeDepthProgress()

    for (const instance of this.instances) {
      this.scene.remove(instance.group)
      instance.group.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose()
          const material = child.material
          if (Array.isArray(material)) material.forEach((m) => m.dispose())
          else material.dispose()
        }
      })
    }
    this.groups.clear()
    this.instances.length = 0
  }
}
