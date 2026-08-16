import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'

export interface BloomOptions {
  strength?: number
  radius?: number
  threshold?: number
}

const DEFAULT_BLOOM_STRENGTH = 0.5
const DEFAULT_BLOOM_RADIUS = 0.4
const DEFAULT_BLOOM_THRESHOLD = 0.3

export interface Postprocessing {
  composer: EffectComposer
  dispose(): void
}

export function createPostprocessing(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  width: number,
  height: number,
  bloomOptions: BloomOptions = {},
): Postprocessing {
  const composer = new EffectComposer(renderer)
  composer.setSize(width, height)

  composer.addPass(new RenderPass(scene, camera))

  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(width, height),
    bloomOptions.strength ?? DEFAULT_BLOOM_STRENGTH,
    bloomOptions.radius ?? DEFAULT_BLOOM_RADIUS,
    bloomOptions.threshold ?? DEFAULT_BLOOM_THRESHOLD,
  )
  composer.addPass(bloomPass)

  const outputPass = new OutputPass()
  composer.addPass(outputPass)

  return {
    composer,
    dispose: () => {
      bloomPass.dispose()
      outputPass.dispose()
      composer.dispose()
    },
  }
}
