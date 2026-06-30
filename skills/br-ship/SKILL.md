---
description: 发布环节。更新变更记录、打 Tag 并推送代码。
---

# /br-ship — 发布模块

负责将已验证通过的代码变更安全地记录并发布。在整个自动化流水线（bugfix, iterate, full-dev）的最后一步被调用。

## 职责
1. 更新项目变更记录（CHANGELOG.md）
2. 提交元数据文件
3. 推送代码到远程仓库

## 第一步：更新 CHANGELOG
检查项目根目录是否存在 `CHANGELOG.md`（或类似变更日志文件）。
- 如果不存在：创建它，并添加基本标题。
- 如果存在：在顶部（最新日期下）追加本次发布的变更总结。

**变更记录要求格式（遵循全局用户指令）：**
```markdown
## YYYY-MM-DD

- **Category**: [简短总结]
  - [主要变动 1]
  - [主要变动 2]
```
*规则：保持记录简短、准确、可审查，不写过程，不贴大段代码。内部重构或极微小改动如无必要可跳过更新。*

## 第二步：代码提交
*(注意：功能代码应该已经在上游工作流（如 /run 或 /br-bugfix）中分步 commit。这里只负责最后收尾。)*
执行命令将变动记录提交：
```bash
git add CHANGELOG.md
git commit -m "chore: update changelog for latest changes"
```

## 第三步：推送到远程
执行推送命令：
```bash
git push origin HEAD
```
*如果推送失败（例如无上游分支、需要 pull 等），向用户报告错误，请用户介入处理，禁止强制推送 (force push)。*

## 结束通知
向用户总结发布状态：
> ✅ **发布流程结束**：所有变更已记录并成功推送。
>
> **后续维护**：发现 bug 用 `/br-bugfix <描述>`；需要小改动用 `/br-iterate <描述>`；要再做新功能用 `/br-full-dev <需求>`（全自动）或 `/idea <需求>`（分步）。
