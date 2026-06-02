# 无障碍访问清单

WCAG 2.1 AA 合规性快速参考。前端开发时参考此清单。

## 目录

- [基本检查项](#基本检查项)
- [常见 HTML 模式](#常见-html-模式)
- [测试工具](#测试工具)
- [快速参考：ARIA 实时区域](#快速参考aria-实时区域)
- [常见反模式](#常见反模式)

## 基本检查项

### 键盘导航
- [ ] 所有可交互元素都可通过 Tab 键获得焦点
- [ ] 焦点顺序遵循视觉/逻辑顺序
- [ ] 焦点可见（聚焦元素显示 outline/ring）
- [ ] 自定义组件支持键盘操作（Enter 激活，Escape 关闭）
- [ ] 没有键盘陷阱（用户始终可以 Tab 离开组件）
- [ ] 页面顶部有跳转内容链接，键盘聚焦时至少可见
- [ ] 弹窗打开时锁定焦点，关闭后归还焦点

### 屏幕阅读器
- [ ] 所有图片都有 `alt` 文本（装饰性图片使用 `alt=""`）
- [ ] 所有表单输入都有关联标签（`<label>` 或 `aria-label`）
- [ ] 按钮和链接有描述性文本（不要用"点击这里"）
- [ ] 纯图标按钮有 `aria-label`
- [ ] 页面只有一个 `<h1>`，标题层级不跳跃
- [ ] 动态内容变化通过 `aria-live` 区域播报
- [ ] 表格有 `<th>` 表头并指定 scope

### 视觉
- [ ] 文本对比度 >= 4.5:1（普通文本）或 >= 3:1（大文本，18px+）
- [ ] UI 组件与背景的对比度 >= 3:1
- [ ] 颜色不是传达信息的唯一方式
- [ ] 文本可放大到 200% 而不破坏布局
- [ ] 没有每秒闪烁超过 3 次的内容

### 表单
- [ ] 每个输入框都有可见标签
- [ ] 必填字段有明确标识（不能仅靠颜色）
- [ ] 错误信息具体且与对应字段关联
- [ ] 错误状态通过多种方式呈现（图标、文字、边框，而非仅靠颜色）
- [ ] 表单提交错误有汇总信息且可获得焦点
- [ ] 已知类型的字段使用 autocomplete（例如 `type="email" autocomplete="email"`）

### 内容
- [ ] 声明页面语言（`<html lang="zh-CN">`）
- [ ] 页面有描述性的 `<title>`
- [ ] 链接与周围文本有明显区分（不能仅靠颜色）
- [ ] 移动端触摸目标 >= 44x44px
- [ ] 空状态有有意义的提示（不要显示空白页面）

## 常见 HTML 模式

### 按钮与链接

```html
<!-- 操作使用 <button> -->
<button onClick={handleDelete}>删除任务</button>

<!-- 导航使用 <a> -->
<a href="/tasks/123">查看任务</a>

<!-- 绝对不要用 div/span 当按钮 -->
<div onClick={handleDelete}>删除</div>  <!-- 错误 -->
```

### 表单标签

```html
<!-- 显式标签关联 -->
<label htmlFor="email">邮箱地址</label>
<input id="email" type="email" required />

<!-- 隐式包裹 -->
<label>
  邮箱地址
  <input type="email" required />
</label>

<!-- 隐藏标签（优先使用可见标签） -->
<input type="search" aria-label="搜索任务" />
```

### ARIA 角色

```html
<!-- 导航 -->
<nav aria-label="主导航">...</nav>
<nav aria-label="页脚链接">...</nav>

<!-- 状态消息 -->
<div role="status" aria-live="polite">任务已保存</div>

<!-- 警告消息 -->
<div role="alert">错误：标题为必填项</div>

<!-- 弹窗对话框 -->
<dialog aria-modal="true" aria-labelledby="dialog-title">
  <h2 id="dialog-title">确认删除</h2>
  ...
</dialog>

<!-- 加载状态 -->
<div aria-busy="true" aria-label="正在加载任务">
  <Spinner />
</div>
```

### 无障碍列表

```html
<ul role="list" aria-label="任务列表">
  <li>
    <input type="checkbox" id="task-1" aria-label="完成：买菜" />
    <label htmlFor="task-1">买菜</label>
  </li>
</ul>
```

## 测试工具

```bash
# 自动化审查
npx axe-core          # 编程式无障碍测试
npx pa11y             # 命令行无障碍检查器

# 浏览器内测试
# Chrome DevTools → Lighthouse → Accessibility
# Chrome DevTools → Elements → Accessibility tree

# 屏幕阅读器测试
# macOS: VoiceOver（Cmd + F5）
# Windows: NVDA（免费）或 JAWS
# Linux: Orca
```

## 快速参考：ARIA 实时区域

| 值 | 行为 | 用途 |
|-------|----------|---------|
| `aria-live="polite"` | 在下一次停顿时播报 | 状态更新、保存确认 |
| `aria-live="assertive"` | 立即播报 | 错误、时间敏感的警告 |
| `role="status"` | 同 `polite` | 状态消息 |
| `role="alert"` | 同 `assertive` | 错误消息 |

## 常见反模式

| 反模式 | 问题 | 修复方式 |
|---|---|---|
| 用 `div` 当按钮 | 无法获得焦点，无键盘支持 | 使用 `<button>` |
| 缺少 `alt` 文本 | 图片对屏幕阅读器不可见 | 添加描述性 `alt` |
| 仅靠颜色区分状态 | 色盲用户无法感知 | 添加图标、文字或图案 |
| 自动播放媒体 | 令人困惑，无法停止 | 添加控制按钮，不要自动播放 |
| 自定义下拉菜单无 ARIA | 键盘和屏幕阅读器无法使用 | 使用原生 `<select>` 或正确的 ARIA listbox |
| 移除焦点轮廓 | 用户看不到当前位置 | 美化轮廓样式，不要移除 |
| 空链接/空按钮 | 屏幕阅读器只播报"链接"，无描述 | 添加文本或 `aria-label` |
| `tabindex > 0` | 打乱自然 Tab 顺序 | 只使用 `tabindex="0"` 或 `-1` |
