---
description: 发布。提交并推送已审查通过的代码（需用户确认）。分步路径 B 的第五步（最后一步）。
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
1. **汇报并询问用户**是否提交（br-ship 第零步，human-in-the-loop）
2. 用户同意后：提交代码（`git add` 本次文件 + `git commit`，message 给用户过目）
3. 推送到远程仓库（`git push`）

> **不碰 CHANGELOG。** BuildRail 不假设用户维护变更日志。

---

## 初始化运行状态

按 `shared/state-schema.md` 覆盖式写入 `.buildrail/state.json`：
- `run`：{id: 当前时间 YYYY-MM-DD-HHMM, command: "br-ship", path: "step", started_at, status: "running"}
- `phase`：{current: "ship", label: "发布"}

---

## 收尾

发布完成后输出：
> "✅ 发布完成：代码已提交并推送到远程。
> 后续：发现 bug 用 `/br-bugfix`，做新功能用 `/br-full-dev`（全自动）或 `/idea`（分步）。"
>
> 如果用户在第零步选择暂不提交：`"✅ 开发已完成，改动保留在工作区未提交。需要提交时运行 /br-ship。"`

更新 state.json：`run.status: completed`、`run.updated_at`、`phase.current: ship`。

---

## 异常处理

| 场景 | 处理 |
|------|------|
| 工作区干净（没有待发布的变更） | 提示"没有可发布的变更。请先运行 `/run` 实现任务。" |
| `git push` 失败（远程有新提交） | 提示"远程有新提交，请先 `git pull --rebase` 后重试" |
| `git push` 失败（无权限/无远程） | 提示"推送失败：{错误信息}。可检查远程仓库配置或手动推送" |


## 语气风格

- 简洁，用中文，用"你"不用"您"
- 发布完成给一句总结，不堆细节