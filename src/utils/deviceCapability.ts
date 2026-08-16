/**
 * 根据视口宽度粗略估算设备能力，决定粒子数量 / renderer 像素比上限 / 是否启用 Bloom 后处理。
 * 纯函数式的运行时读取，不做缓存 —— 调用方决定何时/多频繁地读取（如仅在 init 时读取一次）。
 */

const MOBILE_VIEWPORT_BREAKPOINT = 768

const DESKTOP_PARTICLE_COUNT = 220
const MOBILE_PARTICLE_COUNT = 90

const DESKTOP_PIXEL_RATIO_CAP = 2
const MOBILE_PIXEL_RATIO_CAP = 1.5

export interface DeviceCapabilityProfile {
  particleCount: number
  pixelRatioCap: number
  bloomEnabled: boolean
}

function isMobileViewport(): boolean {
  return window.innerWidth < MOBILE_VIEWPORT_BREAKPOINT
}

export function getProfile(): DeviceCapabilityProfile {
  if (isMobileViewport()) {
    return {
      particleCount: MOBILE_PARTICLE_COUNT,
      pixelRatioCap: MOBILE_PIXEL_RATIO_CAP,
      bloomEnabled: false,
    }
  }

  return {
    particleCount: DESKTOP_PARTICLE_COUNT,
    pixelRatioCap: DESKTOP_PIXEL_RATIO_CAP,
    bloomEnabled: true,
  }
}
