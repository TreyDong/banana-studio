'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const M = require('../src/publishing/publication-model');
require('../src/i18n').configureLocale(() => 'zh', () => 'zh');
function setup() {
  const settings = {}; M.migrateChannels(settings);
  for (const item of M.PLATFORMS) settings.channels.enabled[item.id] = true;
  const a = M.addAccount(settings.channels, 'wechat', '主号'), b = M.addAccount(settings.channels, 'wechat', '副号');
  return { settings, channels: settings.channels, a, b, data: { version: 1, variants: [], records: [] } };
}
test('new users choose platforms; migration is repeatable and preserves isolated credential references', () => {
  const blank = {}; assert.equal(M.migrateChannels(blank), true);
  assert.deepEqual(Object.values(blank.channels.enabled), [false, false, false]);
  const settings = { wechat: { appId: 'id', secretId: 'secret-reference', ssh: { host: 'relay' } }, x: { user: 'writer', accessTokenId: 'token-reference' } };
  M.migrateChannels(settings); assert.equal(settings.channels.accounts.length, 2);
  const before = JSON.stringify(settings.channels); assert.equal(M.migrateChannels(settings), false); assert.equal(JSON.stringify(settings.channels), before);
  settings.channels.accounts[0].config.ssh.host = 'another'; assert.equal(settings.wechat.ssh.host, 'relay');
  const second = M.addAccount(settings.channels, 'wechat', '第二个账号'); assert.equal(second.config.secretId, undefined);
  assert.throws(() => M.addAccount(settings.channels, 'wechat', '第二个账号'), /同名/);
});
test('one original produces separate platform/account history, with exact month filters and no duplicate remote successes', () => {
  const { channels, a, b, data } = setup();
  const x = M.addAccount(channels, 'x', 'X 主号');
  const add = (account, date, extra = {}) => M.upsertRecord(data, channels, { platform: account.platform, accountId: account.id, sourcePath: '原稿.md', title: '同一篇文章', publishedAt: date, ...extra }, Date.parse('2026-11-30'));
  add(a, '2026-11-01T12:00:00+08:00'); add(b, '2026-11-02T13:00:00+08:00');
  const posted = add(x, '2026-11-03T14:00:00+08:00', { remoteId: '123', url: 'https://x.com/i/status/123' });
  assert.equal(add(x, '2026-11-03T14:00:00+08:00', { remoteId: '123' }).id, posted.id);
  add(a, '2026-10-30T12:00:00+08:00');
  assert.equal(M.filterRecords(data, { month: '2026-11' }).length, 3);
  assert.equal(M.filterRecords(data, { month: '2026-11', platform: 'wechat' }).length, 2);
  assert.equal(M.filterRecords(data, { month: '2026-11', accountId: b.id }).length, 1);
});
test('publication history rejects future dates and unsafe links; archival and renames preserve historical identity', () => {
  const { channels, a, data } = setup(), now = Date.parse('2026-11-03');
  const input = { platform: 'wechat', accountId: a.id, title: '已发布', publishedAt: '2026-11-01', sourcePath: '旧名.md' };
  assert.throws(() => M.upsertRecord(data, channels, { ...input, publishedAt: '2027-01-01' }, now), /实际发布时间/);
  assert.throws(() => M.upsertRecord(data, channels, { ...input, url: 'javascript:alert(1)' }, now), /HTTPS/);
  const record = M.upsertRecord(data, channels, input, now);
  a.name = '新的账号名'; a.archived = true; channels.enabled.wechat = false;
  assert.equal(M.filterRecords(data, {}).length, 1); assert.equal(record.accountName, '主号');
  M.upsertRecord(data, channels, { ...record, title: '修正标题' }, now);
  assert.throws(() => M.upsertRecord(data, channels, input, now), /有效的发布账号/);
  data.variants.push({ sourcePath: '旧名.md', path: '平台版本.md' }); M.renameSource(data, '旧名.md', '新名.md');
  assert.equal(data.records[0].sourcePath, '新名.md'); assert.equal(data.variants[0].sourcePath, '新名.md');
});
function pluginFixture() {
  const root = path.join(__dirname, '..', 'src');
  class Empty {}
  const obsidian = { Plugin: Empty, ItemView: Empty, Modal: Empty, FuzzySuggestModal: Empty, PluginSettingTab: Empty, Notice: Empty, normalizePath: value => value };
  const context = { require: name => name === 'obsidian' ? obsidian : require(name.startsWith('.') ? path.join(root, name) : name), module: { exports: {} }, console, URL, setTimeout, clearTimeout };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'main.js'), 'utf8') + '\nmodule.exports.View = BDView;', context);
  const Plugin = context.module.exports, plugin = new Plugin(), fixture = setup();
  plugin.settings = { ...fixture.settings, sessions: {}, outputFolder: 'Banana Studio' }; plugin.publication = fixture.data; plugin.publicationPath = '.obsidian/plugins/banana-studio/publication.json';
  const disk = new Map(), files = new Map(), secrets = new Map();
  plugin.app = { secretStorage: { getSecret: id => secrets.get(id), setSecret: (id, value) => secrets.set(id, value), deleteSecret: id => { secrets.delete(id); return true; } }, vault: {
    adapter: { exists: async key => disk.has(key), mkdir: async key => { disk.set(key, ''); files.set(key, { path: key, children: [] }); }, write: async (key, value) => disk.set(key, value) },
    getAbstractFileByPath: key => files.get(key),
    getMarkdownFiles: () => [...files.values()].filter(file => file.extension === 'md'),
    create: async (key, value) => { const file = { path: key, extension: 'md' }; files.set(key, file); disk.set(key, value); return file; },
    modify: async (file, value) => disk.set(file.path, value), read: async file => disk.get(file.path),
  } };
  plugin.saveData = async data => disk.set('settings', JSON.stringify(data));
  return { ...fixture, plugin, disk, files, secrets, View: Plugin.View };
}
function automaticPropertiesFixture() {
  const fixture = pluginFixture(), { plugin } = fixture;
  fixture.writes = [];
  plugin.app.metadataCache = { getFileCache: file => ({ frontmatter: file.frontmatter }) };
  plugin.app.fileManager = { processFrontMatter: async (file, change) => {
    const latest = M.clone(file.frontmatter || {});
    fixture.beforeAtomic?.(latest); change(latest); file.frontmatter = latest; fixture.writes.push(file.path);
    fixture.afterAtomic?.(file);
  } };
  return fixture;
}
test('platform versions write real Markdown independently per account, survive reload, and leave original untouched', async () => {
  const { plugin, disk, files, a, b } = pluginFixture();
  files.set('原稿.md', { path: '原稿.md', extension: 'md' }); disk.set('原稿.md', '原稿原文');
  const save = (account, markdown) => plugin.savePlatformVariant({ platform: 'wechat', accountId: account.id, sourcePath: '原稿.md', sourceHash: 'source', title: account.name, markdown, images: [] });
  const [one, two] = await Promise.all([save(a, '主号正文'), save(b, '副号正文')]);
  assert.notEqual(one.path, two.path); assert.equal(disk.get(one.path), '主号正文'); assert.equal(disk.get(two.path), '副号正文'); assert.equal(disk.get('原稿.md'), '原稿原文');
  plugin.publication = JSON.parse(disk.get(plugin.publicationPath));
  await plugin.updateChannels(next => { next.selected.wechat = a.id; });
  assert.equal(await plugin.platformMarkdown(files.get('原稿.md'), 'wechat', 'fallback'), '主号正文');
  await plugin.savePlatformVariant({ ...one, title: '修改标题', markdown: '修改后的正文', images: [] });
  assert.equal(disk.get(one.path), '修改后的正文'); assert.equal(plugin.publication.variants.length, 2);
});
test('X refresh callbacks keep the initiating account and calendar writes serialize without losing records', async () => {
  const { plugin, channels, secrets } = pluginFixture();
  const a = M.addAccount(channels, 'x', '账号 A', { auth: 'oauth2' }), b = M.addAccount(channels, 'x', '账号 B', { auth: 'oauth2' });
  channels.selected.x = a.id;
  const credentials = await plugin.xCredentials(plugin.platformConfig('x'));
  await plugin.updateChannels(next => { next.selected.x = b.id; });
  await credentials.onTokens({ accessToken: 'fixture-access', refreshToken: 'fixture-refresh', expiresIn: 3600 });
  assert.equal(secrets.get(plugin.platformConfig('x', a.id).oauth2AccessId), 'fixture-access');
  assert.equal(plugin.platformConfig('x', b.id).oauth2AccessId, undefined);
  await Promise.all([a, b].map(account => plugin.recordPublication({ platform: 'x', accountId: account.id, title: account.name, publishedAt: '2026-01-01' })));
  assert.equal(plugin.publication.records.length, 2);
});
test('switching accounts restores separate X drafts and posted IDs instead of reusing another account thread', () => {
  const { plugin, channels, View } = pluginFixture();
  plugin.wechatThemes = require('../src/templates/wechat-themes');
  const a = M.addAccount(channels, 'x', 'A'), b = M.addAccount(channels, 'x', 'B');
  plugin.settings.sessions['原稿.md'] = { accountSessions: { [a.id]: { xTweets: [{ text: 'A 的正文', images: [], postedId: 'remote-a' }] }, [b.id]: { xTweets: [{ text: 'B 的正文', images: [], postedId: '' }] } } };
  const view = Object.assign(Object.create(View.prototype), { plugin, articlePath: '原稿.md', title: '原稿' });
  channels.selected.x = a.id; view.restorePlatformState(); assert.equal(view.xTweets[0].postedId, 'remote-a');
  channels.selected.x = b.id; view.restorePlatformState(); assert.equal(view.xTweets[0].text, 'B 的正文'); assert.equal(view.xTweets[0].postedId, '');
});
test('an external Markdown edit is preserved instead of silently overwritten by a stale platform editor', async () => {
  const { plugin, disk, a } = pluginFixture();
  const input = { platform: 'wechat', accountId: a.id, sourcePath: '原稿.md', title: '标题', markdown: '原版本', images: [] };
  const record = await plugin.savePlatformVariant(input);
  disk.set(record.path, '其他窗口刚刚修改');
  const expectedHash = require('node:crypto').createHash('sha256').update('原版本').digest('hex');
  await assert.rejects(plugin.savePlatformVariant({ ...input, id: record.id, expectedHash, markdown: '过期编辑' }), /其他窗口/);
  assert.equal(disk.get(record.path), '其他窗口刚刚修改');
});
test('a failed calendar write keeps the last committed records and can be retried', async () => {
  const { plugin, a } = pluginFixture(), write = plugin.app.vault.adapter.write;
  const input = { platform: 'wechat', accountId: a.id, title: '记录', publishedAt: '2026-01-01' };
  plugin.app.vault.adapter.write = async () => { throw new Error('disk unavailable'); };
  await assert.rejects(plugin.recordPublication(input), /disk unavailable/); assert.equal(plugin.publication.records.length, 0);
  plugin.app.vault.adapter.write = write; await plugin.recordPublication(input); assert.equal(plugin.publication.records.length, 1);
});
test('X records confirmed publication only after the full thread succeeds, retaining partial post IDs on failure', async () => {
  const { plugin, channels, View } = pluginFixture(), account = M.addAccount(channels, 'x', '发布账号');
  const controller = new AbortController();
  const view = Object.assign(Object.create(View.prototype), { plugin, app: plugin.app, title: '测试文章', xCoverSource: 'none', xTweets: [{ text: '测试', images: [], postedId: '' }], activeFile: () => ({ path: '原稿.md', basename: '原稿' }), beginTask: () => ({ controller }), finishTask() {}, render() {}, renderBody() {}, remember() {} });
  plugin.view = view;
  plugin.xClientMod = { MAX_MEDIA_PER_TWEET: 4 };
  plugin.xClient = async id => { assert.equal(id, account.id); return { createTweet: async () => ({ id: 'remote-confirmed' }) }; };
  await view.publishX(); assert.equal(plugin.publication.records.length, 1); assert.equal(plugin.publication.records[0].accountId, account.id);
  view.xTweets = [{ text: '第一条', images: [], postedId: 'partial-id' }, { text: '第二条', images: [], postedId: '' }];
  plugin.xClient = async () => ({ createTweet: async () => { throw new Error('network interruption'); } });
  await view.publishX(); assert.equal(plugin.publication.records.length, 1); assert.equal(view.xTweets[0].postedId, 'partial-id'); assert.equal(view.xTweets[1].postedId, '');
});
test('calendar reads only matching folder Markdown, with configurable fields, past dates and optional published status', () => {
  const { channels, a } = setup();
  const source = M.normalizeCalendarSource({ platform: 'wechat', accountId: a.id, folder: '发布/公众号', fields: { date: '发布时间', title: '标题', status: '状态' } });
  const file = (path, fm) => ({ path, basename: '文件标题', frontmatter: fm });
  const fm = { 发布时间: '2026-11-01', 标题: '文档属性标题', 状态: '已发布' };
  const index = M.calendarFromMarkdown([
    file('发布/公众号/文章.md', fm), file('发布/公众号/子目录/文章.md', fm),
    file('发布/公众号备份/不读取.md', fm), file('其他/不读取.md', fm),
    file('发布/公众号/草稿.md', { ...fm, 状态: '草稿' }), file('发布/公众号/未来.md', { ...fm, 发布时间: '2027-01-01' }),
    file('发布/公众号/无日期.md', { 状态: '已发布' }), file('发布/公众号/错误日期.md', { ...fm, 发布时间: '2026-02-30' }),
  ], [source], channels, Date.parse('2026-11-02T12:00:00+08:00'));
  assert.equal(index.records.length, 2); assert.ok(index.records.every(record => record.title === '文档属性标题' && record.accountId === a.id && record.origin === 'markdown'));
  assert.equal(M.calendarFromMarkdown([], [], channels).records.length, 0);
  assert.equal(M.publicationDate(1e30), null);
  assert.equal(M.dayKey(M.publicationDate('2026-11-01')), '2026-11-01');
  assert.throws(() => M.normalizeCalendarSource({ platform: 'wechat', folder: '../私人目录' }), /发布文件夹/);
});
test('shared folders resolve multiple accounts from properties, preserve archived history, and prevent ambiguous duplication', () => {
  const { channels, a, b } = setup();
  const source = M.normalizeCalendarSource({ platform: 'wechat', folder: '发布' });
  const file = { path: '发布/文章.md', basename: '文章', frontmatter: { published: '2026-01-01', account: ['主号', '副号'] } };
  let index = M.calendarFromMarkdown([file], [source], channels);
  assert.deepEqual(index.records.map(record => record.accountId), [a.id, b.id]);
  a.archived = true; channels.enabled.wechat = false;
  const fixed = M.normalizeCalendarSource({ platform: 'wechat', accountId: a.id, folder: '发布' });
  index = M.calendarFromMarkdown([file], [fixed], channels); assert.equal(index.records.length, 1); assert.equal(index.records[0].accountId, a.id);
  const fixedB = M.normalizeCalendarSource({ platform: 'wechat', accountId: b.id, folder: '发布' });
  index = M.calendarFromMarkdown([file], [fixed, fixedB], channels);
  assert.equal(index.records.length, 2);
  index = M.calendarFromMarkdown([{ ...file, frontmatter: { published: '2026-01-01' } }], [fixed, fixedB], channels);
  assert.equal(index.records.length, 0); assert.equal(index.issues.length, 1);
  index = M.calendarFromMarkdown([{ ...file, frontmatter: { published: '2026-01-01', account: '副号' } }], [fixed, fixedB], channels);
  assert.equal(index.records.length, 1); assert.equal(index.records[0].accountId, b.id);
  a.name = '重命名后的账号';
  index = M.calendarFromMarkdown([file], [fixed], channels);
  assert.equal(index.records.length, 1); assert.equal(index.records[0].accountId, a.id);
});
test('folder index is read-only, reacts to metadata edits and removals, and never inspects unrelated note metadata', async () => {
  const { plugin, channels, files, a } = pluginFixture(), metadataEvents = new Map(), vaultEvents = new Map(), inspected = [];
  const note = { path: '发布/文章.md', basename: '文章', extension: 'md', frontmatter: { published: '2026-01-01', title: '原标题' } };
  files.set(note.path, note); files.set('私人/不读取.md', { path: '私人/不读取.md', extension: 'md' });
  plugin.app.vault.getMarkdownFiles = () => [...files.values()].filter(file => file.extension === 'md');
  plugin.app.vault.on = (name, callback) => { vaultEvents.set(name, callback); return {}; };
  plugin.app.metadataCache = { getFileCache: file => { inspected.push(file.path); return { frontmatter: file.frontmatter }; }, on: (name, callback) => { metadataEvents.set(name, callback); return {}; } };
  plugin.registerEvent = () => {};
  plugin.app.vault.adapter.write = async () => { throw new Error('Index must not write files'); };
  channels.calendarSources = [M.normalizeCalendarSource({ platform: 'wechat', accountId: a.id, folder: '发布' })];
  plugin.refreshCalendarIndex(); plugin.watchPublicationFolders();
  assert.equal(plugin.calendarIndex.records[0].title, '原标题'); assert.deepEqual(inspected, ['发布/文章.md']);
  inspected.length = 0; metadataEvents.get('changed')({ path: '私人/不读取.md' }); assert.equal(plugin.calendarRefreshTimer, undefined);
  note.frontmatter.title = '属性更新'; metadataEvents.get('changed')(note); await new Promise(resolve => setTimeout(resolve, 150));
  assert.equal(plugin.calendarIndex.records[0].title, '属性更新');
  files.delete(note.path); vaultEvents.get('delete')(note); await new Promise(resolve => setTimeout(resolve, 150));
  assert.equal(plugin.calendarIndex.records.length, 0); assert.ok(inspected.every(path => path.startsWith('发布/')));
});
test('calendar UI contains only compact controls and a month grid; clicking an item opens the monitored Markdown', async () => {
  const createUI = require('../src/publishing/publication-ui');
  class Node {
    constructor(tag, opts = {}) { this.tag = tag; this.textContent = opts.text || ''; this.children = []; this.attributes = opts.attr || {}; this.className = opts.cls || ''; this.style = { setProperty() {} }; }
    createEl(tag, opts) { const node = new Node(tag, opts); this.children.push(node); return node; }
    createDiv(opts) { return this.createEl('div', typeof opts === 'string' ? { cls: opts } : opts); }
    createSpan(opts) { return this.createEl('span', typeof opts === 'string' ? { cls: opts } : opts); }
    setAttribute(key, value) { this.attributes[key] = value; }
    addClass(value) { this.className += ' ' + value; }
    all() { return [this, ...this.children.flatMap(node => node.all())]; }
  }
  class Empty {}
  const UI = createUI({ Modal: Empty, Notice: Empty, FuzzySuggestModal: Empty }), root = new Node('main'), { channels, a } = setup();
  const note = { path: '发布/文章.md', extension: 'md' }; let opened;
  const view = {
    calendarMonth: '2026-11',
    plugin: { settings: { channels }, calendarIndex: { records: [{ title: '来自 Markdown', publishedAt: '2026-11-01', platform: 'wechat', accountId: a.id, accountName: a.name, sourcePath: note.path }] } },
    app: { vault: { getAbstractFileByPath: path => path === note.path ? note : null }, workspace: { getLeaf: () => ({ openFile: async file => { opened = file; } }) } },
    button(parent, text, action, cls, icon) { const button = parent.createEl('button', { cls }); button.createSpan({ text }); if (icon) button.createSpan({ cls: 'icon' }); button.onclick = action; return button; },
  };
  UI.renderCalendar(view, root);
  const nodes = root.all();
  assert.ok(!nodes.some(node => node.tag === 'h2' || (node.tag === 'input' && node.attributes.type === 'month')));
  for (const label of ['发布日历', '登记已发布', '列表', '月历', '月份', '筛选平台', '筛选账号']) assert.ok(!nodes.some(node => node.textContent === label), label + ' should not occupy calendar space');
  assert.ok(nodes.some(node => node.attributes['aria-label'] === '上个月'));
  assert.ok(nodes.some(node => node.attributes['aria-label'] === '筛选账号'));
  const record = nodes.find(node => node.tag === 'button' && node.children.some(child => child.textContent === '来自 Markdown'));
  await record.onclick(); assert.equal(opened, note);
});
test('adding an account with a publication folder creates its folder and fills standard properties on plain Markdown', async () => {
  const f = automaticPropertiesFixture(), { plugin, files, disk } = f;
  const account = await plugin.savePublicationAccount({ platform: 'xiaohongshu', name: '创作账号', folder: '发布/小红书' });
  assert.ok(Array.isArray(files.get('发布/小红书').children));
  assert.equal(plugin.accountPublicationSource(account.id).folder, '发布/小红书');
  const file = { path: '发布/小红书/我的文章.md', basename: '我的文章', extension: 'md' };
  files.set(file.path, file); disk.set(file.path, '# 我的文章\n\n原文正文，保留双链 [[参考]]。');
  await plugin.queuePublicationProperties(file);
  assert.deepEqual(file.frontmatter, { title: '我的文章', published: M.dayKey(new Date()), platform: 'xiaohongshu', account: '创作账号', account_id: account.id, url: '' });
  assert.equal(disk.get(file.path), '# 我的文章\n\n原文正文，保留双链 [[参考]]。');
  plugin.refreshCalendarIndex(); assert.equal(plugin.calendarIndex.records[0].accountId, account.id);
});
test('automatic properties preserve manual values and recheck concurrent edits inside the atomic callback', async () => {
  const f = automaticPropertiesFixture(), { plugin, files, a, channels } = f;
  channels.calendarSources = [M.normalizeCalendarSource({ platform: 'wechat', accountId: a.id, folder: '发布' })];
  const file = { path: '发布/标题.md', basename: '文件名', extension: 'md', frontmatter: { published: '2020-01-01', url: 'https://example.com/original', custom: ['保留'] } };
  files.set(file.path, file);
  f.beforeAtomic = current => { current.title = '另一个窗口刚编辑的标题'; };
  await plugin.queuePublicationProperties(file);
  assert.equal(file.frontmatter.title, '另一个窗口刚编辑的标题'); assert.equal(file.frontmatter.published, '2020-01-01'); assert.equal(file.frontmatter.url, 'https://example.com/original'); assert.deepEqual(file.frontmatter.custom, ['保留']);
  const writes = f.writes.length;
  await plugin.queuePublicationProperties(file); assert.equal(f.writes.length, writes, 'fully populated notes must not be rewritten');
  a.name = '账号新名称';
  await plugin.queuePublicationProperties(file); assert.equal(file.frontmatter.account, '主号');
  assert.equal(M.calendarFromMarkdown([file], channels.calendarSources, channels).records[0].accountId, a.id);
});
test('automatic filling refuses a conflicting existing account and does not guess ownership of a shared folder', async () => {
  const f = automaticPropertiesFixture(), { plugin, channels, files, a, b } = f;
  const source = M.normalizeCalendarSource({ platform: 'wechat', accountId: b.id, folder: '发布' }); channels.calendarSources = [source];
  const file = { path: '发布/已有账号.md', basename: '已有账号', extension: 'md', frontmatter: { account_id: a.id, account: a.name, platform: 'wechat' } }; files.set(file.path, file);
  await plugin.queuePublicationProperties(file); assert.equal(f.writes.length, 0); assert.equal(file.frontmatter.published, undefined); assert.equal(plugin.publicationPropertyIssues.size, 1);
  channels.calendarSources.push({ ...source, id: 'second', accountId: a.id });
  file.frontmatter = {};
  await plugin.queuePublicationProperties(file); assert.equal(f.writes.length, 0); assert.equal(file.frontmatter.account_id, undefined);
});
test('repeated metadata events coalesce, and only active account folders can change properties', async () => {
  const f = automaticPropertiesFixture(), { plugin, channels, files, a } = f;
  channels.calendarSources = [M.normalizeCalendarSource({ platform: 'wechat', accountId: a.id, folder: '发布' })];
  const file = { path: '发布/新增.md', basename: '新增', extension: 'md' }; files.set(file.path, file);
  f.afterAtomic = written => { plugin.queuePublicationProperties(written); };
  await Promise.all([plugin.queuePublicationProperties(file), plugin.queuePublicationProperties(file), plugin.queuePublicationProperties(file)]);
  assert.equal(f.writes.length, 1);
  plugin.app.metadataCache.getFileCache = note => ({ frontmatter: note.frontmatter ? { ...note.frontmatter, url: null } : undefined });
  await plugin.queuePublicationProperties(file); assert.equal(f.writes.length, 1, 'an empty optional link must not create a metadata write loop');
  const outside = { path: '其他/不修改.md', basename: '不修改', extension: 'md' }; files.set(outside.path, outside);
  await plugin.queuePublicationProperties(outside); assert.equal(outside.frontmatter, undefined);
  channels.enabled.wechat = false;
  const paused = { path: '发布/停用后.md', basename: '停用后', extension: 'md' }; files.set(paused.path, paused);
  await plugin.queuePublicationProperties(paused); assert.equal(paused.frontmatter, undefined); assert.equal(f.writes.length, 1);
  clearTimeout(plugin.calendarRefreshTimer);
});
test('existing and offline-added folder notes are filled on rescan; malformed properties leave the note untouched', async () => {
  const f = automaticPropertiesFixture(), { plugin, channels, files, a } = f;
  channels.calendarSources = [M.normalizeCalendarSource({ platform: 'wechat', accountId: a.id, folder: '发布' })];
  const file = { path: '发布/离线新增.md', basename: '离线新增', extension: 'md' }; files.set(file.path, file);
  await plugin.fillPublicationFolders(); assert.equal(file.frontmatter.account_id, a.id);
  const invalid = { path: '发布/格式错误.md', basename: '格式错误', extension: 'md' }; files.set(invalid.path, invalid);
  plugin.app.fileManager.processFrontMatter = async () => { throw new Error('YAML parse error'); };
  await plugin.queuePublicationProperties(invalid); assert.equal(invalid.frontmatter, undefined); assert.ok(plugin.publicationPropertyIssues.has(invalid.path));
  clearTimeout(plugin.calendarRefreshTimer);
});
test('account folder binding remains optional and rejects folder collisions without adding a partial account', async () => {
  const { plugin } = automaticPropertiesFixture();
  const optional = await plugin.savePublicationAccount({ platform: 'x', name: '无文件夹账号' });
  assert.equal(plugin.accountPublicationSource(optional.id), null);
  const withFolder = await plugin.savePublicationAccount({ platform: 'x', name: '带文件夹账号', folder: '发布/X' });
  const count = plugin.settings.channels.accounts.length;
  await assert.rejects(plugin.savePublicationAccount({ platform: 'x', name: '不应创建的账号', folder: '发布/X' }), /绑定其他账号/);
  assert.equal(plugin.settings.channels.accounts.length, count);
  await plugin.savePublicationAccount({ id: withFolder.id, platform: 'x', name: '带文件夹账号', folder: '' });
  assert.equal(plugin.accountPublicationSource(withFolder.id), null);
});
test('legacy single-account folders gain an explicit stable binding; shared folders and explicit opt-outs are preserved', () => {
  const { channels, a } = setup();
  const x = M.addAccount(channels, 'x', 'X 账号');
  channels.calendarSources = [{ id: 'shared', platform: 'wechat', accountId: '', folder: '共享' }, { id: 'single', platform: 'x', accountId: '', folder: '发布/X' }, { id: 'manual', platform: 'wechat', accountId: a.id, folder: '手动', autoProperties: false }];
  assert.equal(M.migrateAccountPublicationFolders(channels), true);
  assert.equal(channels.calendarSources[0].autoProperties, false); assert.equal(channels.calendarSources[0].accountId, '');
  assert.equal(channels.calendarSources[1].accountId, x.id); assert.equal(x.publicationFolder, '发布/X');
  assert.equal(channels.calendarSources[2].autoProperties, false);
  const snapshot = JSON.stringify(channels); assert.equal(M.migrateAccountPublicationFolders(channels), false); assert.equal(JSON.stringify(channels), snapshot);
});
