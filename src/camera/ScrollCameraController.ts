import * as THREE from 'three'
import { subscribe as subscribeReducedMotion } from '../utils/reducedMotion'

const DEFAULT_DAMPING = 4
const REDUCED_MOTION_DAMPING = 1.5
const DIVE_DISTANCE = 40
const EPSILON = 0.0001

type ProgressListener = (progress: number) => void

export class ScrollCameraController {
  private camera: THREE.PerspectiveCamera
  private unregister: () => void
  private unsubscribeReducedMotion: () => void

  private baseZ: number
  private targetProgress = 0
  private currentProgress = 0
  private ticking = false
  private damping = DEFAULT_DAMPING
  private listeners: Set<ProgressListener> = new Set()

  private onViewportChange = (): void => {
    if (this.ticking) return
    this.ticking = true
    window.requestAnimationFrame(() => {
      this.ticking = false
      this.targetProgress = this.readScrollProgress()
    })
  }

  constructor(
    camera: THREE.PerspectiveCamera,
    registerUpdatable: (fn: (dt: number) => void) => () => void,
  ) {
    this.camera = camera
    this.baseZ = camera.position.z

    this.targetProgress = this.readScrollProgress()
    this.currentProgress = this.targetProgress
    this.applyProgress(this.currentProgress)

    window.addEventListener('scroll', this.onViewportChange, { passive: true })
    window.addEventListener('resize', this.onViewportChange)
    this.unregister = registerUpdatable((dt) => this.update(dt))

    this.unsubscribeReducedMotion = subscribeReducedMotion((reduced) => {
      this.damping = reduced ? REDUCED_MOTION_DAMPING : DEFAULT_DAMPING
    })
  }

  private readScrollProgress(): number {
    const scrollable = document.body.scrollHeight - window.innerHeight
    if (scrollable <= 0) return 0
    return Math.min(1, Math.max(0, window.scrollY / scrollable))
  }

  private applyProgress(progress: number): void {
    this.camera.position.z = this.baseZ - progress * DIVE_DISTANCE
  }

  private update(dt: number): void {
    const previous = this.currentProgress

    if (dt <= 0) {
      this.currentProgress = this.targetProgress
    } else {
      const t = 1 - Math.exp(-this.damping * dt)
      this.currentProgress += (this.targetProgress - previous) * t
    }

    if (Math.abs(this.targetProgress - this.currentProgress) < EPSILON) {
      this.currentProgress = this.targetProgress
    }

    this.applyProgress(this.currentProgress)

    if (this.currentProgress !== previous) {
      for (const listener of this.listeners) {
        listener(this.currentProgress)
      }
    }
  }

  getDepthProgress(): number {
    return this.currentProgress
  }

  /** 将 0-1 深度进度换算为与镜头下潜一致的世界坐标 Z 值，供其他展品定位使用。 */
  getWorldZ(progress: number): number {
    return this.baseZ - progress * DIVE_DISTANCE
  }

  subscribe(cb: ProgressListener): () => void {
    this.listeners.add(cb)
    return () => {
      this.listeners.delete(cb)
    }
  }

  resetToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  dispose(): void {
    window.removeEventListener('scroll', this.onViewportChange)
    window.removeEventListener('resize', this.onViewportChange)
    this.unregister()
    this.unsubscribeReducedMotion()
    this.listeners.clear()
  }
}
