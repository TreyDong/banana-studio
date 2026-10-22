'use strict';
/* X（Twitter）API v2 客户端：OAuth 1.0a 用户上下文签名（HMAC-SHA1，纯 crypto 实现，不依赖 SDK）、
 * GET /2/users/me、POST /2/tweets（回复链 + 媒体）、DELETE /2/tweets/:id、POST /2/media/upload（v2，图片一步上传，
 * GIF 走 initialize/append/finalize + STATUS 轮询）。
 * 传输层可替换：默认直连 model-services.request；也可注入 HTTP 代理或 SSH 隧道传输（国内访问 api.x.com 用）。 */

const crypto = require('crypto');
const { t } = require('../i18n');
const oauth2 = require('./oauth2.js');

const BASE = 'https://api.x.com';
const GIF_CHUNK_BYTES = 1024 * 1024;
const MAX_STATUS_POLLS = 10;
const MAX_MEDIA_PER_TWEET = 4;

/* RFC 3986 严格编码：encodeURIComponent 不转义 !'()*，而 OAuth 1.0a 要求转义，否则签名必错。 */
function percentEncode(value) {
  return encodeURIComponent(String(value)).replace(/[!'()*]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase());
}

/* 生成 Authorization: OAuth ... 头。params 为参与签名的 query/form 参数；JSON 请求体不参与签名。
 * timestamp/nonce 可注入，供确定性测试。 */
function oauth1Header({ method, url, credentials, params = {}, timestamp, nonce }) {
  const oauthParams = {
    oauth_consumer_key: credentials.consumerKey,
    oauth_nonce: nonce || crypto.randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: String(timestamp ?? Math.floor(Date.now() / 1000)),
    oauth_token: credentials.accessToken,
    oauth_version: '1.0',
  };
  const pairs = [...Object.entries(params), ...Object.entries(oauthParams)].map(([k, v]) => [percentEncode(k), percentEncode(v)]);
  pairs.sort((a, b) => (a[0] !== b[0] ? (a[0] < b[0] ? -1 : 1) : a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0));
  const paramString = pairs.map(([k, v]) => `${k}=${v}`).join('&');
  const baseString = [String(method).toUpperCase(), percentEncode(url), percentEncode(paramString)].join('&');
  const signingKey = `${percentEncode(credentials.consumerSecret)}&${percentEncode(credentials.accessTokenSecret)}`;
  const signature = crypto.createHmac('sha1', signingKey).update(baseString).digest('base64');
  return 'OAuth ' + [...Object.entries(oauthParams), ['oauth_signature', signature]].map(([k, v]) => `${k}="${percentEncode(v)}"`).join(', ');
}

function normalizeCredentials(raw) {
  const auth = raw?.auth === 'oauth2' ? 'oauth2' : 'oauth1';
  const credentials = {
    auth,
    consumerKey: String(raw?.consumerKey || '').trim(),
    consumerSecret: String(raw?.consumerSecret || '').trim(),
    accessToken: String(raw?.accessToken || '').trim(),
    accessTokenSecret: String(raw?.accessTokenSecret || '').trim(),
  };
  if (auth === 'oauth2') {
    credentials.clientId = String(raw.clientId || '').trim();
    credentials.clientSecret = String(raw.clientSecret || '').trim();
    credentials.refreshToken = String(raw.refreshToken || '').trim();
    credentials.expiresAt = Number(raw.expiresAt) || 0;
    credentials.onTokens = typeof raw.onTokens === 'function' ? raw.onTokens : null;
    if (!credentials.clientId || !credentials.clientSecret) throw new Error(t('请先填写 OAuth 2.0 的 Client ID 与 Client Secret'));
    if (!credentials.accessToken && !credentials.refreshToken) throw new Error(t('尚未连接 X 账号：请先在设置里完成授权'));
    return credentials;
  }
  if (!credentials.consumerKey || !credentials.consumerSecret) throw new Error(t('请先在设置中填写 X 的 API Key 与 API Key Secret'));
  if (!credentials.accessToken || !credentials.accessTokenSecret) throw new Error(t('请先在设置中填写 X 的 Access Token 与 Access Token Secret'));
  return credentials;
}

function xError(status, data, headers) {
  const detail = String(data?.errors?.[0]?.detail || data?.errors?.[0]?.message || data?.detail || data?.title || '').slice(0, 300);
  let hint = '';
  if (status === 401) hint = t('（401：密钥无效，或应用未开启 OAuth 1.0a；请核对四个密钥是否来自同一个应用）');
  else if (status === 403 && /duplicate/i.test(detail)) hint = t('（403：内容与你近期发布的推文重复）');
  else if (status === 403 && /client-not-enrolled|Project/i.test(detail)) hint = t('（403：应用未加入 Project，请在开发者后台新建 Project 并把应用放进去）');
  else if (status === 403) hint = t('（403：请确认应用权限为 Read and write，且 Access Token 是在设置权限之后重新生成的）');
  else if (status === 429) {
    const reset = Number(headers?.['x-rate-limit-reset'] || 0);
    const minutes = reset ? Math.max(1, Math.ceil((reset - Date.now() / 1000) / 60)) : 0;
    hint = minutes ? t('（429：触发接口限额，约 {minutes} 分钟后重置）', { minutes }) : t('（429：触发接口限额，请稍后再试）');
  }
  const e = new Error(t('X 接口错误 {status}', { status }) + (detail ? '：' + detail : '') + hint);
  e.status = status; e.detail = detail;
  return e;
}

function abortError() { const e = new Error(t('已停止')); e.name = 'AbortError'; return e; }
function sleep(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(abortError());
    const timer = setTimeout(() => { signal?.removeEventListener('abort', stop); resolve(); }, ms);
    const stop = () => { clearTimeout(timer); reject(abortError()); };
    signal?.addEventListener('abort', stop, { once: true });
  });
}

class XClient {
  /* request：基础传输；transport：可选替代传输（代理 / SSH 隧道），签名方式不受影响。 */
  constructor(credentials, request, transport) {
    this.credentials = normalizeCredentials(credentials);
    this.request = request || require('../services/model-services.js').request;
    this.transport = typeof transport === 'function' ? transport : null;
  }
  async call(method, path, { query = {}, json, signal, timeout = 60000 } = {}) {
    const url = BASE + path;
    let authorization;
    if (this.credentials.auth === 'oauth2') authorization = 'Bearer ' + await this.ensureToken(signal);
    else authorization = oauth1Header({ method, url, credentials: this.credentials, params: query });
    const qs = Object.entries(query).map(([k, v]) => `${percentEncode(k)}=${percentEncode(v)}`).join('&');
    const options = { method, headers: { Authorization: authorization }, signal, timeout };
    if (json !== undefined) options.json = json;
    const response = await (this.transport || this.request)(qs ? `${url}?${qs}` : url, options);
    if (signal?.aborted) throw abortError();
    let data = null; try { data = JSON.parse(response.buf.toString('utf8')); } catch (_) { data = null; }
    if (response.status >= 400) throw xError(response.status, data, response.headers);
    return data;
  }
  /* OAuth 2.0：access token 只有 2 小时有效期，过期前用 refresh token 续期（经传输层，可走代理/SSH）。 */
  async ensureToken(signal) {
    const credentials = this.credentials;
    if (credentials.accessToken && Date.now() < credentials.expiresAt - 60000) return credentials.accessToken;
    const tokens = await oauth2.refreshTokens({ refreshToken: credentials.refreshToken, clientId: credentials.clientId, clientSecret: credentials.clientSecret, request: this.transport || this.request, signal });
    credentials.accessToken = tokens.accessToken;
    if (tokens.refreshToken) credentials.refreshToken = tokens.refreshToken;
    credentials.expiresAt = Date.now() + tokens.expiresIn * 1000;
    credentials.onTokens?.(tokens);
    return credentials.accessToken;
  }
  async me(signal) {
    const data = await this.call('GET', '/2/users/me', { signal });
    const user = data?.data;
    if (!user?.id || !user?.username) throw new Error(t('X 没有返回账号信息'));
    return { id: String(user.id), name: String(user.name || ''), username: String(user.username) };
  }
  async createTweet({ text, replyTo, mediaIds }, signal) {
    const payload = { text: String(text || '') };
    if (replyTo) payload.reply = { in_reply_to_tweet_id: String(replyTo) };
    if (mediaIds?.length) payload.media = { media_ids: mediaIds.slice(0, MAX_MEDIA_PER_TWEET).map(String) };
    const data = await this.call('POST', '/2/tweets', { json: payload, signal });
    if (!data?.data?.id) throw new Error(t('X 没有返回推文 ID'));
    return { id: String(data.data.id), text: String(data.data.text || payload.text) };
  }
  async deleteTweet(id, signal) { await this.call('DELETE', `/2/tweets/${encodeURIComponent(id)}`, { signal }); }
  /* 图片一步上传；GIF 走分块。返回 media_id。 */
  async uploadMedia(buf, mime, signal) {
    if (mime === 'image/gif') return this.uploadChunked(buf, mime, 'tweet_gif', signal);
    const data = await this.call('POST', '/2/media/upload', { json: { media: Buffer.from(buf).toString('base64'), media_category: 'tweet_image', media_type: mime }, signal, timeout: 180000 });
    const id = data?.data?.id; if (!id) throw new Error(t('X 没有返回媒体 ID'));
    return String(id);
  }
  async uploadChunked(buf, mime, category, signal) {
    const bytes = Buffer.from(buf);
    const init = await this.call('POST', '/2/media/upload/initialize', { json: { media_type: mime, total_bytes: bytes.length, media_category: category }, signal });
    const id = init?.data?.id; if (!id) throw new Error(t('X 没有返回媒体 ID'));
    for (let offset = 0, index = 0; offset < bytes.length; offset += GIF_CHUNK_BYTES, index++) {
      await this.call('POST', `/2/media/upload/${id}/append`, { json: { media: bytes.subarray(offset, offset + GIF_CHUNK_BYTES).toString('base64'), segment_index: index }, signal, timeout: 180000 });
    }
    const finalized = await this.call('POST', `/2/media/upload/${id}/finalize`, { signal });
    let info = finalized?.data?.processing_info;
    for (let attempt = 0; attempt < MAX_STATUS_POLLS; attempt++) {
      if (!info || info.state === 'succeeded') return String(id);
      if (info.state === 'failed') throw new Error(t('X 无法处理上传的媒体'));
      await sleep((Number(info.check_after_secs) || 1) * 1000, signal);
      const status = await this.call('GET', '/2/media/upload', { query: { command: 'STATUS', media_id: String(id) }, signal });
      info = status?.data?.processing_info;
    }
    throw new Error(t('等待 X 处理媒体超时'));
  }
}

module.exports = { XClient, oauth1Header, percentEncode, normalizeCredentials, xError, BASE, MAX_MEDIA_PER_TWEET };
