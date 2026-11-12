'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const M = require('../src/publishing/publication-model');
require('../src/i18n').configureLocale(() => 'zh', () => 'zh');
// 账号管理已从插件移除；测试需要账号时在这里直接构造。
function addAccount(channels, platform, name, config = {}) {
  const account = { id: 'account-' + platform + '-' + name, platform, name, config: M.clone(config), archived: false };
  channels.accounts.push(account); channels.selected[platform] = account.id;
  return account;
}
function setup() {
  const settings = {}; M.migrateChannels(settings);
  for (const item of M.PLATFORMS) settings.channels.enabled[item.id] = true;
  const a = addAccount(settings.channels, 'wechat', '主号'), b = addAccount(settings.channels, 'wechat', '副号');
  return { settings, channels: settings.channels, a, b, data: { version: 1, variants: [] } };
}
test('new users choose platforms; migration is repeatable and preserves isolated credential references', () => {
  const blank = {}; assert.equal(M.migrateChannels(blank), true);
  assert.deepEqual(Object.values(blank.channels.enabled), [false, false, false]);
  const settings = { wechat: { appId: 'id', secretId: 'secret-reference', ssh: { host: 'relay' } }, x: { user: 'writer', accessTokenId: 'token-reference' } };
  M.migrateChannels(settings); assert.equal(settings.channels.accounts.length, 2);
  const before = JSON.stringify(settings.channels); assert.equal(M.migrateChannels(settings), false); assert.equal(JSON.stringify(settings.channels), before);
  settings.channels.accounts[0].config.ssh.host = 'another'; assert.equal(settings.wechat.ssh.host, 'relay');
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
test('X refresh callbacks keep the initiating account and never write to the other account', async () => {
  const { plugin, channels, secrets } = pluginFixture();
  const a = addAccount(channels, 'x', '账号 A', { auth: 'oauth2' }), b = addAccount(channels, 'x', '账号 B', { auth: 'oauth2' });
  channels.selected.x = a.id;
  const credentials = await plugin.xCredentials(plugin.platformConfig('x'));
  await plugin.updateChannels(next => { next.selected.x = b.id; });
  await credentials.onTokens({ accessToken: 'fixture-access', refreshToken: 'fixture-refresh', expiresIn: 3600 });
  assert.equal(secrets.get(plugin.platformConfig('x', a.id).oauth2AccessId), 'fixture-access');
  assert.equal(plugin.platformConfig('x', b.id).oauth2AccessId, undefined);
});
test('switching accounts restores separate X drafts and posted IDs instead of reusing another account thread', () => {
  const { plugin, channels, View } = pluginFixture();
  plugin.wechatThemes = require('../src/templates/wechat-themes');
  const a = addAccount(channels, 'x', 'A'), b = addAccount(channels, 'x', 'B');
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
test('X keeps posted IDs only for the tweets that were published', async () => {
  const { plugin, channels, View } = pluginFixture(), account = addAccount(channels, 'x', '发布账号');
  const controller = new AbortController();
  const view = Object.assign(Object.create(View.prototype), { plugin, app: plugin.app, title: '测试文章', xCoverSource: 'none', xTweets: [{ text: '测试', images: [], postedId: '' }], activeFile: () => ({ path: '原稿.md', basename: '原稿' }), beginTask: () => ({ controller }), finishTask() {}, render() {}, renderBody() {}, remember() {} });
  plugin.view = view;
  plugin.xClientMod = { MAX_MEDIA_PER_TWEET: 4 };
  plugin.xClient = async id => { assert.equal(id, account.id); return { createTweet: async () => ({ id: 'remote-confirmed' }) }; };
  await view.publishX(); assert.equal(view.xTweets[0].postedId, 'remote-confirmed');
  view.xTweets = [{ text: '第一条', images: [], postedId: 'partial-id' }, { text: '第二条', images: [], postedId: '' }];
  plugin.xClient = async () => ({ createTweet: async () => { throw new Error('network interruption'); } });
  await view.publishX(); assert.equal(view.xTweets[0].postedId, 'partial-id'); assert.equal(view.xTweets[1].postedId, '');
});
test('renaming a note keeps the platform version linked to its source', () => {
  const { data } = setup();
  data.variants.push({ sourcePath: '旧名.md', path: '平台版本.md' });
  assert.equal(M.renameSource(data, '旧名.md', '新名.md'), true);
  assert.equal(data.variants[0].sourcePath, '新名.md');
  assert.equal(M.renameSource(data, '旧名.md', '新名.md'), false);
});
