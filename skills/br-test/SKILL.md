---
name: br-test
description: |
  BuildRail 测试驱动开发。写代码前先写测试，用测试证明代码是对的。
  适用于：实现新功能、修复 bug、修改现有行为。
  不要用于：纯配置变更、文档更新、无行为影响的静态内容。
---

# /br-test — 测试驱动开发

你是 BuildRail 的测试 skill。你的角色像一个 **资深测试工程师在教你怎么证明代码是对的**：先写测试，再写代码，测试不过就是没做完。

**配套参考**：`references/testing-patterns.md` 包含测试结构、命名规范、断言、Mock 模式、React/API/E2E 测试的完整代码模板。本 skill 聚焦"为什么这样写测试"，具体"怎么写"按需查阅该文件。

## 硬性规则

- **测试先行。** 写实现代码之前，先写一个会失败的测试。没有例外。
- **bug 先复现。** 收到 bug 报告时，先写一个能复现 bug 的测试，再动手修。
- **测行为不测实现。** 测试只关心输入和输出，不关心内部调了什么方法。
- **过不了测试就不是完成。** "看起来应该没问题"不算数。

## 什么时候用，什么时候不用

**用：**
- 实现新逻辑、新行为
- 修复 bug（用 Prove-It Pattern）
- 修改现有功能
- 加边界条件处理
- 任何可能破坏已有行为的改动

**不用：** 纯配置变更、文档更新、无行为影响的静态内容。

**配合使用：** 调试修复用 `/br-debug`，代码审查用 `/br-review`，变更验证用 `/br-verify`。

## TDD 循环

```
    RED                GREEN              REFACTOR
 写一个失败测试  ──→  写最少代码让它通过  ──→  清理实现代码  ──→  (重复)
      │                  │                    │
      ▼                  ▼                    ▼
   测试 FAILS         测试 PASSES         测试仍然 PASS
```

### RED — 写一个会失败的测试

先写测试。这个测试必须失败。一开始就通过的测试什么都证明不了。

```typescript
// RED: 这个测试会失败，因为 createTask 还不存在
describe('TaskService', () => {
  it('创建任务时自动设置默认状态和创建时间', async () => {
    const task = await taskService.createTask({ title: '买菜' });

    expect(task.id).toBeDefined();
    expect(task.title).toBe('买菜');
    expect(task.status).toBe('pending');
    expect(task.createdAt).toBeInstanceOf(Date);
  });
});
```

### GREEN — 写最少代码让它通过

只写让测试通过的最少代码，不要过度设计：

```typescript
// GREEN: 最小实现，够让测试通过就行
export async function createTask(input: { title: string }): Promise<Task> {
  const task = {
    id: generateId(),
    title: input.title,
    status: 'pending' as const,
    createdAt: new Date(),
  };
  await db.tasks.insert(task);
  return task;
}
```

### REFACTOR — 清理代码

测试全绿之后，在不改变行为的前提下改善代码：
- 提取公共逻辑
- 改善命名
- 去掉重复
- 必要时优化

每一步重构之后都跑一次测试，确认没改坏。

## Prove-It Pattern（bug 修复流程）

收到 bug 报告时，**不要上来就修。先写一个能复现 bug 的测试。**

```
收到 bug 报告
       │
       ▼
  写一个能复现 bug 的测试
       │
       ▼
  测试 FAILS（确认 bug 确实存在）
       │
       ▼
  实现修复
       │
       ▼
  测试 PASSES（证明修复有效）
       │
       ▼
  跑全量测试（确认没有回归）
```

```typescript
// Bug: "完成任务时没有更新 completedAt 时间戳"

// 第一步：写复现测试（应该 FAILS）
it('完成任务时设置 completedAt 时间戳', async () => {
  const task = await taskService.createTask({ title: '测试' });
  const completed = await taskService.completeTask(task.id);

  expect(completed.status).toBe('completed');
  expect(completed.completedAt).toBeInstanceOf(Date);  // 这里会失败 → bug 确认
});

// 第二步：修 bug
export async function completeTask(id: string): Promise<Task> {
  return db.tasks.update(id, {
    status: 'completed',
    completedAt: new Date(),  // 之前漏了这个
  });
}

// 第三步：测试通过 → bug 修好了，且有防护
```

## 测试金字塔

测试精力按金字塔分配——大部分测试应该小而快，越往上测试越少：

```
        ╱╲
       ╱  ╲         E2E Tests（~5%）
      ╱    ╲        完整用户流程，真实浏览器
     ╱──────╲
    ╱        ╲      Integration Tests（~15%）
   ╱          ╲     组件交互，API 边界
  ╱────────────╲
 ╱              ╲   Unit Tests（~80%）
╱                ╲  纯逻辑，隔离的，毫秒级
╱──────────────────╲
```

**Beyonce Rule：** 如果你觉得它重要，就应该给它写测试。重构、迁移、基础设施变更不负责帮你抓 bug——你的测试才负责。改了东西挂了但你没写测试，那是你的问题。

### 测试大小分类

| 大小 | 约束 | 速度 | 例子 |
|------|------|------|------|
| **Small** | 单进程，无 I/O，无网络，无数据库 | 毫秒级 | 纯函数测试、数据转换 |
| **Medium** | 可以多进程，仅限本地，无外部服务 | 秒级 | 带 test DB 的 API 测试、组件测试 |
| **Large** | 可以跨机器，允许外部服务 | 分钟级 | E2E 测试、性能基准、预发布集成 |

Small 测试应该占绝大多数。它们快、稳定、失败时容易定位。

### 怎么选测试类型

```
是纯逻辑，没有副作用？
  → Unit Test（small）

跨了边界（API、数据库、文件系统）？
  → Integration Test（medium）

是必须端到端跑通的关键用户流程？
  → E2E Test（large）—— 只给关键路径写
```

## 写好测试的原则

### 测状态，不测交互

断言操作的**结果**，而不是内部调了哪些方法。验方法调用顺序的测试，重构一下就挂，即使行为完全没变。

```typescript
// 好：测函数做了什么（状态）
it('按创建时间倒序返回任务列表', async () => {
  const tasks = await listTasks({ sortBy: 'createdAt', sortOrder: 'desc' });
  expect(tasks[0].createdAt.getTime())
    .toBeGreaterThan(tasks[1].createdAt.getTime());
});

// 差：测函数内部怎么做的（交互）
it('调用 db.query 时带上 ORDER BY created_at DESC', async () => {
  await listTasks({ sortBy: 'createdAt', sortOrder: 'desc' });
  expect(db.query).toHaveBeenCalledWith(
    expect.stringContaining('ORDER BY created_at DESC')
  );
});
```

### 测试里 DAMP > DRY

生产代码讲究 DRY（Don't Repeat Yourself）。测试里 **DAMP（Descriptive And Meaningful Phrases）** 更重要——每个测试应该像一个独立的规格说明，不用翻来翻去看公共 setup。

```typescript
// DAMP：每个测试自包含，一眼看懂
it('拒绝空标题', () => {
  const input = { title: '', assignee: 'user-1' };
  expect(() => createTask(input)).toThrow('标题不能为空');
});

it('自动去除标题首尾空格', () => {
  const input = { title: '  买菜  ', assignee: 'user-1' };
  const task = createTask(input);
  expect(task.title).toBe('买菜');
});
```

测试里的重复是可以接受的，只要它让每个测试更容易独立理解。

### 优先用真实实现，少用 Mock

用能跑通的最简单的替身。测试里用的真实代码越多，信心越足。

```
优先级（从高到低）：
1. 真实实现  → 信心最高，能抓到真实 bug
2. Fake     → 内存版的依赖（比如 fake DB）
3. Stub     → 返回固定数据，没有行为
4. Mock     → 验证方法调用——少用
```

**只在以下情况用 Mock：** 真实实现太慢、不确定、或有你控制不了的副作用（外部 API、发邮件）。Mock 太多的后果：测试全过，生产挂掉。

### 用 Arrange-Act-Assert 模式

```typescript
it('截止日期过了的任务标记为逾期', () => {
  // Arrange: 准备测试场景
  const task = createTask({
    title: '测试',
    deadline: new Date('2025-01-01'),
  });

  // Act: 执行被测操作
  const result = checkOverdue(task, new Date('2025-01-02'));

  // Assert: 验证结果
  expect(result.isOverdue).toBe(true);
});
```

### 一个概念一个测试

```typescript
// 好：每个测试验证一个行为
it('拒绝空标题', () => { ... });
it('去除首尾空格', () => { ... });
it('限制标题最大长度', () => { ... });

// 差：所有检查塞一个测试
it('验证标题', () => {
  expect(() => createTask({ title: '' })).toThrow();
  expect(createTask({ title: '  hello  ' }).title).toBe('hello');
  expect(() => createTask({ title: 'a'.repeat(256) })).toThrow();
});
```

### 测试名字要描述行为

```typescript
// 好：读起来像规格说明
describe('TaskService.completeTask', () => {
  it('设置状态为 completed 并记录时间戳', ...);
  it('任务不存在时抛出 NotFoundError', ...);
  it('重复完成是幂等操作', ...);
});

// 差：名字含糊
describe('TaskService', () => {
  it('works', ...);
  it('handles errors', ...);
  it('test 3', ...);
});
```

## 测试反模式

| 反模式 | 问题 | 修正方式 |
|--------|------|----------|
| 测实现细节 | 重构时测试挂掉，行为明明没变 | 测输入和输出，不测内部结构 |
| 不稳定的测试（依赖时序、执行顺序） | 破坏对测试套件的信任 | 用确定的断言，隔离测试状态 |
| 测框架代码 | 浪费时间测第三方行为 | 只测你自己的代码 |
| 滥用快照 | 大快照没人 review，改点东西就挂 | 少用快照，每次变更都要 review |
| 测试不隔离 | 单独跑通过，一起跑挂掉 | 每个测试自己 setup 和 teardown |
| 万物皆 Mock | 测试全过，生产挂掉 | 优先用真实实现 > Fake > Stub > Mock |

## 反合理化表

| 你可能这么想 | 实际情况 |
|-------------|---------|
| "代码写完再补测试" | 你不会补。事后补的测试测的是实现，不是行为。 |
| "这段代码太简单不用测" | 简单的代码会变复杂。测试记录了期望行为。 |
| "写测试太慢了" | 现在慢，以后每次改代码都快。 |
| "我手动测过了" | 手动测试留不下来。明天的改动可能把它弄坏，你还不知道。 |
| "代码本身就是文档" | 测试才是规格说明。它记录的是代码"应该做什么"，不是"碰巧做了什么"。 |
| "这只是个原型" | 原型会变成生产代码。第一天就有测试，就不会有"测试债"。 |
| "再跑一遍测试确认一下" | 测试刚通过、代码没改，再跑一遍没有任何价值。改了代码之后再跑。 |

## 红旗列表

看到这些情况要停下来想一想：

- 写了代码但没有对应的测试
- 测试第一次跑就通过了（可能根本没测到你以为的东西）
- "所有测试通过"但其实一个测试都没跑
- 修 bug 但没写复现测试
- 测试的是框架行为而不是你的业务行为
- 测试名字不能说明它在验证什么
- 跳过测试让套件通过
- 代码没改，连着跑了两遍同样的测试命令

## 验证清单

完成任何实现之后，逐项检查：

- [ ] 每个新行为都有对应的测试
- [ ] 所有测试通过：`npm test`
- [ ] bug 修复包含一个修复前会失败的复现测试
- [ ] 测试名字描述了被验证的行为
- [ ] 没有跳过或禁用的测试
- [ ] 覆盖率没有下降（如果有追踪的话）

**注意：** 代码改了才需要重新跑测试。测试刚通过、代码没动，再跑一遍不增加任何信心。
