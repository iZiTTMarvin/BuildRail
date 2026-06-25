# BuildRail — AI 原生开发工作流集合

> **高度兼容，绝对本地可控。** BuildRail 是一套面向多种 AI 编程助手（Claude Code、Windsurf、OpenCode 等）的轻量级工作流编排文件。它将零散的技能（Skills）整合成端到端的自动化流水线，并彻底解决输出路径不可控、Token 浪费和平台绑定问题。

---

## 快速上手

### 1. 直接描述你要做什么

安装完成后（见下方安装章节），你不需要再手动挑选复杂的底层命令，只需根据目标规模，直接向你的 AI 助手下达最终意图。

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

### 2. 本地化状态查看

所有的执行计划、需求探索与技术方案，都会**绝对严格**地生成在当前项目根目录的 `.buildrail/` 文件夹下，不会污染你的 C 盘或其他系统目录。

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

### 底层能力单元（被顶层自动调用）
- `idea` / `br-office-hours` / `br-brainstorming`：负责需求探索与意图挖掘。
- `br-scope-check` / `br-task-breakdown`：负责架构风险挑战与任务垂直拆分。
- `br-test` / `br-debug` / `br-verify` / `br-review`：负责代码实现的测试、调试、验收与质量把控。
- `br-ship`：负责最终交付的 Changelog 更新与代码合并推送。

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
  ├── S1 极速路：单文件/文案/配置微调 → 修复 → 测试 → ship
  ├── S2 标准路：单模块业务逻辑错误 → blame 取证 → TDD → 全量测试 → ship
  └── S3 深度路：跨模块/偶发异常 → 7步系统化 Debug → TDD → 多维验收与审查 → ship
```

### 3. 控制权状态机机制
BuildRail 的级联调用极具特色：当 `/br-full-dev` 顺序触发 `/br-plan` → `/run` → `/br-review` → `/br-ship` 这个完整链路时，被调用的子流程通过读取上下文字段，能感知到自己是由父级调用的。一旦自己负责的环节完成（计划获 `APPROVED`、任务全部执行、审查通过），它会**自动将控制权静默交还**给父工作流继续执行，而不是中断对话等待用户手动干预。整套端到端流程在用户不感知的情况下无缝推进。

---

## 安装

由于 BuildRail 的极简 Markdown 架构，它不需要任何复杂的依赖脚本。克隆到本地后，把 `commands/` 和 `skills/` 复制或链接到你目标 agent 的对应目录即可。

### macOS / Linux

```bash
# 1. 克隆
git clone https://github.com/YourName/BuildRail.git ~/.buildrail-system

# 2. 链接到 Claude Code
ln -s ~/.buildrail-system/commands/* ~/.claude/commands/
ln -s ~/.buildrail-system/skills/* ~/.claude/skills/

# Windsurf / OpenCode：链接到对应的自定义 Workflow / Skill 目录
```

### Windows (PowerShell)

```powershell
# 1. 克隆（用你喜欢的目录）
git clone https://github.com/YourName/BuildRail.git $env:USERPROFILE\.buildrail-system

# 2. 复制到 Claude Code 配置目录
Copy-Item $env:USERPROFILE\.buildrail-system\commands\* $env:USERPROFILE\.claude\commands\ -Recurse -Force
Copy-Item $env:USERPROFILE\.buildrail-system\skills\* $env:USERPROFILE\.claude\skills\ -Recurse -Force

# 如需软链接（需开启开发者模式）：
# New-Item -ItemType SymbolicLink -Path $env:USERPROFILE\.claude\commands -Target $env:USERPROFILE\.buildrail-system\commands
```

### 通用方案（任意 agent）

如果你的 agent 不支持软链接或符号链接，直接把 `commands/` 和 `skills/` 整个目录复制到对应位置即可。BuildRail 不依赖路径，所有引用都用相对目录描述。

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
├── commands/                   # 顶层自动工作流入口（用户层）
│   ├── br-bugfix.md            
│   ├── br-iterate.md           
│   ├── br-full-dev.md          
│   ├── br-plan.md              
│   └── run.md                  # 任务执行循环（被 /br-full-dev 自动调用）
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
├── references/                 # 通用检查清单与最佳实践（被 skill 引用）
└── shared/                     # 公共契约与数据交换格式
```

> **给贡献者**：在添加新的会编排多个 skill 的命令、或在引入"包装"现有 skill 的新 skill 之前，先读 `references/orchestration-patterns.md`，了解推荐模式和反模式。

---

## 鸣谢与灵感来源

BuildRail 的核心思想、交互体验与架构哲学并非闭门造车，我们深度致敬并吸收了以下社区优秀开源项目的理念：

- **[gstack (office-hours)](https://github.com/garrytan/gstack)**：感谢其首创的深度问答模式和 Startup / Builder 模式，极大启发了 BuildRail 应对复杂系统重构时的需求挑战策略。
- **[superpowers (brainstorm)](https://github.com/obra/superpowers)**：感谢其极简的“一次一问”头脑风暴体验以及 YAGNI（You Aren't Gonna Need It）的软件工程原则，我们在其基础上进行了本地化与轻量化适配。
- **[agent-skills](https://github.com/google/agent-skills)**：感谢其出色的“Guess 模式”意图挖掘理念，以及在 TDD 和任务切片上的探索。我们在兼容性层面上对其概念做了跨客户端泛化。
