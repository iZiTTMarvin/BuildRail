---
description: 按计划执行任务。逐个实现、验收、提交，失败自动调试重试。
argument-hint: [可选：指定从哪个任务开始，如 "从 task-003 开始"]
---

# /run — 按计划执行

从实现计划中逐个执行任务，每个任务走"实现→验收→提交"循环。

**用户需求：** $ARGUMENTS

---

## 执行循环

```
读取计划
    │
    ├─ 无 APPROVED 计划 → 提示先跑 /br-plan
    │
    └─ 找到 → 逐个执行任务
        │
        ┌──────────────────────────────────────┐
        │                                      │
        │  实现 ──→ 验收 ──→ 通过 ──→ 提交     │
        │    │                 │               │
        │    │                 └──────────┐    │
        │    │                            │    │
        │    └── 失败 → /br-debug 修复    │    │
        │              │                  │    │
        │              ├─ 修复成功 → 验收  │    │
        │              └─ 2次失败 → 跳过   │    │
        │                       │          │    │
        │                       └──────────┘    │
        │                                      │
        │              下一个任务 ◄─────────────┘
        │                                      │
        └──────────────────────────────────────┘
                    │
                    └─ 全部完成 → 总结
```

---

## 第一步：读取计划

按 **shared/file-ops.md 的 P1** 在 `.buildrail/plans/` 下找最新的 `-plan.md`（读全文，不要用 `ls -lt`）。

**判断**：

| 情况 | 处理 |
|------|------|
| 找到 APPROVED 计划 | 读取，继续 |
| 找到 DRAFT 计划 | 提示用户："计划还是 DRAFT 状态，建议先确认（说'确认'）或直接继续（说'继续'）。"（路径 B 默认停下；若由 br-full-dev 级联调用，则视为已采纳，直接继续，见 `shared/two-paths.md`） |
| 无计划 | 提示："没有找到实现计划。请先运行 `/br-plan` 生成计划。" |

读取计划内容，解析任务列表。提取每个任务的：
- 编号（task-001 等）
- 描述
- 验收标准
- 涉及文件
- 依赖关系
- 预估大小

**如果用户指定了起始任务**（如"从 task-003 开始"），跳到该任务。

**初始化运行状态**：按 `shared/state-schema.md` 覆盖式写入 `.buildrail/state.json`：
- `run`：{id: 当前时间 YYYY-MM-DD-HHMM, command: "run", path: "full-auto" 或 "step"（见下方判定）, started_at, status: "running"}
- `path` 判定：由 br-full-dev 级联调用 → `"full-auto"`；被用户直接 `/run` → `"step"`（见 `shared/two-paths.md`）
- `phase`：{current: "execute", label: "执行与验证循环"}
- `artifacts.plan`：刚找到的计划路径
- `tasks`：从计划解析的所有任务，全 `pending`
- `stats`：{total: 任务数, done:0, skipped:0, failed:0}
- 若用户指定了起始任务，把它之前的任务标 `done`（已在之前运行完成）

> 用户随时可运行 `/br-status` 查看实时进度。提示一句："📋 进度已记录，随时输入 `/br-status` 查看。"

---

## 第二步：检测项目环境

按 **shared/file-ops.md 的 P3** 从 `package.json` / `pyproject.toml` / `Makefile` 中提取 test/lint/build 命令清单（读全文后结构化解析，不要用 `grep -E`）。

记录：
- 测试命令（`npm test` / `pytest` / `make test` 等）
- 构建命令（`npm run build` / `python -m build` 等）
- Lint 命令（如果有）

---

## 第三步：逐个执行任务

对每个任务，按以下流程执行：

### 3.1 检查依赖

如果任务有依赖，确认依赖任务已完成（在任务列表中标记为 ✅）。
如果依赖未完成 → 跳过此任务，先执行依赖任务。
如果依赖任务已被 skipped/failed → **写入 state**：本任务 `status: skipped`、`failure: {reason: "dependency_missing", summary: "依赖 task-NNN 未完成"}`，继续下一个。

### 3.2 实现

**写入 state**：本任务 `status: in_progress`、`started_at: 当前时间`。

按任务描述编写代码。

**实现原则**（来自 agent-skills incremental-implementation）：

1. **简单优先**：写代码前问"最简单能用的方案是什么？"
2. **范围纪律**：只改任务要求的文件，不要"顺便"改其他东西
3. **一次一件事**：不要在一个任务里混多个不相关的改动
4. **保持可编译**：每一步改完，项目必须能构建

**进度通知**：
> 🟡 开始执行 task-001: {任务描述}

### 3.3 验收

调用 `br-verify` skill 验证验收标准。

**写入 state**：本任务 `verify: {pass: N, fail: M, evidence: ...}`（来自 br-verify 的返回）。

**验收结果处理**：

| 结果 | 处理 |
|------|------|
| 全部 PASS | ✅ 进入提交 |
| 有 FAIL | 进入调试重试 |

### 3.4 调试重试（验收失败时）

**第 1 次失败**：
> 🟡 task-001 验收失败（1/3 未通过），正在调试...

调用 `br-debug` skill 进行系统化调试：
1. 复现失败
2. 定位根因
3. 修复代码
4. 重新验收

**写入 state**：本任务 `attempts: 1`。

**第 2 次失败**：
> 🟡 task-001 验收再次失败（2/3 未通过），再试一次...

换方向修复（不在同一个方向继续细调）。

**写入 state**：本任务 `attempts: 2`。

**第 3 次失败**：
> ❌ task-001 连续 3 次验收失败。已跳过。

**写入 state**（关键诊断，`/br-status` 会渲染它）：
```jsonc
{
  "status": "skipped",
  "attempts": 3,
  "finished_at": "当前时间",
  "failure": {
    "reason": "verify_failed_3x",
    "summary": "一句话概括失败现象",
    "evidence": "验收失败的具体输出（测试名/错误信息）",
    "root_cause_guess": "根因猜测",
    "tried": ["第1次方向及结果", "第2次方向及结果"],
    "next_steps": ["建议的下一步1", "建议的下一步2"]
  }
}
```
更新 `stats.skipped += 1`。继续下一个任务。

> 这些诊断信息是 br-debug 返回契约（br-debug.md 的 yaml）的转写——把 `status: unresolved` + `failure_evidence` + `root_cause_guess` + `next_steps` 落到 state.json，让 `/br-status` 能完整渲染。

### 3.5 提交

验收通过后，提交代码：

```bash
git add {涉及的文件}
git commit -m "feat: {任务描述}"
```

**写入 state**：本任务 `status: done`、`finished_at: 当前时间`、`attempts` 保留实际重试次数。`stats.done += 1`。

**进度通知**：
> ✅ task-001 完成。进度: {stats.done}/{stats.total}

### 3.6 下一个任务

回到 3.1，执行下一个任务。

---

## 第四步：全量验证

所有任务执行完后，运行全量验证。**使用第二步检测到的命令**（不要靠 `|| echo` 猜测），逐条执行并记录结果：

- 运行测试命令（若检测到 `npm test` / `pytest` / `make test`；若未检测到则跳过并记录"无测试命令"）
- 运行构建命令（若检测到；否则跳过）
- 运行 lint 命令（若检测到；否则跳过）

**写入 state**：`global_check: {test:{status,evidence}, build:{...}, lint:{...}}`，每项跑完即时写入。

**结果处理**：

| 结果 | 处理 |
|------|------|
| 全部通过 | ✅ 进入总结 |
| 测试失败 | 🟡 尝试修复回归问题 |
| 构建失败 | 🟡 检查类型错误或编译问题 |
| 修复后仍失败 | 记录问题，不阻塞总结 |

---

## 第五步：输出总结

**写入 state（最终态）**：`run.status: completed`、`run.updated_at`、`stats` 最终值。

> 提示用户："📋 完整进度与跳过原因已记录在 `/br-status`，随时可查。"

```markdown
## 执行总结

**计划文件：** {计划文件路径}
**执行时间：** {开始时间} - {结束时间}

### 任务完成情况

| 任务 | 状态 | 说明 |
|------|------|------|
| task-001: {描述} | ✅ DONE | |
| task-002: {描述} | ✅ DONE | |
| task-003: {描述} | ⏭️ SKIPPED | 3 次验收失败：{原因} |
| task-004: {描述} | ✅ DONE | |

**统计：** X 完成 / Y 跳过 / Z 总计

### 全量验证
- 测试：✅ 通过 / ❌ 失败
- 构建：✅ 通过 / ❌ 失败
- Lint：✅ 通过 / ❌ 失败

### 遗留问题
{如果有跳过的任务或验证失败，列出}
```

**按调用方式收尾**（见 `shared/two-paths.md`）：

- **级联调用**（路径 A，被 br-full-dev 调用）：输出总结后，**直接将控制权交还给父工作流**，继续执行后续审查与发布阶段。
- **独立调用**（路径 B，用户直接 `/run`）：总结末尾追加提示：
  > "**下一步**：可运行 `/br-review` 做代码审查；确认无误后 `/br-ship` 发布。跳过的任务可用 `/br-debug <task-id>` 深度排查后 `/run 从 task-NNN 开始` 补做。"

---

## 异常处理

| 场景 | 处理方式 |
|------|----------|
| 用户中途说"停止" | **写入 state**：`run.status: aborted`、当前 task 标记 `status: pending`，保存进度，输出已完成任务的总结 |
| 用户说"跳过当前任务" | **写入 state**：本任务 `status: skipped`、`failure.reason: "user_aborted"`、`failure.summary: "用户手动跳过"`，继续下一个 |
| 实现过程中发现设计有问题 | 记录问题，建议用户回到 `/br-scope-check` 或 `/br-office-hours` |
| git commit 失败 | 检查原因（冲突、hook），修复后重试一次 |
| 任务之间有文件冲突 | 按依赖顺序执行，不做并行 |
| 所有任务都跳过了 | 输出失败报告，建议用户检查计划质量 |

## 语气风格

- 进度通知用 🟡/✅/❌，简洁一句
- 不要解释内部流程（用户不需要知道 br-debug 跑了几步）
- 用中文，用开发者熟悉的语言
- 不要用"您"，用"你"
