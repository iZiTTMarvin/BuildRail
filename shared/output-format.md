# BuildRail 公共输出格式

所有 BuildRail skill 产出的文档遵循统一规范。

## 文件命名

**设计/需求文档**（idea 阶段）：
```
.buildrail/idea/YYYY-MM-DD-<topic>-<type>.md
```

- `<type>` 取值：`design`（设计文档）、`requirement`（需求文档）
- `<topic>`：小写英文，连字符分隔，概括文档主题
- 示例：`2026-05-29-buildrail-idea-skill-design.md`

**实现计划**（plan 阶段）：
```
.buildrail/plans/YYYY-MM-DD-<topic>-plan.md
```

- `<topic>`：小写英文，连字符分隔，概括计划主题
- 示例：`2026-05-29-buildrail-idea-skill-plan.md`

## 公共 Frontmatter

每个文档开头必须包含：

**设计/需求文档**：
```markdown
---
生成时间: YYYY-MM-DD
模式: 大方向探索 | 小功能探索
状态: DRAFT | APPROVED | 未完成
触发 skill: br-office-hours | br-brainstorming
---
```

**实现计划**：
```markdown
---
生成时间: YYYY-MM-DD
状态: DRAFT | APPROVED
设计文档: .buildrail/idea/<对应的设计文档文件名>
---
```

## 状态枚举

**文档生命周期状态**（每个 idea/plan 文件 frontmatter 中的 `状态` 字段）：

| 状态 | 含义 | 变更条件 |
|------|------|----------|
| DRAFT | 初始状态，讨论中 | 默认 |
| APPROVED | 用户明确确认 | 用户说"确认/同意/没问题" |
| 未完成 | 用户中途放弃 | 保存当前进度 |

- 不记录审批人/时间（个人工具）
- 用户在 APPROVED 前可随时要求修改
- APPROVED 后仍可退回 DRAFT（用户要求修改时）

### 状态机区分

BuildRail 有**三套独立的状态，分属不同对象，不要混用**：

1. **文档生命周期状态**（上面表格）——属于 idea/plan 文件本身。`/br-plan` 等 skill 通过读取 frontmatter 的 `状态: APPROVED` 来决定是否消费这份文档。
2. **审查严重度等级**——属于 `br-scope-check` 的内部产出（HIGH / MEDIUM / LOW），以及它的派生态 Tradeoff。**不会**写入 idea/plan 的 frontmatter，而是追加在文档正文末尾的 `## Scope Check 结果` 区块里。
3. **运行执行状态**——属于 `.buildrail/state.json`（见 `shared/state-schema.md`）。描述**当前这次运行**的进度（哪个任务在跑、哪个跳过、自动做了什么决策）。`/br-status` 读它渲染进度。**与文档状态完全独立**：一份 idea 文档可能 APPROVED 了，但运行状态显示 task-003 被跳过。

举例：
- 一份 idea 文档可以是 `状态: APPROVED`（已被用户接受），但末尾的 Scope Check 结果里还有 `HIGH: 2`（scope-check 发现了 2 个未解决问题）。
- 这种"已批准但带风险"的状态由 `br-task-breakdown` 在拆分任务时读取并标注为 `## 风险与 Tradeoff`，进入计划文件。
- 而 state.json 里记录的是：这次运行的 scope-check 阶段，HIGH-1 被自动修改、HIGH-2 被标记为 tradeoff（用户可用 `/br-status` 回看）。

新增 skill 时注意：
- 如果你产出的是 idea/plan 文档，用第一套。
- 如果你产出审查/评估结果，用第二套并加 tally 注释。
- 如果你在执行任务（run/verify/debug/bugfix），用第三套写入 state.json，让 `/br-status` 能实时反映。

## 下游发现机制

**设计/需求文档**（供 /br-plan、/br-task-breakdown 消费）：

1. 扫描 `.buildrail/idea/` 目录
2. 筛选状态为 `APPROVED` 的文件
3. 存在多个 APPROVED 文件时，选最新修改时间
4. 通过文件名后缀区分类型：`-design.md` 或 `-requirement.md`
5. 如果目录不存在或无 APPROVED 文件 → 提示用户先运行 `/idea`

**实现计划**（供 /build 等执行阶段消费）：

1. 扫描 `.buildrail/plans/` 目录
2. 筛选状态为 `APPROVED` 的文件
3. 存在多个 APPROVED 文件时，选最新修改时间
4. 如果目录不存在或无 APPROVED 文件 → 提示用户先运行 `/br-plan`

## 目录创建

skill 首次写文件时自动创建对应目录（`.buildrail/idea/` 或 `.buildrail/plans/`）。如果无写入权限，降级到项目根目录并提示用户。
