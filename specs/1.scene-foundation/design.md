# Feature 1: scene-foundation — 设计文档

## 版本
v1

## 涉及层
纯前端：构建工具链、Three.js 渲染层、HTML UI 层。无后端。

## 模块设计
- `src/scene/` — Three.js 场景核心：`createRenderer.ts`、`createCamera.ts`、`createLights.ts`、`createFog.ts`、`ParticleField.ts`（漂浮颗粒 + 气泡）、`postprocessing.ts`（EffectComposer + UnrealBloomPass）。
- `src/scene/SceneManager.ts` — 场景生命周期管理：init/resize/dispose，统一持有 renderer/scene/camera/composer 引用，供其他 Feature 通过受控接口访问（如注册可视对象、读取当前深度进度）。
- `src/ui/LoadingScreen.ts` — HTML 加载状态组件。
- `src/ui/WebglFallback.ts` — WebGL 检测（如 `three/examples/jsm/capabilities/WebGL`）与静态降级页面。
- `src/utils/reducedMotion.ts` — 监听 `prefers-reduced-motion` media query，暴露 `isReducedMotion` 响应式状态（简单事件发布/订阅）。
- `src/utils/deviceCapability.ts` — 根据视口宽度/`navigator` 特征估算移动端，决定粒子数量、`renderer.setPixelRatio` 上限、是否启用 Bloom。

## 接口契约
- `SceneManager.init(canvas: HTMLCanvasElement): void`
- `SceneManager.registerUpdatable(fn: (dt: number) => void): () => void`（返回注销函数）
- `SceneManager.dispose(): void` — 遍历 scene 释放 geometry/material/texture，移除事件监听。
- `reducedMotion.subscribe(cb: (v: boolean) => void): () => void`
- `deviceCapability.getProfile(): { particleCount: number; pixelRatioCap: number; bloomEnabled: boolean }`

## 数据模型
无持久化数据；仅运行时配置对象（如 `SceneConfig`）。

## 安全/兼容性
- 遵循 [[security]] 规则：不引入第三方分析/追踪脚本，不请求非本地资源。
- WebGL 检测失败时的降级内容必须是纯 HTML/CSS，不依赖 Canvas。
- resize 监听需做防抖，避免频繁触发昂贵的 composer 重建。

## 技术决策与理由
- 使用 `SceneManager` 作为单一渲染入口，避免多个 Feature 各自持有 renderer/scene 引用造成生命周期混乱，满足 PRD "HTML UI 与 Three.js Canvas 分层管理"约束。
- `reducedMotion` 与 `deviceCapability` 设计为独立、无依赖的工具模块，供 Feature 2/3/4 单向引用，避免反向依赖 SceneManager。
