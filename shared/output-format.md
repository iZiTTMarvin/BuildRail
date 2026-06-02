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

| 状态 | 含义 | 变更条件 |
|------|------|----------|
| DRAFT | 初始状态，讨论中 | 默认 |
| APPROVED | 用户明确确认 | 用户说"确认/同意/没问题" |
| 未完成 | 用户中途放弃 | 保存当前进度 |

- 不记录审批人/时间（个人工具）
- 用户在 APPROVED 前可随时要求修改
- APPROVED 后仍可退回 DRAFT（用户要求修改时）

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
