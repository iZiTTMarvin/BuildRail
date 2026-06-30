# 跨平台文件操作原语

> **为什么有这个文件**：BuildRail 声称兼容多种 Markdown 驱动的 agent（Claude Code、Windsurf、OpenCode 等），但 `ls` / `grep` / `cat ... 2>/dev/null` / `head` / `find` 这些 bash 命令在 Windows 原生环境会直接报错。本文件把所有"探测/读取文件"的操作抽象为**意图**，让 agent 用自己的原生工具实现，不再写死 bash。
>
> **硬性规则**：skill 正文中**禁止出现裸的 `ls -lt` / `cat X 2>/dev/null` / `grep -E` / `head -N` / `find . -type f`**。需要这些操作时，按下面的原语描述意图，由 agent 用原生工具（如 Read / Glob / Grep）落地。

---

## 原语清单

每个原语只声明"输入 → 要拿到什么"，不规定用什么命令实现。

### P1. 找最新的某类文档

**意图**：在指定目录下，找到符合命名模式、且修改时间最新的一个文件。

```
目录：.buildrail/idea/
模式：*-design.md 或 *-requirement.md
我要拿到：最新一个匹配文件的【路径】和【完整内容】
若无匹配：明确报告"目录不存在"或"无匹配文件"，不要静默吞错
```

### P2. 读取一个文件（可能不存在）

**意图**：读取指定文件全文；不存在时返回"不存在"，不要报错中断。

```
文件：README.md（或 CLAUDE.md / package.json / pyproject.toml / Cargo.toml / Makefile）
我要拿到：文件存在 → 完整内容；文件不存在 → 明确的"不存在"判定
```

> 用 agent 的原生文件读取工具。原生工具对"文件不存在"会返回结构化错误，比 `cat X 2>/dev/null` 静默吞错更可诊断。

### P3. 读取配置文件的脚本段

**意图**：从 `package.json` 提取 `scripts` 字段、从 `pyproject.toml` 提取测试/lint 相关段、从 `Makefile` 提取目标名。用来判断项目有哪些 test/lint/build 命令。

```
我要拿到：一个清单 —— { 命令名: 执行串 }，例如 { test: "jest", build: "vite build" }
若无 package.json / pyproject.toml / Makefile：报告"未检测到标准配置"，不要报错
```

> 不要用 `grep -E` 抓取——遇到字段顺序、引号、嵌套差异会漏。读全文后结构化解析。

### P4. 列出目录结构（了解项目布局）

**意图**：了解项目根有哪些文件和一级目录，判断源码/测试目录在哪。

```
我要拿到：项目根的【文件 + 目录名列表】
不要：递归 dump 全部文件（用 P5 的受限递归）
```

### P5. 受限递归列出源码文件

**意图**：在排除噪音目录后，列出最多 N 个源码文件，了解项目规模和结构。

```
排除：.git / node_modules / .buildrail / dist / build / target / __pycache__
上限：前 50 个
我要拿到：相对路径列表（前 50 个）
```

> 不要用 `find . -type f -not -path ...`——在 Windows 上 `find` 是另一个命令。用 agent 的 glob 工具（如 `**/*` 配合排除规则）。

### P6. 确认目录存在并创建

**意图**：确保 `.buildrail/idea/` 或 `.buildrail/plans/` 存在；不存在则创建。

```
我要拿到：目录已存在的确认，或新建成功的确认
```

> agent 的写文件工具通常会在写入时自动创建父目录——多数情况下"直接写文件"即可，无需单独 mkdir。

### P7. 定位源码 / 测试目录

**意图**：判断项目用的是 `src/` / `lib/` / `app/`，测试在 `test/` / `tests/` / `spec/` / `__tests__/`。

```
我要拿到：存在的源码目录名（可能多个、可能没有），测试目录名（同上）
若无标准目录：报告"未发现标准源码目录"，继续流程不阻塞
```

### P8. 探测 git 上下文

**意图**：了解最近提交和最近改动，判断项目成熟度。

```
我要拿到：最近 10 条提交的 one-line 摘要（若无 git：报告"无 git 记录"）
        以及最近 5 次提交的 diffstat 概览（同上）
```

> git 是跨平台工具，`git log` / `git diff` 命令本身可保留；但 `2>/dev/null || echo` 这种 bash 错误吞咽要去掉，改为"若非 git 仓库则报告"。

---

## 使用约定

skill 正文里需要这些操作时，**这样写**：

```markdown
按 `shared/file-ops.md` 的 **P1** 找到最新的设计/需求文档，读取其完整内容。
按 **P3** 检测项目的 test/lint/build 命令。
```

不要这样写：

```bash
# ❌ 禁止：bash 特定，Windows 报错
ls -lt .buildrail/idea/*-design.md 2>/dev/null
cat package.json 2>/dev/null | grep -E '"(test|lint|build)"' || true
```

---

## 为什么不直接写跨平台 shell 脚本

因为不同 agent 的 shell 能力不同（有的只有 bash、有的用 PowerShell、有的压根不暴露 shell 给 skill）。**意图描述**让每个 agent 用自己最擅长的方式实现，这才是真正的"兼容多种 agent"。写脚本反而是新的平台绑定。
