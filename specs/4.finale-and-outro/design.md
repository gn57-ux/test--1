# Feature 4: finale-and-outro — 设计文档

## 版本
v1

## 涉及层
Three.js 渲染层（水母/粒子、场景变暗）+ HTML UI 层（文案、按钮、项目信息）。

## 模块设计
- `src/finale/JellyfishField.ts` — 发光水母/粒子对象，围绕最终文案区域缓慢移动的动画（订阅 reducedMotion 降低幅度）。
- `src/finale/FinaleDarkening.ts` — 根据 `depthProgress` 接近 1 时进一步降低场景亮度/加深雾色（复用 Feature 2 的 depthColor 曲线，在末段追加变暗系数）。
- `src/ui/FinaleOutro.ts` — HTML 组件：最终文案、项目名称、制作说明、链接预留位（`href` 为空时渲染禁用态或不渲染）。
- `src/ui/ReturnToSurfaceButton.ts` — 按钮组件，调用 Feature 2 暴露的 `resetToTop()`。

## 接口契约
- `JellyfishField.init(sceneManager, depthProgress$, reducedMotion$): void`
- `ReturnToSurfaceButton.onClick(): void` → 调用 `ScrollCameraController.resetToTop()`。

## 数据模型
```ts
interface FinaleLinks {
  githubUrl?: string;
  portfolioUrl?: string;
}
```

## 安全/兼容性
- 遵循 [[frontend]] 规则：最终文案与项目信息使用 HTML 渲染；按钮具备可访问名称与键盘可达性。
- 链接预留位若未配置 URL，不渲染可点击但无效的链接，避免死链接。

## 技术决策与理由
- 复用 Feature 2 的 `depthColor` 曲线并在末段叠加变暗系数，而非独立实现一套颜色系统，避免结尾展区与开场镜头的颜色逻辑不一致。
- `resetToTop()` 的实现归属 Feature 2（镜头系统的自然能力），Feature 4 仅负责触发调用，保持单向依赖。
