#!/usr/bin/env node
// BuildRail 一键安装器（零依赖，纯 Node，跨平台）
//
// 用法：
//   npx buildrail init            # 交互式选择目标 agent，复制 commands/skills 到对应目录
//   node cli/buildrail.js init    # 本地直接跑
//
// 设计目标：新手懒人一行命令装上，不碰符号链接、不碰 PowerShell/bash 语法。

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');

// ---- 路径辅助 ----

const REPO_ROOT = path.resolve(__dirname, '..');
const SRC_COMMANDS = path.join(REPO_ROOT, 'commands');
const SRC_SKILLS = path.join(REPO_ROOT, 'skills');

// 各 agent 的目标目录（相对用户主目录）。
// 新增 agent 支持时，在 AGENTS 表里加一项即可。
const AGENTS = {
  'claude-code': {
    label: 'Claude Code',
    commandsDir: '.claude/commands',
    skillsDir: '.claude/skills',
  },
  'windsurf': {
    label: 'Windsurf',
    // Windsurf 用 rules + workflows；BuildRail 的 command 放 workflows，skill 放 rules 下的 skills
    commandsDir: '.codeium/windsurf/workflows',
    skillsDir: '.codeium/windsurf/rules/buildrail-skills',
  },
  'opencode': {
    label: 'OpenCode',
    commandsDir: '.opencode/commands',
    skillsDir: '.opencode/skills',
  },
  'cursor': {
    label: 'Cursor',
    commandsDir: '.cursor/commands',
    skillsDir: '.cursor/skills',
  },
};

// ---- 文件操作（跨平台，不依赖 shell） ----

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function copyDir(src, dest) {
  // 递归复制目录。Node 16.7+ 有 cpSync，这里写个兼容兜底。
  if (typeof fs.cpSync === 'function') {
    fs.cpSync(src, dest, { recursive: true, force: true });
    return;
  }
  ensureDir(dest);
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

function listMarkdownFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.md'))
    .map(f => ({ name: f, path: path.join(dir, f) }));
}

function listSkillDirs(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => ({ name: e.name, path: path.join(dir, e.name) }));
}

// ---- 交互式输入 ----

function ask(rl, question) {
  return new Promise(resolve => rl.question(question, ans => resolve(ans.trim())));
}

// 检测哪些 agent 的目标目录已存在（作为推荐默认）
function detectInstalledAgents() {
  const home = os.homedir();
  const found = [];
  for (const [key, cfg] of Object.entries(AGENTS)) {
    // 宽松判断：命令目录、或其顶层配置目录存在即认为装了该 agent
    // 例如 claude-code 看 ~/.claude，windsurf 看 ~/.codeium，opencode 看 ~/.opencode
    const topConfigDir = path.join(home, cfg.commandsDir.split('/')[0]);
    const candidates = [
      path.join(home, cfg.commandsDir),
      topConfigDir,
    ];
    if (candidates.some(c => fs.existsSync(c))) found.push(key);
  }
  return found;
}

// ---- 安装主流程 ----

async function installAgent(agentKey) {
  const cfg = AGENTS[agentKey];
  const home = os.homedir();
  const destCommands = path.join(home, cfg.commandsDir);
  const destSkills = path.join(home, cfg.skillsDir);

  console.log(`\n→ 安装到 ${cfg.label}`);
  console.log(`  命令目录: ${destCommands}`);
  console.log(`  技能目录: ${destSkills}`);

  ensureDir(destCommands);
  ensureDir(destSkills);

  // 复制 commands/*.md
  const cmds = listMarkdownFiles(SRC_COMMANDS);
  for (const c of cmds) {
    fs.copyFileSync(c.path, path.join(destCommands, c.name));
  }
  console.log(`  ✓ 复制 ${cmds.length} 个命令 (${cmds.map(c => c.name).join(', ')})`);

  // 复制 skills/*/
  const skills = listSkillDirs(SRC_SKILLS);
  for (const s of skills) {
    copyDir(s.path, path.join(destSkills, s.name));
  }
  console.log(`  ✓ 复制 ${skills.length} 个技能目录`);
}

async function cmdInit() {
  console.log('════════════════════════════════════════');
  console.log('  BuildRail 安装器');
  console.log('  让 AI 编程助手按纪律干活');
  console.log('════════════════════════════════════════\n');

  if (!fs.existsSync(SRC_COMMANDS) || !fs.existsSync(SRC_SKILLS)) {
    console.error('✗ 找不到 commands/ 或 skills/ 目录。请确认在 BuildRail 仓库根目录或已正确分发。');
    console.error(`  期望位置: ${SRC_COMMANDS}`);
    process.exit(1);
  }

  const detected = detectInstalledAgents();
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  console.log('选择要安装到哪个 AI 助手：\n');
  const keys = Object.keys(AGENTS);
  keys.forEach((k, i) => {
    const installed = detected.includes(k) ? ' [检测到已安装]' : '';
    console.log(`  ${i + 1}) ${AGENTS[k].label} (${k})${installed}`);
  });
  console.log(`  a) 全部安装`);
  console.log('');

  let choice = await ask(rl, `输入序号（默认 ${detected.length === 1 ? keys.indexOf(detected[0]) + 1 : 1}${detected.length === 1 ? '，检测到 ' + AGENTS[detected[0]].label : ''}）: `);

  // 默认值优先用检测到的第一个 agent，没有检测到才回退到序号 1
  const defaultIdx = detected.length === 1 ? keys.indexOf(detected[0]) : 0;

  let targets = [];
  if (choice.toLowerCase() === 'a') {
    targets = keys;
  } else {
    const idx = parseInt(choice || String(defaultIdx + 1), 10) - 1;
    if (isNaN(idx) || idx < 0 || idx >= keys.length) {
      console.error(`✗ 无效选择: "${choice}"`);
      rl.close();
      process.exit(1);
    }
    targets = [keys[idx]];
  }

  for (const t of targets) {
    try {
      await installAgent(t);
    } catch (e) {
      console.error(`  ✗ 安装失败: ${e.message}`);
      console.error(`    请检查目录权限，或手动复制。`);
    }
  }

  rl.close();
  console.log('\n✅ 安装完成。');
  console.log('   重启你的 AI 助手，然后试试：');
  console.log('   /br-bugfix <bug 描述>');
  console.log('   /br-iterate <改动描述>');
  console.log('   /br-full-dev <需求描述>     全自动，一路跑到底');
  console.log('   /idea <需求描述>            分步，逐步掌控');
  console.log('\n   两种用法见 README.md 的"两种用法"章节，或 shared/two-paths.md。\n');
}

// ---- 导出（供单元测试 require；命令分发在 require.main === module 时才执行，被 require 时跳过） ----

module.exports = {
  AGENTS,
  ensureDir,
  copyDir,
  listMarkdownFiles,
  listSkillDirs,
  detectInstalledAgents,
  SRC_COMMANDS,
  SRC_SKILLS,
};

// ---- 命令分发（仅直接运行时执行，被 require 时跳过） ----

if (require.main === module) {
  const [, , cmd, ...rest] = process.argv;

  if (cmd === 'init') {
    cmdInit().catch(e => {
      console.error('✗ 安装出错:', e.message);
      process.exit(1);
    });
  } else if (cmd === 'list') {
    // 调试用：列出当前仓库的 commands / skills
    console.log('Commands:');
    listMarkdownFiles(SRC_COMMANDS).forEach(c => console.log('  ' + c.name));
    console.log('\nSkills:');
    listSkillDirs(SRC_SKILLS).forEach(s => console.log('  ' + s.name + '/'));
  } else if (cmd === 'help' || cmd === '--help' || cmd === '-h' || typeof cmd === 'undefined') {
    console.log('BuildRail CLI — AI 原生开发工作流集合的一键安装器');
    console.log('');
    console.log('用法:');
    console.log('  buildrail init            交互式安装 commands/skills 到目标 AI 助手');
    console.log('  buildrail list            列出本仓库包含的 commands/skills');
    console.log('  buildrail help            显示本帮助');
    console.log('');
    console.log('支持的 AI 助手:');
    Object.entries(AGENTS).forEach(([k, v]) => console.log(`  ${v.label} (${k})`));
    console.log('');
    console.log('安装后用斜杠命令驱动你的 AI 助手，详见 README.md。');
    process.exit(0);
  } else {
    console.log('BuildRail CLI');
    console.log('');
    console.log(`✗ 未知命令: "${cmd}"`);
    console.log('用法:');
    console.log('  buildrail init            交互式安装 commands/skills 到目标 AI 助手');
    console.log('  buildrail list            列出本仓库包含的 commands/skills');
    console.log('  buildrail help            显示帮助');
    process.exit(1);
  }
}
