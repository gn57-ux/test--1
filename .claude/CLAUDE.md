# 深海失物博物馆

沉浸式 Three.js 3D 单页网站，用户通过滚动潜入深海，依次发现五件承载短故事的"失物"。

## 技术栈
- Three.js 0.185.x（3D 场景、灯光、粒子、EffectComposer/Bloom 后期处理）
- Vite 8.2.x + TypeScript 6.0.x（ES Modules，严格的未使用项检查）
- npm（依赖管理）
- 纯静态单页网站，不使用后端或数据库
- 不强制使用 React，优先最轻量方案；展品数据保存在本地 JSON/TS 数据文件中
- 可选 GSAP 或自定义插值实现滚动动画
- Bloom 等效果使用 Three.js EffectComposer

## 常用命令
- 安装：`npm install`
- 开发：`npm run dev`
- 构建（含 TypeScript 检查）：`npm run build`
- 预览构建：`npm run preview`
- 当前未配置独立的 test/lint 脚本。

## 关键目录
- `src/scene/` — Three.js 场景、粒子与后期处理
- `src/ui/` — HTML UI 层
- `src/utils/` — 通用工具
- `specs/` — Feature 规格、设计与任务清单
- `docs/prd.md` — 产品需求文档

## 规则
@rules/coding-style.md
@rules/testing.md
@rules/security.md
@rules/git-workflow.md
@rules/frontend.md
