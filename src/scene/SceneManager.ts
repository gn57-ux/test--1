import * as THREE from 'three'
import type { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { createRenderer } from './createRenderer'
import { createCamera } from './createCamera'
import { createLights } from './createLights'
import { createFog } from './createFog'
import { ParticleField, DEFAULT_FLOATING_PARTICLE_COUNT, DEFAULT_BUBBLE_COUNT } from './ParticleField'
import { createPostprocessing, type Postprocessing } from './postprocessing'
import { getProfile, type DeviceCapabilityProfile } from '../utils/deviceCapability'

type Updatable = (dt: number) => void

const RESIZE_REPROFILE_DEBOUNCE_MS = 200

function bubbleCountFor(particleCount: number): number {
  return Math.round(particleCount * (DEFAULT_BUBBLE_COUNT / DEFAULT_FLOATING_PARTICLE_COUNT))
}

export class SceneManager {
  scene: THREE.Scene | null = null
  camera: THREE.PerspectiveCamera | null = null
  renderer: THREE.WebGLRenderer | null = null
  fog: THREE.FogExp2 | null = null
  composer: EffectComposer | null = null

  private profile: DeviceCapabilityProfile | null = null
  private particleField: ParticleField | null = null
  private unregisterParticleUpdate: (() => void) | null = null
  private postprocessing: Postprocessing | null = null

  private updatables: Set<Updatable> = new Set()
  private lastTimestamp: number | null = null
  private resizeReprofileTimer: ReturnType<typeof window.setTimeout> | null = null
  private renderLoopId: number | null = null

  private onWindowResize = (): void => {
    this.resize(window.innerWidth, window.innerHeight)

    if (this.resizeReprofileTimer !== null) {
      window.clearTimeout(this.resizeReprofileTimer)
    }
    this.resizeReprofileTimer = window.setTimeout(() => {
      this.resizeReprofileTimer = null
      this.applyProfile(getProfile())
    }, RESIZE_REPROFILE_DEBOUNCE_MS)
  }

  init(canvas: HTMLCanvasElement): void {
    const scene = new THREE.Scene()
    const fog = createFog()
    scene.fog = fog
    scene.background = new THREE.Color(fog.color)

    const profile = getProfile()

    const camera = createCamera()
    const renderer = createRenderer(canvas, profile.pixelRatioCap)

    for (const light of createLights()) {
      scene.add(light)
    }

    this.scene = scene
    this.camera = camera
    this.renderer = renderer
    this.fog = fog

    this.applyProfile(profile)

    window.addEventListener('resize', this.onWindowResize)

    this.startRenderLoop()
  }

  private applyProfile(profile: DeviceCapabilityProfile): void {
    if (!this.scene || !this.renderer) return
    const previous = this.profile
    this.profile = profile

    if (!previous || previous.pixelRatioCap !== profile.pixelRatioCap) {
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, profile.pixelRatioCap))
    }

    if (!previous || previous.particleCount !== profile.particleCount) {
      if (this.particleField) {
        this.scene.remove(this.particleField.object3d)
        this.particleField.dispose()
      }
      this.unregisterParticleUpdate?.()

      const particleField = new ParticleField(profile.particleCount, bubbleCountFor(profile.particleCount))
      this.scene.add(particleField.object3d)
      this.unregisterParticleUpdate = this.registerUpdatable((dt) => particleField.update(dt))
      this.particleField = particleField
    }

    if (!previous || previous.bloomEnabled !== profile.bloomEnabled) {
      if (this.postprocessing) {
        this.postprocessing.dispose()
        this.postprocessing = null
      }

      if (profile.bloomEnabled && this.camera) {
        this.postprocessing = createPostprocessing(
          this.renderer,
          this.scene,
          this.camera,
          window.innerWidth,
          window.innerHeight,
        )
      }
      this.composer = this.postprocessing?.composer ?? null
    }
  }

  resize(width: number, height: number): void {
    if (!this.camera || !this.renderer) return
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(width, height)
    this.postprocessing?.composer.setSize(width, height)
  }

  registerUpdatable(fn: Updatable): () => void {
    this.updatables.add(fn)
    return () => {
      this.updatables.delete(fn)
    }
  }

  private startRenderLoop(): void {
    const tick = (timestamp: number) => {
      const dt = this.lastTimestamp === null ? 0 : (timestamp - this.lastTimestamp) / 1000
      this.lastTimestamp = timestamp

      for (const update of this.updatables) {
        update(dt)
      }

      if (this.postprocessing) {
        this.postprocessing.composer.render()
      } else if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera)
      }

      this.renderLoopId = requestAnimationFrame(tick)
    }

    this.renderLoopId = requestAnimationFrame(tick)
  }

  dispose(): void {
    if (this.renderLoopId !== null) {
      cancelAnimationFrame(this.renderLoopId)
      this.renderLoopId = null
    }

    window.removeEventListener('resize', this.onWindowResize)
    if (this.resizeReprofileTimer !== null) {
      window.clearTimeout(this.resizeReprofileTimer)
      this.resizeReprofileTimer = null
    }

    this.unregisterParticleUpdate?.()
    this.particleField?.dispose()
    if (this.scene && this.particleField) {
      this.scene.remove(this.particleField.object3d)
    }

    this.postprocessing?.dispose()

    this.renderer?.dispose()

    this.updatables.clear()

    this.scene = null
    this.camera = null
    this.renderer = null
    this.fog = null
    this.composer = null
    this.particleField = null
    this.unregisterParticleUpdate = null
    this.postprocessing = null
    this.profile = null
    this.lastTimestamp = null
  }
}
