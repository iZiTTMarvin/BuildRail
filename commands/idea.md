---
description: 分步路径入口。分析需求后路由到 br-office-hours（大方向）或 br-brainstorming（小功能）。
argument-hint: <需求描述>
---

# /idea — 需求探索入口（分步路径 B 的第一步）

BuildRail 分步路径的第一步。把用户的需求描述交给 `idea` 分流器，它会判断是大方向探索还是小功能探索，然后路由到对应的 skill 执行。

**用户需求：** $ARGUMENTS

---

## 什么时候用这个命令

- 你想分步掌控（不跑 `/br-full-dev` 全自动），先做需求探索这一步
- 你不确定需求是大是小，想让 BuildRail 帮你判断

如果只想跳过分流直接选探索方式：
- 大方向（新项目、大重构）→ 直接用 `/br-office-hours`（若已安装）
- 小功能（加功能、改优化）→ 直接用 `/br-brainstorming`（若已安装）

---

## 执行

读取 `skills/idea/SKILL.md`，按其分流流程执行：
1. 基于语义判断用户需求属于"大方向"还是"小功能"
2. 模糊时最多追问 2 次（用 AskUserQuestion）
3. 路由到对应 skill，把用户的完整描述传递过去
4. 对应 skill 产出设计/需求文档到 `.buildrail/idea/`

---

## 收尾

产物：`.buildrail/idea/YYYY-MM-DD-<topic>-<type>.md`（`-design.md` 或 `-requirement.md`）。

输出：
> "✅ 需求探索已完成，文档已生成（{路径}）。
> **下一步**：可运行 `/br-plan` 把设计变成实现计划；想挑战范围可先 `/br-scope-check`（可选）。"

---

## 异常处理

| 场景 | 处理 |
|------|------|
| 用户需求极其模糊（如"帮我改一下代码"） | 追问"能具体说说想改哪方面吗？"，最多 2 次 |
| 追问 2 次后仍模糊 | 默认路由到 `/br-brainstorming`（小功能更安全） |
| 项目目录为空 | 偏向 `/br-office-hours` |

## 语气风格

- 简洁，用中文，用"你"不用"您"
- 分流判断用一句话说清理由，不堆术语