const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

// BuildRail CLI 是可被 require 的脚本（见 buildrail.js 末尾的 module.exports）
const cli = require('../cli/buildrail.js');

const { AGENTS, ensureDir, copyDir, listMarkdownFiles, listSkillDirs, detectInstalledAgents, SRC_COMMANDS, SRC_SKILLS } = cli;

// ---- 临时目录辅助：每个测试用独立临时目录，测完清理 ----

function tmpDir() {
  const d = path.join(os.tmpdir(), `buildrail-test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  ensureDir(d);
  return d;
}

function cleanup(d) {
  try { fs.rmSync(d, { recursive: true, force: true }); } catch { /* ignore */ }
}

// ---- 测试 1：仓库本身包含 6+ 个命令文件 ----

test('SRC_COMMANDS 目录存在且包含 .md 命令文件', () => {
  const cmds = listMarkdownFiles(SRC_COMMANDS);
  assert.ok(cmds.length >= 6, `应至少有 6 个命令文件，实际 ${cmds.length}`);
  // 关键命令必须存在（对应 P0-1 修复）
  const names = cmds.map(c => c.name);
  for (const required of ['idea.md', 'br-review.md', 'br-ship.md', 'br-debug.md', 'br-scope-check.md', 'run.md']) {
    assert.ok(names.includes(required), `缺少命令文件 ${required}`);
  }
});

// ---- 测试 2：仓库本身包含 10 个 skill 目录 ----

test('SRC_SKILLS 目录存在且包含 skill 子目录', () => {
  const skills = listSkillDirs(SRC_SKILLS);
  assert.ok(skills.length >= 10, `应至少有 10 个 skill 目录，实际 ${skills.length}`);
  const names = skills.map(s => s.name);
  for (const required of ['idea', 'br-office-hours', 'br-brainstorming', 'br-review', 'br-debug', 'br-ship']) {
    assert.ok(names.includes(required), `缺少 skill 目录 ${required}`);
  }
});

// ---- 测试 3：ensureDir 递归创建目录 ----

test('ensureDir 能递归创建多层目录', () => {
  const d = path.join(tmpDir(), 'a', 'b', 'c');
  ensureDir(d);
  assert.ok(fs.existsSync(d), '多层目录应被创建');
  cleanup(path.dirname(path.dirname(path.dirname(d))));
});

// ---- 测试 4：copyDir 递归复制目录 ----

test('copyDir 能递归复制目录结构', () => {
  const src = tmpDir();
  fs.writeFileSync(path.join(src, 'top.md'), '# top');
  fs.mkdirSync(path.join(src, 'sub'));
  fs.writeFileSync(path.join(src, 'sub', 'child.md'), '# child');

  const dest = path.join(tmpDir(), 'copy');
  copyDir(src, dest);

  assert.ok(fs.existsSync(path.join(dest, 'top.md')), '顶层文件应被复制');
  assert.ok(fs.existsSync(path.join(dest, 'sub', 'child.md')), '子目录文件应被复制');
  assert.strictEqual(fs.readFileSync(path.join(dest, 'top.md'), 'utf8'), '# top', '内容应一致');

  cleanup(src);
  cleanup(dest);
});

// ---- 测试 5：copyDir 覆盖已存在的目标（force 行为） ----

test('copyDir 覆盖已存在的目标文件', () => {
  const src = tmpDir();
  fs.writeFileSync(path.join(src, 'f.md'), 'new');

  const dest = tmpDir();
  fs.writeFileSync(path.join(dest, 'f.md'), 'old');

  copyDir(src, dest);
  assert.strictEqual(fs.readFileSync(path.join(dest, 'f.md'), 'utf8'), 'new', '旧内容应被新内容覆盖');

  cleanup(src);
  cleanup(dest);
});

// ---- 测试 6：listMarkdownFiles 只返回 .md 且包含路径 ----

test('listMarkdownFiles 过滤非 .md 文件并返回路径', () => {
  const d = tmpDir();
  fs.writeFileSync(path.join(d, 'a.md'), 'a');
  fs.writeFileSync(path.join(d, 'b.txt'), 'b');
  fs.writeFileSync(path.join(d, 'c.md'), 'c');

  const result = listMarkdownFiles(d);
  assert.strictEqual(result.length, 2, '应只返回 2 个 .md 文件');
  assert.ok(result.every(r => r.name.endsWith('.md')), '所有条目都应是 .md');
  assert.ok(result.every(r => r.path && fs.existsSync(r.path)), '每个条目都应有有效路径');

  cleanup(d);
});

// ---- 测试 7：listMarkdownFiles 对不存在的目录返回空数组 ----

test('listMarkdownFiles 对不存在的目录返回空数组', () => {
  const result = listMarkdownFiles(path.join(tmpDir(), 'nonexistent'));
  assert.deepStrictEqual(result, [], '不存在的目录应返回空数组');
});

// ---- 测试 8：listSkillDirs 只返回目录且排除文件 ----

test('listSkillDirs 只返回目录，排除文件', () => {
  const d = tmpDir();
  fs.mkdirSync(path.join(d, 'skill-a'));
  fs.mkdirSync(path.join(d, 'skill-b'));
  fs.writeFileSync(path.join(d, 'not-a-skill.md'), 'x');

  const result = listSkillDirs(d);
  assert.strictEqual(result.length, 2, '应只返回 2 个目录');
  assert.ok(result.every(r => !r.name.includes('.')), '目录名不应含点');

  cleanup(d);
});

// ---- 测试 9：detectInstalledAgents 返回数组 ----

test('detectInstalledAgents 返回字符串数组（可能为空）', () => {
  const found = detectInstalledAgents();
  assert.ok(Array.isArray(found), '应返回数组');
  // 每个元素都应是 AGENTS 表里的合法 key
  const validKeys = Object.keys(AGENTS);
  assert.ok(found.every(k => validKeys.includes(k)), '每个检测结果都应是合法的 agent key');
});

// ---- 测试 10：AGENTS 表包含四个支持的 agent ----

test('AGENTS 表包含 claude-code / windsurf / opencode / cursor', () => {
  const keys = Object.keys(AGENTS);
  for (const required of ['claude-code', 'windsurf', 'opencode', 'cursor']) {
    assert.ok(keys.includes(required), `应支持 ${required}`);
    assert.ok(AGENTS[required].commandsDir, `${required} 应有 commandsDir`);
    assert.ok(AGENTS[required].skillsDir, `${required} 应有 skillsDir`);
    assert.ok(AGENTS[required].label, `${required} 应有 label`);
  }
});

// ---- 测试 11：windsurf 的 commandsDir 不以 /commands 结尾（验证 marker 修复的边界） ----

test('windsurf commandsDir 是 .codeium/windsurf/workflows（非 /commands 结尾）', () => {
  assert.strictEqual(AGENTS['windsurf'].commandsDir, '.codeium/windsurf/workflows');
  assert.ok(!AGENTS['windsurf'].commandsDir.endsWith('/commands'), 'windsurf 不应用 /commands 结尾的检测逻辑');
});