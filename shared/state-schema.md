# 状态系统：.buildrail/state.json

> **为什么有这个文件**：BuildRail 的全自动路径（`/br-full-dev`）承诺"丢一句话自动跑完"。但自动跑完 = 黑盒——用户看不到现在跑到哪、为什么跳过、自动做了什么决策。`state.json` 是唯一的**运行时真实源**：每个 skill/command 在关键节点原子写入它，`/br-status` 读它渲染成人类可读的进度。把黑盒变白盒，是新手信任的天敌。
>
> **与文档状态的关系**：`.buildrail/idea/` 和 `.buildrail/plans/` 里的 frontmatter `状态: DRAFT|APPROVED` 描述的是**文档的生命周期**（见 output-format.md）。`state.json` 描述的是**当前这次运行**的执行进度。两者独立，不要混用。

---

## 文件位置

```
.buildrail/state.json
```

每次新运行（用户调用任意顶层命令 `/br-full-dev` / `/br-bugfix` / `/br-iterate`）开始时，**覆盖式重写**为新 run。历史 run 不保留——个人工具不需要审计轨迹，"现在"才是用户关心的。

> 若用户想保留历史，可手动 `cp state.json state-YYYY-MM-DD.json`。BuildRail 不自动归档。

---

## JSON Schema

```jsonc
{
  // —— 运行元信息 ——
  "run": {
    "id": "2026-06-25-1430",           // 运行标识：启动时间 YYYY-MM-DD-HHMM
    "command": "br-full-dev",           // 触发的顶层命令
    "path": "full-auto",                // full-auto（br-full-dev 全自动） | step（分步命令，见 two-paths.md）
    "started_at": "2026-06-25T14:30:00", // ISO 时间戳
    "updated_at": "2026-06-25T14:42:11",
    "status": "running"                 // running | completed | failed | aborted
  },

  // —— 阶段进度（br-full-dev 的 5 阶段；其它命令填自己用到的） ——
  "phase": {
    "current": "execute",               // explore | plan | execute | review | ship
    "label": "阶段 3：执行与验证循环",
    "entered_at": "2026-06-25T14:35:00"
  },

  // —— 产物指针（用户随时能点开看） ——
  "artifacts": {
    "idea": ".buildrail/idea/2026-06-25-login-requirement.md",
    "plan": ".buildrail/plans/2026-06-25-login-plan.md"
  },

  // —— 任务级进度（核心，用户最关心） ——
  "tasks": [
    {
      "id": "task-001",
      "title": "实现登录 API 端点",
      "status": "done",                 // pending | in_progress | done | skipped | failed
      "size": "S",
      "attempts": 0,                    // debug 重试次数（done 时通常 0）
      "verify": {                       // 最近一次验收结果
        "pass": 2, "fail": 0,
        "evidence": "2 passed in 0.05s"
      },
      "started_at": "2026-06-25T14:36:00",
      "finished_at": "2026-06-25T14:38:22"
    },
    {
      "id": "task-003",
      "title": "登录限流中间件",
      "status": "skipped",              // ⚠️ 跑飞的关键信号
      "size": "M",
      "attempts": 3,                    // 连续 3 次验收失败 → 跳过
      "failure": {                      // status != done 必填
        "reason": "verify_failed_3x",   // 见下方 failure.reason 枚举
        "summary": "限流计数器在并发下丢更新",
        "evidence": "测试 test_rate_limit_concurrent 失败：预期 5 次请求拦截 4 次，实际拦截 2 次",
        "root_cause_guess": "计数器用内存 Map，未加锁，竞态导致丢失",
        "tried": [
          "第1次：加 Map.clear() 重置 → 失败",
          "第2次：改用 Set 计数 → 失败"
        ],
        "next_steps": [
          "改用 Redis INCR 做原子计数",
          "或加 mutex 锁保护 Map"
        ]
      },
      "started_at": "2026-06-25T14:40:00",
      "finished_at": "2026-06-25T14:48:30"
    }
  ],

  // —— 全量验证（run 第四步 / br-bugfix S2-S3） ——
  "global_check": {
    "test": { "status": "pass", "evidence": "12 passed" },
    "build": { "status": "pass", "evidence": "build success" },
    "lint": { "status": "skip", "evidence": "未检测到 lint 命令" }
  },

  // —— 代码审查结果（br-review 产出，br-full-dev 阶段 4 / /br-review 消费） ——
  "review": {
    "verdict": "pass",                       // pass（可发布） | conditional（需修小问题） | block（有 Critical/HIGH 必须修）
    "critical_count": 0,
    "high_count": 0,
    "issues": [                              // 按严重度降序
      {
        "severity": "high",                  // critical | high | medium | low | nit
        "file": "src/auth/login.ts",
        "line": 42,
        "summary": "密码明文传给日志",
        "suggestion": "改为只记录用户 ID"
      }
    ]
  },

  // —— 自动决策日志（全自动路径 A 的"我替你做了这些决策"清单） ——
  "auto_decisions": [
    {
      "phase": "explore",
      "decision": "路由到 br-brainstorming",
      "reason": "判断为小功能增强（在已有系统加登录）",
      "auto": true                    // 是否自动采纳（manual 模式下可能是用户选的）
    },
    {
      "phase": "scope-check",
      "decision": "HIGH-1『登录失败重试无退避』自动修改设计文档",
      "reason": "推荐修改明确且改动可控",
      "auto": true
    },
    {
      "phase": "scope-check",
      "decision": "HIGH-2『session 存储未定』标记为 tradeoff",
      "reason": "涉及技术选型，留给 task-breakdown 标注风险",
      "auto": true
    }
  ],

  // —— 统计（/br-status 直接读这里） ——
  "stats": {
    "total": 4,
    "done": 3,
    "skipped": 1,
    "failed": 0
  }
}
```

---

## 写入契约

**原则：每个 skill/command 在关键节点原子更新 state.json。** 不要积累到最后一次性写——用户可能在任意时刻打开 `/br-status`。

### command 级 vs skill 级写入

state.json 的初始化分两层，避免"必须经过 command 才有 state"的隐含假设：

- **command 级（顶层入口：full-dev/bugfix/iterate/run/idea/br-plan/br-review/br-ship/br-debug/br-scope-check/br-office-hours/br-brainstorming）**：用户直接 `/xxx` 触发时，**覆盖式重写整个文件**，建立新的 run。这是"一次运行"的起点。
- **skill 级（底层能力：所有 `skills/*/SKILL.md`）**：每个 skill 开头有一段"运行状态约定"，声明自己启动时**若 state.json 不存在或不是自己这次 run，则按自己的 command 名初始化**；若已是当前 run，则只更新自己负责的字段（phase、tasks、verify、review 等）。

这样设计的原因：skill 可能被 command 编排调用（经过 command 初始化），也可能被 agent 自动激活（没经过 command）。两种情况下 skill 自己都能保证 state.json 可用，`/br-status` 不会因为"没经过 command"就显示旧状态。

> **判定"要不要覆盖式初始化"**：读 state.json，若 `run.status === "running"`（有活跃 run）→ 本 skill 是被上层编排调用的子步骤，**只更新自己负责的字段，不覆盖 run**；若没有活跃 run（文件不存在、status 非 running）→ 本 skill 是入口（用户单独触发或被自动激活），覆盖式初始化。**不靠 command 名匹配**——因为 br-debug 被 `/br-bugfix` 调用时 command 名是 "br-bugfix" 不是 "br-debug"，靠名字匹配会误判为新 run 而覆盖掉父流程状态。

### 各角色的写入职责

| 角色 | 写入时机 | 写入字段 |
|------|---------|---------|
| **顶层命令启动**（full-dev/bugfix/iterate/run/idea/br-plan/br-scope-check/br-review/br-ship/br-debug/br-office-hours/br-brainstorming） | run 开始 | 覆盖式重写整个文件：`run`（id/command/path/started_at/status=running）、`phase.current`、`phase.label` |
| **skill 启动自检**（每个 skill 开头的"运行状态约定"） | skill 被调用时 | 若非当前 run → 按 skill 自己的 command 名初始化 `run`/`phase`；若是当前 run → 只更新自己负责的字段 |
| **路由判断**（idea / full-dev 阶段1） | 判定后立即 | `auto_decisions` += {phase:explore, decision:路由到X, reason, auto} |
| **阶段决策**（full-dev 各阶段、scope-check HIGH 处理） | 每个决策后 | `auto_decisions` += 对应条目；`auto` 字段由是否全自动决定（path=full-auto 且自动处理 → true；path=step 且用户选 → false） |
| **任务状态变化**（run 执行循环） | 状态每次变化 | 对应 `tasks[i].status`、`attempts`、`started_at`/`finished_at`、`verify` |
| **调试失败**（br-debug 重试耗尽） | 返回 unresolved/partial 时 | 对应 `tasks[i].failure`（reason/summary/evidence/root_cause_guess/tried/next_steps）、`attempts`、`status=skipped\|failed` |
| **全量验证**（run 第四步） | 每项跑完 | `global_check.test/build/lint` |
| **代码审查**（br-review） | 审查完成 | `review.verdict`、`review.critical_count`、`review.high_count`、`review.issues[]`（按严重度降序）；verdict=block 时禁止 br-ship 放行 |
| **运行结束** | 完成/失败/中止 | `run.status`、`run.updated_at`、`phase.current`（completed 时清空或标记 done） |

### `failure.reason` 枚举

| reason | 含义 | 触发者 |
|--------|------|--------|
| `verify_failed_3x` | 验收连续 3 次失败被跳过 | run.md 3.4 |
| `debug_unresolved` | br-debug 2 次重试未解决 | br-debug |
| `dependency_missing` | 依赖任务被跳过，本任务无法执行 | run.md 3.1 |
| `test_timeout` | 验收命令超时 | br-verify |
| `user_aborted` | 用户中途说"停止" | 任意 |

---

## 读写约定

**读**：agent 用原生文件读取工具读全文后 JSON 解析。不要用 `cat state.json | grep`。

**写（原子更新）**：
1. 读取当前 state.json（或初始化为空结构）
2. 修改对应字段
3. **整体写回**（先写临时文件再 rename，或直接覆盖——个人工具接受非原子）
4. 刷新 `run.updated_at`

> "整体写回"比"原地 patch"简单且不易出错。state.json 体量小（<50KB），整体覆盖无性能问题。

**初始化**：若 `.buildrail/state.json` 不存在，顶层命令启动时创建并填入 `run` + 空 `tasks`。

---

## 隐私与提交

- state.json 含**运行细节**（错误、猜测、尝试），可能敏感。
- **`.gitignore` 应排除 `.buildrail/state.json`**（保留 idea/plans 文档，但不提交运行状态）。README 的"本地化"原则已承诺不污染——state 属于"本地运行态"，不该进版本库。
- 在 README 与安装器里提示用户加这条 gitignore。
