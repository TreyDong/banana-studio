'use strict';
/* SSH 隧道中转测试：用 ssh2 自带的 Server 做 mock SSH 服务器，把转发通道接到本地 mock 微信 HTTPS 服务，
 * 端到端验证 隧道请求 / TOFU 指纹 / 认证失败 / 禁止转发 的行为；以及 WechatClient 的中转与 40164 重试逻辑。 */

const test = require('node:test');
const assert = require('node:assert');
const net = require('net');
const https = require('https');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const i18n = require('../src/i18n.js');
const relay = require('../src/wechat/ssh-relay.js');
const { WechatClient } = require('../src/wechat/client.js');

i18n.configureLocale(() => 'zh', () => 'zh');

/* 测试专用自签名证书（CN=localhost，SAN localhost/127.0.0.1，有效期 100 年）。 */
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
const TLS = { ca: CERT, servername: 'localhost' };

function startHttps() {
  return new Promise(resolve => {
    const server = https.createServer({ key: KEY, cert: CERT }, (req, res) => {
      let body = ''; req.on('data', c => body += c);
      req.on('end', () => {
        res.setHeader('Content-Type', 'application/json');
        if (req.url.startsWith('/cgi-bin/token')) return res.end(JSON.stringify({ access_token: 'TUNNEL-TOKEN', expires_in: 7200 }));
        res.end(JSON.stringify({ url: req.url, method: req.method, body }));
      });
    });
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

function startSsh(httpsPort, { allowForward = true } = {}) {
  const { Server } = require('ssh2');
  const hostKey = crypto.generateKeyPairSync('rsa', { modulusLength: 2048, privateKeyEncoding: { type: 'pkcs1', format: 'pem' }, publicKeyEncoding: { type: 'pkcs1', format: 'pem' } }).privateKey;
  const server = new Server({ hostKeys: [hostKey] }, client => {
    client.on('authentication', ctx => {
      if (ctx.method === 'password' && ctx.username === 'bd' && ctx.password === 'pw') return ctx.accept();
      ctx.reject(['password']);
    });
    client.on('ready', () => {
      client.on('tcpip', (accept, reject) => {
        if (!allowForward) return reject();
        const channel = accept();
        const upstream = net.connect(httpsPort, '127.0.0.1');
        channel.pipe(upstream).pipe(channel);
        upstream.on('error', () => channel.destroy());
        channel.on('close', () => upstream.destroy());
      });
    });
    client.on('error', () => {});
  });
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve(server)));
}

test('sshConnectConfig：必填校验、端口默认、私钥文本与路径', () => {
  assert.throws(() => relay.sshConnectConfig({ username: 'u', password: 'p' }), /服务器地址/);
  assert.throws(() => relay.sshConnectConfig({ host: 'h', password: 'p' }), /用户名/);
  assert.throws(() => relay.sshConnectConfig({ host: 'h', username: 'u' }), /密码或私钥/);
  assert.throws(() => relay.sshConnectConfig({ host: 'h', username: 'u', password: 'p', port: 70000 }), /端口/);
  const cfg = relay.sshConnectConfig({ host: 'h', username: 'u', password: 'p', port: '' });
  assert.equal(cfg.port, 22); assert.equal(cfg.password, 'p'); assert.equal(cfg.tryKeyboard, true);
  const pem = '-----BEGIN OPENSSH PRIVATE KEY-----\nabc\n-----END OPENSSH PRIVATE KEY-----';
  assert.equal(relay.sshConnectConfig({ host: 'h', username: 'u', privateKey: pem, passphrase: 'pp' }).privateKey, pem);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bd-ssh-'));
  const keyFile = path.join(dir, 'id_test'); fs.writeFileSync(keyFile, pem);
  assert.equal(relay.sshConnectConfig({ host: 'h', username: 'u', privateKey: keyFile }).privateKey, pem, '路径应读成文件内容');
  assert.throws(() => relay.sshConnectConfig({ host: 'h', username: 'u', privateKey: path.join(dir, 'missing') }), /无法读取私钥文件/);
  assert.ok(relay.looksLikeKeyText(pem)); assert.ok(!relay.looksLikeKeyText('~/.ssh/id_ed25519'));
  fs.rmSync(dir, { recursive: true, force: true });
});

test('fingerprintOf：OpenSSH 风格 SHA256 指纹', () => {
  assert.match(relay.fingerprintOf(Buffer.from('host-key')), /^SHA256:[A-Za-z0-9+/]+$/);
  assert.equal(relay.fingerprintOf(Buffer.from('a')), relay.fingerprintOf(Buffer.from('a')));
});

test('隧道端到端：经 mock SSH 转发到 HTTPS，返回响应与指纹，TOFU 校验生效', async t => {
  const httpsServer = await startHttps();
  const sshServer = await startSsh(httpsServer.address().port);
  t.after(() => { sshServer.close(); httpsServer.close(); });
  const raw = { host: '127.0.0.1', port: sshServer.address().port, username: 'bd', password: 'pw' };

  const first = await relay.tunnelRequest(raw, 'https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential', { tls: TLS, timeout: 15000 });
  assert.equal(first.status, 200);
  assert.equal(JSON.parse(first.buf.toString('utf8')).access_token, 'TUNNEL-TOKEN');
  assert.match(first.hostKeyFingerprint, /^SHA256:/);

  const second = await relay.tunnelRequest({ ...raw, hostKeyFingerprint: first.hostKeyFingerprint }, 'https://api.weixin.qq.com/cgi-bin/token', { tls: TLS, timeout: 15000 });
  assert.equal(second.status, 200, '指纹一致应放行');

  await assert.rejects(
    () => relay.tunnelRequest({ ...raw, hostKeyFingerprint: 'SHA256:definitely-wrong' }, 'https://api.weixin.qq.com/cgi-bin/token', { tls: TLS, timeout: 15000 }),
    e => e.code === 'HOST_KEY_MISMATCH' && /指纹变化/.test(e.message));

  const posted = await relay.tunnelRequest(raw, 'https://api.weixin.qq.com/cgi-bin/draft/add?access_token=T', { tls: TLS, json: { articles: [1] }, timeout: 15000 });
  const echo = JSON.parse(posted.buf.toString('utf8'));
  assert.equal(echo.method, 'POST'); assert.equal(echo.url, '/cgi-bin/draft/add?access_token=T'); assert.equal(echo.body, '{"articles":[1]}');

  const probe = await relay.testConnection(raw);
  assert.equal(probe.fingerprint, first.hostKeyFingerprint);
});

test('隧道：密码错误报认证失败；服务器禁止转发报友好错误', async t => {
  const httpsServer = await startHttps();
  const open = await startSsh(httpsServer.address().port);
  const closed = await startSsh(httpsServer.address().port, { allowForward: false });
  t.after(() => { open.close(); closed.close(); httpsServer.close(); });
  await assert.rejects(
    () => relay.tunnelRequest({ host: '127.0.0.1', port: open.address().port, username: 'bd', password: 'nope' }, 'https://api.weixin.qq.com/cgi-bin/token', { tls: TLS, timeout: 15000 }),
    /认证失败/);
  await assert.rejects(
    () => relay.tunnelRequest({ host: '127.0.0.1', port: closed.address().port, username: 'bd', password: 'pw' }, 'https://api.weixin.qq.com/cgi-bin/token', { tls: TLS, timeout: 15000 }),
    /端口转发/);
  await assert.rejects(() => relay.tunnelRequest({ host: '127.0.0.1', port: open.address().port, username: 'bd', password: 'pw' }, 'http://api.weixin.qq.com/x'), /HTTPS/);
});

test('WechatClient：token 走中转，其余直连；直连遇 40164 自动改走中转重试一次', async () => {
  const json = obj => ({ status: 200, headers: {}, buf: Buffer.from(JSON.stringify(obj)) });
  const log = [];
  const tail = url => url.split('?')[0].split('/').pop();
  const direct = async url => { log.push('direct:' + tail(url)); return url.includes('uploadimg') ? json({ errcode: 40164, errmsg: 'invalid ip 1.2.3.4, not in whitelist' }) : json({ media_id: 'D' }); };
  const viaRelay = async url => { log.push('relay:' + tail(url)); return url.includes('/cgi-bin/token') ? json({ access_token: 'T-RELAY', expires_in: 7200 }) : json({ url: 'https://mmbiz.qpic.cn/via-relay' }); };
  const client = new WechatClient('wx', 'secret', direct, undefined, viaRelay);
  assert.equal(await client.accessToken(), 'T-RELAY', 'token 必须走中转');
  const uploaded = await client.uploadContentImage(Buffer.from('x'), 'a.png');
  assert.equal(uploaded.url, 'https://mmbiz.qpic.cn/via-relay');
  assert.deepEqual(log, ['relay:token', 'direct:uploadimg', 'relay:uploadimg']);
  assert.equal(client.forceRelay, false, '重试后应恢复直连');
  const draft = await client.addDraft({ title: 't', content: '<p>x</p>', thumbMediaId: 'M' });
  assert.equal(draft.mediaId, 'D');
  assert.equal(log.at(-1), 'direct:add', '非 40164 的请求保持直连');
});
