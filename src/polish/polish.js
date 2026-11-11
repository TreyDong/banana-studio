'use strict';

// 文章润色：角色提示词、本地技能文件、按文章保存的版本记录。
// 版本 JSON 放在插件目录下（不进入笔记库），每篇文章一个文件。
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const OUTPUT_RULES = '输出要求：只输出润色后的 Markdown 正文，不要解释，也不要把整篇内容包在代码块里；保留原有标题层级、列表、表格、代码块、![[图片]] 与 [[链接]]，不要删除或改写它们；不添加原文没有的事实、数字或观点。';

const DEFAULT_ROLES = [
  {
    id: 'general',
    name: '通用润色',
    prompt: '你是中文文章的编辑。在不改变作者观点、事实和个人经历的前提下，修顺语句、删掉重复和冗余、调整段落顺序让逻辑更清楚，保留原文的口吻和用词习惯。不确定的表述保持原样，不补写新内容。',
    skillPath: '',
    builtin: true,
  },
  {
    id: 'deai',
    name: '去 AI 味',
    prompt: '你是中文写作编辑，帮作者去掉文章里的 AI 腔。删掉套话和空泛总结（如「总而言之」「希望对你有帮助」「在当今时代」）、堆叠的排比和三段式对仗、过度整齐的小标题；把「不是 X，而是 Y」「不仅仅是……更是……」这类句式改成直说；删掉没有事实支撑的宏大判断。保留第一人称、个人经验、具体细节和作者原本的语气，只改表达，不改事实、观点和结论，也不新增内容。',
    skillPath: '',
    builtin: true,
  },
  {
    id: 'oral',
    name: '口语化',
    prompt: '把文章改成口述的语气：短句、自然的连接词、少用书面腔和被动句，读起来像在跟朋友说话。保留原意、第一人称和个人经历，不增加原文没有的内容。',
    skillPath: '',
    builtin: true,
  },
  {
    id: 'tighten',
    name: '精简',
    prompt: '在保留全部关键信息和例子的前提下，把文章压缩到大约原文的三分之二：删掉重复表达、铺垫和可有可无的形容。不改事实、观点和口吻，不新增内容。',
    skillPath: '',
    builtin: true,
  },
];

function defaultRoles() {
  return DEFAULT_ROLES.map(role => ({ ...role }));
}

/* 首次使用时写入默认角色；空数组视为未配置（至少保留一个角色才能润色）。 */
function ensureRoles(polish) {
  if (!polish || typeof polish !== 'object') return defaultRoles();
  if (!Array.isArray(polish.roles) || !polish.roles.length) polish.roles = defaultRoles();
  return polish.roles;
}

/* 把 YAML 属性头单独拆出：润色只改正文，应用时再拼回去。 */
function splitFrontmatter(markdown) {
  const text = String(markdown || '');
  const match = /^---\r?\n[\s\S]*?\r?\n---\r?\n?/.exec(text);
  if (!match) return { front: '', body: text };
  return { front: match[0], body: text.slice(match[0].length) };
}

/* 模型偶尔会把整篇包在代码块里；只剥掉最外层围栏，不动正文内的代码块。 */
function cleanPolished(text) {
  let out = String(text || '').trim();
  const fence = /^```[a-zA-Z]*\s*\r?\n([\s\S]*?)\r?\n```$/.exec(out);
  if (fence) out = fence[1].trim();
  return out;
}

/* 角色的技能文件：兼容早期单个 skillPath，统一返回去重后的路径列表。 */
function roleSkills(role) {
  const list = Array.isArray(role?.skills) ? role.skills : [];
  const legacy = String(role?.skillPath || '').trim();
  return [...new Set([...list, legacy].map(item => String(item || '').trim()).filter(Boolean))];
}

/* 只要提示词或技能文件有一项就能润色；两者都空时不能开始。 */
function roleReady(role) {
  return !!String(role?.prompt || '').trim() || roleSkills(role).length > 0;
}

function buildPolishMessages({ article, role, skillTexts = [], skillText = '', instruction = '', title = '' }) {
  const parts = [];
  const rolePrompt = String(role?.prompt || '').trim();
  if (rolePrompt) parts.push(rolePrompt);
  const texts = [...(Array.isArray(skillTexts) ? skillTexts : []), skillText].map(text => String(text || '').trim()).filter(Boolean);
  for (const [index, text] of texts.entries()) parts.push((texts.length > 1 ? '下面是技能说明 ' + (index + 1) + '，请按其中的要求执行：\n\n' : '下面是技能说明，请按其中的要求执行：\n\n') + text);
  parts.push(OUTPUT_RULES);
  const user = [];
  if (String(instruction || '').trim()) user.push('本次额外要求：' + String(instruction).trim());
  if (String(title || '').trim()) user.push('文章标题：' + String(title).trim());
  user.push('文章正文：\n\n' + String(article || ''));
  return { system: parts.join('\n\n---\n\n'), user: user.join('\n\n') };
}

/* 技能文件按纯文本读取，支持 ~/ 开头；超长内容截断，避免撑爆上下文。 */
async function readSkill(skillPath, home = os.homedir()) {
  const raw = String(skillPath || '').trim();
  if (!raw) return '';
  const target = raw.startsWith('~/') ? path.join(home, raw.slice(2)) : raw;
  const stat = await fs.promises.stat(target);
  if (!stat.isFile()) throw new Error('技能路径不是文件：' + target);
  const text = await fs.promises.readFile(target, 'utf8');
  return text.length > 60000 ? text.slice(0, 60000) : text;
}

/* 按顺序读取多个技能文件；出错时带上具体路径，方便在设置里定位。 */
async function readSkills(skillPaths, home = os.homedir()) {
  const paths = (Array.isArray(skillPaths) ? skillPaths : [skillPaths]).map(item => String(item || '').trim()).filter(Boolean);
  const texts = [];
  for (const target of paths) {
    try { texts.push(await readSkill(target, home)); }
    catch (error) { throw new Error(target + '：' + error.message); }
  }
  return texts;
}

function wordCount(text) {
  return String(text || '').replace(/\s+/g, '').length;
}

function versionFile(dir, articlePath) {
  if (!dir || !articlePath) return '';
  const hash = crypto.createHash('sha1').update(String(articlePath)).digest('hex').slice(0, 16);
  return path.join(dir, hash + '.json');
}

async function loadVersions(file) {
  if (!file) return [];
  try {
    const data = JSON.parse(await fs.promises.readFile(file, 'utf8'));
    return Array.isArray(data.versions) ? data.versions.filter(version => version && typeof version.text === 'string') : [];
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

async function saveVersions(file, versions, articlePath = '') {
  await fs.promises.mkdir(path.dirname(file), { recursive: true });
  await fs.promises.writeFile(file, JSON.stringify({ path: articlePath, updatedAt: Date.now(), versions }, null, 2), 'utf8');
  return versions;
}

/* 新版本置顶，最多保留 60 条。 */
async function addVersion(file, version, articlePath = '') {
  const versions = await loadVersions(file);
  return saveVersions(file, [version, ...versions.filter(item => item.id !== version.id)].slice(0, 60), articlePath);
}

async function removeVersion(file, id, articlePath = '') {
  const versions = (await loadVersions(file)).filter(version => version.id !== id);
  return saveVersions(file, versions, articlePath);
}

module.exports = {
  DEFAULT_ROLES, OUTPUT_RULES, defaultRoles, ensureRoles, roleSkills, roleReady, splitFrontmatter, cleanPolished,
  buildPolishMessages, readSkill, readSkills, wordCount, versionFile, loadVersions, saveVersions, addVersion, removeVersion,
};
