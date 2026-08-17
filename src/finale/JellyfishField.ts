import * as THREE from 'three'
import type { ScrollCameraController } from '../camera/ScrollCameraController'
import { subscribe as subscribeReducedMotion } from '../utils/reducedMotion'

const GLOW_COLOR = 0x86f0ff
const JELLYFISH_COUNT = 6

const BELL_RADIUS_MIN = 0.35
const BELL_RADIUS_MAX = 0.6
const TENTACLE_COUNT = 5
const TENTACLE_LENGTH = 1.1

const SPREAD_X = 6
const SPREAD_Y = 3
const SPREAD_Z = 3

/**
 * 水母集群相对相机终点（depthProgress=1）的前置距离。相机在 progress→1 时持续向 -Z 移动，
 * 若集群直接放在 getWorldZ(1) 上会与相机终点重合甚至被越过（参考 ExhibitController 的
 * VIEW_DISTANCE 前置偏移思路），必须比相机终点更靠前（更负的 Z）才能落在视野内。
 */
const VIEW_DISTANCE = 12

const BOB_AMPLITUDE_MIN = 0.3
const BOB_AMPLITUDE_MAX = 0.6
const BOB_FREQUENCY_MIN = 0.15
const BOB_FREQUENCY_MAX = 0.3
const SWAY_AMPLITUDE_MIN = 0.4
const SWAY_AMPLITUDE_MAX = 0.9
const SWAY_FREQUENCY_MIN = 0.08
const SWAY_FREQUENCY_MAX = 0.16
const PULSE_FREQUENCY_MIN = 0.5
const PULSE_FREQUENCY_MAX = 0.8
const PULSE_SCALE = 0.12
const TENTACLE_SWAY_AMPLITUDE = 0.15

const REDUCED_MOTION_SCALE = 1 / 3

/** 结尾区域 depthProgress 起点；从这里开始淡入，FADE_PADDING 后完全显现。 */
const FINALE_FADE_START = 0.82
const FINALE_FADE_PADDING = 0.08

function randomInRange(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

interface JellyfishInstance {
  group: THREE.Group
  bell: THREE.Mesh
  tentacles: THREE.Line[]
  light: THREE.PointLight
  baseX: number
  baseY: number
  baseZ: number
  bobAmplitude: number
  bobFrequency: number
  bobPhase: number
  swayAmplitude: number
  swayFrequency: number
  swayPhase: number
  pulseFrequency: number
  pulsePhase: number
}

function createJellyfish(): JellyfishInstance {
  const group = new THREE.Group()
  const radius = randomInRange(BELL_RADIUS_MIN, BELL_RADIUS_MAX)

  const bellGeometry = new THREE.SphereGeometry(radius, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2)
  const bellMaterial = new THREE.MeshPhongMaterial({
    color: GLOW_COLOR,
    emissive: GLOW_COLOR,
    emissiveIntensity: 0.6,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
  })
  const bell = new THREE.Mesh(bellGeometry, bellMaterial)
  bell.rotation.x = Math.PI
  group.add(bell)

  const tentacles: THREE.Line[] = []
  for (let i = 0; i < TENTACLE_COUNT; i++) {
    const angle = (i / TENTACLE_COUNT) * Math.PI * 2
    const anchorX = Math.cos(angle) * radius * 0.6
    const anchorZ = Math.sin(angle) * radius * 0.6

    const points = [
      new THREE.Vector3(anchorX, 0, anchorZ),
      new THREE.Vector3(anchorX, -TENTACLE_LENGTH, anchorZ),
    ]
    const tentacleGeometry = new THREE.BufferGeometry().setFromPoints(points)
    const tentacleMaterial = new THREE.LineBasicMaterial({
      color: GLOW_COLOR,
      transparent: true,
      opacity: 0.35,
    })
    const tentacle = new THREE.Line(tentacleGeometry, tentacleMaterial)
    tentacle.userData.anchorX = anchorX
    tentacle.userData.anchorZ = anchorZ
    tentacle.userData.phase = angle
    group.add(tentacle)
    tentacles.push(tentacle)
  }

  const light = new THREE.PointLight(GLOW_COLOR, 0.8, 4)
  group.add(light)

  const baseX = randomInRange(-SPREAD_X, SPREAD_X)
  const baseY = randomInRange(-SPREAD_Y, SPREAD_Y)
  const baseZ = randomInRange(-SPREAD_Z, SPREAD_Z)
  group.position.set(baseX, baseY, baseZ)

  return {
    group,
    bell,
    tentacles,
    light,
    baseX,
    baseY,
    baseZ,
    bobAmplitude: randomInRange(BOB_AMPLITUDE_MIN, BOB_AMPLITUDE_MAX),
    bobFrequency: randomInRange(BOB_FREQUENCY_MIN, BOB_FREQUENCY_MAX),
    bobPhase: randomInRange(0, Math.PI * 2),
    swayAmplitude: randomInRange(SWAY_AMPLITUDE_MIN, SWAY_AMPLITUDE_MAX),
    swayFrequency: randomInRange(SWAY_FREQUENCY_MIN, SWAY_FREQUENCY_MAX),
    swayPhase: randomInRange(0, Math.PI * 2),
    pulseFrequency: randomInRange(PULSE_FREQUENCY_MIN, PULSE_FREQUENCY_MAX),
    pulsePhase: randomInRange(0, Math.PI * 2),
  }
}

/** depthProgress 从 FINALE_FADE_START 到 +FADE_PADDING 线性淡入，此前完全不可见。 */
function computeFadeIn(progress: number): number {
  if (progress <= FINALE_FADE_START) return 0
  if (progress >= FINALE_FADE_START + FINALE_FADE_PADDING) return 1
  return (progress - FINALE_FADE_START) / FINALE_FADE_PADDING
}

export class JellyfishField {
  private readonly scene: THREE.Scene
  private readonly root = new THREE.Group()
  private readonly instances: JellyfishInstance[] = []

  private elapsed = 0
  private motionScale = 1
  private readonly unregisterUpdatable: () => void
  private readonly unsubscribeReducedMotion: () => void
  private readonly unsubscribeDepthProgress: () => void

  constructor(
    scene: THREE.Scene,
    scrollCamera: ScrollCameraController,
    registerUpdatable: (fn: (dt: number) => void) => () => void,
  ) {
    this.scene = scene

    this.root.position.z = scrollCamera.getWorldZ(1) - VIEW_DISTANCE
    this.root.visible = false

    for (let i = 0; i < JELLYFISH_COUNT; i++) {
      const instance = createJellyfish()
      this.root.add(instance.group)
      this.instances.push(instance)
    }

    scene.add(this.root)

    this.unregisterUpdatable = registerUpdatable((dt) => this.update(dt))
    this.unsubscribeReducedMotion = subscribeReducedMotion((reduced) => {
      this.motionScale = reduced ? REDUCED_MOTION_SCALE : 1
    })
    this.unsubscribeDepthProgress = scrollCamera.subscribe((progress) => this.applyFadeIn(progress))
    this.applyFadeIn(scrollCamera.getDepthProgress())
  }

  private applyFadeIn(progress: number): void {
    const fade = computeFadeIn(progress)
    this.root.visible = fade > 0.001

    for (const instance of this.instances) {
      const bellMaterial = instance.bell.material as THREE.MeshPhongMaterial
      bellMaterial.opacity = 0.55 * fade
      instance.light.intensity = 0.8 * fade
      for (const tentacle of instance.tentacles) {
        const material = tentacle.material as THREE.LineBasicMaterial
        material.opacity = 0.35 * fade
      }
    }
  }

  private update(dt: number): void {
    this.elapsed += dt

    for (const instance of this.instances) {
      const { group, bell, bobAmplitude, bobFrequency, bobPhase, swayAmplitude, swayFrequency, swayPhase } = instance

      group.position.y = instance.baseY + Math.sin(this.elapsed * bobFrequency + bobPhase) * bobAmplitude * this.motionScale
      group.position.x = instance.baseX + Math.sin(this.elapsed * swayFrequency + swayPhase) * swayAmplitude * this.motionScale

      const pulse = 1 + Math.sin(this.elapsed * instance.pulseFrequency + instance.pulsePhase) * PULSE_SCALE * this.motionScale
      bell.scale.set(1, pulse, 1)

      for (const tentacle of instance.tentacles) {
        const phase = tentacle.userData.phase as number
        tentacle.rotation.z =
          Math.sin(this.elapsed * bobFrequency * 1.5 + phase) * TENTACLE_SWAY_AMPLITUDE * this.motionScale
      }
    }
  }

  dispose(): void {
    this.unregisterUpdatable()
    this.unsubscribeReducedMotion()
    this.unsubscribeDepthProgress()

    this.scene.remove(this.root)
    this.root.traverse((child) => {
      if (child instanceof THREE.Mesh || child instanceof THREE.Line) {
        child.geometry.dispose()
        const material = child.material
        if (Array.isArray(material)) material.forEach((m) => m.dispose())
        else material.dispose()
      }
    })
    this.instances.length = 0
  }
}
