# 安全检查清单

Web 应用安全快速参考。配合 br-review skill 的安全维度一起使用，按需展开对应章节。

## 目录

- [提交前检查](#提交前检查)
- [身份认证](#身份认证)
- [权限控制](#权限控制)
- [输入校验](#输入校验)
- [安全响应头](#安全响应头)
- [CORS 配置](#cors-配置)
- [数据保护](#数据保护)
- [依赖安全](#依赖安全)
- [错误处理](#错误处理)
- [OWASP Top 10 快速参考](#owasp-top-10-快速参考)

## 提交前检查

- [ ] 代码中没有密钥（用 agent 的 Grep 工具扫描暂存区 diff，搜索 `password|secret|api_key|token`；bash 环境下可用 `git diff --cached | grep -i "password\|secret\|api_key\|token"`，Windows 原生 CMD/PowerShell 不支持该管道写法）
- [ ] `.gitignore` 已覆盖：`.env`、`.env.local`、`*.pem`、`*.key`
- [ ] `.env.example` 使用占位值（而非真实密钥）

## 身份认证

- [ ] 密码使用 bcrypt（≥12 轮）、scrypt 或 argon2 进行哈希
- [ ] Session Cookie 设置：`httpOnly`、`secure`、`sameSite: 'lax'`
- [ ] 已配置 Session 过期时间（合理的 max-age）
- [ ] 登录接口有限流（≤10 次/15 分钟）
- [ ] 密码重置令牌：限时（≤1 小时）、一次性使用
- [ ] 连续失败后锁定账户（可选，需通知用户）
- [ ] 敏感操作支持 MFA 多因素认证（可选，但强烈推荐）

## 权限控制

- [ ] 每个受保护接口都检查了认证状态
- [ ] 每次资源访问都检查了所有权/角色（防止 IDOR）
- [ ] 管理接口需要管理员角色验证
- [ ] API 密钥仅授予最小必要权限
- [ ] JWT 令牌已验证签名、过期时间和签发者

## 输入校验

- [ ] 所有用户输入在系统边界处校验（API 路由、表单处理）
- [ ] 校验使用白名单（而非黑名单）
- [ ] 字符串长度有约束（最小/最大值）
- [ ] 数值范围已校验
- [ ] 邮箱、URL、日期格式使用专业库校验
- [ ] 文件上传：限制类型、限制大小、校验实际内容
- [ ] SQL 查询使用参数化（禁止字符串拼接）
- [ ] HTML 输出已编码（使用框架自带的转义机制）
- [ ] 重定向前校验目标 URL（防止开放重定向）

## 安全响应头

```
Content-Security-Policy: default-src 'self'; script-src 'self'
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 0  (已禁用，依赖 CSP)
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

## CORS 配置

```typescript
// 严格模式（推荐）
cors({
  origin: ['https://yourdomain.com', 'https://app.yourdomain.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
})

// 生产环境绝对不要这样写：
cors({ origin: '*' })  // 允许任何来源
```

## 数据保护

- [ ] API 响应中排除了敏感字段（`passwordHash`、`resetToken` 等）
- [ ] 不记录敏感数据到日志（密码、令牌、完整信用卡号）
- [ ] PII 数据静态加密（如法规要求）
- [ ] 所有外部通信使用 HTTPS
- [ ] 数据库备份已加密

## 依赖安全

```bash
# 审计依赖
npm audit

# 自动修复可修复的问题
npm audit fix

# 仅检查严重漏洞
npm audit --audit-level=critical

# 保持依赖更新
npx npm-check-updates
```

## 错误处理

```typescript
// 生产环境：返回通用错误，不暴露内部细节
res.status(500).json({
  error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' }
});

// 生产环境绝对不要这样写：
res.status(500).json({
  error: err.message,
  stack: err.stack,         // 暴露内部实现
  query: err.sql,           // 暴露数据库细节
});
```

## OWASP Top 10 快速参考

| # | 漏洞 | 防护措施 |
|---|---|---|
| 1 | 权限控制失效 | 每个接口都做认证检查，验证资源所有权 |
| 2 | 加密失败 | 使用 HTTPS、强哈希算法，不在代码中存放密钥 |
| 3 | 注入 | 参数化查询、输入校验 |
| 4 | 不安全设计 | 威胁建模、规范驱动开发 |
| 5 | 安全配置错误 | 安全响应头、最小权限、审计依赖 |
| 6 | 易受攻击的组件 | `npm audit`、保持依赖更新、精简依赖 |
| 7 | 认证失败 | 强密码策略、限流、Session 管理 |
| 8 | 数据完整性失败 | 校验更新和依赖来源、使用签名产物 |
| 9 | 日志与监控失败 | 记录安全事件、不记录密钥 |
| 10 | SSRF | 校验/白名单 URL、限制出站请求 |
