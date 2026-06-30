---
生成时间: 2026-06-25
模式: 小功能探索
状态: APPROVED
触发 skill: br-brainstorming
---

# 需求文档：待办事项（Todo）最小可用版

## 意图概述

用户想要一个命令行能跑的待办清单工具，能增删查改、能标记完成、退出后数据不丢。先做最小可用，不要花哨功能。

## 具体需求

- [ ] 添加任务（标题）
- [ ] 列出所有任务（带序号和完成状态）
- [ ] 标记任务完成/未完成
- [ ] 删除任务
- [ ] 数据持久化到本地 JSON 文件

## 技术方案

基于项目现有 Node 环境，纯 JavaScript + 内置 fs 模块，不引入第三方依赖。

- 实现思路：一个 TodoService 类封装所有操作 + 一个 CLI 入口解析命令
- 涉及文件：src/todo.js（新增）、src/todo.test.js（新增）、bin/todo.js（新增）、package.json（修改 bin 字段）
- 技术要点：JSON 文件读写、原子写入（先写临时文件再 rename 避免损坏）

## 影响范围

仅新增文件 + package.json 加一个 bin 字段，不影响任何现有代码（本项目当前为空）。

## 不做的事情（Not Doing）

- 不做优先级（所有任务平等）
- 不做截止日期
- 不做分类/标签
- 不做 Web UI（纯 CLI）
- 不做多用户

## 验收标准

- [ ] 运行 `node bin/todo.js add 买菜` 后，JSON 文件里出现一条记录
- [ ] 运行 `node bin/todo.js list` 打印所有任务，含序号和 [ ]/[x] 完成标记
- [ ] 运行 `node bin/todo.js done 1` 后，序号 1 的任务状态变为完成
- [ ] 运行 `npm test` 全部通过（含持久化测试）
- [ ] 退出后重新运行，数据仍在

## Scope Check 结果

- [MEDIUM-1] 持久化测试可能因文件路径不同而脆弱：建议测试用临时目录隔离
<!-- tally-start -->
HIGH: 0
MEDIUM: 1
LOW: 0
<!-- tally-end -->
