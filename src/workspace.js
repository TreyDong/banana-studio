'use strict';
const DEFAULTS = Object.freeze({ notesDir: '笔记', diaryDir: '笔记/日记', materialsDir: '资料', attachmentsDir: '附件' });
const inside = (file, dir) => !!dir && (file === dir || file.startsWith(dir + '/'));
function relative(value, fallback) {
  if (typeof value !== 'string') return fallback;
  const result = value.trim().replace(/\\/g, '/').replace(/\/+$/, '');
  return !result || result.startsWith('/') || result.includes(':') || result.split('/').some(p => !p || p.startsWith('.')) ? fallback : result;
}
function workspacePaths(raw = {}) {
  const notesDir = relative(raw.notesDir, DEFAULTS.notesDir);
  return { notesDir, diaryDir: relative(raw.diaryDir, notesDir + '/日记'), materialsDir: relative(raw.materialsDir, DEFAULTS.materialsDir), attachmentsDir: relative(raw.attachmentsDir, DEFAULTS.attachmentsDir) };
}
function loadWorkspace(vaultRoot) {
  try {
    const fs = require('fs'), path = require('path'), os = require('os');
    const raw = JSON.parse(fs.readFileSync(path.join(os.homedir(), '.config/banana/workspace.json'), 'utf8'));
    if (raw.version === 1 && (!vaultRoot || !raw.vaultRoot || path.resolve(raw.vaultRoot) === path.resolve(vaultRoot))) return workspacePaths(raw);
  } catch (_) { /* Missing config uses the current portable defaults. */ }
  return workspacePaths();
}
function privatePath(value, paths = DEFAULTS) {
  const file = String(value || '').replace(/\\/g, '/');
  return inside(file, paths.diaryDir) || file.split('/').some(p => ['..', '日记', '03_日记', '公司', '工作', '投资', '60_工作库', '20_投资库', 'A1_交易数据'].includes(p));
}
/** Materials require an explicit selection in the current view; saved sessions are never consent. */
function articleAllowed(file, frontmatter = {}, paths = DEFAULTS, explicit = false) {
  if (!file || file.extension !== 'md' || privatePath(file.path, paths)) return false;
  if (inside(file.path, paths.materialsDir) || inside(file.path, '04_剪藏')) return explicit;
  if (!inside(file.path, paths.notesDir)) return false;
  if (frontmatter.generated === true || frontmatter['自动生成'] === true || frontmatter.generated_by || frontmatter.generator || ['素材', '材料', '候选'].includes(frontmatter.media_kind)) return false;
  if (frontmatter.private||frontmatter.confidential||frontmatter.类型==='日记'||frontmatter.type==='tmmap')return false;
  return true;
}
function outputFolder(saved, paths = DEFAULTS) {
  return !saved || ['Banana Studio', '05_附件/Banana Studio', '02_自媒体/05_附件/Banana Studio'].includes(saved) ? paths.attachmentsDir + '/Banana Studio' : saved;
}
module.exports = { DEFAULTS, workspacePaths, loadWorkspace, privatePath, articleAllowed, outputFolder };
