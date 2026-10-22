'use strict';
/* 公众号模块单测：主题数据结构、Markdown→内联 HTML 排版管线、微信客户端（stub 网络）。 */

const test = require('node:test');
const assert = require('node:assert');
const { WECHAT_THEMES, REQUIRED_ELEMENTS } = require('../src/templates/wechat-themes.js');
const { formatWechat, autoDigest, imagePlaceholder } = require('../src/wechat/formatter.js');
const { WechatClient, normalizeArticle } = require('../src/wechat/client.js');
const i18n = require('../src/i18n.js');

i18n.configureLocale(() => 'zh', () => 'zh'); // 断言中文报错文案，固定 zh 环境

/* ================= 主题数据 ================= */

test('公众号主题：结构完整、id 唯一、元素样式齐备', () => {
  assert.ok(WECHAT_THEMES.length >= 4);
  const ids = new Set();
  for (const theme of WECHAT_THEMES) {
    assert.ok(!ids.has(theme.id), '主题 id 重复：' + theme.id);
    ids.add(theme.id);
    assert.ok(theme.name && theme.description && theme.accent);
    for (const key of REQUIRED_ELEMENTS) {
      const style = theme.elements[key];
      assert.ok(style && typeof style === 'object' && Object.keys(style).length > 0, `${theme.id} 缺少元素样式 ${key}`);
    }
  }
});

test('公众号主题：中文名称与描述都有英文词条', () => {
  for (const theme of WECHAT_THEMES) {
    for (const key of ['name', 'description']) {
      if (/[\u4e00-\u9fff]/.test(theme[key])) assert.ok(Object.hasOwn(i18n.EN, theme[key]), theme[key]);
    }
  }
});

/* ================= 排版管线 ================= */

const MINIMAL = WECHAT_THEMES.find(theme => theme.id === 'minimal');

function render(markdown, theme = MINIMAL) { return formatWechat(markdown, theme); }

test('排版：标题与段落带内联样式', () => {
  const { html } = render('## 小节\n\n正文一段。');
  assert.match(html, /<h2 style="[^"]*color:#111111[^"]*">小节<\/h2>/);
  assert.match(html, /<p style="[^"]*line-height:1\.85[^"]*">正文一段。<\/p>/);
});

test('排版：加粗、斜体、链接与删除线套样式', () => {
  const { html } = render('**重** *斜* ~~删~~ [链](https://a.com)');
  assert.match(html, /<strong style="[^"]*color:#111111[^"]*">重<\/strong>/);
  assert.match(html, /<em style="[^"]*">斜<\/em>/);
  assert.match(html, /<a href="https:\/\/a\.com" style="[^"]*color:#576b95[^"]*">链<\/a>/);
  assert.match(html, /<del style="[^"]*">删<\/del>/);
});

test('排版：代码块转义并保留 pre / code 样式', () => {
  const { html } = render('```js\nconst a = "<div>";\n```');
  assert.match(html, /<pre style="[^"]*background:#f7f7f7[^"]*"><code style="[^"]*white-space:pre-wrap[^"]*">/);
  assert.ok(html.includes('&quot;&lt;div&gt;&quot;') || html.includes('&lt;div&gt;'));
});

test('排版：Obsidian 语法不污染行内代码', () => {
  const { html, images } = render('看 `![[x.png]]` 这个');
  assert.deepStrictEqual(images, []);
  assert.ok(html.includes('![[x.png]]'), '行内代码里的嵌入语法应原样保留');
});

test('排版：本地嵌入抽成图片占位符，远程图片保留原链接', () => {
  const { html, images } = render('![[pic.png]]\n\n![外](https://example.com/a.png)');
  assert.deepStrictEqual(images, ['pic.png']);
  assert.ok(html.includes(imagePlaceholder(0)), '应有 %%BDIMG0%%');
  assert.match(html, /<img src="https:\/\/example\.com\/a\.png"/);
});

test('排版：wikilink 转纯文本，高亮转 mark', () => {
  const { html } = render('见 [[目标页|别名]] 与 [[目标页]]，以及 ==重点==。');
  assert.ok(html.includes('别名'), '别名应保留');
  assert.ok(html.includes('目标页'), '目标页应保留');
  assert.ok(!/\[\[/.test(html), '不应残留双链语法');
  assert.match(html, /<mark style="[^"]*background:#fff3b8[^"]*">重点<\/mark>/);
});

test('排版：callout 转引用块并加粗标题', () => {
  const { html } = render('> [!note] 提示标题\n> 内容行');
  assert.match(html, /<blockquote style="[^"]*background:#f7f7f7[^"]*">/);
  assert.match(html, /<strong style="[^"]*color:#111111[^"]*">提示标题<\/strong>/);
  assert.ok(html.includes('内容行'));
});

test('排版：任务列表、有序列表与表格', () => {
  const { html } = render('- [x] 完成\n- [ ] 待办\n\n3. 第三\n4. 第四\n\n| A | B |\n| --- | --- |\n| 1 | 2 |');
  assert.ok(html.includes('☑'), '已完成任务应有 ☑');
  assert.ok(html.includes('☐'), '未完成任务应有 ☐');
  assert.match(html, /<ol style="[^"]*" start="3">/);
  assert.match(html, /<th style="[^"]*background:#f5f5f5[^"]*">A<\/th>/);
  assert.match(html, /<td style="[^"]*">1<\/td>/);
});

test('排版：嵌套列表正常渲染', () => {
  const { html } = render('- 外层\n  - 内层');
  assert.match(html, /<li style="[^"]*">外层<ul style="[^"]*">/);
});

test('排版：主题切换生效（杂志红 h3 用强调色）', () => {
  const magazine = WECHAT_THEMES.find(theme => theme.id === 'magazine');
  const { html } = render('### 三级', magazine);
  assert.match(html, /<h3 style="[^"]*color:#b03a2e[^"]*">三级<\/h3>/);
});

test('autoDigest：取正文首段并截断 120 字', () => {
  const digest = autoDigest('字'.repeat(200));
  assert.equal(digest.length, 120);
  assert.equal(autoDigest('# 标题\n\n首段内容'), '首段内容');
  assert.equal(autoDigest('前导\n\n' + '字'.repeat(200)), '前导');
});

/* ================= 微信客户端（stub 网络） ================= */

function jsonResponse(obj) { return { status: 200, headers: {}, buf: Buffer.from(JSON.stringify(obj)) }; }

function makeClient(handler) {
  const calls = [];
  const request = async (url, options = {}) => { calls.push({ url, options }); return handler(url, options); };
  return { client: new WechatClient('wx1234', 'secret-x', request), calls };
}

test('客户端：access_token 获取并缓存', async () => {
  let n = 0;
  const { client, calls } = makeClient(() => jsonResponse({ access_token: 'T' + (++n), expires_in: 7200 }));
  assert.equal(await client.accessToken(), 'T1');
  assert.equal(await client.accessToken(), 'T1', '缓存期内不重复取');
  assert.equal(calls.length, 1);
});

test('客户端：token 失效自动刷新并重试一次', async () => {
  let n = 0;
  const { client, calls } = makeClient(url => {
    if (url.includes('/cgi-bin/token')) return jsonResponse({ access_token: 'T' + (++n), expires_in: 7200 });
    if (url.includes('uploadimg')) return url.includes('T1')
      ? jsonResponse({ errcode: 42001, errmsg: 'access_token expired' })
      : jsonResponse({ url: 'https://mmbiz.qpic.cn/abc.png' });
    return jsonResponse({});
  });
  const result = await client.uploadContentImage(Buffer.from('png'), 'a.png');
  assert.equal(result.url, 'https://mmbiz.qpic.cn/abc.png');
  assert.equal(calls.length, 4, 'token、失败上传、刷新 token、重试上传');
  const uploads = calls.filter(c => c.url.includes('uploadimg'));
  assert.equal(uploads.length, 2);
  assert.ok(uploads[1].url.includes('T2'), '重试应携带新 token');
});

test('客户端：上传是 multipart，含 media 字段与正确 Content-Type', async () => {
  const { client, calls } = makeClient(url => url.includes('/cgi-bin/token')
    ? jsonResponse({ access_token: 'T1', expires_in: 7200 })
    : jsonResponse({ url: 'https://mmbiz.qpic.cn/x' }));
  await client.uploadContentImage(Buffer.from('hello'), 'a.png');
  const upload = calls.find(c => c.url.includes('uploadimg'));
  assert.ok(upload.options.headers['Content-Type'].startsWith('multipart/form-data; boundary='));
  const body = upload.options.body.toString('latin1');
  assert.ok(body.includes('name="media"'), '应有 media 字段');
  assert.ok(body.includes('filename="image.png"'));
  assert.ok(body.includes('Content-Type: image/png'));
});

test('客户端：封面素材与草稿的请求形态', async () => {
  const { client, calls } = makeClient(url => {
    if (url.includes('/cgi-bin/token')) return jsonResponse({ access_token: 'T1', expires_in: 7200 });
    if (url.includes('add_material')) return jsonResponse({ media_id: 'MEDIA1', url: 'https://mmbiz.qpic.cn/cover' });
    if (url.includes('draft/add')) return jsonResponse({ media_id: 'DRAFT1' });
    return jsonResponse({});
  });
  const cover = await client.uploadCover(Buffer.from('c'), 'cover.png');
  assert.equal(cover.mediaId, 'MEDIA1');
  assert.ok(calls[1].url.includes('add_material') && calls[1].url.includes('type=image'), '封面走永久素材接口');
  const draft = await client.addDraft({ title: '标题', author: '作者', digest: '摘要', content: '<p>正文</p>', thumbMediaId: 'MEDIA1' });
  assert.equal(draft.mediaId, 'DRAFT1');
  const draftCall = calls.at(-1);
  assert.ok(draftCall.url.includes('draft/add'));
  assert.equal(draftCall.options.json.articles.length, 1);
  assert.equal(draftCall.options.json.articles[0].thumb_media_id, 'MEDIA1');
});

test('草稿字段：标题 64、作者 8、摘要 120 截断，缺封面时报错', () => {
  const article = normalizeArticle({ title: '标'.repeat(70), author: '作'.repeat(12), digest: '摘'.repeat(200), content: '<p>x</p>', thumbMediaId: 'M' });
  assert.equal(article.title.length, 64);
  assert.equal(article.author.length, 8);
  assert.equal(article.digest.length, 120);
  assert.throws(() => normalizeArticle({ title: 'x', content: '<p></p>', thumbMediaId: '' }), /封面/);
  assert.throws(() => normalizeArticle({ title: '', content: '<p>x</p>', thumbMediaId: 'M' }), /标题/);
  assert.throws(() => normalizeArticle({ title: 'x', content: '', thumbMediaId: 'M' }), /正文/);
});

test('客户端：40164 报错带 IP 白名单提示', async () => {
  const { client } = makeClient(url => url.includes('/cgi-bin/token')
    ? jsonResponse({ access_token: 'T1', expires_in: 7200 })
    : jsonResponse({ errcode: 40164, errmsg: 'invalid ip 1.2.3.4 ipv6 ::1, not in whitelist' }));
  await assert.rejects(() => client.uploadContentImage(Buffer.from('x'), 'a.png'), e => /白名单/.test(e.message));
});

/* ================= 反代地址与连通检测 ================= */

const { normalizeApiBase } = require('../src/wechat/client.js');

test('normalizeApiBase：留空回官方，去尾斜杠，拒绝远程 HTTP 与带参地址', () => {
  assert.equal(normalizeApiBase(''), 'https://api.weixin.qq.com');
  assert.equal(normalizeApiBase(undefined), 'https://api.weixin.qq.com');
  assert.equal(normalizeApiBase('https://srv.example.com/wx/'), 'https://srv.example.com/wx');
  assert.throws(() => normalizeApiBase('http://srv.example.com/wx'), /HTTPS/);
  assert.throws(() => normalizeApiBase('https://srv.example.com/wx?token=1'), /根地址/);
  assert.equal(normalizeApiBase('http://localhost:8787/wx'), 'http://localhost:8787/wx', '本机调试允许 HTTP');
});

test('客户端：配置反代后所有请求改走反代根地址', async () => {
  const calls = [];
  const request = async (url, options = {}) => {
    calls.push({ url, options });
    return url.includes('/cgi-bin/token') ? jsonResponse({ access_token: 'T1', expires_in: 7200 }) : jsonResponse({ media_id: 'D1' });
  };
  const relay = new WechatClient('wx1234', 'secret-x', request, 'https://srv.example.com/wx/');
  await relay.accessToken();
  await relay.addDraft({ title: 't', content: '<p>x</p>', thumbMediaId: 'M' });
  assert.ok(calls[0].url.startsWith('https://srv.example.com/wx/cgi-bin/token'), 'token 请求应走反代');
  assert.ok(calls[1].url.startsWith('https://srv.example.com/wx/cgi-bin/draft/add'), '草稿请求应走反代');
});

test('probe：成功返回 ok；40164 时错误带 callerIp', async () => {
  const good = makeClient(() => jsonResponse({ access_token: 'T1', expires_in: 7200 }));
  assert.deepEqual(await good.client.probe(), { ok: true });

  const bad = makeClient(() => jsonResponse({ errcode: 40164, errmsg: 'invalid ip 203.0.113.7 ipv6 ::ffff:203.0.113.7, not in whitelist hint: [abcd]' }));
  await assert.rejects(() => bad.client.probe(), e => { assert.equal(e.errcode, 40164); assert.equal(e.callerIp, '203.0.113.7'); return true; });
});
