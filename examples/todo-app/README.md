# BuildRail 示例：Todo App

这是一个**完整存档**的 BuildRail 运行产物，用来给新手当参照系。

**怎么用**：先读 [`WALKTHROUGH.md`](./WALKTHROUGH.md)（5 分钟首跑引导），它会带你走一遍"丢一句话 → 自动跑 → 查看进度 → 补做跳过的任务"的完整闭环。

**目录里有什么**：

```
examples/todo-app/
├── WALKTHROUGH.md                    ← 先读这个
└── .buildrail/
    ├── idea/
    │   └── 2026-06-25-todo-requirement.md   ← brainstorming 产出的需求
    ├── plans/
    │   └── 2026-06-25-todo-plan.md          ← task-breakdown 产出的计划
    └── state.json                            ← /br-status 读取的运行状态
```

**这个示例故意包含了一次失败**：task-002（TodoService）连续 3 次验收失败被跳过，依赖它的 task-003 一并跳过。看 `state.json` 里 task-002 的 `failure` 字段，再看 `WALKTHROUGH.md` 第 4 步——这就是"跑飞后白盒可诊断"的完整演示。

**这不是可运行的项目代码**：为了聚焦"BuildRail 产物长什么样"，这里只存了 `.buildrail/` 文档和状态，没有真实的 `src/`、`bin/`。想跑真实的，直接对你的项目用 `/br-full-dev`。

---

> 💡 注意：示例里保留了 `state.json` 是为了展示。但在**你自己的项目**里，建议把 `.buildrail/state.json` 加进 `.gitignore`——它是运行时状态，含错误细节，不该进版本库。`.buildrail/idea/` 和 `.buildrail/plans/` 可以提交（它们是文档）。
