---
name: coding-style
description: TypeScript 与 Three.js 代码风格约定
---

- 使用 TypeScript ES Modules；遵循现有代码的单引号、无分号风格。
- `tsconfig.json` 已启用 `noUnusedLocals`、`noUnusedParameters`、`noFallthroughCasesInSwitch`，新增代码必须通过 `npm run build`。
- 场景能力按职责拆分到 `src/scene/`，入口 `src/main.ts` 只负责校验容器并装配模块。
- 不强制使用 React，优先选择最轻量且适合当前项目的实现方案。
- HTML UI 与 Three.js Canvas 分层管理，不要混在同一渲染路径。
- 展品信息保存在本地 JSON 或 TypeScript 数据文件中，展示逻辑不应硬编码在多个组件中（PRD F-004）。
