'use strict';
/* 设置页保存流程的 DOM 级测试：用最小假 DOM 真正跑 renderWechatPage，点击「保存私钥 / 保存密码 / 保存密钥」，
 * 验证 SecretStorage 写入与 data.json 落盘；并覆盖 secretStorage 缺失时的报错。 */

const test = require('node:test');
const assert = require('node:assert');
const vm = require('node:vm');
const path = require('node:path');
const fs = require('node:fs');
const Module = require('node:module');

const srcDir = path.join(__dirname, '..', 'src');
const i18n = require('../src/i18n.js');
i18n.configureLocale(() => 'zh', () => 'zh'); // 与真实中文环境一致，按中文标签查找控件

/* ---------- 极简 DOM ---------- */
let NOTICES = [];
class BdNode {
  constructor(tag) { this.tag = tag; this.children = []; this.className = ''; this.attributes = {}; this.value = ''; this.style = {}; this.handlers = {}; this.textContent = ''; }
  get classList() { const self = this; return { add: c => { self.className = (self.className + ' ' + c).trim(); }, remove: c => { self.className = self.className.split(/\s+/).filter(x => x !== c).join(' '); }, contains: c => self.className.split(/\s+/).includes(c) }; }
  createDiv(opts) { return this.createEl('div', typeof opts === 'string' ? { cls: opts } : (opts || {})); }
  createSpan(opts) { return this.createEl('span', typeof opts === 'string' ? { cls: opts } : (opts || {})); }
  createEl(tag, opts = {}) {
    const node = new BdNode(tag);
    if (opts.cls) node.className = opts.cls;
    if (opts.text != null) node.textContent = opts.text;
    for (const [k, v] of Object.entries(opts.attr || {})) { node.attributes[k] = v; if (k === 'aria-label') node.ariaLabel = v; }
    if (tag === 'input' || tag === 'textarea' || tag === 'select') node.value = '';
    this.children.push(node); return node;
  }
  append(child) { this.children.push(child); return child; }
  setAttribute(k, v) { this.attributes[k] = v; if (k === 'aria-label') this.ariaLabel = v; }
  setText(t) { this.textContent = t; return this; }
  addClass(c) { this.classList.add(c); }
  removeClass(c) { this.classList.remove(c); }
  empty() { this.children = []; }
  querySelector(sel) {
    const cls = sel.replace(/^\./, '');
    const walk = node => { for (const child of node.children) { if (child.className.split(/\s+/).includes(cls)) return child; const hit = walk(child); if (hit) return hit; } return null; };
    return walk(this);
  }
  findAll(pred, out = []) { for (const child of this.children) { if (pred(child)) out.push(child); child.findAll(pred, out); } return out; }
}

/* ---------- obsidian 桩 ---------- */
function makeObsidianStub() {
  class Notice { constructor(msg) { NOTICES.push(String(msg)); } }
  class ToggleComponent { constructor(parent) { this.toggleEl = new BdNode('div'); if (parent) parent.append(this.toggleEl); } setTooltip() { return this; } setValue(v) { this.value = v; return this; } onChange(fn) { this.onChangeFn = fn; return this; } }
  class PluginSettingTab { constructor(app, plugin) { this.app = app; this.plugin = plugin; this.containerEl = new BdNode('div'); } }
  class Modal {} class FuzzySuggestModal {} class Menu {} class TFile {} class MarkdownView {} class ItemView {} class Plugin {}
  return { Plugin, ItemView, Notice, PluginSettingTab, Setting: class {}, normalizePath: s => s, FuzzySuggestModal, Modal, Menu, TFile, MarkdownView, MarkdownRenderer: { render: async () => {} }, arrayBufferToBase64: () => '', setIcon() {}, getLanguage: () => 'zh', ToggleComponent, PluginSettingTab };
}

function loadUnderTest() {
  let source = fs.readFileSync(path.join(srcDir, 'main.js'), 'utf8');
  source += '\n;module.exports.__test = { BDSettingTab, WECHAT_SSH_DEFAULTS };';
  const stub = makeObsidianStub();
  const sandboxRequire = request => request === 'obsidian' ? stub : require(request.startsWith('.') ? path.join(srcDir, request) : request);
  const sandbox = { require: sandboxRequire, module: { exports: {} }, exports: {}, console, URL, setTimeout, clearTimeout, crypto: require('crypto') };
  vm.runInNewContext(source, sandbox, { filename: 'main-under-test.js' });
  return { main: sandbox.module.exports, stub };
}

/* ---------- 被测环境 ---------- */
const { main, stub } = loadUnderTest();
const { BDSettingTab } = main.__test;

function makeEnv({ withSecretStorage = true, enabled = true } = {}) {
  NOTICES = [];
  const store = new Map();
  const secretStorage = withSecretStorage ? {
    getSecret: id => (store.has(id) ? store.get(id) : null),
    setSecret: async (id, s) => { store.set(id, String(s)); },
    deleteSecret: async id => { store.delete(id); },
  } : undefined;
  let savedCount = 0;
  const settings = { wechat: { appId: 'wx123', secretId: '', author: '', defaultTheme: 'minimal', ssh: { ...main.__test.WECHAT_SSH_DEFAULTS, enabled, host: 'srv.example.com', username: 'root' } } };
  const plugin = { settings, manifest: { version: '0.11.0' }, sshRelay: require('../src/wechat/ssh-relay.js'), saveSettings: async () => { savedCount++; } };
  // 借用插件类原型上的全部方法（storeWechatSecret / wechatSshRaw / ensureWechatSecretStorage ...），this 指向这个假 plugin
  for (const name of Object.getOwnPropertyNames(main.prototype)) if (name !== 'constructor' && typeof main.prototype[name] === 'function' && !(name in plugin)) plugin[name] = main.prototype[name];
  const app = { secretStorage };
  plugin.app = app;
  const tab = new BDSettingTab(app, plugin);
  tab.settingsPage = 'wechat';
  return { tab, plugin, store, app, savedCount: () => savedCount, root: tab.containerEl };
}

const findBtn = (root, text) => root.findAll(n => n.tag === 'button' && (n.textContent.includes(text) || n.findAll(c => c.textContent.includes(text)).length > 0))[0];
const findField = (root, label) => root.findAll(n => (n.tag === 'input' || n.tag === 'textarea') && n.ariaLabel === label)[0];
const PEM = '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkq\n-----END PRIVATE KEY-----\n';

test('保存私钥：粘贴 PEM 后写入 SecretStorage 并落盘 keySecretId', async () => {
  const env = makeEnv();
  env.tab.display();
  const keyArea = findField(env.root, '私钥');
  assert.ok(keyArea, '私钥输入框应存在');
  keyArea.value = PEM;
  const btn = findBtn(env.root, '保存私钥');
  assert.ok(btn, '保存私钥按钮应存在');
  await btn.onclick();
  assert.equal(NOTICES.filter(n => n.includes('已保存私钥设置')).length, 1);
  assert.ok(env.plugin.settings.wechat.ssh.keySecretId, 'keySecretId 应已写入设置');
  assert.equal(env.store.get(env.plugin.settings.wechat.ssh.keySecretId), PEM.trim(), '密钥串里应保存原文');
  assert.equal(env.savedCount(), 1, '应调用 saveSettings 落盘');
  env.tab.display();
  assert.ok(env.root.findAll(n => n.textContent.includes('已保存粘贴的私钥内容')).length > 0, '重渲染后状态行应显示已保存');
});

test('保存私钥：填写路径时写 keyPath 而非密钥串', async () => {
  const env = makeEnv();
  env.tab.display();
  findField(env.root, '私钥').value = '~/.ssh/id_ed25519';
  await findBtn(env.root, '保存私钥').onclick();
  assert.equal(env.plugin.settings.wechat.ssh.keyPath, '~/.ssh/id_ed25519');
  assert.equal(env.plugin.settings.wechat.ssh.keySecretId, '');
});

test('保存密码：写入 SecretStorage；AppSecret 保存走 saveWechatSecret', async () => {
  const env = makeEnv();
  env.tab.display();
  findField(env.root, '密码').value = 'ssh-pass';
  await env.root.findAll(n => n.tag === 'button' && n.findAll(c => c.textContent === '保存').length > 0)[0].onclick();
  assert.ok(env.plugin.settings.wechat.ssh.passwordSecretId, 'passwordSecretId 应写入');
  assert.equal(env.store.get(env.plugin.settings.wechat.ssh.passwordSecretId), 'ssh-pass');

  const secretInput = findField(env.root, 'AppSecret');
  secretInput.value = 'app-secret-x';
  await findBtn(env.root, '保存密钥').onclick();
  assert.ok(env.plugin.settings.wechat.secretId, 'secretId 应写入');
  assert.equal(env.store.get(env.plugin.settings.wechat.secretId), 'app-secret-x');
});

test('开关关闭时 SSH 字段收起，中转不再生效', async () => {
  const env = makeEnv({ enabled: false });
  env.tab.display();
  assert.equal(findField(env.root, '私钥'), undefined, '关闭时不应渲染私钥输入框');
  assert.equal(env.plugin.wechatRelayConfigured(), false);
});

test('secretStorage 缺失时保存报出可理解的错误而非静默失败', async () => {
  const env = makeEnv({ withSecretStorage: false });
  env.tab.display();
  findField(env.root, '私钥').value = PEM;
  await findBtn(env.root, '保存私钥').onclick();
  assert.ok(NOTICES.some(n => /密钥串/.test(n) && /Obsidian/.test(n)), '应提示升级 Obsidian，实际：' + JSON.stringify(NOTICES));
  assert.equal(env.plugin.settings.wechat.ssh.keySecretId, '', '不应留下悬空的密钥引用');
  assert.equal(env.savedCount(), 0, '失败时不应落盘');
});

test('保存私钥：粘贴公钥时明确报错，不当作路径存下', async () => {
  const env = makeEnv();
  env.tab.display();
  findField(env.root, '私钥').value = 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIExample user@host';
  await findBtn(env.root, '保存私钥').onclick();
  assert.ok(NOTICES.some(n => n.includes('公钥')), '应提示这是公钥：' + JSON.stringify(NOTICES));
  assert.equal(env.plugin.settings.wechat.ssh.keyPath, '');
  assert.equal(env.plugin.settings.wechat.ssh.keySecretId, '');
});

test('密钥引用悬空（密钥串里读不到）时 wechatSshRaw / wechatSecret 给出可操作的报错', () => {
  const env = makeEnv();
  env.plugin.settings.wechat.ssh.keySecretId = 'banana-design-wechat-ssh-key-gone';
  assert.throws(() => env.plugin.wechatSshRaw(), /重新输入并保存/);
  env.plugin.settings.wechat.secretId = 'banana-design-wechat-appsecret-gone';
  assert.rejects(() => env.plugin.wechatSecret(), /重新输入并保存/);
});
