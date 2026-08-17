import * as THREE from 'three'
import { subscribe as subscribeReducedMotion } from '../utils/reducedMotion'

const MAX_OFFSET = 0.3
const DAMPING = 4
const REDUCED_MOTION_SCALE = 1 / 4

export class ParallaxController {
  private readonly camera: THREE.PerspectiveCamera
  private targetX = 0
  private targetY = 0
  private currentX = 0
  private currentY = 0
  private motionScale = 1

  private readonly unregisterUpdatable: () => void
  private readonly unsubscribeReducedMotion: () => void

  private readonly onPointerMove = (event: PointerEvent): void => {
    if (event.pointerType !== 'mouse') return
    const nx = (event.clientX / window.innerWidth) * 2 - 1
    const ny = (event.clientY / window.innerHeight) * 2 - 1
    this.targetX = nx * MAX_OFFSET
    this.targetY = -ny * MAX_OFFSET
  }

  constructor(camera: THREE.PerspectiveCamera, registerUpdatable: (fn: (dt: number) => void) => () => void) {
    this.camera = camera
    window.addEventListener('pointermove', this.onPointerMove)
    this.unregisterUpdatable = registerUpdatable((dt) => this.update(dt))
    this.unsubscribeReducedMotion = subscribeReducedMotion((reduced) => {
      this.motionScale = reduced ? REDUCED_MOTION_SCALE : 1
    })
  }

  private update(dt: number): void {
    const t = dt > 0 ? 1 - Math.exp(-DAMPING * dt) : 0
    this.currentX += (this.targetX * this.motionScale - this.currentX) * t
    this.currentY += (this.targetY * this.motionScale - this.currentY) * t
    this.camera.position.x = this.currentX
    this.camera.position.y = this.currentY
  }

  dispose(): void {
    window.removeEventListener('pointermove', this.onPointerMove)
    this.unregisterUpdatable()
    this.unsubscribeReducedMotion()
  }
}
