import * as THREE from 'three'

const PRIMARY_GLOW_COLOR = 0x45d6e8
const SECONDARY_GLOW_COLOR = 0xddf7ff

export const DEFAULT_FLOATING_PARTICLE_COUNT = 220
export const DEFAULT_BUBBLE_COUNT = 90

const FLOATING_SPREAD_X = 10
const FLOATING_SPREAD_Y = 6
const FLOATING_SPREAD_Z_NEAR = 8
const FLOATING_SPREAD_Z_FAR = -15

const FLOAT_AMPLITUDE_MIN = 0.3
const FLOAT_AMPLITUDE_MAX = 1.2
const FLOAT_FREQUENCY_MIN = 0.05
const FLOAT_FREQUENCY_MAX = 0.15

const BUBBLE_SPREAD_X = 10
const BUBBLE_SPREAD_Z_NEAR = 8
const BUBBLE_SPREAD_Z_FAR = -15
const BUBBLE_BOTTOM_Y = -8
const BUBBLE_TOP_Y = 10
const BUBBLE_RANGE_Y = BUBBLE_TOP_Y - BUBBLE_BOTTOM_Y

const BUBBLE_RISE_SPEED_MIN = 0.3
const BUBBLE_RISE_SPEED_MAX = 0.9
const BUBBLE_WOBBLE_AMPLITUDE = 0.4
const BUBBLE_WOBBLE_FREQUENCY_MIN = 0.2
const BUBBLE_WOBBLE_FREQUENCY_MAX = 0.5

function randomInRange(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

interface FloatingParticles {
  points: THREE.Points
  geometry: THREE.BufferGeometry
  basePositions: Float32Array
  amplitudes: Float32Array
  frequencies: Float32Array
  phases: Float32Array
}

interface Bubbles {
  points: THREE.Points
  geometry: THREE.BufferGeometry
  baseX: Float32Array
  baseZ: Float32Array
  speeds: Float32Array
  wobbleFrequencies: Float32Array
  wobblePhases: Float32Array
}

export class ParticleField {
  readonly object3d: THREE.Group

  private readonly floatingParticleCount: number
  private readonly bubbleCount: number

  private floating: FloatingParticles
  private bubbles: Bubbles
  private elapsed = 0

  constructor(
    floatingParticleCount: number = DEFAULT_FLOATING_PARTICLE_COUNT,
    bubbleCount: number = DEFAULT_BUBBLE_COUNT,
  ) {
    this.floatingParticleCount = floatingParticleCount
    this.bubbleCount = bubbleCount

    this.object3d = new THREE.Group()

    this.floating = this.createFloatingParticles()
    this.object3d.add(this.floating.points)

    this.bubbles = this.createBubbles()
    this.object3d.add(this.bubbles.points)
  }

  update(dt: number): void {
    this.elapsed += dt
    this.updateFloatingParticles()
    this.updateBubbles(dt)
  }

  dispose(): void {
    this.floating.geometry.dispose()
    ;(this.floating.points.material as THREE.Material).dispose()
    this.bubbles.geometry.dispose()
    ;(this.bubbles.points.material as THREE.Material).dispose()
  }

  private createFloatingParticles(): FloatingParticles {
    const positions = new Float32Array(this.floatingParticleCount * 3)
    const basePositions = new Float32Array(this.floatingParticleCount * 3)
    const amplitudes = new Float32Array(this.floatingParticleCount * 3)
    const frequencies = new Float32Array(this.floatingParticleCount * 3)
    const phases = new Float32Array(this.floatingParticleCount * 3)

    for (let i = 0; i < this.floatingParticleCount; i++) {
      const base = i * 3
      const bx = randomInRange(-FLOATING_SPREAD_X, FLOATING_SPREAD_X)
      const by = randomInRange(-FLOATING_SPREAD_Y, FLOATING_SPREAD_Y)
      const bz = randomInRange(FLOATING_SPREAD_Z_FAR, FLOATING_SPREAD_Z_NEAR)

      basePositions[base] = bx
      basePositions[base + 1] = by
      basePositions[base + 2] = bz
      positions[base] = bx
      positions[base + 1] = by
      positions[base + 2] = bz

      for (let axis = 0; axis < 3; axis++) {
        amplitudes[base + axis] = randomInRange(FLOAT_AMPLITUDE_MIN, FLOAT_AMPLITUDE_MAX)
        frequencies[base + axis] = randomInRange(FLOAT_FREQUENCY_MIN, FLOAT_FREQUENCY_MAX)
        phases[base + axis] = randomInRange(0, Math.PI * 2)
      }
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    const material = new THREE.PointsMaterial({
      color: SECONDARY_GLOW_COLOR,
      size: 0.06,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
      sizeAttenuation: true,
    })

    const points = new THREE.Points(geometry, material)

    return { points, geometry, basePositions, amplitudes, frequencies, phases }
  }

  private updateFloatingParticles(): void {
    const { geometry, basePositions, amplitudes, frequencies, phases } = this.floating
    const position = geometry.attributes.position as THREE.BufferAttribute
    const array = position.array as Float32Array

    for (let i = 0; i < this.floatingParticleCount; i++) {
      const base = i * 3
      for (let axis = 0; axis < 3; axis++) {
        const idx = base + axis
        array[idx] =
          basePositions[idx] + Math.sin(this.elapsed * frequencies[idx] + phases[idx]) * amplitudes[idx]
      }
    }

    position.needsUpdate = true
  }

  private createBubbles(): Bubbles {
    const positions = new Float32Array(this.bubbleCount * 3)
    const baseX = new Float32Array(this.bubbleCount)
    const baseZ = new Float32Array(this.bubbleCount)
    const speeds = new Float32Array(this.bubbleCount)
    const wobbleFrequencies = new Float32Array(this.bubbleCount)
    const wobblePhases = new Float32Array(this.bubbleCount)

    for (let i = 0; i < this.bubbleCount; i++) {
      const base = i * 3
      const x = randomInRange(-BUBBLE_SPREAD_X, BUBBLE_SPREAD_X)
      const z = randomInRange(BUBBLE_SPREAD_Z_FAR, BUBBLE_SPREAD_Z_NEAR)
      const y = randomInRange(BUBBLE_BOTTOM_Y, BUBBLE_TOP_Y)

      baseX[i] = x
      baseZ[i] = z
      positions[base] = x
      positions[base + 1] = y
      positions[base + 2] = z

      speeds[i] = randomInRange(BUBBLE_RISE_SPEED_MIN, BUBBLE_RISE_SPEED_MAX)
      wobbleFrequencies[i] = randomInRange(BUBBLE_WOBBLE_FREQUENCY_MIN, BUBBLE_WOBBLE_FREQUENCY_MAX)
      wobblePhases[i] = randomInRange(0, Math.PI * 2)
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    const material = new THREE.PointsMaterial({
      color: PRIMARY_GLOW_COLOR,
      size: 0.12,
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
      sizeAttenuation: true,
    })

    const points = new THREE.Points(geometry, material)

    return { points, geometry, baseX, baseZ, speeds, wobbleFrequencies, wobblePhases }
  }

  private updateBubbles(dt: number): void {
    const { geometry, baseX, baseZ, speeds, wobbleFrequencies, wobblePhases } = this.bubbles
    const position = geometry.attributes.position as THREE.BufferAttribute
    const array = position.array as Float32Array

    for (let i = 0; i < this.bubbleCount; i++) {
      const base = i * 3
      const raw = array[base + 1] + speeds[i] * dt
      const offset = raw - BUBBLE_BOTTOM_Y
      const wrapped = ((offset % BUBBLE_RANGE_Y) + BUBBLE_RANGE_Y) % BUBBLE_RANGE_Y
      array[base + 1] = BUBBLE_BOTTOM_Y + wrapped

      const wobble = Math.sin(this.elapsed * wobbleFrequencies[i] + wobblePhases[i]) * BUBBLE_WOBBLE_AMPLITUDE
      array[base] = baseX[i] + wobble
      array[base + 2] = baseZ[i] + wobble
    }

    position.needsUpdate = true
  }
}
