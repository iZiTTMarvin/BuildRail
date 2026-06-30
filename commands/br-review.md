---
description: 代码审查。合并前对本次所有 Diff 做五轴审查（正确性、可读性、架构、安全、性能）。
argument-hint: [可选：指定要审查的文件或 commit 范围]
---

# /br-review — 代码审查（分步路径 B 的第四步）

对本次所有变更做五轴代码审查。像一个高级工程师在做 Code Review——直接说问题，不客套。

**用户补充说明：** $ARGUMENTS

---

## 什么时候用这个命令

- 你已经用 `/run` 实现完任务，想在发布前审查代码
- 这是分步路径 B 的第四步（`/idea` → `/br-plan` → `/run` → **`/br-review`** → `/br-ship`）
- 也可以单独用——任何想对当前 Diff 做审查的场景

---

## 执行

读取 `skills/br-review/SKILL.md`，按其五轴审查流程执行：
1. 理解上下文（这个变更要做什么）
2. 先看测试
3. 带着五个轴逐文件走一遍（正确性、可读性、架构、安全、性能）
4. 分类发现（标严重度：Critical / HIGH / Nit / Optional / FYI）
5. 验证"验证"（测试、构建、手动验证是否充分）
6. 死代码卫生检查

**安全/性能维度**按需展开对应参考文件：
- 安全：`references/security-checklist.md`
- 性能：`references/performance-checklist.md`

---

## 初始化运行状态

按 `shared/state-schema.md` 覆盖式写入 `.buildrail/state.json`：
- `run`：{id: 当前时间 YYYY-MM-DD-HHMM, command: "br-review", path: "step", started_at, status: "running"}
- `phase`：{current: "review", label: "代码审查"}

---

## 返回结构化结果

审查完成后，按 skill 末尾的 `review_result` 返回契约输出结构化结果，并写入 state.json 的 `review` 字段（见 `shared/state-schema.md`）。这让 `/br-status` 能渲染审查结论，也让 `/br-ship` 能据此判断是否放行。

---

## 收尾

**本命令是分步路径 B（用户直接调用）**，审查报告末尾追加提示：
> "✅ 代码审查完成。
> 审查通过可运行 `/br-ship` 发布；发现问题用 `/run` 修复后重跑，或手动改后用 `/br-verify` 验收。"

更新 state.json：`run.status: completed`、`run.updated_at`。

---

## 异常处理

| 场景 | 处理 |
|------|------|
| 没有任何 Diff（工作区干净） | 提示"没有可审查的变更。请先运行 `/run` 实现任务。" |
| Diff 太大（>1000 行） | 建议拆分变更后再审查 |
| 测试未通过就请求审查 | 标记为 Critical："测试未通过，审查无意义。请先让测试通过。" |

## 语气风格

- 别走过场——没看代码就 LGTM 是在害人
- 有问题直接说，给替代方案
- 用中文，用"你"不用"您"