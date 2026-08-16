# Feature 2: opening-and-scroll-camera — 设计文档

## 版本
v1

## 涉及层
Three.js 渲染层（镜头控制）+ HTML UI 层（标题、深度指示器）。

## 模块设计
- `src/camera/ScrollCameraController.ts` — 监听滚动事件，将 scrollY 归一化为 `depthProgress`（0-1），使用阻尼插值（lerp/damp）驱动 `camera.position`，避免跳变。
- `src/camera/depthColor.ts` — 根据 `depthProgress` 计算雾/背景色（在深蓝黑与浅蓝之间插值），写入 SceneManager 的 fog/background。
- `src/ui/IntroTitle.ts` — 开场标题 HTML 组件，随 `depthProgress` 淡出（opacity 插值）。
- `src/ui/DepthIndicator.ts` — 右侧深度指示器 HTML 组件，展示格式化后的深度值（等宽字体 class）。

## 接口契约
- `ScrollCameraController.getDepthProgress(): number`（0-1，供 Feature 3/4 读取以确定展品/结尾展区可见性）
- `ScrollCameraController.subscribe(cb: (progress: number) => void): () => void`
- `resetToTop(): void` — 平滑滚动到顶部并复位镜头（供 Feature 4 的"返回海面"调用）。

## 数据模型
无持久化数据；`depthProgress` 为运行时状态。

## 安全/兼容性
- 遵循 [[frontend]] 规则：镜头运动通过插值实现，不能直接跳跃；重要文字（标题、深度值）用 HTML 渲染。
- 滚动事件监听需做 rAF 节流，避免每次 scroll 事件都触发重计算。

## 技术决策与理由
- 使用单一 `depthProgress` 作为 Feature 2 对外的核心状态接口，Feature 3/4 只读取该值决定自身行为，避免与镜头控制器产生双向耦合。
- 深度到颜色的插值放在独立 `depthColor.ts` 模块，便于单独调整视觉曲线而不影响滚动逻辑。
