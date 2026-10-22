'use strict';
/* X 发布测试：OAuth 1.0a 签名向量（Twitter 官方文档规范值）、推文串切分、XClient 链路（stub 传输）、HTTP CONNECT 代理端到端。 */

const test = require('node:test');
const assert = require('node:assert');
const net = require('net');
const https = require('https');
const i18n = require('../src/i18n.js');
const th = require('../src/x/thread.js');
const { oauth1Header, percentEncode, XClient } = require('../src/x/client.js');
const { normalizeProxyUrl, proxyRequest } = require('../src/net/proxy.js');

i18n.configureLocale(() => 'zh', () => 'zh');

/* ================= OAuth 1.0a 签名 ================= */

const CREDS = {
  consumerKey: 'xvz1evFS4wEEPTGEFPHBog',
  consumerSecret: 'kAcSOqF21Fu85e7zjz7ZN2U4ZRhfV3WpwPAoE3Z7kBw',
  accessToken: '370773112-GmHxMAgYyLbNEtIKZeRNFsMKPR9EyMZeS9weJAEb',
  accessTokenSecret: 'LswwdoUaIvS8ltyTt5jkRh4J50vUPVVHtR2YPi5kE',
};
const PARAMS = { include_entities: 'true', status: 'Hello Ladies + Gentlemen, a signed OAuth request!' };
const STAMP = { timestamp: 1318622958, nonce: 'kYjzVBB8Y0ZFabxSWbWovY3uYSQ2pTgmZeNu2VS4cg' };

test('OAuth1：复现 Twitter 文档的规范签名（2011 /1.0 URL）', async () => {
  const header = await oauth1Header({ method: 'POST', url: 'https://api.twitter.com/1/statuses/update.json', credentials: CREDS, params: PARAMS, ...STAMP });
  assert.ok(header.startsWith('OAuth '));
  assert.ok(header.includes('oauth_signature="tnnArxj06cWHq44gCs1OSKk%2FjLY%3D"'), header);
  assert.ok(header.includes('oauth_consumer_key="xvz1evFS4wEEPTGEFPHBog"'));
  assert.ok(header.includes('oauth_timestamp="1318622958"'));
});

test('OAuth1：/1.1 文档变体签名一致；RFC3986 严格编码', async () => {
  const header = await oauth1Header({ method: 'POST', url: 'https://api.twitter.com/1.1/statuses/update.json', credentials: CREDS, params: PARAMS, ...STAMP });
  assert.ok(header.includes('oauth_signature="hCtSmYh%2BiHYCEqBWrE7C7hYmtUk%3D"'), header);
  assert.equal(percentEncode("Ladies +'()*"), 'Ladies%20%2B%27%28%29%2A');
});

/* ================= 推文串内容层 ================= */

const MINIMAL = { weightedLength: t => th.weightedLength(t) };

test('thread：加权计数（CJK x2，URL 固定 23）', () => {
  assert.equal(th.weightedLength('字'.repeat(140)), 280);
  assert.equal(th.weightedLength('看 https://a.co/abc end'), th.weightedLength('看') + 1 + 23 + 1 + th.weightedLength('end'));
});

test('thread：文章切分全部不超限，编号后缀正确', () => {
  const md = '# 标题\n\n' + '这是第一段很长的内容。'.repeat(20) + '\n\n' + '第二段也不短，讲另一个要点！'.repeat(15);
  const parts = th.threadFromArticle(md, { numbering: 'suffix' });
  assert.ok(parts.length >= 2);
  for (const [index, part] of parts.entries()) {
    assert.ok(th.weightedLength(part) <= 280, '第 ' + index + ' 条超限：' + th.weightedLength(part));
    assert.ok(part.endsWith('(' + (index + 1) + '/' + parts.length + ')'));
  }
});

test('thread：切分不劈开 URL，前缀编号生效', () => {
  const parts = th.splitText('开头 https://example.com/very/long/url/segment/that/must/not/be/cut ' + '测'.repeat(140), 280);
  for (const part of parts) assert.ok(!/https?:\S*$/.test(part.replace(/https?:\/\/\S+/, '')) || part.includes('https://'), part);
  const whole = parts.join('\n');
  assert.ok(whole.includes('https://example.com/very/long/url/segment/that/must/not/be/cut'), 'URL 必须完整保留在某一条里');
  const numbered = th.applyNumbering(['甲', '乙', '丙'], 'prefix');
  assert.deepEqual(numbered, ['1/ 甲', '2/ 乙', '3/ 丙']);
});

test('thread：AI 产物解析（JSON 数组、编号文本、超限兜底切分）', () => {
  assert.deepEqual(th.parseAITweets('```json\n["第一条","第二条"]\n```'), ['第一条', '第二条']);
  assert.deepEqual(th.parseAITweets('1. 甲\n\n2. 乙'), ['甲', '乙']);
  const overLimit = '字'.repeat(200);
  const parts = th.parseAITweets(JSON.stringify([overLimit]));
  assert.ok(parts.length > 1);
  for (const part of parts) assert.ok(th.weightedLength(part) <= 280);
});

/* ================= XClient 链路（stub 传输） ================= */

function json(obj, headers = {}) { return { status: 200, headers, buf: Buffer.from(JSON.stringify(obj)) }; }
const tail = url => url.split('?')[0].replace('https://api.x.com', '');
const seenAuth = (options) => String(options.headers?.Authorization || '').startsWith('OAuth ');

test('客户端：me 解析账号；发帖带 OAuth 头并串回复链、首条挂媒体', async () => {
  const calls = [];
  const transport = async (url, options) => {
    calls.push({ path: tail(url), options, url });
    if (url.includes('/2/users/me')) return json({ data: { id: '42', name: '测试员', username: 'bd_user' } });
    if (url.includes('/2/media/upload')) return json({ data: { id: 'media-' + calls.length } });
    const body = options.json;
    return json({ data: { id: 'post-' + calls.length, text: body.text } });
  };
  const client = new XClient(CREDS, undefined, transport);
  const me = await client.me();
  assert.equal(me.username, 'bd_user');
  assert.ok(seenAuth(calls[0].options), '应有 OAuth 头');
  const media = await client.uploadMedia(Buffer.from('png'), 'image/png');
  const first = await client.createTweet({ text: '第一条', mediaIds: [media] });
  const second = await client.createTweet({ text: '第二条', replyTo: first.id });
  assert.equal(media, 'media-2');
  const firstCall = calls.find(c => c.path === '/2/tweets');
  const secondCall = calls.filter(c => c.path === '/2/tweets')[1];
  assert.deepEqual(secondCall.options.json.reply, { in_reply_to_tweet_id: first.id });
  assert.deepEqual(firstCall.options.json.media, { media_ids: [media] });
  assert.equal(secondCall.options.json.text, '第二条');
  assert.ok(firstCall.options.headers.Authorization.startsWith('OAuth '));
});

test('客户端：错误映射（401 / 403 重复 / 429 带重置时间）', async () => {
  const make = (status, body, headers = {}) => new XClient(CREDS, async () => ({ status, headers, buf: Buffer.from(JSON.stringify(body)) }), null);
  await assert.rejects(() => make(401, { errors: [{ detail: 'Unauthorized' }] }).me(), e => /401/.test(e.message) && /OAuth 1\.0a/.test(e.message));
  await assert.rejects(() => make(403, { errors: [{ detail: 'duplicate content' }] }).createTweet({ text: 'x' }), e => /重复/.test(e.message));
  const reset = Math.floor(Date.now() / 1000) + 900;
  await assert.rejects(() => make(429, { errors: [{ detail: 'Rate limit exceeded' }] }, { 'x-rate-limit-reset': String(reset) }).createTweet({ text: 'x' }), e => /429/.test(e.message) && /分钟/.test(e.message));
});

test('凭证：缺密钥时给出中文指引', () => {
  const { normalizeCredentials } = require('../src/x/client.js');
  assert.throws(() => normalizeCredentials({}), /API Key/);
  assert.throws(() => normalizeCredentials({ consumerKey: 'a', consumerSecret: 'b' }), /Access Token/);
});

/* ================= HTTP CONNECT 代理端到端 ================= */

test('代理：经 CONNECT 隧道访问 HTTPS；normalizeProxyUrl 校验', async t => {
  assert.equal(normalizeProxyUrl('127.0.0.1:7890'), 'http://127.0.0.1:7890');
  assert.throws(() => normalizeProxyUrl('socks5://127.0.0.1:7891'), /http/);
  assert.throws(() => normalizeProxyUrl('not a url'), /代理地址格式无效/);

  const CERT = `-----BEGIN CERTIFICATE-----
MIIDJzCCAg+gAwIBAgIUM3Clj2YhkRIKBwZq7pAJ7foMGGcwDQYJKoZIhvcNAQEL
BQAwFDESMBAGA1UEAwwJbG9jYWxob3N0MCAXDTI2MTAyMDEyNTczMVoYDzIxMjYw
OTI2MTI1NzMxWjAUMRIwEAYDVQQDDAlsb2NhbGhvc3QwggEiMA0GCSqGSIb3DQEB
AQUAA4IBDwAwggEKAoIBAQDawVsh04FfhA6fPm4aFjMVlg5+LgRoc+YrCa9K2Ej6
xZtO9PQMPiFWJPMuCiOMwIkTb76Pwz42oCQD/MGpUPE3oWq/HjE0lSpiTnJUkB+F
u3nx8e6YxuWTU4pLHAWO+/20uoPg7hx29JuhG/qJszlGyhkEhTJuJQwU+IKg0ihy
UFFSg7TH9XLv/y7il3/H5g+2kdDaad0abNPOFj6PN1KJ6AwdqlG50KKQGtgLhwkK
fKd0q7saisuaaBiehZCwjRRvw/vp3YV5ql37hBndDuiQtnWbS4D8o+6M9sC2d4uh
pxHH/niYjznuk67cI6DWWh0XT9f8BJgWHQmfkvR8RrePAgMBAAGjbzBtMB0GA1Ud
DgQWBBQ297TRUmPQHWs6xb4qT5xYDJgfKDAfBgNVHSMEGDAWgBQ297TRUmPQHWs6
xb4qT5xYDJgfKDAPBgNVHRMBAf8EBTADAQH/MBoGA1UdEQQTMBGCCWxvY2FsaG9z
dIcEfwAAATANBgkqhkiG9w0BAQsFAAOCAQEANvjeBBsAXNmaAfoIZsUptYZHjiwa
wZuM//U/y5RL8TyBrpkp3DuWkHrXhza95UmwXvt93OaTgiwfcZ/f4mt2x5i3P0XT
3yoek7Mu7FqmkYcM4VHuOvNBZttIe28B1zRNozzJDW8xJ9WxKmjZigSp2ih36X6h
iF1AFyAtMeuCZ/cUh03ibxQD7rXGpofaSN8FVNGPdlO11FXDlATTUEHUjQa/wzcU
tziEwgxsk95YBrh91/PTuZ8H5oku6BTpqkgm1u5MGrbN4/aJYsAMAJVENGpPF/BZ
vHTFYA5VfmUuxvZZu41bhSqkEONsSpBbPbsfrY/QAZmj665uyNRj7R0pCw==
-----END CERTIFICATE-----`;
  const KEY = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDawVsh04FfhA6f
Pm4aFjMVlg5+LgRoc+YrCa9K2Ej6xZtO9PQMPiFWJPMuCiOMwIkTb76Pwz42oCQD
/MGpUPE3oWq/HjE0lSpiTnJUkB+Fu3nx8e6YxuWTU4pLHAWO+/20uoPg7hx29Juh
G/qJszlGyhkEhTJuJQwU+IKg0ihyUFFSg7TH9XLv/y7il3/H5g+2kdDaad0abNPO
Fj6PN1KJ6AwdqlG50KKQGtgLhwkKfKd0q7saisuaaBiehZCwjRRvw/vp3YV5ql37
hBndDuiQtnWbS4D8o+6M9sC2d4uhpxHH/niYjznuk67cI6DWWh0XT9f8BJgWHQmf
kvR8RrePAgMBAAECggEABZzXaz9DfwFi5KgT6BxwtBmVBpzEpS9wFOObOUbiXHjM
etKjHltLvKuXB7Pf5KEeAz8nOwYN5xXlxqpqB5+ZiM1d8Uhjh89Z9oq/uTa3cFV2
lAQalJXp1wVaM4IlDF2fzU7JynAhj9XH1nLi0zyjeBMAYFLQj+3oaPNVWq35trEX
tY342QQd3oE+/oTU4FgRs9P58xocRyd/8sb9rx2joafGtShATfdkLw307TC4GP1V
RNVBo2ZMIigSlgP1oQnHV/SlyI3KzCNG6EUn5gJPdrjn8S2k6IH1HFTEZuHnRyfR
G9TWxJWUaSoK7mIuBiWzjh2Lhf5RHR0Y8QYAQF3pOQKBgQD20dBixEo31IdewQKg
N3LvtuX17KadeItBOJQG3DvQnxtkBz5trtJu/v1g8Z7pRuSrSTBtHR5fjBiKaOa6
mXAnKIxkIdMhFnWKn4KalXoKna4OU0aXlC3X41kQwgWwUjz5bp8UTqHSU+vdI01F
yNocK78aTeaYpIrUzlIx7GJNRwKBgQDi5FE2nK43lk/syf21vwuD4xkf9b8UgbcU
opxo26imB9Dwt/WtqIloGYFXQnU2HL5jNuVsfcafSxntp1cu2XfCTzYcNDL88pwd
88jWHDxqseRL3UhEWfE8mo/zJfQ66T5cTc9aVBMphvJnnlRtuqT347Wjo/Dqv7d/
eaUMMVLHeQKBgQDloYz75t2aFcwgFvhHcW8ooQRQCe11wknk0yu9OjcYQH8uUCL/
zs+PXwMDp6iOJlvnFD/OtHGmuWO3miNX5htXAz2ih2mzdf7DiuXqxjj2GX9vaoDZ
043XNniNw8WhJtH9yrKMJSAe298sLYTd8SEjZnv0kBeDWkqj9JS6R8+pTwKBgC+m
y/ewSFacVwTgF0zIZt64H1q6/fqMk6rdzAOpvm3ATn1/5TUnpFQcpzFwX7WRq9qi
eOSkNcbWuwdSkdjhC2nfwPmDbQH64hbYUGHHZFj0K4JTYw4X5bZYr8rdOcH1ooc4
QEg0SCH8mYRxmEHDZUo6pLdNgxeKVDuNjMBWy4/hAoGAY6TehHMcOTFmCfcyn2W5
1Ag+SqgnGFYtxsi+lLSmLG8tJybh4vPOw2Ry5Z/13H+D2pCnLD4V/aoaIoV94Dfv
t+d08pVjv5Q1Q0mEtMStoEyHRsbwABNWPOsWjTUMxYNnuzIDJS3UDIZaiODnsd79
MqvZTFKuDF9QHsX57f1i8mM=
-----END PRIVATE KEY-----`;
  const httpsServer = await new Promise(resolve => {
    const server = https.createServer({ key: KEY, cert: CERT }, (req, res) => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ via: 'proxy', path: req.url })); });
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
  const target = httpsServer.address();
  const proxy = net.createServer(client => {
    client.once('data', chunk => {
      const request = chunk.toString('latin1');
      assert.ok(request.startsWith('CONNECT api.x.com:443'), request.split('\r\n')[0]);
      client.write('HTTP/1.1 200 Connection established\r\n\r\n');
      const upstream = net.connect(target.port, '127.0.0.1');
      client.pipe(upstream).pipe(client);
      upstream.on('error', () => client.destroy());
      client.on('close', () => upstream.destroy());
    });
  });
  await new Promise(resolve => proxy.listen(0, '127.0.0.1', resolve));
  t.after(() => { proxy.close(); httpsServer.close(); });

  const response = await proxyRequest('http://127.0.0.1:' + proxy.address().port, 'https://api.x.com/2/users/me', { tls: { ca: CERT, servername: 'localhost' }, timeout: 15000 });
  assert.equal(response.status, 200);
  assert.equal(JSON.parse(response.buf.toString('utf8')).via, 'proxy');

  await assert.rejects(() => proxyRequest('http://127.0.0.1:' + (proxy.address().port + 1), 'https://api.x.com/x', { timeout: 5000 }), /无法连接代理/);
});
