# 性能检查清单

Web 应用性能快速参考清单。配合 br-review skill 的性能维度一起使用。

## 目录

- [Core Web Vitals 目标](#core-web-vitals-目标)
- [TTFB 诊断](#ttfb-诊断)
- [前端检查清单](#前端检查清单)
- [后端检查清单](#后端检查清单)
- [测量命令](#测量命令)
- [常见反模式](#常见反模式)

## Core Web Vitals 目标

| 指标 | 良好 | 需要改进 | 较差 |
|------|------|----------|------|
| LCP（最大内容绘制） | ≤ 2.5s | ≤ 4.0s | > 4.0s |
| INP（交互到下次绘制） | ≤ 200ms | ≤ 500ms | > 500ms |
| CLS（累积布局偏移） | ≤ 0.1 | ≤ 0.25 | > 0.25 |

## TTFB 诊断

当 TTFB 较慢（> 800ms）时，在 DevTools Network 瀑布流中逐项排查：

- [ ] **DNS 解析**慢 → 对已知域名添加 `<link rel="dns-prefetch">` 或 `<link rel="preconnect">`
- [ ] **TCP/TLS 握手**慢 → 启用 HTTP/2，考虑边缘部署，确认 keep-alive 开启
- [ ] **服务器处理**慢 → 分析后端性能，排查慢查询，添加缓存

## 前端检查清单

### 图片
- [ ] 图片使用现代格式（WebP、AVIF）
- [ ] 图片按响应式尺寸提供（`srcset` 和 `sizes`）
- [ ] 图片和 `<source>` 元素设置了明确的 `width` 和 `height`（防止艺术方向场景下的 CLS）
- [ ] 首屏以下的图片使用 `loading="lazy"` 和 `decoding="async"`
- [ ] Hero/LCP 图片使用 `fetchpriority="high"`，且不使用懒加载

### JavaScript
- [ ] 打包体积在 200KB gzipped 以内（首屏加载）
- [ ] 对路由和重型功能使用动态 `import()` 进行代码分割
- [ ] Tree shaking 已启用（确认依赖提供了 ESM 并标记了 `sideEffects: false`）
- [ ] `<head>` 中没有阻塞渲染的 JavaScript（使用 `defer` 或 `async`）
- [ ] 重计算卸载到 Web Workers（如适用）
- [ ] 对相同 props 下仍频繁重渲染的高开销组件使用 `React.memo()`
- [ ] 仅在性能分析确认有效的地方使用 `useMemo()` / `useCallback()`
- [ ] 长任务（> 50ms）已拆分，保持主线程可用——这是优化 INP 的核心手段
- [ ] 长循环中使用 `yieldToMain` 模式，让输入事件能在各处理块之间执行
- [ ] 在可用时使用现代调度 API：`scheduler.yield()`（优先）、带优先级的 `scheduler.postTask()`、`isInputPending()`（仅在需要时让出主线程）
- [ ] 可延迟的非紧急工作使用 `requestIdleCallback`（如：分析数据上报、预取、预热）
- [ ] 非关键工作从事件处理函数中延迟出去（如：埋点、日志），避免延迟用户交互的响应
- [ ] 第三方脚本使用 `async` / `defer` 加载，审查体积，重型脚本（聊天组件、嵌入内容）使用外观占位模式（facade）

### CSS
- [ ] 关键 CSS 已内联或预加载
- [ ] 非关键样式没有阻塞渲染
- [ ] 生产环境中没有 CSS-in-JS 的运行时开销（使用提取方案）

### 字体
- [ ] 限制在 2–3 个字体族，每个 2–3 个字重（每多一个字重就多一次请求）
- [ ] 仅使用 WOFF2 格式（体积最小，兼容性已足够——跳过 WOFF/TTF/EOT）
- [ ] 尽可能自托管（第三方字体 CDN 会增加 DNS + TCP + TLS 往返时间）
- [ ] LCP 关键字体已预加载：`<link rel="preload" as="font" type="font/woff2" crossorigin>`
- [ ] 使用 `font-display: swap`（非关键字体用 `optional`），避免 FOIT 阻塞渲染
- [ ] 通过 `unicode-range` 子集化，只加载页面需要的字符
- [ ] 需要多个字重/样式时考虑可变字体（一个文件替代多个）
- [ ] 通过 `size-adjust`、`ascent-override`、`descent-override` 调整回退字体度量，减少字体切换时的 CLS
- [ ] 优先考虑系统字体栈，再决定是否引入自定义字体

### 网络
- [ ] 静态资源使用长 `max-age` + 内容哈希进行缓存
- [ ] API 响应在合适的地方配置缓存（`Cache-Control`）
- [ ] 启用 HTTP/2 或 HTTP/3
- [ ] 对已知域名预连接（`<link rel="preconnect">`）
- [ ] 对关键非图片资源使用 `fetchpriority`（如：关键 `<link rel="preload">`、首屏 `<script>`）——不仅限于 `<img>`
- [ ] 没有不必要的重定向

### 渲染
- [ ] 没有布局抖动（强制同步布局）
- [ ] 动画使用 `transform` 和 `opacity`（GPU 加速）
- [ ] 长列表使用虚拟化（如 `react-window`）
- [ ] 没有不必要的全页重渲染
- [ ] 屏幕外区域使用 `content-visibility: auto` 配合 `contain-intrinsic-size`，跳过非可见区域的布局和绘制
- [ ] 没有 `unload` 事件处理器，HTML 响应不带 `Cache-Control: no-store`——保持前进/后退缓存（bfcache）资格

## 后端检查清单

### 数据库
- [ ] 没有 N+1 查询模式（使用预加载 / join）
- [ ] 查询有合适的索引
- [ ] 列表接口已分页（绝不 `SELECT * FROM table`）
- [ ] 已配置连接池
- [ ] 已启用慢查询日志

### API
- [ ] 响应时间 < 200ms（p95）
- [ ] 请求处理函数中没有同步重计算
- [ ] 使用批量操作替代循环单条调用
- [ ] 响应已压缩（gzip/brotli）
- [ ] 配置了合适的缓存（内存、Redis、CDN）

### 基础设施
- [ ] 静态资源使用 CDN
- [ ] 服务器靠近用户（或使用边缘部署）
- [ ] 已配置水平扩缩容（如需要）
- [ ] 为负载均衡器提供健康检查端点

## 测量命令

### INP 线上数据与 DevTools 工作流

1. **先看线上数据** — 在 [CrUX Vis](https://developer.chrome.com/docs/crux/vis) 或你的 RUM 工具中查看真实用户的 INP 数据，再开始优化
2. **定位慢交互** — 打开 DevTools → Performance 面板 → 录制期间进行交互；关注点击/按键触发的长任务
3. **在中端 Android 设备上测试** — INP 问题通常只在较慢的硬件上暴露；使用真机或 DevTools CPU 节流（4×–6× 降速）

```bash
# Lighthouse CLI
npx lighthouse https://localhost:3000 --output json --output-path ./report.json

# 打包体积分析
npx webpack-bundle-analyzer stats.json
# 或 Vite 项目：
npx vite-bundle-visualizer

# 检查打包体积
npx bundlesize

# 代码中采集 Web Vitals
import { onLCP, onINP, onCLS } from 'web-vitals';
onLCP(console.log);
onINP(console.log);
onCLS(console.log);

# 带交互级详情的 INP 采集（attribution 版本）
import { onINP } from 'web-vitals/attribution';
onINP(({ value, attribution }) => {
  const { interactionTarget, inputDelay, processingDuration, presentationDelay } = attribution;
  console.log({ value, interactionTarget, inputDelay, processingDuration, presentationDelay });
});
```

## 常见反模式

| 反模式 | 影响 | 修复方式 |
|--------|------|----------|
| N+1 查询 | 数据库负载线性增长 | 使用 join、includes 或批量加载 |
| 无限制查询 | 内存耗尽、超时 | 始终分页，添加 LIMIT |
| 缺少索引 | 数据增长后读取变慢 | 为过滤/排序字段添加索引 |
| 布局抖动 | 卡顿、掉帧 | 批量读取 DOM，再批量写入 |
| 图片未优化 | LCP 慢、带宽浪费 | 使用 WebP、响应式尺寸、懒加载 |
| 打包体积过大 | Time to Interactive 变慢 | 代码分割、tree shaking、审查依赖 |
| 阻塞主线程 | INP 差、UI 无响应 | 用 `scheduler.yield()` / `yieldToMain` 拆分长任务，卸载到 Web Workers |
| 内存泄漏 | 内存持续增长，最终崩溃 | 清理监听器、定时器、引用 |
