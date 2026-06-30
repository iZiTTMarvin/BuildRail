---
description: 查看 BuildRail 当前运行的进度、跳过的任务、自动决策清单。把黑盒变白盒。
argument-hint: [可选：latest 查看最近一次运行的完整诊断]
---

# /br-status — 运行状态查看

读取 `.buildrail/state.json`，用**自然语言**渲染当前运行的进度。用户随时能查：现在跑到哪、为什么跳过、自动做了什么决策、下一步怎么办。

**用法：**
- `/br-status` —— 看当前/最近一次运行的进度概览
- `/br-status latest` —— 额外展开所有 skipped/failed 任务的完整诊断（原因 + 尝试记录 + 建议）

**用户输入：** $ARGUMENTS

---

## 第一步：读取状态

按 **shared/file-ops.md 的 P2** 读取 `.buildrail/state.json`。

| 情况 | 输出 |
|------|------|
| 文件存在 | 解析 JSON，继续渲染 |
| 文件不存在 | "📝 还没有运行记录。试试 `/br-full-dev <需求>`、`/br-bugfix <bug>` 或 `/br-iterate <改动>` 开始一次运行。" 然后结束。 |

---

## 第二步：渲染概览

输出格式（**用自然语言，不要暴露 JSON 字段名/技术术语**）：

```markdown
## 运行状态

**做什么**：{run.command} — {一句话标题，从 artifacts.idea 或 plan 推断}
**模式**：{全自动 / 半自动}
**状态**：{进行中 / 已完成 / 失败 / 已中止}
**时间**：{started_at} 起，{updated_at} 最后更新

### 进度：{stats.done}/{stats.total} 完成，{stats.skipped} 跳过，{stats.failed} 失败

当前阶段：{phase.label}

### 任务

| 任务 | 状态 | 说明 |
|------|------|------|
| task-001 实现登录 API | ✅ 完成 | 验收 2/2 通过 |
| task-002 登录页前端 | 🔄 进行中 | — |
| task-003 限流中间件 | ⏭️ 跳过 | 连续 3 次失败：{failure.summary} |
| task-004 登出功能 | ⏳ 待开始 | — |

### 产物
- 设计/需求：{artifacts.idea}（若已生成）
- 实现计划：{artifacts.plan}（若已生成）
```

**任务状态图标映射**（统一全项目）：
- `pending` → ⏳ 待开始
- `in_progress` → 🔄 进行中
- `done` → ✅ 完成
- `skipped` → ⏭️ 跳过
- `failed` → ❌ 失败

---

## 第三步：渲染自动决策清单（仅全自动路径 A）

如果 `run.path === "full-auto"` 且 `auto_decisions` 非空，追加：

```markdown
### 我替你自动做的决策（{N} 项）

1. **路由判断**：自动选择 {br-brainstorming}，因为 {reason}
2. **范围挑战**：自动处理 {HIGH-1}——{decision}，因为 {reason}
3. **范围挑战**：{HIGH-2} 标记为风险待定，因为 {reason}
...
```

> 这是兑现"全自动"承诺的关键——用户跑完一次能看到"工具到底替我做了哪些决定"，而不是完全黑盒。

---

## 第四步：展开诊断（仅 `/br-status latest` 或有 skipped/failed 时）

**默认行为**：只要存在 skipped/failed 任务，**自动展开**它们的诊断（即使用户没加 `latest`）——因为这是用户最需要知道"为什么坏了"的场景。

对每个 `status` 为 `skipped` 或 `failed` 的任务，输出：

```markdown
### ⏭️ task-003「限流中间件」为什么跳过

**现象**：{failure.summary}
**证据**：{failure.evidence}
**根因猜测**：{failure.root_cause_guess}
**已尝试**：
  - {tried[0]}
  - {tried[1]}
**建议下一步**：
  - {next_steps[0]}
  - {next_steps[1]}
```

渲染完成后追加一句**可操作的引导**：

> 想重新尝试？运行 `/run 从 task-003 开始`，或手动 `/br-debug`。

---

## 第五步：完成态摘要（status 非 running 时）

如果 `run.status === completed`：

```markdown
### ✅ 本次运行已完成

完成了 {stats.done}/{stats.total} 个任务。
{若 stats.skipped > 0}：有 {stats.skipped} 个任务被跳过，建议查看上面的诊断决定是否补做。
{若全 done}：所有任务全部完成，无遗留问题。
```

如果 `run.status === failed` 或 `aborted`：

```markdown
### ⚠️ 本次运行未完成

原因：{从 tasks 里找 status=failed 的，或 run 里记录的中止原因}
建议：{从 failure.next_steps 或固定引导「检查失败任务，修复后用 /run 继续」}
```

---

## 异常处理

| 场景 | 处理 |
|------|------|
| state.json 存在但 JSON 格式错误 | "⚠️ 状态文件损坏（{错误位置}）。建议删除 `.buildrail/state.json` 重新开始一次运行。" |
| state.json 缺字段（旧版本/手改过） | 尽量用现有字段渲染，缺失部分显示"—"，不崩溃 |
| tasks 为空 | 显示运行元信息 + "暂无任务（可能还在探索/计划阶段）" |
| 用户在 run 进行中查询 | 显示当前实时进度（status: running），不阻塞 |

---

## 语气风格

- **用自然语言，不要技术术语**：说"跳过"不说"status=skipped"，说"全自动模式"不说"mode=auto"。
- **可操作**：每个 skipped/failed 都给出"下一步怎么办"，不要只陈列问题。
- **简洁**：概览一屏内看完，诊断按需展开。
- 用中文，用"你"不用"您"。
