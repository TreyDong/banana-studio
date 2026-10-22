'use strict';
/* OAuth 2.0 测试：PKCE、授权 URL、回调服务（端到端 HTTP）、换码/刷新表单与 Basic 头、客户端自动续期。 */

const test = require('node:test');
const assert = require('node:assert');
const http = require('http');
const crypto = require('crypto');
const i18n = require('../src/i18n.js');
const oauth2 = require('../src/x/oauth2.js');
const { XClient } = require('../src/x/client.js');

i18n.configureLocale(() => 'zh', () => 'zh');

test('PKCE：verifier/base64url/challenge 符合 RFC 7636', () => {
  const { verifier, challenge } = oauth2.pkce();
  assert.ok(verifier.length >= 43 && verifier.length <= 128);
  assert.ok(/^[A-Za-z0-9_-]+$/.test(verifier) && /^[A-Za-z0-9_-]+$/.test(challenge));
  assert.equal(oauth2.base64url(crypto.createHash('sha256').update(verifier).digest()), challenge);
  assert.equal(oauth2.base64url(Buffer.from('<>?~')), 'PD4_fg');
});

test('授权 URL：参数齐全且编码正确', () => {
  const url = oauth2.authUrl({ clientId: 'cid-1', redirectUri: 'http://127.0.0.1:8765/callback', state: 'st=1', challenge: 'ch/ll' });
  assert.ok(url.startsWith('https://x.com/i/oauth2/authorize?'));
  assert.ok(url.includes('response_type=code'));
  assert.ok(url.includes('client_id=cid-1'));
  assert.ok(url.includes('redirect_uri=http%3A%2F%2F127.0.0.1%3A8765%2Fcallback'));
  assert.ok(url.includes('scope=tweet.read%20tweet.write%20users.read%20media.write%20offline.access'));
  assert.ok(url.includes('code_challenge_method=S256'));
  assert.ok(url.includes('state=st%3D1') && url.includes('code_challenge=ch%2Fll'));
  assert.throws(() => oauth2.authUrl({ redirectUri: 'x', state: 's', challenge: 'c' }), /Client ID/);
});

test('回调服务：state 匹配返回 code，拒绝不匹配与 access_denied', async t => {
  const port = 18765 + Math.floor(Math.random() * 2000);
  const pending = oauth2.startCallbackServer({ port, expectedState: 'st-ok' });
  await pending.ready;
  t.after(() => pending.promise.catch(() => {}));
  const get = path => new Promise((resolve, reject) => {
    http.get({ host: '127.0.0.1', port, path, agent: false }, res => { let b = ''; res.on('data', c => b += c); res.on('end', () => resolve({ status: res.statusCode, body: b })); }).on('error', reject);
  });

  const poll = { code: null };
  pending.promise.then(v => { poll.code = v.code; }).catch(() => {});
  await get('/callback?code=abc&state=st-ok');
  await new Promise(r => setTimeout(r, 50));
  assert.equal(poll.code, 'abc');

  const mismatch = oauth2.startCallbackServer({ port, expectedState: 'st-other' });
  const mismatchResult = await Promise.allSettled([mismatch.promise, get('/callback?code=x&state=wrong')]);
  assert.ok(mismatchResult[0].status === 'rejected', 'state 不匹配应拒绝');

  const denied = oauth2.startCallbackServer({ port, expectedState: 'st-ok' });
  const denial = assert.rejects(() => denied.promise, /取消/);
  await get('/callback?error=access_denied&state=st-ok');
  await denial;
});

test('换码与刷新：表单编码、Basic 头、令牌映射、invalid_grant 友好报错', async () => {
  const calls = [];
  const request = async (url, options) => {
    calls.push({ url, options });
    return { status: 200, headers: {}, buf: Buffer.from(JSON.stringify({ access_token: 'at-1', refresh_token: 'rt-1', expires_in: 7200 })) };
  };
  const tokens = await oauth2.exchangeCode({ code: 'c1', verifier: 'v1', clientId: 'id', clientSecret: 'sec', redirectUri: 'http://127.0.0.1:8765/callback', request });
  assert.deepEqual(tokens, { accessToken: 'at-1', refreshToken: 'rt-1', expiresIn: 7200 });
  const exchange = calls[0];
  assert.equal(exchange.options.headers.Authorization, 'Basic ' + Buffer.from('id:sec').toString('base64'));
  const body = exchange.options.body.toString();
  assert.ok(body.includes('grant_type=authorization_code') && body.includes('code=c1') && body.includes('code_verifier=v1'));
  const refresh = await oauth2.refreshTokens({ refreshToken: 'rt-old', clientId: 'id', clientSecret: 'sec', request });
  assert.equal(refresh.accessToken, 'at-1');
  assert.ok(calls[1].options.body.includes('grant_type=refresh_token') && calls[1].options.body.includes('refresh_token=rt-old'));
  const failing = async () => ({ status: 400, headers: {}, buf: Buffer.from(JSON.stringify({ error: 'invalid_grant' })) });
  await assert.rejects(() => oauth2.refreshTokens({ refreshToken: 'bad', clientId: 'i', clientSecret: 's', request: failing }), e => /重新连接/.test(e.message) && e.code === 'OAUTH2_REFRESH');
});

test('XClient（OAuth 2.0）：Bearer 头、过期自动刷新并持久化新令牌', async () => {
  const calls = [];
  let expiresAt = Date.now() - 1000; // 已过期
  const onTokens = [];
  const transport = async (url, options) => {
    calls.push({ url: url.split('?')[0], auth: options.headers?.Authorization });
    if (url.includes('/2/oauth2/token')) {
      return { status: 200, headers: {}, buf: Buffer.from(JSON.stringify({ access_token: 'at-new', refresh_token: 'rt-new', expires_in: 7200 })) };
    }
    return { status: 200, headers: {}, buf: Buffer.from(JSON.stringify({ data: { id: 'p1', text: 'ok' } })) };
  };
  const credentials = { auth: 'oauth2', clientId: 'id', clientSecret: 'sec', accessToken: 'at-old', refreshToken: 'rt-old', expiresAt, onTokens: t => onTokens.push(t) };
  const client = new XClient(credentials, undefined, transport);
  await client.createTweet({ text: 'hello' });
  const tweetAuth = calls.find(c => c.url.endsWith('/2/tweets')).auth;
  assert.equal(tweetAuth, 'Bearer at-new');
  assert.deepEqual(onTokens, [{ accessToken: 'at-new', refreshToken: 'rt-new', expiresIn: 7200 }]);
  assert.equal(client.credentials.refreshToken, 'rt-new', '轮换后的 refresh token 必须更新到客户端凭据');
  const before = calls.length;
  await client.createTweet({ text: 'again' });
  assert.equal(calls.length, before + 1, '未过期时不应再次刷新');
});
