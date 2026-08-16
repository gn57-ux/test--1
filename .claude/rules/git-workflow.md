---
name: git-workflow
description: 当前项目的 Git 工作流约定
---

项目已经初始化为 Git 仓库，当前尚无已确认的分支命名、commit message 或 CI 规范。

- 不为每个 Task 强制提交；按用户要求，在项目完成并验收后统一提交。
- 提交前检查变更范围，避免加入 `node_modules/`、`dist/`、密钥或个人信息。
- 未经用户明确要求，不推送远端、不创建 PR、不改写历史。
