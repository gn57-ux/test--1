import * as THREE from 'three'

export function createLights(): THREE.Light[] {
  const ambientLight = new THREE.AmbientLight(0xddf7ff, 0.6)

  const directionalLight = new THREE.DirectionalLight(0x45d6e8, 0.5)
  directionalLight.position.set(2, 5, 3)

  return [ambientLight, directionalLight]
}
