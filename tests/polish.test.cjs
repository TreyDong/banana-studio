'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const polish = require('../src/polish/polish.js');

test('default roles ship general, de-AI, oral and tighten prompts', () => {
  const roles = polish.defaultRoles();
  assert.deepEqual(roles.map(role => role.id), ['general', 'deai', 'oral', 'tighten']);
  assert.ok(roles.every(role => role.prompt.length > 20), '每个默认角色都要有可用提示词');
  assert.ok(roles.every(role => role.builtin));
});

test('roles are seeded once and custom roles survive', () => {
  const settings = {};
  assert.equal(polish.ensureRoles(settings).length, 4);
  settings.roles.push({ id: 'mine', name: '我的角色', prompt: '只改结构' });
  assert.equal(polish.ensureRoles(settings).length, 5);
  assert.equal(polish.ensureRoles({ roles: [] }).length, 4, '空列表视为未配置，重新写入默认角色');
});

test('frontmatter is split from the body and never polished', () => {
  const split = polish.splitFrontmatter('---\ntitle: x\n---\n\n正文第一段\n');
  assert.equal(split.front, '---\ntitle: x\n---\n');
  assert.equal(split.body, '\n正文第一段\n');
  const plain = polish.splitFrontmatter('# 标题\n正文');
  assert.equal(plain.front, '');
  assert.equal(plain.body, '# 标题\n正文');
});

test('polished output loses an outer code fence but keeps inner ones', () => {
  assert.equal(polish.cleanPolished('```markdown\n润色后\n```'), '润色后');
  assert.equal(polish.cleanPolished('  正文  '), '正文');
  assert.ok(polish.cleanPolished('```\n含 ``` 的代码块\n```').includes('含 ``` 的代码块'));
});

test('the prompt carries role, skills, instruction and the article in order', () => {
  const { system, user } = polish.buildPolishMessages({ article: '原文正文', role: { prompt: '角色要求' }, skillTexts: ['技能一', '技能二'], instruction: '只改第一段', title: '文章标题' });
  assert.ok(system.includes('角色要求'));
  assert.ok(system.includes('技能一') && system.includes('技能二'));
  assert.ok(system.indexOf('技能一') < system.indexOf('技能二'), '技能按添加顺序排列');
  assert.ok(system.includes('技能说明 1') && system.includes('技能说明 2'), '多个技能要编号');
  assert.ok(system.includes('图片'));
  assert.ok(user.includes('只改第一段'));
  assert.ok(user.includes('文章标题'));
  assert.ok(user.indexOf('原文正文') > user.indexOf('只改第一段'), '额外要求排在正文之前');
});

test('a role without a prompt still works with skill files alone', () => {
  const { system } = polish.buildPolishMessages({ article: '原文正文', role: { prompt: '   ', skills: ['a.md'] }, skillTexts: ['只按技能改'], title: '标题' });
  assert.ok(system.startsWith('下面是技能说明'), '没有提示词时技能排在最前');
  assert.ok(system.includes('只按技能改'));
  assert.ok(!system.includes('技能说明 1'), '单个技能不需要编号');
});

test('roles keep several skill files and accept the older single path', () => {
  assert.deepEqual(polish.roleSkills({ skills: ['a.md', ' b.md ', 'a.md'] }), ['a.md', 'b.md']);
  assert.deepEqual(polish.roleSkills({ skills: ['a.md'], skillPath: 'c.md' }), ['a.md', 'c.md'], '旧版 skillPath 继续生效');
  assert.deepEqual(polish.roleSkills({ skillPath: ' c.md ' }), ['c.md']);
  assert.deepEqual(polish.roleSkills({}), []);
  assert.deepEqual(polish.roleSkills(undefined), []);
});

test('a role is ready with a prompt or a skill file, and blocked without both', () => {
  assert.equal(polish.roleReady({ prompt: '改结构' }), true);
  assert.equal(polish.roleReady({ prompt: '  ', skills: ['a.md'] }), true);
  assert.equal(polish.roleReady({ prompt: '', skillPath: 'a.md' }), true);
  assert.equal(polish.roleReady({ prompt: '  ', skills: [] }), false);
  assert.equal(polish.roleReady(undefined), false);
});

test('skill files are read from disk and missing ones fail loudly', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bd-polish-'));
  fs.writeFileSync(path.join(dir, 'skill.md'), '# 去 AI 味\n规则');
  assert.equal(await polish.readSkill(path.join(dir, 'skill.md')), '# 去 AI 味\n规则');
  assert.equal(await polish.readSkill(''), '');
  await assert.rejects(polish.readSkill(path.join(dir, 'missing.md')), /ENOENT/);
});

test('several skill files are read in order and errors name the path', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bd-polish-'));
  fs.writeFileSync(path.join(dir, 'a.md'), '甲');
  fs.writeFileSync(path.join(dir, 'b.md'), '乙');
  assert.deepEqual(await polish.readSkills([path.join(dir, 'a.md'), path.join(dir, 'b.md')]), ['甲', '乙']);
  assert.deepEqual(await polish.readSkills([]), []);
  assert.deepEqual(await polish.readSkills(path.join(dir, 'a.md')), ['甲'], '单个路径也能读');
  const missing = path.join(dir, 'missing.md');
  await assert.rejects(polish.readSkills([path.join(dir, 'a.md'), missing]), error => error.message.includes(missing));
});

test('versions are stored per article, newest first, and can be removed', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bd-polish-'));
  const file = polish.versionFile(dir, '笔记/文章.md');
  assert.notEqual(file, polish.versionFile(dir, '其他.md'), '不同文章用不同版本文件');
  assert.deepEqual(await polish.loadVersions(file), []);
  const v1 = { id: 'v1', roleName: '通用润色', createdAt: Date.now(), text: '版本一' };
  const v2 = { id: 'v2', roleName: '去 AI 味', createdAt: Date.now(), text: '版本二' };
  let versions = await polish.addVersion(file, v1, '笔记/文章.md');
  assert.equal(versions.length, 1);
  versions = await polish.addVersion(file, v2, '笔记/文章.md');
  assert.equal(versions[0].id, 'v2', '新版本排在最前');
  assert.equal(versions.length, 2);
  versions = await polish.removeVersion(file, 'v2', '笔记/文章.md');
  assert.equal(versions.length, 1);
  assert.equal(versions[0].text, '版本一');
  const stored = JSON.parse(fs.readFileSync(file, 'utf8'));
  assert.equal(stored.path, '笔记/文章.md');
});

test('character count ignores whitespace', () => {
  assert.equal(polish.wordCount('你好 世界'), 4);
  assert.equal(polish.wordCount(''), 0);
});
