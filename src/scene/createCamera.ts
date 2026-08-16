import * as THREE from 'three'

export function createCamera(): THREE.PerspectiveCamera {
  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000,
  )

  camera.position.set(0, 0, 10)

  return camera
}
