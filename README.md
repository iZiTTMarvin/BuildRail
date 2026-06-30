# BuildRail — AI 原生开发工作流集合

> **高度兼容，绝对本地可控。** BuildRail 是一套面向多种 AI 编程助手（Claude Code、Windsurf、OpenCode 等）的轻量级工作流编排文件。它将零散的技能（Skills）整合成端到端的自动化流水线，并彻底解决输出路径不可控、Token 浪费和平台绑定问题。

---

## 快速上手

### 1. 一行命令安装

```bash
npx buildrail init
```

安装器会列出支持的 AI 助手（Claude Code / Windsurf / OpenCode / Cursor），你选一个序号，它自动把命令和技能复制到对应目录。**不需要手动软链接、不需要碰 PowerShell/bash 语法。**

> 没装 Node？也可以直接 `git clone` 后在仓库目录跑 `node cli/buildrail.js init`。

### 2. 直接描述你要做什么

安装完成后，你不需要再手动挑选复杂的底层命令，只需根据目标规模，直接向你的 AI 助手下达最终意图。

BuildRail 会自动评估改动范围，自主拆解并执行：

```bash
# 遇到了报错或需要修 Bug？
/br-bugfix 登录超时后 app 直接崩溃，控制台报错如下: ...

# 需要局部微调或小优化？
/br-iterate 把首页加载的 loading 动画换成骨架屏，宽度保持 100%

# 需要实现一个端到端的全新大功能？
/br-full-dev 帮我接入支付宝和微信的支付模块，并提供统一的后端回调接口
```

> **注意：** 如果你使用的是 Windsurf，无需加 `/` 前缀，直接输入命令即可。

### 3. 本地化状态查看

所有的执行计划、需求探索与技术方案，都会**绝对严格**地生成在当前项目根目录的 `.buildrail/` 文件夹下，不会污染你的 C 盘或其他系统目录。

---

## 两种用法：全自动 vs 分步

BuildRail 不用"开关参数"，而是用**两个不同的入口**满足两种用户。斜杠命令的心智是"命令名 + 说人话"，塞 `--auto`/`--manual` 既反直觉又难记。

### 路径 A：全自动（新手懒人）

```
/br-full-dev 帮我开发登录注册功能
```

零参数、零门禁、一路跑到底。设计→计划→执行→审查→发布一气呵成，不问不等。跑完用 `/br-status` 看它替你做了什么决策。

### 路径 B：分步（资深 / 敏感改动）

```
/idea 帮我开发登录注册功能      → 做完提示"下一步可 /br-plan"
/br-plan                        → 做完提示"下一步可 /run"
/run                            → 做完提示"下一步可 /br-review"
/br-review                      → 做完提示"下一步可 /br-ship"
/br-ship                        → 发布
```

每个命令做完**自然停**（不是门禁打断，是职责边界），并提示下一步。你随时可介入、改、跳过某步。想对范围做挑战可加 `/br-scope-check`（可选）。

详见 `shared/two-paths.md`。

---

## 可观测性：随时知道发生了什么 `/br-status`

全自动模式最大的风险是"黑盒——跑完了但不知道中间发生了什么"。BuildRail 用 `.buildrail/state.json` 记录每次运行的完整进度，`/br-status` 把它渲染成人类可读的报告。

```
/br-status          # 看当前/最近一次运行的进度
/br-status latest   # 额外展开所有跳过/失败任务的完整诊断
```

你会看到：现在跑到哪个阶段、每个任务什么状态、**为什么某个任务被跳过**（现象/证据/根因猜测/试过什么/下一步建议）、全自动（`/br-full-dev`）跑完后工具替你自动做了哪些决策。

**跑飞了别慌**——`/br-status` 永远告诉你发生了什么、怎么办。看完诊断后，`/br-debug <task-id>` 单独深度排查，或 `/run 从 task-NNN 开始` 补做。

> 新手第一次看完整产物长什么样？读 [`examples/todo-app/WALKTHROUGH.md`](examples/todo-app/WALKTHROUGH.md)，5 分钟走完"丢一句话 → 自动跑 → 查看进度 → 补做跳过的任务"的完整闭环（含一次真实的失败演示）。

---

## 为什么要用 BuildRail？

现存的 AI 工具链和命令行集合已经很多了，但 BuildRail 致力于解决日常重度使用 AI 编程时的几个核心痛点：

### 核心痛点与对比

| | gstack (office-hours) | superpowers (brainstorm) | agent-skills | **BuildRail** |
|---|---|---|---|---|
| **输出路径控制** | 较弱（常写入系统级隐藏目录） | 中等 | 好 | **极佳（严格锁定在项目 `.buildrail/` 目录）** |
| **执行重量级** | 中等 | 极重（强制全套流程） | 中等 | **自适应（小任务走快速路，绝不浪费 Token）** |
| **平台兼容性** | 偏向于 Codex | 偏向于特定插件框架 | 强绑定 Claude Code | **极高（原生兼容多种 Markdown 驱动的 Agent）** |
| **技能聚合度** | 离散指令，需用户手控流转 | 高聚合，但缺乏灵活性 | 偏底层具体操作 | **四大顶层入口，自动编排 10 项底层技能** |

**BuildRail 不重复造轮子。** 
社区里已经有非常优秀的技能：`office-hours` 的深度追问逻辑、`brainstorm` 的一次一问体验，以及 `agent-skills` 的 TDD 哲学。
**BuildRail 做的是统一编排与体验重塑**：提取它们的精华逻辑，剔除掉臃肿的无关依赖和强绑定的平台限制，用更轻量、更聚焦的方式重新拼装成一套“开箱即用”的流水线。

---

## 包含什么

BuildRail 提供了 4 个顶层工作流命令和 10 个底层基础技能单元：

### 顶层工作流（日常只用这四个）

| 工作流 | 使用场景 | 特点与防线 |
|--------|---------|-----------|
| **`/br-bugfix`** | Bug 修复、崩溃排查 | **三级自适应**。自动判定 S1（极速）、S2（标准 TDD）、S3（深度 Debug）。一旦简单路径走不通，自动升级降级。 |
| **`/br-iterate`** | 小改动、样式调整、配置修改 | **范围门控 (Impact Gate)**。强制拦截超大范围或敏感业务修改。范围内的小需求走极速闭环，省时省 Token。 |
| **`/run`** | 已有 APPROVED 计划，直接执行 | **任务循环机**。逐个实现、验收、提交，失败自动调用 `br-debug` 修复。被 `/br-full-dev` 自动调用，也可独立使用。 |
| **`/br-full-dev`**| 新功能、大型重构、跨模块架构变更 | **端到端串联**。将需求探索、方案对比、计划拆分、代码执行、五轴审查到变更发布全部串联。内部会自动调用 `/run` 执行。 |

> **何时直接用 `/run`**：你已经有了一份 APPROVED 计划（`/br-plan` 产物），想跳过设计阶段直接进入实现。例如：昨天 `/br-full-dev` 走到一半中断了，今天接着干。
>
> **何时直接用 `/br-plan`**：你只想生成实现计划、暂时不执行（比如要先和同事评审计划）。`/br-plan` 会调用 `br-scope-check` 做范围挑战、`br-task-breakdown` 拆分任务，产出 APPROVED 计划后停下来等你。

### 底层能力单元（被顶层自动调用，也可在分步路径单独调用）
- `idea` / `br-office-hours` / `br-brainstorming`：负责需求探索与意图挖掘。分步路径从 `/idea` 进入，也可跳过分流直接用 `/br-office-hours` 或 `/br-brainstorming`。
- `br-scope-check` / `br-task-breakdown`：负责架构风险挑战与任务垂直拆分。`/br-scope-check` 可单独调做范围挑战。
- `br-test` / `br-debug` / `br-verify` / `br-review`：负责代码实现的测试、调试、验收与质量把控。`/br-debug` 可单独排查某个失败任务，`/br-review` 可单独审查当前 Diff。
- `br-ship`：负责最终交付的 Changelog 更新与代码合并推送。

> 分步路径命令一览见上方"两种用法"章节：`/idea` → `/br-plan` →（`/br-scope-check` 可选）→ `/run` → `/br-review` → `/br-ship`，任意一步做完会提示下一步。

---

## 工作流架构：自适应与解耦

AI 工作流最容易失败的原因通常不是 AI 写不了代码，而是：**小题大做（浪费 Token）**或**大题小做（引发灾难级回归）**。

### 1. 范围门控快速路径 (/br-iterate)
```
拦截检查（行数 / 文件数 / 新依赖 / API 契约 / 敏感路径）
  │
  ├── 触发任意拦截限制 → 强行打断，建议升级到 /br-full-dev
  └── 在安全范围内 → 极速 TDD 编码 → 自动验证 → ship
```

### 2. 缺陷修复流水线 (/br-bugfix)
```
严重性自适应分级（S1 / S2 / S3）
  │
  ├── S1 极速路：单文件/文案/配置微调 → 复现测试 → 修复 → 全量测试 → ship
  ├── S2 标准路：单模块业务逻辑错误 → blame 取证 → TDD → 全量测试 → ship
  └── S3 深度路：跨模块/偶发异常 → 7步系统化 Debug → TDD → 多维验收与审查 → ship
```

### 3. 控制权状态机机制
BuildRail 的级联调用极具特色：当 `/br-full-dev` 顺序触发 `/br-plan` → `/run` → `/br-review` → `/br-ship` 这个完整链路时，被调用的子流程通过读取上下文字段，能感知到自己是由父级调用的。一旦自己负责的环节完成（计划获 `APPROVED`、任务全部执行、审查通过），它会**自动将控制权静默交还**给父工作流继续执行，而不是中断对话等待用户手动干预。整套端到端流程在用户不感知的情况下无缝推进。

---

## 安装

**推荐方式：一键安装器**

```bash
npx buildrail init
```

交互式选择目标 AI 助手，自动复制 `commands/` 和 `skills/` 到对应目录。支持 Claude Code、Windsurf、OpenCode、Cursor（在 `cli/buildrail.js` 的 `AGENTS` 表里加一项即可扩展）。

**本地方式（无需 npm）**

```bash
git clone https://github.com/YourName/BuildRail.git
cd BuildRail
node cli/buildrail.js init
```

> BuildRail 不依赖运行时——所有 skill 都是 Markdown，由你的 AI 助手加载。安装器只是把文件放到对的位置。

---

## 设计原则

1. **绝对本地化** —— 没有任何产出文档允许越过项目的 `.buildrail/` 根目录。
2. **拒绝盲目改动** —— TDD 贯穿始终，先写失败测试，后写修复代码。
3. **轻重分离** —— 坚决不在改文案的小迭代上跑全栈架构审查。
4. **意图挖掘重于执行** —— 用户给出的第一需求往往不是真正的诉求。利用 `brainstorm` 的猜测模式深挖真实目的。

---

## 文件结构

```text
BuildRail/
├── commands/                   # 顶层工作流入口（用户层）
│   ├── br-full-dev.md          # 全自动路径：需求→发布一气呵成
│   ├── br-bugfix.md            # Bug 修复（S1/S2/S3 自适应）
│   ├── br-iterate.md           # 快速迭代（带范围门控）
│   ├── idea.md                 # 分步路径入口：智能分流到探索 skill
│   ├── br-office-hours.md      # 大方向探索（可直接调，跳过分流）
│   ├── br-brainstorming.md     # 小功能探索（可直接调，跳过分流）
│   ├── br-plan.md              # 设计→实现计划
│   ├── br-scope-check.md      # 范围挑战（可选）
│   ├── run.md                  # 任务执行循环（被 /br-full-dev 自动调用，也可独立用）
│   ├── br-review.md            # 代码审查
│   ├── br-ship.md              # 发布
│   ├── br-debug.md             # 单任务深度调试
│   └── br-status.md            # 查看运行进度与跳过诊断
├── skills/                     # 基础技能单元（被顶层自动调用）
│   ├── idea/
│   ├── br-office-hours/
│   ├── br-brainstorming/
│   ├── br-scope-check/
│   ├── br-task-breakdown/
│   ├── br-debug/
│   ├── br-verify/
│   ├── br-review/
│   ├── br-test/
│   └── br-ship/
├── shared/                     # 公共契约
│   ├── output-format.md        # 文档命名与状态枚举
│   ├── file-ops.md             # 跨平台文件操作原语（不写死 bash）
│   ├── two-paths.md            # 两条路径：全自动 vs 分步
│   └── state-schema.md         # .buildrail/state.json 结构与写入契约
├── cli/                        # 一键安装器（零依赖 Node）
│   └── buildrail.js
├── examples/                   # 新手首跑参照
│   └── todo-app/               # 完整产物存档 + WALKTHROUGH
├── references/                 # 通用检查清单与最佳实践（被 skill 引用）
├── package.json                # npm 分发元数据（bin: buildrail）
└── README.md
```

> **给贡献者**：在添加新的会编排多个 skill 的命令、或在引入"包装"现有 skill 的新 skill 之前，先读 `references/orchestration-patterns.md`，了解推荐模式和反模式。

---

## 鸣谢与灵感来源

BuildRail 的核心思想、交互体验与架构哲学并非闭门造车，我们深度致敬并吸收了以下社区优秀开源项目的理念：

- **[gstack (office-hours)](https://github.com/garrytan/gstack)**：感谢其首创的深度问答模式和 Startup / Builder 模式，极大启发了 BuildRail 应对复杂系统重构时的需求挑战策略。
- **[superpowers (brainstorm)](https://github.com/obra/superpowers)**：感谢其极简的“一次一问”头脑风暴体验以及 YAGNI（You Aren't Gonna Need It）的软件工程原则，我们在其基础上进行了本地化与轻量化适配。
- **[agent-skills](https://github.com/google/agent-skills)**：感谢其出色的“Guess 模式”意图挖掘理念，以及在 TDD 和任务切片上的探索。我们在兼容性层面上对其概念做了跨客户端泛化。
