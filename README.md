<div align="center">

# BuildRail

**AI 原生开发工作流集合 —— 让 AI 编程助手按纪律干活**

高度兼容 · 绝对本地可控 · 不浪费 Token

[![npm version](https://img.shields.io/npm/v/buildrail.svg)](https://www.npmjs.com/package/buildrail)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D14-green.svg)](https://nodejs.org)
[![Tests](https://img.shields.io/badge/tests-11%20passing-brightgreen.svg)](#测试)

一行命令，把零散的 AI 编程纪律（需求挖掘、TDD、任务拆分、代码审查）编排成端到端流水线。
原生兼容 Claude Code / Windsurf / OpenCode / Cursor 等多种 Markdown 驱动的 AI 助手。

</div>

---

## 为什么是 BuildRail

重度使用 AI 编程时，真正的痛点不是"AI 写不了代码"，而是：

- **输出路径不可控** —— 工具把计划、状态、产物写进系统级隐藏目录（`~/.xxx`），污染你的磁盘，难以追踪。
- **执行重量级** —— 改一行文案也跑全栈架构审查，烧 Token、浪费时间。
- **平台强绑定** —— 优秀的技能集合往往锁死在某一个客户端上。

BuildRail 把社区里已经验证过的优秀实践（深度追问、一次一问、TDD 哲学），**提取精华逻辑、剔除臃肿依赖、用更轻量的方式重新编排**，统一到一套开箱即用的流水线里。核心承诺：

1. **绝对本地化** —— 所有产出严格锁定在项目根目录的 `.buildrail/`，绝不污染系统目录。
2. **自适应轻重** —— 小任务走极速快速路，大任务才跑完整流水线；不在改文案的小迭代上浪费 Token。
3. **拒绝盲目改动** —— TDD 贯穿始终，先写失败测试，后写修复代码。
4. **意图挖掘重于执行** —— 用户给出的第一需求往往不是真正的诉求；先挖出真实目的，再动手。

---

## 目录

- [快速上手](#快速上手)
- [两种用法：全自动 vs 分步](#两种用法全自动-vs-分步)
- [可观测性：随时知道发生了什么](#可观测性随时知道发生了什么)
- [包含什么](#包含什么)
- [工作流架构](#工作流架构自适应与解耦)
- [安装](#安装)
- [测试](#测试)
- [设计原则](#设计原则)
- [文件结构](#文件结构)
- [贡献](#贡献)
- [路线图](#路线图)
- [鸣谢与灵感来源](#鸣谢与灵感来源)
- [License](#license)

---

## 快速上手

### 1. 一行命令安装

```bash
npx buildrail init
```

安装器会列出支持的 AI 助手（Claude Code / Windsurf / OpenCode / Cursor），你选一个序号，它自动把命令和技能复制到对应目录。**不需要手动软链接、不需要碰 PowerShell / bash 语法。**

> 没装 Node？也可以直接 `git clone` 后在仓库目录跑 `node cli/buildrail.js init`。

### 2. 直接描述你要做什么

安装完成后，无需手动挑选底层命令，只需根据目标规模向 AI 助手下达最终意图，BuildRail 会自动评估改动范围并拆解执行：

```bash
# 遇到了报错或需要修 Bug？
/br-bugfix 登录超时后 app 直接崩溃，控制台报错如下: ...

# 需要局部微调或小优化？
/br-iterate 把首页加载的 loading 动画换成骨架屏，宽度保持 100%

# 需要实现一个端到端的全新大功能？
/br-full-dev 帮我接入支付宝和微信的支付模块，并提供统一的后台回调接口
```

> **注意：** 如果你使用的是 Windsurf，无需加 `/` 前缀，直接输入命令即可。

### 3. 本地化状态查看

所有的执行计划、需求探索与技术方案，都会**绝对严格**地生成在当前项目根目录的 `.buildrail/` 文件夹下，不会污染你的 C 盘或其他系统目录。

---

## 两种用法：全自动 vs 分步

BuildRail 不用"开关参数"，而是用**两个不同的入口**满足两种姿态。斜杠命令的心智是"命令名 + 说人话"，塞 `--auto` / `--manual` 既反直觉又难记。

> **设计洞察：** 这两条路服务的不是"两类不同的人"，而是**同一个人的两种姿态**——同一个开发者，有时候想一口气说完需求、全自动跑完；有时候又想每一步自己拍板。新手只是"暂时只有全自动模式"，熟练者两种模式都拥有。

### 路径 A：全自动（新手懒人）

```
/br-full-dev 帮我开发登录注册功能
```

开发阶段（设计 → 计划 → 执行 → 审查）零参数、零门禁、一路跑到底，不问不等。**审查通过后会在发布（提交/推送）前停下汇报，让你决定是否提交** —— 这是合格工作流的底线，提交和推送是对外操作，需要你点头。跑完用 `/br-status` 看它替你做了什么决策。

### 路径 B：分步（资深 / 敏感改动）

```
/idea 帮我开发登录注册功能      → 做完提示"下一步可 /br-plan"
/br-plan                        → 做完提示"下一步可 /run"
/run                            → 做完提示"下一步可 /br-review"
/br-review                      → 做完提示"下一步可 /br-ship"
/br-ship                        → 发布
```

每个命令做完**自然停**（不是门禁打断，是职责边界），并提示下一步。你随时可介入、改、跳过某步。想对范围做挑战可加 `/br-scope-check`（可选）。

详见 [`shared/two-paths.md`](./shared/two-paths.md)。

---

## 可观测性：随时知道发生了什么 `/br-status`

全自动模式最大的风险是"黑盒——跑完了但不知道中间发生了什么"。BuildRail 用 `.buildrail/state.json` 记录每次运行的完整进度，`/br-status` 把它渲染成人类可读的报告。

```
/br-status          # 看当前 / 最近一次运行的进度
/br-status latest   # 额外展开所有跳过 / 失败任务的完整诊断
```

你会看到：现在跑到哪个阶段、每个任务什么状态、**为什么某个任务被跳过**（现象 / 证据 / 根因猜测 / 试过什么 / 下一步建议）、全自动（`/br-full-dev`）跑完后工具替你自动做了哪些决策。

**跑飞了别慌** —— `/br-status` 永远告诉你发生了什么、怎么办。看完诊断后，`/br-debug <task-id>` 单独深度排查，或 `/run 从 task-NNN 开始` 补做。

> 想看完整产物长什么样？读 [`examples/todo-app/WALKTHROUGH.md`](./examples/todo-app/WALKTHROUGH.md)，跟着"丢一句话 → 自动跑 → 查看进度 → 补做跳过的任务"的完整闭环走一遍。

---

## 包含什么

BuildRail 提供了 4 个顶层工作流命令和 10 个底层基础技能单元。

### 顶层工作流（日常只用这四个）

| 工作流 | 使用场景 | 特点与防线 |
|--------|---------|-----------|
| **`/br-bugfix`** | Bug 修复、崩溃排查 | **三级自适应**。自动判定 S1（极速）、S2（标准 TDD）、S3（深度 Debug）。简单路径走不通，自动升级降级。 |
| **`/br-iterate`** | 小改动、样式调整、配置修改 | **范围门控（Impact Gate）**。强制拦截超大范围或敏感业务修改。范围内的小需求走极速闭环，省时省 Token。 |
| **`/run`** | 已有 APPROVED 计划，直接执行 | **任务循环机**。逐个实现、验收、提交，失败自动调用 `br-debug` 修复。被 `/br-full-dev` 自动调用，也可独立使用。 |
| **`/br-full-dev`** | 新功能、大型重构、跨模块架构变更 | **端到端串联**。需求探索、方案对比、计划拆分、代码执行、五轴审查到发布全部串联。内部自动调用 `/run` 执行。 |

> **何时直接用 `/run`**：你已经有了一份 APPROVED 计划（`/br-plan` 产物），想跳过设计阶段直接进入实现。例如：昨天 `/br-full-dev` 走到一半中断了，今天接着干。
>
> **何时直接用 `/br-plan`**：你只想生成实现计划、暂时不执行（比如要先和同事评审）。`/br-plan` 会调用 `br-scope-check` 做范围挑战、`br-task-breakdown` 拆分任务，产出 APPROVED 计划后停下来等你。

### 底层能力单元（被顶层自动调用，也可在分步路径单独调用）

- `idea` / `br-office-hours` / `br-brainstorming` —— 需求探索与意图挖掘。分步路径从 `/idea` 进入，也可跳过分流直接用 `/br-office-hours` 或 `/br-brainstorming`。
- `br-scope-check` / `br-task-breakdown` —— 架构风险挑战与任务垂直拆分。`/br-scope-check` 可单独调做范围挑战。
- `br-test` / `br-debug` / `br-verify` / `br-review` —— 代码实现的测试、调试、验收与质量把控。`/br-debug` 可单独排查某个失败任务，`/br-review` 可单独审查当前 Diff。
- `br-ship` —— 最终交付的 Changelog 更新与代码合并推送。

> 分步路径命令一览见上方"两种用法"章节：`/idea` → `/br-plan` →（`/br-scope-check` 可选）→ `/run` → `/br-review` → `/br-ship`，任意一步做完会提示下一步。

### 与同类项目对比

> **说明：** 下表为基于作者实际使用体验的主观对比，而非基准测试结果。每个项目都有自己的定位与适用场景，此处仅帮助读者快速判断 BuildRail 的设计取向。

| | gstack (office-hours) | superpowers (brainstorm) | agent-skills | **BuildRail** |
|---|---|---|---|---|
| **输出路径控制** | 较弱（常写入系统级隐藏目录） | 中等 | 好 | **极佳（严格锁定在项目 `.buildrail/` 目录）** |
| **执行重量级** | 中等 | 极重（强制全套流程） | 中等 | **自适应（小任务走快速路，绝不浪费 Token）** |
| **平台兼容性** | 偏向于 Codex | 偏向于特定插件框架 | 强绑定 Claude Code | **极高（原生兼容多种 Markdown 驱动的 Agent）** |
| **技能聚合度** | 离散指令，需用户手控流转 | 高聚合，但缺乏灵活性 | 偏底层具体操作 | **四大顶层入口，自动编排 10 项底层技能** |

**BuildRail 不重复造轮子。** 社区里已有非常优秀的技能：`office-hours` 的深度追问逻辑、`brainstorm` 的一次一问体验，以及 `agent-skills` 的 TDD 哲学。BuildRail 做的是统一编排与体验重塑：提取它们的精华逻辑，剔除臃肿的无关依赖和强绑定的平台限制，用更轻量、更聚焦的方式重新拼装成一套开箱即用的流水线。

---

## 工作流架构：自适应与解耦

AI 工作流最容易失败的原因，通常不是"AI 写不了代码"，而是：**小题大做（浪费 Token）** 或 **大题小做（引发灾难级回归）**。

### 1. 范围门控快速路径（`/br-iterate`）

```
拦截检查（行数 / 文件数 / 新依赖 / API 契约 / 敏感路径）
  │
  ├── 触发任意拦截限制 → 强行打断，建议升级到 /br-full-dev
  └── 在安全范围内 → 极速 TDD 编码 → 自动验证 → ship
```

### 2. 缺陷修复流水线（`/br-bugfix`）

```
严重性自适应分级（S1 / S2 / S3）
  │
  ├── S1 极速路：单文件 / 文案 / 配置微调 → 复现测试 → 修复 → 全量测试 → ship
  ├── S2 标准路：单模块业务逻辑错误 → blame 取证 → TDD → 全量测试 → ship
  └── S3 深度路：跨模块 / 偶发异常 → 7 步系统化 Debug → TDD → 多维验收与审查 → ship
```

### 3. 控制权状态机机制

BuildRail 的级联调用颇具特色：当 `/br-full-dev` 顺序触发 `/br-plan` → `/run` → `/br-review` → `/br-ship` 这个完整链路时，被调用的子流程通过读取上下文字段，能感知到自己是由父级调用的。一旦自己负责的环节完成（计划获 `APPROVED`、任务全部执行、审查通过），它会**自动将控制权静默交还**给父工作流继续执行，而不是中断对话等待用户手动干预。整套端到端流程在用户不感知的情况下无缝推进。

---

## 安装

**推荐方式：一键安装器**

```bash
npx buildrail init
```

交互式选择目标 AI 助手，自动复制 `commands/` 和 `skills/` 到对应目录。支持 Claude Code、Windsurf、OpenCode、Cursor（在 `cli/buildrail.js` 的 `AGENTS` 表里加一项即可扩展）。

**本地方式（无需 npm）**

```bash
git clone https://github.com/iZiTTMarvin/BuildRail.git
cd BuildRail
node cli/buildrail.js init
```

> BuildRail 不依赖运行时——所有 skill 都是 Markdown，由你的 AI 助手加载。安装器只是把文件放到对的位置。

---

## 测试

CLI 安装器附带单元测试（纯 Node 内置 `node:test`，零依赖）：

```bash
npm test
```

覆盖：命令/技能文件完整性、目录递归创建与复制、文件过滤逻辑、`AGENTS` 表的四个 agent 配置、Windsurf 检测边界等（共 11 项）。

> 注：测试只覆盖 CLI 安装器的纯逻辑。工作流本身（`.md` 驱动的 AI 行为）属于 prompt 工程，由人工 dogfood 验证。

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
│   ├── br-scope-check.md       # 范围挑战（可选）
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
│   └── todo-app/               # WALKTHROUGH
├── references/                 # 通用检查清单与最佳实践（被 skill 引用）
├── tests/                      # CLI 单元测试
├── LICENSE
├── package.json                # npm 分发元数据（bin: buildrail）
└── README.md
```

> **给贡献者**：在添加新的会编排多个 skill 的命令、或引入"包装"现有 skill 的新 skill 之前，先读 [`references/orchestration-patterns.md`](./references/orchestration-patterns.md)，了解推荐模式和反模式。

---

## 贡献

欢迎 Issue 和 PR。在贡献前：

1. CLI 改动请确保 `npm test` 通过。
2. 新增 / 修改 skill 或 command 时，遵循 [`shared/output-format.md`](./shared/output-format.md) 的命名与状态约定。
3. 编排多个 skill 的新命令，先参考 [`references/orchestration-patterns.md`](./references/orchestration-patterns.md) 的推荐模式，避免反模式。


### 维护者：发布与更新流程

> **关键认知**：用户跑 `buildrail update` 拉的是 **npm 上的版本**，不是 GitHub。
> 所以本地改完代码，必须 `npm publish` 后，用户的 `update` 才能拿到新版。

完整的发布循环（每次改完 skill/command 后）：

```bash
1. 改 skills/xxx/SKILL.md 或 commands/xxx.md
2. 改 package.json 的 version（如 0.1.0 → 0.1.1）  # 必须改！npm 拒收同版本
3. npm test                                         # 确保测试过
4. git commit -am "..." && git push                 # 推源码到 GitHub
5. npm publish                                      # 推新版本到 npm（用户才能 update 到）
```

用户更新到最新版：

```bash
buildrail update          # 从 npm 拉最新版，覆盖到 agent 目录
# 或等价写法：
npx buildrail@latest init # init 本身就是覆盖式复制
```

---

## 路线图

- [x] 4 顶层工作流 + 10 底层技能，两路径（全自动 / 分步）
- [x] `state.json` + `/br-status` 可观测层
- [x] 一键安装器（Claude Code / Windsurf / OpenCode / Cursor）
- [x] CLI 单元测试
- [x] `buildrail update` 子命令（从 npm 拉最新版，一键覆盖更新到 agent 目录）
- [ ] GitHub Actions CI（push 时自动跑 `npm test`）
- [ ] 更多 agent 支持（按需在 `AGENTS` 表扩展）

---

## 鸣谢与灵感来源

BuildRail 的核心思想、交互体验与架构哲学并非闭门造车，我们深度致敬并吸收了以下社区优秀开源项目的理念：

- **[gstack (office-hours)](https://github.com/garrytan/gstack)** —— 感谢其首创的深度问答模式和 Startup / Builder 模式，极大启发了 BuildRail 应对复杂系统重构时的需求挑战策略。
- **[superpowers (brainstorm)](https://github.com/obra/superpowers)** —— 感谢其极简的"一次一问"头脑风暴体验以及 YAGNI（You Aren't Gonna Need It）的软件工程原则，我们在其基础上进行了本地化与轻量化适配。
- **[agent-skills](https://github.com/google/agent-skills)** —— 感谢其出色的"Guess 模式"意图挖掘理念，以及在 TDD 和任务切片上的探索。我们在兼容性层面上对其概念做了跨客户端泛化。

---

## License

[MIT](./LICENSE) © BuildRail Contributors
