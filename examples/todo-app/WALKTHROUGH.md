# BuildRail 5 分钟首跑：Todo App

> 这个示例展示 BuildRail **全自动（`br-full-dev`，路径 A）**跑完一个真实小功能的全过程，包括**一次任务失败被跳过**和**用 `/br-status` 查看进度**。读完后你就能照着自己的需求跑 `br-full-dev`。
>
> 示例的完整产物（需求文档、实现计划、运行状态）都在 `examples/todo-app/.buildrail/` 下，对照着看。

---

## 场景

你想做一个命令行的 Todo 清单工具，能增删查改、数据不丢。

---

## 第 1 步：丢一句话

在装好 BuildRail 的 AI 助手里输入（Windsurf 不用加 `/`）：

```
/br-full-dev 我想做一个命令行的 todo 工具，能增删查改，数据存本地
```

因为是 **`br-full-dev`（全自动，路径 A）**，BuildRail 会自己判断、自己跑，尽量不打断你。

## 第 2 步：它自动做的事（你可以去喝咖啡）

BuildRail 按 5 个阶段推进，每个关键决策都会**记录下来**（不是问你）：

1. **🟡 探索**：自动判断这是"小功能增强"（具体、局部），路由到 `br-brainstorming`。生成需求文档存到 `.buildrail/idea/`。
   - 全自动路径：**不**问你"确认吗"，默认采纳为 APPROVED，直接继续。
2. **🟡 计划**：跑 `br-scope-check` 挑战范围，跑 `br-task-breakdown` 拆任务。生成计划存到 `.buildrail/plans/`。
   - 全自动路径：scope-check 发现的问题**批量自动处理**，不逐条问你。计划默认采纳。
3. **🟡 执行**：逐个任务实现→验收（不提交，改动留在工作区）。
4. **🟡 审查**：跑五轴代码审查。
5. **🟡 发布**：汇报成果 → 问你是否提交 → 你同意才 git commit + push（不碰 CHANGELOG）。

> 想每步都自己拍板？别用 `br-full-dev`，改用分步命令：`/idea` → `/br-plan` → `/run` → `/br-review` → `/br-ship`，每个命令做完停下等你确认（见 `shared/two-paths.md`）。

## 第 3 步：随时看进度 `/br-status`

跑到一半，你随时输入：

```
/br-status
```

会看到这样的输出（这是 todo-app 示例的真实产物对应的渲染）：

```markdown
## 运行状态

**做什么**：br-full-dev — 待办事项最小可用版
**模式**：全自动
**状态**：已完成
**时间**：14:30 起，14:52 最后更新

### 进度：2/4 完成，2 跳过，0 失败
当前阶段：阶段 5：发布

### 任务

| 任务 | 状态 | 说明 |
|------|------|------|
| task-001 实现持久化层 | ✅ 完成 | 验收 3/3 通过 |
| task-002 实现 TodoService | ⏭️ 跳过 | 连续 3 次失败：done(index) 传入越界序号时未按预期抛出错误 |
| task-003 实现 CLI 入口 | ⏭️ 跳过 | 依赖 task-002 未完成 |
| task-004 数据文件路径 | ✅ 完成 | 验收 3/3 通过 |

### 我替你自动做的决策（5 项）

1. **路由判断**：自动选择 br-brainstorming，因为判断为小功能增强
2. **探索阶段**：设计文档默认采纳，因为全自动路径不设门禁
3. **范围挑战**：[MEDIUM-1] 持久化测试隔离 → 自动采纳建议
4. **计划阶段**：实现计划默认采纳，因为全自动路径不设门禁
5. **执行**：task-002 连续 3 次验收失败 → 自动跳过，依赖它的 task-003 一并跳过
```

**这是全自动（`br-full-dev`）的灵魂**——你不是黑盒，跑完能看到工具到底替你做了哪些决定。

## 第 4 步：看懂"跳过的任务"怎么办

`/br-status` 看到 task-002 被跳过时，会自动展开诊断（因为有 skipped 任务）：

```markdown
### ⏭️ task-002「实现 TodoService」为什么跳过

**现象**：done(index) 传入越界序号时未按预期抛出错误
**证据**：测试 test_done_with_invalid_index 失败：预期抛出 RangeError，实际返回 undefined
**根因猜测**：done() 没有对 index 做边界检查，直接访问数组
**已尝试**：
  - 第1次：在 done() 末尾加 if(!task) throw → 仍失败（序号 1-based 问题）
  - 第2次：改成 tasks[index-1] 并加边界检查 → 仍有 case 漏（负数 index）
**建议下一步**：
  - 用 Number.isInteger + 范围检查统一校验 index
  - 或运行 /br-debug task-002 单独深度排查

> 想重新尝试？运行 /run 从 task-002 开始，或手动 /br-debug。
```

**这就是从黑盒变白盒的关键**：新手看到 ⏭️ 不再一脸懵，而是清楚知道"为什么坏、试过什么、下一步怎么办"。

## 第 5 步：补做跳过的任务

按诊断建议，你可以：

```
/br-debug task-002
```

让 br-debug 专门深度排查这一个任务（它会复现、定位根因、修、加测试）。修好后：

```
/run 从 task-002 开始
```

继续把跳过的部分补上。

---

## 对照真实产物

示例目录 `examples/todo-app/.buildrail/` 里有完整产物，对照上面的输出看：

| 文件 | 是什么 | 对应输出 |
|------|--------|---------|
| `idea/2026-06-25-todo-requirement.md` | brainstorming 产出的需求文档 | `/br-status` 的"做什么"标题 |
| `plans/2026-06-25-todo-plan.md` | task-breakdown 产出的计划 | 任务列表的来源 |
| `state.json` | 运行状态真实源 | `/br-status` 渲染的全部内容 |

打开 `state.json` 看 `tasks[1]`（task-002）的 `failure` 字段——那就是 `/br-status` 诊断段的数据来源。

---

## 你现在可以做什么

1. **照着跑**：把 todo 需求换成你自己的，`/br-full-dev <你的需求>`。
2. **想精细控制**：用分步命令 `/idea` → `/br-plan` → `/run` → `/br-review` → `/br-ship`，每步做完停下等你拍板。
3. **跑飞了别慌**：`/br-status` 永远告诉你发生了什么、怎么办。
4. **想看单个命令的用法**：README 的"包含什么"章节有 4 个顶层命令的说明。

---

## 想深入？

- `shared/two-paths.md` —— 全自动 vs 分步两条路径的完整说明
- `shared/state-schema.md` —— state.json 的结构（贡献者看）
- `shared/output-format.md` —— 文档状态与运行状态的区分
- `commands/br-status.md` —— /br-status 的完整渲染逻辑
