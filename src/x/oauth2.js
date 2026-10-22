'use strict';
/* X OAuth 2.0（Authorization Code + PKCE，用户上下文）。
 * 流程：插件在 127.0.0.1 起一个一次性回调服务 → 打开浏览器授权页 → 回调带回授权码（30 秒内必须交换）
 * → 用 code + verifier 换 access/refresh token → 之后由 client 在过期前用 refresh token 自动续期。
 * 文档：authorize = https://x.com/i/oauth2/authorize；token = https://api.x.com/2/oauth2/token；
 * scope：tweet.read tweet.write users.read media.write offline.access。 */

const http = require('http');
const crypto = require('crypto');
const { t } = require('../i18n');

const AUTHORIZE_URL = 'https://x.com/i/oauth2/authorize';
const TOKEN_URL = 'https://api.x.com/2/oauth2/token';
const SCOPES = 'tweet.read tweet.write users.read media.write offline.access';
const CALLBACK_HOST = '127.0.0.1';

function base64url(buffer) { return Buffer.from(buffer).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }

/* PKCE：verifier 为 43-128 位 base64url 随机串，challenge = base64url(sha256(verifier))。 */
function pkce() {
  const verifier = base64url(crypto.randomBytes(48));
  return { verifier, challenge: base64url(crypto.createHash('sha256').update(verifier).digest()) };
}

function authUrl({ clientId, redirectUri, state, challenge }) {
  if (!clientId) throw new Error(t('请先填写 Client ID'));
  const params = [
    ['response_type', 'code'],
    ['client_id', clientId],
    ['redirect_uri', redirectUri],
    ['scope', SCOPES],
    ['state', state],
    ['code_challenge', challenge],
    ['code_challenge_method', 'S256'],
  ];
  return AUTHORIZE_URL + '?' + params.map(([k, v]) => encodeURIComponent(k) + '=' + encodeURIComponent(v)).join('&');
}

/* 一次性本地回调服务：只接受 /callback?code=..&state=..（或 error=..）。 */
function startCallbackServer({ port, expectedState, signal, timeout = 300000 }) {
  let resolveReady, rejectReady;
  const ready = new Promise((res, rej) => { resolveReady = res; rejectReady = rej; });
  const promise = new Promise((resolve, reject) => {
    if (signal?.aborted) { const e = new Error(t('已停止')); e.name = 'AbortError'; return reject(e); }
    let settled = false, timer;
    const finish = (error, result) => {
      if (settled) return; settled = true;
      clearTimeout(timer); signal?.removeEventListener('abort', stop);
      try { server.close(); } catch (_) {}
      error ? reject(error) : resolve(result);
    };
    const stop = () => finish(abortError());
    const respond = (res, ok, message) => {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<!doctype html><meta charset="utf-8"><body style="font:16px/1.8 -apple-system,sans-serif;text-align:center;padding-top:18vh">' + (ok ? '<h2>✓ 授权成功</h2>已获取授权码，可以关闭这个页面回到 Obsidian。' : '<h2>✕ 授权未完成</h2>' + message) + '</body>');
    };
    const server = http.createServer((req, res) => {
      const url = new URL(req.url, `http://${CALLBACK_HOST}:${port}`);
      if (url.pathname !== '/callback') { res.writeHead(404); return res.end(); }
      if (url.searchParams.get('state') !== expectedState) { respond(res, false, '状态校验失败，请回到 Obsidian 重新发起连接。'); return finish(new Error(t('X 回调状态校验失败，请重新发起连接'))); }
      const error = url.searchParams.get('error');
      if (error) return respond(res, false, error === 'access_denied' ? '你在 X 页面拒绝了授权。' : error), finish(new Error(t('X 授权被取消：{error}', { error })));
      const code = url.searchParams.get('code');
      if (!code) return respond(res, false, '缺少授权码。');
      respond(res, true, '');
      finish(null, { code });
    });
    server.on('error', e => { rejectReady(e); finish(e.code === 'EADDRINUSE' ? new Error(t('本地端口 {port} 被占用，无法接收 X 回调', { port })) : e); });
    signal?.addEventListener('abort', stop, { once: true });
    timer = setTimeout(() => finish(new Error(t('等待 X 授权超时，请重试'))), timeout);
    server.listen(port, CALLBACK_HOST, () => resolveReady());
  });
  return { promise, ready };
}

function formBody(fields) { return Object.entries(fields).map(([k, v]) => encodeURIComponent(k) + '=' + encodeURIComponent(v)).join('&'); }

function tokensOf(data) {
  if (!data?.access_token) throw new Error(t('X 没有返回访问令牌'));
  return { accessToken: String(data.access_token), refreshToken: data.refresh_token ? String(data.refresh_token) : '', expiresIn: Number(data.expires_in) || 7200 };
}

/* 授权码换令牌（须在回调后 30 秒内完成）；机密客户端用 Basic 头携带 client_id:client_secret。 */
async function exchangeCode({ code, verifier, clientId, clientSecret, redirectUri, request, signal }) {
  const response = await request(TOKEN_URL, {
    method: 'POST', signal, timeout: 30000,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Authorization: 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64') },
    body: formBody({ grant_type: 'authorization_code', code, redirect_uri: redirectUri, code_verifier: verifier }),
  });
  let data = {}; try { data = JSON.parse(response.buf.toString('utf8')); } catch (_) {}
  if (response.status >= 400) throw new Error(t('换取令牌失败（{status}）：{detail}', { status: response.status, detail: data.error_description || data.error || '' }));
  return tokensOf(data);
}

/* 用 refresh token 续期；X 会轮换 refresh token，调用方必须持久化返回的新 refresh token。 */
async function refreshTokens({ refreshToken, clientId, clientSecret, request, signal }) {
  if (!refreshToken) throw new Error(t('X 授权已过期，请重新连接账号'));
  const response = await request(TOKEN_URL, {
    method: 'POST', signal, timeout: 30000,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Authorization: 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64') },
    body: formBody({ grant_type: 'refresh_token', refresh_token: refreshToken, client_id: clientId }),
  });
  let data = {}; try { data = JSON.parse(response.buf.toString('utf8')); } catch (_) {}
  if (response.status >= 400) {
    const detail = String(data.error_description || data.error || '');
    const e = new Error(detail.includes('invalid_grant') ? t('X 授权已失效，请重新连接账号') : t('刷新令牌失败（{status}）：{detail}', { status: response.status, detail }));
    e.code = 'OAUTH2_REFRESH'; throw e;
  }
  return tokensOf(data);
}

module.exports = { pkce, authUrl, startCallbackServer, exchangeCode, refreshTokens, base64url, formBody, AUTHORIZE_URL, TOKEN_URL, SCOPES };
