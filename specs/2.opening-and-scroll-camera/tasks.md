# Feature 2: opening-and-scroll-camera — 任务列表

## 版本
v1

## Feature / Spec 路径
specs/2.opening-and-scroll-camera/

- [ ] T-001: 开场标题/引导文案 HTML 组件及随滚动淡出交互｜验证：页面加载显示标题，滚动开始后标题透明度平滑降为 0｜复杂度：S
- [ ] T-002: 实现 ScrollCameraController，将滚动位置映射为平滑插值的镜头深度｜验证：滚动过程中镜头位置连续变化，无跳跃感（人工目测 + 插值日志）｜复杂度：M
- [ ] T-003: 深度→环境色（背景/雾）渐变｜验证：从顶部滚动到底部，背景色由浅蓝渐变为深蓝黑｜复杂度：S
- [ ] T-004: 右侧深度指示器 UI，绑定 depthProgress 实时更新｜验证：滚动时深度数值随进度变化，等宽字体显示｜复杂度：S
- [ ] T-005: reduced-motion 模式下镜头插值速度与视差幅度降低｜验证：开启系统减少动态效果后，镜头插值系数发生可观察变化，滚动仍能正常驱动深度｜复杂度：S

## 依赖
- 依赖 Feature 1 完成（SceneManager、reducedMotion）。

## 风险
- 滚动映射与总页面高度绑定，后续 Feature 3/4 增减展区高度可能需要回调本 Feature 调整映射范围。
