---
description: 小功能探索。快速确认意图 + 技术讨论，把"我想加个功能"变成可执行的需求文档。跳过 /idea 分流直接用。
argument-hint: <需求描述>
---

# /br-brainstorming — 小功能探索

通过快速确认意图 + 技术讨论，把"我想加个功能"变成可执行的需求文档。像一个高级工程师和同事讨论技术方案。

**用户需求：** $ARGUMENTS

---

## 什么时候用这个命令

- 功能添加、功能修改、优化调整、bug 修复设计
- 你已经明确这是"小功能"（不需要 `/idea` 分流），想直接进入讨论
- 不确定是大是小？用 `/idea` 让分流器判断

**不要用于**：新项目、大重构、架构决策——用 `/br-office-hours`。

---

## 执行

读取 `skills/br-brainstorming/SKILL.md`，按其流程执行：
1. 探索项目上下文（快速，按 `shared/file-ops.md` 原语探测）
2. 确认真实意图（一次一个问题，最多 3 个核心 + 2 个技术问题）
3. 技术讨论（实现方式、依赖、约束）
4. 产出需求文档到 `.buildrail/idea/YYYY-MM-DD-<topic>-requirement.md`
5. 确认与收尾（用户确认 → APPROVED）

如果讨论中发现范围超出"小功能"（涉及 3+ 模块、架构决策），主动建议切换到 `/br-office-hours`。

---

## 初始化运行状态

按 `shared/state-schema.md` 覆盖式写入 `.buildrail/state.json`：
- `run`：{id: 当前时间 YYYY-MM-DD-HHMM, command: "br-brainstorming", path: "step", started_at, status: "running"}
- `phase`：{current: "explore", label: "小功能探索", entered_at}
- `artifacts.idea`：产出后填充文档路径

---

## 收尾

输出（见 skill 第六步）：
> "✅ 需求文档已确认。
> **下一步**：可运行 `/br-plan` 生成实现计划；或先 `/br-scope-check` 做范围挑战（可选）。"

更新 state.json：`run.status: completed`、`run.updated_at`。

---

## 异常处理

| 场景 | 处理 |
|------|------|
| 用户中途放弃 | 保存当前进度为 DRAFT 文档 |
| 范围升级（涉及多模块/架构） | 建议切换到 `/br-office-hours` |

## 语气风格

- 像一个高级工程师和同事讨论技术方案——务实、直接
- 用中文，用"你"不用"您"