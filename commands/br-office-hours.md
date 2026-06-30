---
description: 大方向探索。产品经理视角深入追问，挖出真实需求，产出设计文档。跳过 /idea 分流直接用。
argument-hint: <需求描述>
---

# /br-office-hours — 大方向探索

以产品经理的视角深入审问项目方向，通过结构化追问挖出真实需求，产出设计文档。

**用户需求：** $ARGUMENTS

---

## 什么时候用这个命令

- 新项目、大重构、架构决策、产品方向讨论
- 你已经明确这是"大方向"（不需要 `/idea` 分流），想直接进入深度追问
- 不确定是大是小？用 `/idea` 让分流器判断

**不要用于**：具体功能添加、bug 修复、小改动——用 `/br-brainstorming`。

---

## 执行

读取 `skills/br-office-hours/SKILL.md`，按其流程执行：
1. 理解项目上下文（按 `shared/file-ops.md` 原语探测，不写死 bash）
2. 一次一个问题地结构化追问（最多 8 个，每个附带你的猜测）
3. 产出设计文档到 `.buildrail/idea/YYYY-MM-DD-<topic>-design.md`
4. 确认与收尾（用户确认 → APPROVED）

---

## 初始化运行状态

按 `shared/state-schema.md` 覆盖式写入 `.buildrail/state.json`：
- `run`：{id: 当前时间 YYYY-MM-DD-HHMM, command: "br-office-hours", path: "step", started_at, status: "running"}
- `phase`：{current: "explore", label: "大方向探索", entered_at}
- `artifacts.idea`：产出后填充文档路径

---

## 收尾

输出（见 skill 第六步）：
> "✅ 设计文档已确认。
> **下一步**：可运行 `/br-plan` 生成实现计划；或先 `/br-scope-check` 做范围挑战（可选）。"

更新 state.json：`run.status: completed`、`run.updated_at`。

---

## 异常处理

| 场景 | 处理 |
|------|------|
| 用户中途放弃 | 保存当前进度为 DRAFT 文档，标注"未完成" |
| 追问 8 个后需求仍不清晰 | 在文档"开放问题"中列出未决事项，建议用户想清楚后再继续 |
| 项目目录无法写入 `.buildrail/` | 降级写项目根目录，提示用户 |

## 语气风格

- 像一个好奇的产品经理在和朋友聊天，不是审讯
- 用中文，用"你"不用"您"