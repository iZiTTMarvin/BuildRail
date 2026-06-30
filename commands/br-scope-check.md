---
description: 范围挑战。审查设计文档的复用、最小变更集、复杂度、技术选型、完整性、Not Doing 一致性。可选步骤。
argument-hint: [可选：补充说明]
---

# /br-scope-check — 范围挑战（分步路径 B 的可选步骤）

在设计文档 APPROVED 之后、生成实现计划之前，对设计做 6 项范围挑战。帮你在写代码前发现问题——比写完再发现便宜 100 倍。

**用户补充说明：** $ARGUMENTS

---

## 什么时候用这个命令

- 你已经有一份 APPROVED 的设计/需求文档（`/idea` 或 `/br-office-hours` / `/br-brainstorming` 的产物）
- 你想在拆任务前挑战设计的范围、复杂度、可行性
- 这是**可选步骤**——`/br-plan` 内部也会调用它，如果你打算直接 `/br-plan` 可以跳过本命令

---

## 执行

读取 `skills/br-scope-check/SKILL.md`，按其流程执行。

**关键：本命令是分步路径 B（用户直接调用）**，所以 skill 内部走"逐条询问"策略——每个 HIGH 问题用 AskUserQuestion 让你单独拍板，不批量处理。这与被 `/br-full-dev` 级联调用时的"自动批量处理"不同（见 `shared/two-paths.md`）。

执行要点：
- 先按 `shared/file-ops.md` 的 **P1** 找到最新的 APPROVED 设计/需求文档
- 逐项执行 6 项检查
- 对每个 HIGH 问题，单独询问用户决策
- 每个决策写入 `.buildrail/state.json`（`auto_decisions` 数组，`auto: false`，因为是你选的）

---

## 初始化运行状态

按 `shared/state-schema.md` 覆盖式写入 `.buildrail/state.json`：
- `run`：{id: 当前时间 YYYY-MM-DD-HHMM, command: "br-scope-check", path: "step", started_at, status: "running"}
- `phase`：{current: "scope-check", label: "范围挑战"}
- `artifacts.idea`：找到的设计/需求文档路径
- `auto_decisions`：[]（逐条追加）

---

## 收尾

输出（见 skill 第五步）：
> "✅ Scope Check 完成。HIGH: X, MEDIUM: Y, LOW: Z。
> 设计文档已更新（检查结果已追加到文档末尾）。
> **下一步**：可运行 `/br-plan` 生成实现计划。"

---

## 异常处理

| 场景 | 处理 |
|------|------|
| 没有 APPROVED 设计文档 | 提示"没有找到已确认的设计/需求文档。请先运行 `/idea`。" |
| 设计文档是 DRAFT 状态 | 提示先确认文档："这份设计文档还是 DRAFT 状态。请先确认（说'确认'或'同意'）。" |
| 设计文档内容太少（<5 行实质内容） | 标记为 HIGH："设计文档内容不足以生成计划。建议补充：问题陈述、方案、约束条件。" |

## 语气风格

- 像一个工程经理在计划评审会上提问——直接、具体、不废话
- 用中文，用"你"不用"您"
- 不确定的地方直接说"我不确定，你觉得呢？"