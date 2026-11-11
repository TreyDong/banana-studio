'use strict';

const { randomUUID } = require('node:crypto');
const PLATFORMS = Object.freeze([
  { id: 'wechat', name: '公众号', icon: 'message-circle', short: '公' },
  { id: 'xiaohongshu', name: '小红书', icon: 'book-heart', short: '红' },
  { id: 'x', name: 'X', icon: 'at-sign', short: 'X' },
]);
const platform = id => PLATFORMS.find(item => item.id === id);
const clone = value => JSON.parse(JSON.stringify(value));
function migrateChannels(settings) {
  if (settings.channels?.version === 1) return false;
  const channels = { version: 1, enabled: {}, selected: {}, accounts: [] };
  for (const item of PLATFORMS) {
    const cfg = settings[item.id] || {};
    const configured = item.id === 'wechat' ? !!(cfg.appId || cfg.secretId) : item.id === 'x' && !!(cfg.user || cfg.consumerKey || cfg.clientId || cfg.accessTokenId || cfg.oauth2AccessId);
    channels.enabled[item.id] = configured;
    if (configured) {
      const account = { id: randomUUID(), platform: item.id, name: cfg.user ? '@' + cfg.user : item.name + '账号', config: clone(cfg), archived: false, legacy: true };
      channels.accounts.push(account); channels.selected[item.id] = account.id;
    }
  }
  settings.channels = channels;
  return true;
}
function activeAccount(channels, id, accountId = channels?.selected?.[id]) {
  return channels?.accounts?.find(account => account.id === accountId && account.platform === id && !account.archived) || null;
}
function addAccount(channels, id, name, config = {}) {
  if (!platform(id)) throw new Error('平台不存在');
  name = String(name || '').trim();
  if (!name) throw new Error('请填写账号名称');
  if (channels.accounts.some(account => account.platform === id && !account.archived && account.name === name)) throw new Error('这个平台已有同名账号');
  const account = { id: randomUUID(), platform: id, name, config: clone(config), archived: false };
  channels.accounts.push(account); channels.selected[id] = account.id;
  return account;
}
function dayKey(value) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '';
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
}
function localDateTime(value = new Date()) {
  const date = new Date(value);
  return dayKey(date) + 'T' + String(date.getHours()).padStart(2, '0') + ':' + String(date.getMinutes()).padStart(2, '0');
}
function safeUrl(value) {
  if (!String(value || '').trim()) return '';
  let url;
  try { url = new URL(String(value).trim()); } catch (_) { throw new Error('请填写完整的 HTTPS 发布链接'); }
  if (url.protocol !== 'https:' || url.username || url.password) throw new Error('发布链接需使用 HTTPS，且不能包含账号密码');
  return url.href;
}
function upsertRecord(data, channels, input, now = Date.now()) {
  const existing = input.id ? data.records.find(item => item.id === input.id) : null;
  if (input.id && !existing) throw new Error('发布记录已不存在，请重新打开');
  const account = channels.accounts.find(item => item.id === input.accountId && item.platform === input.platform);
  if (!account || (account.archived && (!existing || existing.accountId !== account.id))) throw new Error('请选择有效的发布账号');
  const title = String(input.title || '').trim();
  if (!title) throw new Error('请填写内容标题');
  const publishedAt = new Date(input.publishedAt);
  if (!Number.isFinite(publishedAt.getTime()) || publishedAt.getTime() > now) throw new Error('请选择已经发生的实际发布时间');
  const url = safeUrl(input.url);
  // The same confirmed remote result must not create a second calendar item on retry.
  const duplicate = !existing && data.records.find(item => item.platform === input.platform && item.accountId === account.id && ((input.remoteId && item.remoteId === input.remoteId) || (url && item.url === url)));
  if (duplicate) return duplicate;
  const record = {
    id: existing?.id || randomUUID(), platform: input.platform, accountId: account.id,
    accountName: existing?.accountId === account.id ? existing.accountName : account.name,
    title, sourcePath: String(input.sourcePath || ''), variantId: String(input.variantId || ''),
    coverPath: String(input.coverPath || ''), publishedAt: publishedAt.toISOString(),
    timezone: existing?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    url, remoteId: String(input.remoteId || existing?.remoteId || ''),
    origin: existing?.origin || input.origin || 'manual', createdAt: existing?.createdAt || new Date(now).toISOString(),
  };
  if (existing) data.records[data.records.indexOf(existing)] = record; else data.records.push(record);
  return record;
}
function filterRecords(data, { month, platform: id = '', accountId = '' } = {}) {
  return data.records.filter(record => (!month || dayKey(record.publishedAt).startsWith(month)) && (!id || record.platform === id) && (!accountId || record.accountId === accountId)).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}
function renameSource(data, oldPath, newPath) {
  let changed = false;
  for (const item of [...data.records, ...data.variants]) {
    if (item.sourcePath === oldPath) { item.sourcePath = newPath; changed = true; }
    if (item.path === oldPath) { item.path = newPath; changed = true; }
  }
  return changed;
}
const CALENDAR_FIELDS = Object.freeze({ date: 'published', title: 'title', account: 'account', url: 'url', cover: 'cover', status: '' });
function migrateAccountPublicationFolders(channels) {
  let changed = false;
  for (const source of channels.calendarSources || []) {
    if (source.autoProperties == null) {
      const accounts = channels.accounts.filter(account => account.platform === source.platform && !account.archived);
      if (!source.accountId && accounts.length === 1) source.accountId = accounts[0].id;
      source.autoProperties = !!source.accountId; changed = true;
    }
    const account = channels.accounts.find(item => item.id === source.accountId);
    if (account && account.publicationFolder == null && !account.publicationSourceId) {
      account.publicationFolder = source.folder; account.publicationSourceId = source.id; changed = true;
    }
  }
  return changed;
}
function normalizeCalendarSource(input) {
  if (!platform(input.platform)) throw new Error('请选择平台');
  const folder = String(input.folder || '').trim().replace(/\\/g, '/').replace(/\/+$/, '');
  if (!folder || folder.startsWith('/') || folder.split('/').some(part => !part || part.startsWith('.'))) throw new Error('请选择笔记库内的发布文件夹');
  const fields = { ...CALENDAR_FIELDS, ...input.fields };
  for (const key of Object.keys(CALENDAR_FIELDS)) fields[key] = String(fields[key] || '').trim();
  if (!fields.date) throw new Error('请设置发布日期属性');
  for (const field of Object.values(fields)) if (field.split('.').some(part => ['__proto__', 'prototype', 'constructor'].includes(part))) throw new Error('属性名称无效');
  const writable = [fields.date, fields.title || 'title', fields.account || 'account', fields.url || 'url', 'platform', 'account_id', fields.status].filter(Boolean);
  if (input.autoProperties !== false && new Set(writable).size !== writable.length) throw new Error('自动补齐的属性名称不能重复');
  return { id: input.id || randomUUID(), platform: input.platform, accountId: String(input.accountId || ''), folder, fields, publishedValues: String(input.publishedValues || '已发布,published').trim(), autoProperties: input.autoProperties !== false };
}
function inCalendarFolder(path, source) { return !!source.folder && path.startsWith(source.folder + '/'); }
function frontmatterField(frontmatter, key) {
  if (!key) return undefined;
  if (Object.prototype.hasOwnProperty.call(frontmatter, key)) return frontmatter[key];
  return key.split('.').reduce((value, part) => value && typeof value === 'object' ? value[part] : undefined, frontmatter);
}
function publicationDate(value) {
  if (value instanceof Date) return Number.isFinite(value.getTime()) ? value : null;
  if (typeof value === 'number') { const date = new Date(value); return value > 100000000000 && Number.isFinite(date.getTime()) ? date : null; }
  if (typeof value !== 'string') return null;
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/);
  if (!match) return null;
  const [year, month, day] = match.slice(1, 4).map(Number), check = new Date(year, month - 1, day);
  if (check.getFullYear() !== year || check.getMonth() !== month - 1 || check.getDate() !== day) return null;
  const date = value.trim().length === 10 ? check : new Date(value.trim().replace(' ', 'T'));
  return Number.isFinite(date.getTime()) ? date : null;
}
function canonicalPlatform(value) {
  const raw = String(value || '').trim().toLowerCase();
  const aliases = { wechat: 'wechat', '公众号': 'wechat', xiaohongshu: 'xiaohongshu', '小红书': 'xiaohongshu', rednote: 'xiaohongshu', x: 'x', twitter: 'x' };
  return aliases[raw] || raw;
}
function publicationPropertyOwner(file, frontmatter, sources, channels) {
  const candidates = sources.filter(source => source.autoProperties !== false && channels.enabled?.[source.platform] && inCalendarFolder(file.path, source) && channels.accounts.some(account => !account.archived && account.platform === source.platform && (!source.accountId || account.id === source.accountId))).sort((a, b) => b.folder.length - a.folder.length || Number(!!b.accountId) - Number(!!a.accountId));
  if (!candidates.length) return {};
  const specific = candidates.filter(source => source.folder.length === candidates[0].folder.length), owners = [];
  const stableId = String(frontmatter.account_id || '').trim(), declaredPlatform = canonicalPlatform(frontmatter.platform);
  for (const source of specific) {
    if (declaredPlatform && declaredPlatform !== source.platform) continue;
    const accounts = channels.accounts.filter(account => account.platform === source.platform && !account.archived);
    const fields = { ...CALENDAR_FIELDS, ...source.fields }, raw = frontmatterField(frontmatter, fields.account), names = (Array.isArray(raw) ? raw : [raw]).filter(value => value != null && String(value).trim()).map(value => String(value).trim());
    let account = source.accountId ? accounts.find(item => item.id === source.accountId) : stableId ? accounts.find(item => item.id === stableId) : names.length === 1 ? accounts.find(item => item.id === names[0] || item.name === names[0]) : !names.length && accounts.length === 1 ? accounts[0] : null;
    if (!account || (stableId && stableId !== account.id)) continue;
    if (!stableId && names.length && (names.length !== 1 || !names.some(name => name === account.id || name === account.name))) continue;
    owners.push({ source, account });
  }
  const unique = new Set(owners.map(owner => owner.account.id));
  if (unique.size !== 1) return { issue: unique.size > 1 ? '文件夹关联多个账号，无法自动确定归属' : '文件已有其他平台或账号属性，或无法确定归属，未自动覆盖' };
  return owners[0];
}
function publicationPropertyPatch(frontmatter, file, source, account, now = new Date()) {
  const fields = { ...CALENDAR_FIELDS, ...source.fields };
  const defaults = { [fields.title || 'title']: file.basename || file.path.replace(/.*\//, '').replace(/\.md$/, ''), [fields.date]: dayKey(now), platform: account.platform, [fields.account || 'account']: account.name, account_id: account.id, [fields.url || 'url']: '' };
  if (fields.status) defaults[fields.status] = String(source.publishedValues || '已发布,published').split(/[,，]/)[0].trim();
  return Object.fromEntries(Object.entries(defaults).filter(([key, value]) => {
    const current = frontmatterField(frontmatter, key), missing = current == null || (typeof current === 'string' && !current.trim());
    if (key === (fields.url || 'url') && current !== undefined) return false;
    return missing && current !== value;
  }));
}
function applyPropertyPatch(frontmatter, patch) {
  for (const [key, value] of Object.entries(patch)) {
    const parts = Object.prototype.hasOwnProperty.call(frontmatter, key) ? [key] : key.split('.');
    if (parts.some(part => ['__proto__', 'prototype', 'constructor'].includes(part))) throw new Error('属性名称无效');
    let target = frontmatter;
    for (const part of parts.slice(0, -1)) {
      if (target[part] != null && (typeof target[part] !== 'object' || Array.isArray(target[part]))) throw new Error('已有属性与嵌套字段冲突，未自动覆盖');
      target[part] ||= {}; target = target[part];
    }
    target[parts.at(-1)] = value;
  }
}
function calendarFromMarkdown(files, sources, channels, now = Date.now()) {
  const records = [], issues = [], seen = new Set();
  for (const file of files) {
    if (!file.frontmatter) continue;
    for (const item of PLATFORMS) {
      const candidates = sources.filter(source => source.platform === item.id && inCalendarFolder(file.path, source)).sort((a, b) => b.folder.length - a.folder.length || Number(!!b.accountId) - Number(!!a.accountId));
      for (const source of candidates) {
        const fields = { ...CALENDAR_FIELDS, ...source.fields }, fm = file.frontmatter;
        if (fm.platform && canonicalPlatform(fm.platform) !== item.id) continue;
        if (fields.status) {
          const status = String(frontmatterField(fm, fields.status) ?? '').toLowerCase().trim();
          const accepted = String(source.publishedValues || '已发布,published').split(/[,，]/).map(value => value.trim().toLowerCase());
          if (!accepted.includes(status)) continue;
        }
        const date = publicationDate(frontmatterField(fm, fields.date));
        if (!date || date.getTime() > now) continue;
        const accounts = (channels.accounts || []).filter(account => account.platform === item.id);
        const rawAccount = fm.account_id || frontmatterField(fm, fields.account), values = (Array.isArray(rawAccount) ? rawAccount : [rawAccount]).filter(value => value != null && String(value).trim()).map(value => String(value).trim());
        let targets, expandFixed = false;
        if (source.accountId) {
          const fixed = accounts.find(account => account.id === source.accountId);
          if (!fixed) { issues.push(file.path + '：监控账号已不存在'); continue; }
          if (fm.account_id && !values.includes(fixed.id)) { issues.push(file.path + '：文件账号属性与发布文件夹不一致'); continue; }
          const conflicting = candidates.filter(candidate => candidate.folder === source.folder && candidate.accountId && candidate.accountId !== fixed.id);
          if (conflicting.length && values.length && !values.some(value => value === fixed.id || value === fixed.name)) continue;
          if (!values.length && conflicting.length) { issues.push(file.path + '：同一文件夹关联多个账号，请填写账号属性'); continue; }
          expandFixed = conflicting.length > 0;
          targets = [fixed];
        } else if (values.length) {
          targets = values.map(value => accounts.find(account => account.id === value || account.name === value) || { id: 'property:' + item.id + ':' + value, name: value });
        } else {
          const available = accounts.filter(account => !account.archived);
          targets = available.length === 1 ? available : [{ id: '', name: '未指定账号' }];
        }
        for (const account of targets) {
          const key = [file.path, item.id, account.id].join('\u0000'); if (seen.has(key)) continue;
          seen.add(key);
          const rawUrl = frontmatterField(fm, fields.url); let url = '';
          try { url = safeUrl(rawUrl); } catch (_) { /* An invalid optional URL must not hide an otherwise valid note. */ }
          const cover = frontmatterField(fm, fields.cover);
          records.push({ id: 'md:' + key, platform: item.id, accountId: account.id, accountName: account.name, title: String(frontmatterField(fm, fields.title) || file.basename || file.path.replace(/.*\//, '').replace(/\.md$/, '')), sourcePath: file.path, publishedAt: date.toISOString(), coverPath: String(Array.isArray(cover) ? cover[0] || '' : cover || ''), url, origin: 'markdown', sourceId: source.id });
        }
        if (!expandFixed) break;
      }
    }
  }
  return { records, issues: [...new Set(issues)] };
}
module.exports = { PLATFORMS, platform, clone, migrateChannels, activeAccount, addAccount, dayKey, localDateTime, safeUrl, upsertRecord, filterRecords, renameSource, CALENDAR_FIELDS, normalizeCalendarSource, inCalendarFolder, frontmatterField, publicationDate, calendarFromMarkdown, publicationPropertyOwner, publicationPropertyPatch, applyPropertyPatch, migrateAccountPublicationFolders };
