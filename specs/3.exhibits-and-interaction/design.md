# Feature 3: exhibits-and-interaction — 设计文档

## 版本
v1

## 涉及层
Three.js 渲染层（展品模型、动画、raycaster 交互）+ HTML UI 层（故事卡片、光标状态）。

## 模块设计
- `src/data/exhibits.ts` — 展品数据文件（TS 常量数组），字段：`id, name, subtitle, story, depthRange: [number, number], colorAccent, position`。
- `src/exhibits/ExhibitFactory.ts` — 根据已确认的 Stitch/设计输入与 `exhibits.ts` 数据构建对应 Three.js Object3D；实现可使用几何体组合或本地 GLTF，加载失败时统一回退到默认几何体占位。
- `src/exhibits/ExhibitController.ts` — 管理展品实例集合：订阅 Feature 2 的 `depthProgress`，控制展品淡入/激活范围；订阅 `reducedMotion` 降低动画幅度；实现浮动/旋转动画（通过 `registerUpdatable`）。
- `src/exhibits/InteractionManager.ts` — 使用 `THREE.Raycaster` 处理桌面 hover/click 与移动 tap，触发高亮、减速旋转、cursor 样式切换、打开故事卡片事件。
- `src/exhibits/ParallaxController.ts` — 桌面端鼠标位移驱动的轻微镜头视差（读取 reducedMotion 降低幅度）。
- `src/ui/StoryCard.ts` — 故事卡片 HTML 组件：半透明玻璃样式、展品编号/名称/故事内容、关闭按钮、Esc 键监听、单例显示（内部维护 `activeExhibitId`）。

## 接口契约
- `exhibits: ExhibitData[]`（只读数据源）。
- `ExhibitController.init(sceneManager, depthProgress$, reducedMotion$): void`
- `InteractionManager.on('exhibit:select', (id: string) => void)` — 供 `StoryCard` 订阅打开对应内容。
- `StoryCard.open(id: string): void` / `StoryCard.close(): void`

## 数据模型
```ts
interface ExhibitData {
  id: string;             // e.g. "paper-airplane"
  index: number;           // 1-5，展示编号
  name: string;             // 展品名称，如"没有寄出的远方"
  story: string;            // 故事文案
  depthRange: [number, number]; // 在 depthProgress 上的激活区间
  accentColor: string;      // 局部光效颜色
}
```

## 安全/兼容性
- 遵循 [[security]] 规则：展品资源使用本地文件，不请求外部模型服务。
- 遵循 [[frontend]] 规则：故事卡片文字为 HTML 渲染；交互元素具备 aria-label；键盘可关闭。
- 移动端交互路径完全不依赖 hover 事件，通过 pointer/touch 事件统一处理。

## 技术决策与理由
- 展品数据与渲染/交互逻辑分离（`exhibits.ts` 纯数据 + `ExhibitFactory`/`ExhibitController` 消费），满足 PRD F-004"展示逻辑不硬编码在多个组件中"的约束，且便于未来替换为 GLTF 而不改动交互层。
- 使用统一 `InteractionManager` 处理 hover 与 tap，避免桌面/移动端各自实现一套交互逻辑导致的重复与不一致。
- 视觉实现方式在进入 Feature 3 时才依据设计输入确认；交互层与数据层不依赖“几何体或 GLTF”的具体选择。
