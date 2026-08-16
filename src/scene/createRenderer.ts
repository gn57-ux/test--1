import * as THREE from 'three'

export function createRenderer(canvas: HTMLCanvasElement, pixelRatioCap: number): THREE.WebGLRenderer {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
  })

  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, pixelRatioCap))

  return renderer
}
