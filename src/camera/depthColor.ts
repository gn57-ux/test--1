import * as THREE from 'three'

const SHALLOW_COLOR = new THREE.Color(0x061a2d)
const DEEP_COLOR = new THREE.Color(0x020711)
const tmpColor = new THREE.Color()

export function applyDepthColor(scene: THREE.Scene, progress: number): void {
  tmpColor.lerpColors(SHALLOW_COLOR, DEEP_COLOR, progress)

  if (scene.fog) {
    scene.fog.color.copy(tmpColor)
  }

  if (scene.background instanceof THREE.Color) {
    scene.background.copy(tmpColor)
  } else {
    scene.background = tmpColor.clone()
  }
}
