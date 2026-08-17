import * as THREE from 'three'
import type { ExhibitData } from '../data/exhibits'

const BUBBLE_COLOR = 0x45d6e8
export const BUBBLE_RADIUS = 1.5
const PLACEHOLDER_COLOR = 0xc6d7e2

function createExhibitGeometry(id: string): THREE.BufferGeometry {
  switch (id) {
    case 'paper-airplane':
      return new THREE.ConeGeometry(0.5, 1.5, 3)
    case 'old-tape':
      return new THREE.BoxGeometry(1.2, 0.8, 0.2)
    case 'old-key':
      return new THREE.TorusGeometry(0.3, 0.05, 16, 32)
    case 'polaroid-photo':
      return new THREE.PlaneGeometry(1, 1.2)
    case 'astronaut':
      return new THREE.SphereGeometry(0.6, 32, 32)
    default:
      console.warn(`未知展品 id："${id}"，降级为占位几何体`)
      return new THREE.BoxGeometry(1, 1, 1)
  }
}

/** 除纸飞机外静态强度为 0（无常驻发光），悬停高亮时由 InteractionManager 临时提升。 */
function createExhibitMaterial(id: string, accentColor: string): THREE.MeshPhongMaterial {
  const baseEmissiveIntensity = id === 'paper-airplane' ? 0.5 : 0

  if (id === 'polaroid-photo') {
    return new THREE.MeshPhongMaterial({
      color: accentColor,
      emissive: accentColor,
      emissiveIntensity: baseEmissiveIntensity,
      side: THREE.DoubleSide,
      transparent: true,
    })
  }

  return new THREE.MeshPhongMaterial({
    color: accentColor,
    emissive: accentColor,
    emissiveIntensity: baseEmissiveIntensity,
    transparent: true,
  })
}

function createLocalLight(accentColor: string): THREE.PointLight {
  return new THREE.PointLight(accentColor, 1.2, 4)
}

function createBubbleShell(): THREE.Mesh {
  const geometry = new THREE.SphereGeometry(BUBBLE_RADIUS, 32, 32)
  const material = new THREE.MeshPhongMaterial({
    color: BUBBLE_COLOR,
    transparent: true,
    opacity: 0.1,
    side: THREE.DoubleSide,
  })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.userData.isBubble = true
  mesh.userData.baseOpacity = 0.1
  return mesh
}

function createPlaceholderMesh(): THREE.Mesh {
  return new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshPhongMaterial({ color: PLACEHOLDER_COLOR, transparent: true }),
  )
}

export function createExhibitObject(data: ExhibitData): THREE.Group {
  const group = new THREE.Group()

  let mesh: THREE.Mesh
  try {
    const geometry = createExhibitGeometry(data.id)
    const material = createExhibitMaterial(data.id, data.accentColor)
    mesh = new THREE.Mesh(geometry, material)
    mesh.userData.baseEmissiveIntensity = material.emissiveIntensity
  } catch (error) {
    console.warn(`展品 "${data.id}" 构造失败，降级为占位几何体`, error)
    mesh = createPlaceholderMesh()
    mesh.userData.baseEmissiveIntensity = 0
  }
  mesh.userData.baseOpacity = 1
  group.add(mesh)

  group.add(createBubbleShell())
  group.add(createLocalLight(data.accentColor))

  return group
}
