'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { createRelay } = require('../server/publish-relay.cjs');
const { buildArticlePackage } = require('../src/publishing/article-package');
const { formatWechat } = require('../src/wechat/formatter');
const { WECHAT_THEMES } = require('../src/templates/wechat-themes');
const { relayOrigin, createWechatDraft } = require('../browser-companion/worker');
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aXioAAAAASUVORK5CYII=', 'base64');
async function packet() {
  return buildArticlePackage({ title: '跨设备文章', markdown: '正文\n\n![[body.png]]', formatted: formatWechat('正文\n\n![[body.png]]', WECHAT_THEMES[0]), coverRef: 'cover.png', resolveImage: async ref => ({ fileName: ref, data: png }) });
}
async function fixture(t) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'banana-relay-test-'));
  let clock = Date.now(), server, base;
  const admin = 'synthetic-admin-token-for-test-only';
  async function restart() {
    if (server) await new Promise(resolve => server.close(resolve));
    server = await createRelay({ directory, adminToken: admin, now: () => clock, leaseMs: 1000, retentionMs: 20_000 });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    base = 'http://127.0.0.1:' + server.address().port;
  }
  await restart();
  t.after(async () => { await new Promise(resolve => server.close(resolve)); await fs.rm(directory, { recursive: true, force: true }); });
  async function api(route, token, body) {
    const response = await fetch(base + route, { method: body === undefined ? 'GET' : 'POST', headers: { ...(token ? { Authorization: 'Bearer ' + token } : {}), 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
    return { status: response.status, ...(await response.json()) };
  }
  async function pair(role, label = role) {
    const result = await api('/v1/pairing', admin, { role, label }); assert.equal(result.status, 200);
    const paired = await api('/v1/pair', '', { code: result.code }); assert.equal(paired.status, 200);
    return paired;
  }
  const producer = await pair('producer'), browser = await pair('browser');
  const enqueue = async snapshot => api('/v1/jobs', producer.token, { packet: snapshot || await packet(), target: 'wechat', deviceId: browser.device.id });
  return { directory, api, pair, producer, browser, enqueue, admin, restart, base: () => base, advance: ms => { clock += ms; } };
}

test('queued article survives a relay restart and is processed while producer is disconnected', async t => {
  const f = await fixture(t), original = await packet();
  const saved = await f.enqueue(original); assert.equal(saved.status, 200);
  await f.restart();
  const claimed = await f.api('/v1/jobs/claim', f.browser.token, {});
  assert.equal(claimed.job.id, saved.job.id);
  assert.deepEqual(claimed.job.packet, original);
  assert.equal((await f.api('/v1/jobs/' + claimed.job.id + '/start', f.browser.token, { leaseId: claimed.job.leaseId })).job.status, 'processing');
  const finished = await f.api('/v1/jobs/' + claimed.job.id + '/result', f.browser.token, { leaseId: claimed.job.leaseId, status: 'draft_saved', url: 'https://mp.weixin.qq.com/cgi-bin/appmsg?appmsgid=123&token=BROWSER_SECRET' });
  assert.equal(finished.job.status, 'draft_saved');
  assert.ok(!finished.job.url.includes('token'));
  assert.equal((await f.api('/v1/jobs/' + saved.job.id, f.producer.token)).job.status, 'draft_saved');
  const disk = await fs.readFile(path.join(f.directory, 'state.json'), 'utf8');
  assert.ok(!disk.includes(f.producer.token)); assert.ok(!disk.includes(f.browser.token)); assert.ok(!disk.includes('BROWSER_SECRET'));
  assert.equal(JSON.parse(disk).jobs[0].packet, undefined, 'article bytes cleared after result');
  assert.deepEqual(await fs.readdir(path.join(f.directory, 'packets')), [], 'snapshot file removed after a definite result');
});

test('lost upload response can be retried without duplicate tasks and conflicting contents are refused', async t => {
  const f = await fixture(t), input = await packet();
  const first = await f.enqueue(input), second = await f.enqueue(input);
  assert.equal(first.job.id, second.job.id);
  const changed = await packet(); changed.requestId = input.requestId;
  changed.article.title = 'changed';
  // Untrusted producer cannot hide altered content behind the old snapshot checksum.
  const invalid = await f.enqueue(changed); assert.equal(invalid.status, 400);
  const claims = await Promise.all([f.api('/v1/jobs/claim', f.browser.token, {}), f.api('/v1/jobs/claim', f.browser.token, {})]);
  assert.equal(claims.filter(result => result.job).length, 1);
});

test('unused lease can return to queue, but interrupted platform execution is never automatically replayed', async t => {
  const f = await fixture(t), created = await f.enqueue();
  const first = await f.api('/v1/jobs/claim', f.browser.token, {});
  f.advance(1001);
  const second = await f.api('/v1/jobs/claim', f.browser.token, {});
  assert.equal(first.job.id, second.job.id); assert.notEqual(first.job.leaseId, second.job.leaseId);
  assert.equal((await f.api('/v1/jobs/' + created.job.id + '/start', f.browser.token, { leaseId: first.job.leaseId })).status, 409);
  await f.api('/v1/jobs/' + created.job.id + '/start', f.browser.token, { leaseId: second.job.leaseId });
  f.advance(1001);
  assert.equal((await f.api('/v1/jobs/claim', f.browser.token, {})).job, null);
  assert.equal((await f.api('/v1/jobs/' + created.job.id, f.producer.token)).job.status, 'uncertain');
  const late = await f.api('/v1/jobs/' + created.job.id + '/result', f.browser.token, { leaseId: second.job.leaseId, status: 'draft_saved', url: 'https://mp.weixin.qq.com/cgi-bin/appmsg?appmsgid=456' });
  assert.equal(late.job.status, 'draft_saved', 'a late definite result can settle the uncertain task');
});

test('browser and producer permissions, target devices, one-use pairing and revocation are enforced', async t => {
  const f = await fixture(t), other = await f.pair('browser', 'Other Mac');
  assert.equal((await f.api('/v1/jobs/claim', '', {})).status, 401);
  assert.equal((await f.api('/v1/jobs/claim', f.producer.token, {})).status, 403);
  const created = await f.enqueue();
  assert.equal((await f.api('/v1/jobs/claim', other.token, {})).job, null);
  assert.equal((await f.api('/v1/jobs/' + created.job.id, other.token)).status, 404);
  const code = await f.api('/v1/pairing', f.admin, { role: 'producer', label: 'new' });
  assert.equal((await f.api('/v1/pair', '', { code: code.code })).status, 200);
  assert.equal((await f.api('/v1/pair', '', { code: code.code })).status, 403);
  await f.api('/v1/devices/' + f.browser.device.id + '/revoke', f.admin, {});
  assert.equal((await f.api('/v1/jobs/claim', f.browser.token, {})).status, 401);
});

test('expired jobs discard article assets and invalid attachment bytes cannot enter queue', async t => {
  const f = await fixture(t), corrupted = await packet();
  corrupted.assets[0].base64 = Buffer.from('corrupt').toString('base64');
  assert.equal((await f.enqueue(corrupted)).status, 400);
  const created = await f.enqueue(); f.advance(20_001);
  assert.equal((await f.api('/v1/jobs/' + created.job.id, f.producer.token)).job.status, 'expired');
  assert.equal((await f.api('/v1/jobs/claim', f.browser.token, {})).job, null);
  const stored = JSON.parse(await fs.readFile(path.join(f.directory, 'state.json'), 'utf8'));
  assert.equal(stored.jobs[0].packet, undefined);
  assert.deepEqual(await fs.readdir(path.join(f.directory, 'packets')), []);
});

test('plugin pairs without storing the token in settings and recovers a lost enqueue response using the persisted request ID', async t => {
  const f = await fixture(t);
  const vm = require('node:vm'), { createRequire } = require('node:module');
  const filename = path.resolve(__dirname, '../src/main.js'), local = createRequire(filename);
  const mod = { exports: {} }; let dropResponse = true;
  const host = Object.fromEntries(['Plugin', 'ItemView', 'Modal', 'FuzzySuggestModal', 'PluginSettingTab', 'Menu', 'Notice', 'TFile', 'MarkdownView'].map(name => [name, class {}]));
  host.requestUrl = async options => {
    const response = await fetch(options.url, { method: options.method, headers: options.headers, body: options.body });
    const result = { status: response.status, json: await response.json() };
    if (options.url.endsWith('/v1/jobs') && dropResponse) { dropResponse = false; throw new Error('synthetic lost response'); }
    return result;
  };
  vm.runInNewContext((await fs.readFile(filename, 'utf8')) + '\nmodule.exports.View = BDView;', { module: mod, exports: mod.exports, require: id => id === 'obsidian' ? host : /\.(png|svg|webp)$/.test(id) ? 'data:image/png;base64,' : local(id), Buffer, URL, Blob, process, console, setTimeout, clearTimeout, AbortController }, { filename });
  const Plugin = mod.exports, secrets = new Map();
  const plugin = Object.assign(Object.create(Plugin.prototype), { settings: { wechat: { delivery: 'browser', author: '作者' } }, app: { secretStorage: { getSecret: id => secrets.get(id), setSecret: async (id, value) => secrets.set(id, value), deleteSecret: async id => secrets.delete(id) } }, async saveSettings() { this.saved = JSON.stringify(this.settings); }, wechatFormatter: require('../src/wechat/formatter') });
  const pairing = await f.api('/v1/pairing', f.admin, { role: 'producer', label: 'Obsidian integration fixture' });
  await plugin.pairPublishRelay(f.base(), pairing.code);
  assert.equal(secrets.size, 1);
  assert.ok(!plugin.saved.includes([...secrets.values()][0]));
  plugin.settings.publishRelay.deviceId = f.browser.device.id;
  const files = new Map(['body.png', 'cover.png'].map(name => [name, { path: name, name, basename: name.split('.')[0], extension: 'png' }]));
  const view = Object.assign(Object.create(Plugin.View.prototype), { plugin, title: '跨设备文章', wechatCoverPath: 'cover.png', wechatThemeId: WECHAT_THEMES[0].id, app: { vault: { readBinary: async () => png, getAbstractFileByPath: name => files.get(name) }, metadataCache: { getFirstLinkpathDest: name => files.get(name) } }, activeFile: () => ({ path: 'Article.md' }), articleMarkdown: async () => '正文\n\n![[body.png]]', wechatTheme: () => WECHAT_THEMES[0], beginTask: () => ({ controller: new AbortController() }), finishTask() {}, render() {}, renderBody() {}, remember() {} });
  await view.queueWechatForBrowser();
  assert.match(view.wechatError, /lost response/);
  const requestId = plugin.settings.publishRelay.jobs[0].requestId;
  assert.ok(plugin.saved.includes(requestId), 'request identity saved before failed upload acknowledgement');
  await view.queueWechatForBrowser();
  assert.equal(plugin.settings.publishRelay.jobs.length, 1);
  const record = plugin.settings.publishRelay.jobs[0]; assert.equal(record.requestId, requestId); assert.equal(record.status, 'queued');
  const claim = await f.api('/v1/jobs/claim', f.browser.token, {}); assert.equal(claim.job.id, record.id);
  assert.equal((await f.api('/v1/jobs/claim', f.browser.token, {})).job, null);
});

test('an explicit retry can recover a login failure, while uncertain results remain blocked', async t => {
  const f = await fixture(t), input = await packet(), first = await f.enqueue(input);
  const { job } = await f.api('/v1/jobs/claim', f.browser.token, {});
  await f.api('/v1/jobs/' + job.id + '/start', f.browser.token, { leaseId: job.leaseId });
  await f.api('/v1/jobs/' + job.id + '/result', f.browser.token, { leaseId: job.leaseId, status: 'needs_review', error: '请登录' });
  const retried = await f.api('/v1/jobs', f.producer.token, { packet: input, target: 'wechat', deviceId: f.browser.device.id, retry: true });
  assert.equal(retried.job.id, first.job.id); assert.equal(retried.job.status, 'queued');
  const claimed = await f.api('/v1/jobs/claim', f.browser.token, {});
  await f.api('/v1/jobs/' + job.id + '/start', f.browser.token, { leaseId: claimed.job.leaseId });
  await f.api('/v1/jobs/' + job.id + '/result', f.browser.token, { leaseId: claimed.job.leaseId, status: 'uncertain', error: '响应丢失' });
  assert.equal((await f.api('/v1/jobs', f.producer.token, { packet: input, target: 'wechat', deviceId: f.browser.device.id, retry: true })).job.status, 'uncertain');
  assert.equal((await f.api('/v1/jobs/claim', f.browser.token, {})).job, null);
});

test('browser fails before uploading when logged out and only permits TLS for remote relay URLs', async () => {
  assert.throws(() => relayOrigin('http://remote.example.com'), /HTTPS/);
  assert.throws(() => relayOrigin('https://name:password@example.com'), /根地址/);
  assert.equal(relayOrigin('http://127.0.0.1:39281'), 'http://127.0.0.1:39281');
  const prior = global.fetch; let calls = 0;
  global.fetch = async () => { calls++; return { url: 'https://mp.weixin.qq.com/', text: async () => '<html>请登录</html>' }; };
  try { const result = await createWechatDraft(await packet()); assert.equal(result.status, 'needs_review'); assert.equal(calls, 1); }
  finally { global.fetch = prior; }
});

test('native Chrome DOM preserves image placement and cover, strips executable markup and reports an ambiguous draft response', { skip: !process.env.BANANA_CHROME_TEST_BIN }, async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'banana-chrome-dom-'));
  try {
    const input = await packet();
    input.article.html += '<script>window.shouldNotExecute=1</script><a href="javascript:alert(1)" onclick="alert(1)">unsafe</a>';
    const script = `(async () => {
      const packet = ${JSON.stringify(input).replace(/</g, '\\u003c')};
      // Produce a browser-native image so this test exercises real decode rather than a mocked bitmap.
      const canvas=document.createElement('canvas'); canvas.width=2; canvas.height=2;
      canvas.getContext('2d').fillRect(0,0,2,2);
      const nativeBase64=canvas.toDataURL('image/png').split(',')[1];
      const nativeBytes=Uint8Array.from(atob(nativeBase64),c=>c.charCodeAt(0));
      packet.assets[0].base64=nativeBase64; packet.assets[0].bytes=nativeBytes.length;
      packet.assets[0].sha256=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',nativeBytes)),n=>n.toString(16).padStart(2,'0')).join('');
      const location = { origin: 'https://mp.weixin.qq.com' };
      globalThis.wx = {commonData:{t:'123',ticket:'synthetic-ticket',user_name:'synthetic-user'}};
      let loseResponse = false, uploads = 0, creates = 0, content = '', cover = '';
      const fetch = async (input, options) => {
        const url = String(input);
        if (url === '/') return {url:'https://mp.weixin.qq.com/?token=123',text:async()=>''};
        if (url.includes('/cgi-bin/filetransfer')) { uploads++; return {ok:true,json:async()=>({base_resp:{ret:0},cdn_url:'https://mmbiz.qpic.cn/synthetic.png',content:'321'})}; }
        if (url.includes('/cgi-bin/operate_appmsg')) {
          creates++; content=options.body.get('content0'); cover=options.body.get('cdn_url0');
          if (loseResponse) throw new Error('synthetic connection reset');
          return {ok:true,json:async()=>({appMsgId:'456'})};
        }
        throw new Error('Unexpected request: '+url);
      };
      const deliver = ${createWechatDraft.toString()};
      const first = await deliver(packet);
      const safe = first.status==='draft_saved' && !first.url.includes('token') && first.openUrl.includes('token=123') && cover==='https://mmbiz.qpic.cn/synthetic.png' && uploads===1 && creates===1 && content.includes('https://mmbiz.qpic.cn/synthetic.png') && !/banana-asset:|<script|onclick|javascript:/i.test(content) && !window.shouldNotExecute;
      loseResponse=true;
      const second = await deliver(packet);
      document.body.textContent=JSON.stringify({passed:safe&&second.status==='uncertain'&&creates===2,first:first.status,second:second.status,uploads,creates,content});
    })().catch(error=>{document.body.textContent=JSON.stringify({passed:false,error:error.message})});`;
    const filename = path.join(directory, 'test.html');
    await fs.writeFile(filename, '<!doctype html><meta charset="utf-8"><body>pending<script>' + script + '</script>');
    const { execFile } = require('node:child_process');
    const output = await new Promise((resolve, reject) => execFile(process.env.BANANA_CHROME_TEST_BIN, ['--headless', '--disable-gpu', '--disable-background-networking', '--disable-component-update', '--disable-sync', '--no-first-run', '--no-default-browser-check', '--password-store=basic', '--use-mock-keychain', '--user-data-dir=' + path.join(directory, 'profile'), '--virtual-time-budget=5000', '--dump-dom', 'file://' + filename], { timeout: 30_000, maxBuffer: 2 * 1024 * 1024 }, (error, stdout) => error ? reject(error) : resolve(stdout)));
    assert.match(output, /"passed":true/, output);
  } finally { await fs.rm(directory, { recursive: true, force: true }); }
});
