import * as THREE from 'three'
import type { ScrollCameraController } from '../camera/ScrollCameraController'

/**
 * 末段变暗的 depthProgress 起点，与 exhibits.ts 中最后一件展品（astronaut）
 * depthRange 终点（0.8）衔接，避免展品仍在视野内时雾/亮度已经开始突变。
 */
const DARKEN_START = 0.8
const DARKEN_END = 1

const FOG_DENSITY_MULTIPLIER = 1.8
const LIGHT_INTENSITY_FLOOR = 0.45

/** depthProgress 从 DARKEN_START 到 DARKEN_END 线性增强，此前保持 Feature 1/2 的基准值。 */
function computeDarken(progress: number): number {
  if (progress <= DARKEN_START) return 0
  if (progress >= DARKEN_END) return 1
  return (progress - DARKEN_START) / (DARKEN_END - DARKEN_START)
}

export class FinaleDarkening {
  private readonly fog: THREE.FogExp2 | null
  private readonly lights: THREE.Light[]
  private readonly baseFogDensity: number
  private readonly baseLightIntensities: number[]
  private readonly unsubscribeDepthProgress: () => void

  constructor(scene: THREE.Scene, scrollCamera: ScrollCameraController) {
    this.fog = scene.fog instanceof THREE.FogExp2 ? scene.fog : null
    this.baseFogDensity = this.fog?.density ?? 0

    this.lights = scene.children.filter(
      (child): child is THREE.Light => child instanceof THREE.AmbientLight || child instanceof THREE.DirectionalLight,
    )
    this.baseLightIntensities = this.lights.map((light) => light.intensity)

    this.unsubscribeDepthProgress = scrollCamera.subscribe((progress) => this.applyDarkening(progress))
    this.applyDarkening(scrollCamera.getDepthProgress())
  }

  private applyDarkening(progress: number): void {
    const darken = computeDarken(progress)

    if (this.fog) {
      this.fog.density = THREE.MathUtils.lerp(this.baseFogDensity, this.baseFogDensity * FOG_DENSITY_MULTIPLIER, darken)
    }

    this.lights.forEach((light, index) => {
      const base = this.baseLightIntensities[index]
      light.intensity = THREE.MathUtils.lerp(base, base * LIGHT_INTENSITY_FLOOR, darken)
    })
  }

  dispose(): void {
    this.unsubscribeDepthProgress()
  }
}
