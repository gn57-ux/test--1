import * as THREE from 'three'

const DEEP_SEA_BLUE_BLACK = 0x020711

export function createFog(): THREE.FogExp2 {
  return new THREE.FogExp2(DEEP_SEA_BLUE_BLACK, 0.05)
}
