---
description: 把设计文档变成可执行的实现计划。自动调用范围挑战 + 任务拆分。
argument-hint: [可选：补充说明]
---

# /br-plan — 实现计划生成

从设计文档到可执行任务列表的自动化流程。

**用户需求：** $ARGUMENTS

---

## 流程总览

```
读取设计文档
    │
    ├─ 无 APPROVED 文档 → 提示先跑 /idea
    │
    └─ 找到 → 调用 br-scope-check
        │
        ├─ HIGH=0 → 直接进入任务拆分
        │
        ├─ 有 HIGH → 修复设计文档 → 第 2 轮检查
        │   ├─ HIGH=0 → 进入任务拆分
        │   └─ 仍有 HIGH → 记录 tradeoff，🟡 通知，继续
        │
        └─ 调用 br-task-breakdown
            │
            └─ 输出计划到 .buildrail/plans/
```

---

## 第一步：读取设计文档

扫描 `.buildrail/idea/` 目录，找到最新的 APPROVED 设计/需求文档：

```bash
ls -lt .buildrail/idea/*-design.md .buildrail/idea/*-requirement.md 2>/dev/null
```

**判断**：

| 情况 | 处理 |
|------|------|
| 找到 APPROVED 文档 | 读取，继续 |
| 找到 DRAFT 文档 | 🟡 提示："找到 DRAFT 状态的文档 `{文件名}`。先确认再继续？" 用 AskUserQuestion：A) 确认文档，继续 B) 跳过确认，直接继续 C) 取消 |
| 无文档 | 提示："没有找到设计/需求文档。请先运行 `/idea`（会自动分流到 `/br-office-hours` 或 `/br-brainstorming`）。" |

读取文档内容，判断类型：
- `-design.md` → 大方向设计文档
- `-requirement.md` → 小功能需求文档

---

## 第二步：调用 br-scope-check

读取 `skills/br-scope-check/SKILL.md`，按其流程执行范围挑战。

**执行时**：
- 不重复读取设计文档（已在第一步读取）
- 不重复读取项目上下文（br-scope-check 内部会处理）
- 按 br-scope-check 的 6 项检查逐项执行
- 每个 HIGH 问题单独用 AskUserQuestion 让用户决定

**scope-check 完成后判断**：

| 结果 | 处理 |
|------|------|
| HIGH=0 | 🟡 通知"范围挑战通过"，直接进入第三步 |
| HIGH>0 且已修复 | 进入第 2 轮检查 |
| 第 2 轮仍有 HIGH | 记录为 tradeoff，🟡 通知用户，继续（不阻塞） |

> **最多 2 轮。** 个人工具不需要 xdev 那样的 5 轮 keep/discard 循环。2 轮后未解决的问题记录为 tradeoff，交给用户后续处理。

---

## 第三步：调用 br-task-breakdown

读取 `skills/br-task-breakdown/SKILL.md`，按其流程生成任务列表。

**执行时**：
- 读取经 scope-check 审查过的最新设计文档
- 如果文档末尾有 scope-check 结果，关注 HIGH 问题和 tradeoff
- 按 br-task-breakdown 的流程：扫描项目 → 拆分任务 → 标注依赖 → 自检 → 写计划

**计划文件写入**：`.buildrail/plans/YYYY-MM-DD-<topic>-plan.md`

---

## 第四步：确认与收尾

计划文件生成后，用 AskUserQuestion 让用户确认：

> "计划已保存到 `.buildrail/plans/{文件名}`。请查看并确认。"

- 用户确认 → 状态改为 APPROVED
- 用户要求修改 → 修改对应任务，重新确认

确认后：
> "✅ 计划已确认。共 X 个任务，涉及 Y 个文件。
> 你可以运行后续 BuildRail skill（如 `/build`）来执行计划。"

---

## 异常处理

| 场景 | 处理方式 |
|------|----------|
| 用户中途说"取消" | 保存当前进度为 DRAFT，提示"已保存当前进度。下次可以继续。" |
| scope-check 超过 2 轮 | 强制进入任务拆分，记录 tradeoff |
| 设计文档太短（<10 行实质内容） | 提示用户补充，但不阻塞（scope-check 会标记为 HIGH） |
| 无 git 记录 | 不影响，继续 |
| `.buildrail/plans/` 无法创建 | 降级写项目根目录 |

## 语气风格

- 通知用户进度时用 🟡 通知风格，简洁一句
- 不要解释内部流程细节（用户不需要知道 scope-check 跑了几轮）
- 用中文，用开发者熟悉的语言
- 不要用"您"，用"你"
