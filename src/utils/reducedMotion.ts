/**
 * 监听 `prefers-reduced-motion` media query，暴露一个简单的发布/订阅接口。
 * 与 SceneManager / deviceCapability 无依赖关系，供其他 Feature 单向引用。
 */

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

export type ReducedMotionListener = (reducedMotion: boolean) => void

/**
 * 订阅 reduced-motion 状态变化。
 * 订阅时立即以当前状态调用一次 cb，之后每次系统设置变化再次调用。
 * 返回取消订阅函数。
 */
export function subscribe(cb: ReducedMotionListener): () => void {
  const mediaQueryList = window.matchMedia(REDUCED_MOTION_QUERY)

  cb(mediaQueryList.matches)

  const handleChange = (event: MediaQueryListEvent): void => {
    cb(event.matches)
  }

  if (typeof mediaQueryList.addEventListener === 'function') {
    mediaQueryList.addEventListener('change', handleChange)
    return () => mediaQueryList.removeEventListener('change', handleChange)
  }

  // Safari < 14 兼容：MediaQueryList 曾使用已废弃的 addListener/removeListener。
  mediaQueryList.addListener(handleChange)
  return () => mediaQueryList.removeListener(handleChange)
}
