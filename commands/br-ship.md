---
description: 发布。更新 CHANGELOG，提交元数据，推送到远程。分步路径 B 的第五步（最后一步）。
argument-hint: [可选：补充发布说明]
---

# /br-ship — 发布（分步路径 B 的第五步）

将已验证通过的代码变更安全地记录并发布。整个流水线的最后一步。

**用户补充说明：** $ARGUMENTS

---

## 什么时候用这个命令

- 你已经用 `/run` 实现完任务、用 `/br-review` 审查通过，准备发布
- 这是分步路径 B 的第五步（`/idea` → `/br-plan` → `/run` → `/br-review` → **`/br-ship`**）
- 也可以被 `/br-full-dev` / `/br-bugfix` / `/br-iterate` 级联调用（路径 A）

---

## 执行

读取 `skills/br-ship/SKILL.md`，按其流程执行：
1. 更新 `CHANGELOG.md`（顶部最新日期下追加本次变更总结）
2. 提交元数据文件（`git add CHANGELOG.md && git commit`）
3. 推送到远程仓库（`git push`）

---

## 初始化运行状态

按 `shared/state-schema.md` 覆盖式写入 `.buildrail/state.json`：
- `run`：{id: 当前时间 YYYY-MM-DD-HHMM, command: "br-ship", path: "step", started_at, status: "running"}
- `phase`：{current: "ship", label: "发布"}

---

## 收尾

发布完成后输出：
> "✅ 发布完成。变更已记录到 CHANGELOG 并推送到远程仓库。
> 后续：发现 bug 用 `/br-bugfix`，做新功能用 `/br-full-dev`（全自动）或 `/idea`（分步）。"

更新 state.json：`run.status: completed`、`run.updated_at`、`phase.current: ship`。

---

## 异常处理

| 场景 | 处理 |
|------|------|
| 工作区干净（没有待发布的变更） | 提示"没有可发布的变更。请先运行 `/run` 实现任务。" |
| `CHANGELOG.md` 不存在 | 创建它并添加基本标题（见 skill 第一步） |
| `git push` 失败（远程有新提交） | 提示"远程有新提交，请先 `git pull --rebase` 后重试" |
| `git push` 失败（无权限/无远程） | 提示"推送失败：{错误信息}。可检查远程仓库配置或手动推送" |
| 本次是内部重构/极微小改动 | 按 skill 规则可跳过 CHANGELOG 更新，但仍然 commit + push 代码 |

## 语气风格

- 简洁，用中文，用"你"不用"您"
- 发布完成给一句总结，不堆细节